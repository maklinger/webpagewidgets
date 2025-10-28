define sliders

{% for s in sliders %}
  <div class="slider-container">
    <label for="{{ s.id }}">{{ s.label }}: <span id="{{ s.id }}_val">{{ s.value }}</span></label><br>
    <input type="range" id="{{ s.id }}" min="{{ s.min }}" max="{{ s.max }}" 
           step="{{ s.step }}" value="{{ s.value }}">
  </div>
  {% endfor %}


  define plots

   {% for plot in plots %}
  <canvas id="{{ plot.id }}" width="600" height="400"></canvas>
  {% endfor %}


  start the script
    <script type="module">

load the python environment via pyodide
 import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs";
  const pyodide = await loadPyodide();
  console.log("✅ Pyodide loaded");


  // Load required Python packages from YAML
  const pkgs = {{ python_packages | tojson }};
  for (const pkg of pkgs) {
    console.log(`📦 Loading ${pkg} ...`);
    try {
      await pyodide.loadPackage(pkg);
    } catch (err) {
      console.warn(`⚠️ Could not load ${pkg} automatically, trying micropip`);
      const micropip = pyodide.pyimport("micropip");
      await micropip.install(pkg);
    }
  }

Load the python backend scripts

    // Load Python files relative to index.html
    {% for f in backend_files %}
      const src_{{ loop.index }} = await (await fetch("{{ f }}")).text();
      pyodide.runPython(src_{{ loop.index }});
    {% endfor %}
    const result_src = await (await fetch("{{ shared_backend }}")).text();
    pyodide.runPython(result_src);

Import and initialise the plotters



Define functions via wrapper for arguments

    console.log("Def functions");
    const functions = {{ functions | tojson }};



    async function runFunction(funcName) {
        console.log("Running" + funcName);
      const meta = functions[funcName];
      const args = meta.args.map(id => parseFloat(document.getElementById(id).value));
      // dynamically use the module name from YAML
      const pyCall = `import ${moduleName}; ${moduleName}.${funcName}(*${args})`;
      const jsonResult = await pyodide.runPythonAsync(pyCall);
      const result = JSON.parse(jsonResult);
      Plotter.render(chart, result);
    }


Connect functions to sliders


    {% for fname, fmeta in functions.items() %}
        {% for trig in fmeta.trigger %}
    document.getElementById('{{ trig.control }}')
        .addEventListener('{{ trig.event }}', () => runFunction('{{ fname }}'));
        {% endfor %}
    {% endfor %}

