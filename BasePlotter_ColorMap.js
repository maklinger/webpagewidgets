// A reusable base class for interactive 2D color plots using Plotly.js
// import Plotly from "https://cdn.plot.ly/plotly-2.32.0.min.js";

export const NIGHTFALL_COLORSCALE = [
  [0.0,  "#125A56"],
  [0.066, "#00767B"],
  [0.133, "#238F9D"],
  [0.2,  "#42A7C6"],
  [0.266, "#60BCE9"],
  [0.333, "#9DCCEF"],
  [0.4,  "#C6DBED"],
  [0.466, "#DEE6E7"],
  [0.533, "#ECEADA"],
  [0.6,  "#F0E6B2"],
  [0.666, "#F9D576"],
  [0.733, "#FFB954"],
  [0.8,  "#FD9A44"],
  [0.866, "#F57634"],
  [0.933, "#E94C1F"],
  [1.0,  "#A01813"]
];


export class BaseColorPlotter {
  constructor(containerId, meta = {}) {
    this.containerId = containerId;
    this.meta = meta;
    this.container = document.getElementById(containerId);
    this.traces = [];
    this.lineMap = {};

    if (!this.container) {
      console.error(`BaseColorPlotter: container #${containerId} not found`);
      return;
    }

    // Pick color scale
    let colorscale = "Viridis";
    if (meta.colorscale === "Nightfall") {
      colorscale = NIGHTFALL_COLORSCALE;
    } else if (meta.colorscale) {
      colorscale = meta.colorscale;
    }


    this.layout = {
      title: meta.title || "2D Color Plot",
      xaxis: {
        title: { text: meta.x_label || "X" },
        scaleanchor: "y", scaleratio: 1,
        zeroline: false,
        },
      yaxis: {
        title: { text: meta.y_label || "Y" },
        zeroline: false,
      },
      autosize: true,
      width: meta.width || 600,
      height: meta.height || 500,
      margin: { l: 50, r: 50, t: 50, b: 50 },
      coloraxis: { colorscale},
    };

    this.config = {
      responsive: true,
      displaylogo: false,
      scrollZoom: false,
    };

    this.initialized = false;
    this.colorscale = colorscale;
  }

  /**
   * Initializes the empty plot once.
   */
  init_empty() {
    const trace = {
      z: [[0, 0], [0, 0]],
      x: [0, 1],
      y: [0, 1],
      type: "heatmap",
      colorscale: this.colorscale,
      showscale: true,
    };

    this.traces = [trace];
    Plotly.newPlot(this.containerId, this.traces, this.layout, this.config);
    this.initialized = true;
  }

  /**
   * Renders new data from Python.
   * result_dict should contain { X, Y, Z } as nested arrays/lists.
   */
  plot2DArray(result_dict) {
    if (!result_dict) {
      console.warn("BaseColorPlotter: No data provided for rendering.");
      return;
    }

    if (!result_dict.X || !result_dict.Y || !result_dict.Z) {
      console.error("BaseColorPlotter: Missing X, Y, or Z in result_dict.");
      return;
    }
    const maxVal = Math.max(...result_dict.Z.flat());
    const trace = {
      x: result_dict.X, //X[0],
      y: result_dict.Y, //Y.map(row => row[0]),
      z: result_dict.Z,
      type: "heatmap",
      colorscale: this.colorscale,
      showscale: true,
      colorbar: {
        title: {
        text: this.meta.cbar_label || "Intensity",
        side: "right",
        font: { size: 14 },
        },
        thickness: 20,
        len: 0.7,
      },
      zmin: -26,
      zmax: -22,
    };

    if (!this.initialized) this.init_empty();

    // Replace first trace (the heatmap)
    this.traces[0] = trace;

    Plotly.react(this.containerId, this.traces, this.layout, this.config);
  }

  /**
   * Add or update a named line overlay.
   * Equivalent to repeated ax.plot(...) calls in matplotlib.
   */
  addOrUpdateLine(name, x, y, options = {}) {
    if (!this.initialized) this.init_empty();
    if (!Array.isArray(x) || !Array.isArray(y)) {
      console.error("addOrUpdateLine: x and y must be arrays");
      return;
    }

  // Default: just lines
  let mode = "lines";
  if (options.marker || options.markerstyle) {
    mode = options.linestyle ? "lines+markers" : "markers";
  }

  const markerStyleMap = {
    "o": "circle",
    "s": "square",
    "^": "triangle-up",
    "v": "triangle-down",
    "<": "triangle-left",
    ">": "triangle-right",
    "x": "x",
    "+": "cross",
    "d": "diamond",
    "*": "star",
    ".": "circle",
  };

  const trace = {
    x,
    y,
    mode,
    type: "scatter",
    name: name || `line_${Object.keys(this.lineMap).length}`,
    line: {
      color: options.color || "#FF5733",
      width: options.linewidth || 2,
      dash: options.linestyle || "solid",
    },
    marker: {
      symbol: markerStyleMap[options.marker || options.markerstyle] || "circle",
      size: options.markersize || 6,
      color: options.markercolor || options.color || "#FF5733",
      opacity: options.alpha ?? 1.0,
      line: {
        width: options.markeredgewidth || 1,
        color: options.markeredgecolor || "#000",
      },
    },
    showlegend: options.showlegend ?? true,
    hoverinfo: "none",
  };

    if (this.lineMap[name] !== undefined) {
      // Update existing trace
      const index = this.lineMap[name];
      this.traces[index] = trace;
    } else {
      // Add new trace
      this.traces.push(trace);
      this.lineMap[name] = this.traces.length - 1;
    }

    Plotly.react(this.containerId, this.traces, this.layout, this.config);
  }

  /**
   * Remove a line by name.
   */
  removeLine(name) {
    if (this.lineMap[name] === undefined) return;
    const index = this.lineMap[name];
    delete this.lineMap[name];
    this.traces.splice(index, 1);
    // Rebuild lineMap indices
    this.lineMap = Object.fromEntries(
      Object.entries(this.lineMap).map(([k, i]) => [k, i > index ? i - 1 : i])
    );
    Plotly.react(this.containerId, this.traces, this.layout, this.config);
  }

  /**
   * Clear all overlays but keep heatmap.
   */
  clearLines() {
    this.traces = [this.traces[0]]; // keep only heatmap
    this.lineMap = {};
    Plotly.react(this.containerId, this.traces, this.layout, this.config);
  }

  /**
   * Optionally update layout options like color scale or axis labels dynamically.
   */
  update_layout(options = {}) {
    Object.assign(this.layout, options);
    Plotly.relayout(this.containerId, this.layout);
  }

  /**
   * Clears the plot area (optional convenience method)
   */
  clear() {
    Plotly.purge(this.containerId);
    this.initialized = false;
  }
}
