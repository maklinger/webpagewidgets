#!/usr/bin/env python3
"""
generate_ui.py

Generate a standalone web UI for a simulation project
using relative paths (no file copying).
"""

import sys
import yaml
import jinja2
import pathlib


ROOT = pathlib.Path(__file__).parent
COMMON_DIR = ROOT / "backend_common"


def load_yaml(path):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def ensure_dir(path):
    path.mkdir(parents=True, exist_ok=True)


def relative_path(from_path, to_path):
    """Compute relative path from one folder to another file."""
    return str(pathlib.Path(to_path).resolve().relative_to(from_path.resolve()))

def build_elements(cfg):
    """
    Build a dictionary of HTML snippets for each element from the config.
    """
    elements = {}
    for spec in cfg.get("elements", []):
        el_id = spec.get("id")
        el_type = spec.get("type")

        if not el_id or not el_type:
            print(f"⚠️ Skipping invalid element: {spec}")
            continue

        if el_type == "slider":
            if "scale" in spec:
                if spec["scale"]=="log10":
                    logtext = "1e"
            else:
                logtext = ""
            elements[el_id] = f"""
              <div class="slider-container">
                <label for="{el_id}">{spec.get("label", el_id.title())}: 
                  <span id="{el_id}_val">{logtext}{spec.get("value", 0)}</span>
                </label><br>
                <input type="range" id="{el_id}"
                       min="{spec.get('min', 0)}"
                       max="{spec.get('max', 100)}"
                       step="{spec.get('step', 1)}"
                       value="{spec.get('value', 0)}"
                       oninput="document.getElementById('{el_id}_val').innerText = '{logtext}' + this.value">
              </div>
            """

        elif el_type == "button":
            elements[el_id] = f"""
              <button id="{el_id}">{spec.get("label", el_id.title())}</button>
            """

        elif el_type == "plot":
            elements[el_id] = f"""
              <div class="plot-container">
                <h3>{spec.get("title", spec.get("label", el_id.title()))}</h3>
                <canvas id="{el_id}" width="{spec.get('width', 0)}" height="{spec.get('height', 0)}"></canvas>
              </div>
            """

        else:
            elements[el_id] = f"<!-- Unknown element type: {el_type} -->"

    return elements

def render_layout(layout, elements):
    if isinstance(layout, list):
        # Simple list → horizontal by default
        html = '<div class="hbox">'
        for item in layout:
            html += render_layout(item, elements)
        html += '</div>'
        return html

    if isinstance(layout, str):
        # Direct element reference (slider, plot, button, etc.)
        return elements.get(layout, f'<!-- Unknown element: {layout} -->')

    if isinstance(layout, dict):
        html = ""
        for key, items in layout.items():
            if key == "HorizontalBox":
                html += '<div class="hbox">'
            elif key == "VerticalBox":
                html += '<div class="vbox">'
            else:
                raise ValueError(f"Unknown container type: {key}")

            # Recursively render children
            for item in items:
                html += render_layout(item, elements)

            html += '</div>'
        return html

    return ""

def generate_ui(config_path):
    config_path = pathlib.Path(config_path).resolve()
    project_dir = config_path.parent
    cfg = load_yaml(config_path)

    output_dir = project_dir / "output"
    ensure_dir(output_dir)

    # Inject project metadata
    cfg.setdefault("project_name", project_dir.name)
    cfg.setdefault("functions", {})
    cfg.setdefault("backend_files", [])
    cfg.setdefault("python_packages", [])

    # Build element HTML and layout
    elements = build_elements(cfg)
    layout_html = render_layout(cfg.get("layout", []), elements)

    # plotters
    # Collect all plots and plotter paths
    plots = {}
    plotters_set = set()
    for el in cfg.get("elements", []):
        if el.get("type") == "plot" and "plotter" in el:
            plots[el["id"]] = {
                "plotter_path": el["plotter"],
                "x_label": el.get("x_label", "x"),
                "y_label": el.get("y_label", "y"),
                "title": el.get("title", None)
            }
            plotters_set.add(el["plotter"])

    # Generate unique JS variable names for plotters
    plotter_vars = {}
    for p in sorted(plotters_set):
        name = pathlib.Path(p).stem.replace("-", "_").replace(".", "_")
        plotter_vars[p] = name

    # Now plots can reference the correct JS variable
    for pid, meta in plots.items():
        meta["varname"] = plotter_vars[meta["plotter_path"]]


    # Compute relative paths for backend files (from output/)
    cfg["backend_files"] = [
        str(pathlib.Path(f).relative_to(project_dir))
        if not f.startswith("../") else f
        for f in cfg.get("backend_files", [])
    ]

    # Always include shared result.py
    result_rel = str(pathlib.Path("../../../backend_common/result.py"))
    cfg.setdefault("shared_backend", result_rel)

    # Load template
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(ROOT)),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template("ui_template.html.j2")

    html = template.render(**cfg, layout_html=layout_html, 
                           plotter_vars=plotter_vars, plots=plots)
    out_html = output_dir / "index.html"
    out_html.write_text(html, encoding="utf-8")

    print(f"✅ UI generated: {out_html}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python generate_ui.py <path/to/config.yaml>")
        sys.exit(1)

    generate_ui(sys.argv[1])
