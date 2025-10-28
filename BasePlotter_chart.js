/**
 * plotter_chart.js
 * Simple interactive plot module using Chart.js
 *
 * Exports:
 *   - init(canvasId, meta): create a new chart
 *   - render(chart, result): update the chart with data from a Result
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale, 
  Title,
  Tooltip,
  Legend
} from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/+esm";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

import zoomPlugin from "https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/+esm";
Chart.register(zoomPlugin);


export class BasePlotter {
  constructor(canvasId, meta = {}) {
    this.canvasId = canvasId;
    this.meta = meta;
    this.chart = this.initChart();
  }

  initChart() {
    // Initialize a chart with given canvas ID and meta info
    const ctx = document.getElementById(this.canvasId).getContext("2d");

    const config = {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        // aspectRatio: 1,
        maintainAspectRatio: true,
        interaction: { mode: "nearest", intersect: false },
        scales: {
          x: {
              type: "linear", 
              title: { display: true, text: this.meta.x_label || "x" },
              ticks: {
              // optional formatting
              callback: value => value.toFixed(1)
              }
          },
          y: {
              type: "linear", 
              title: { display: true, text: this.meta.y_label || "y" }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: !!this.meta.title,
            text: this.meta.title,
          },
          tooltip: { enabled: true },
          zoom: {
            zoom: {
              wheel: { enabled: true },       // Zoom with mouse wheel
              pinch: { enabled: true },       // Zoom with pinch on touch devices
              mode: 'xy',                     // Allow both axes to zoom
            },
            pan: {
              enabled: true,                  // Enable panning
              mode: 'xy',
            },
            limits: {
              x: { min: 'original', max: 'original' },
              y: { min: 'original', max: 'original' },
            },
          },
        },
      },
    };


    const chart = new Chart(ctx, config);
    console.log(`✅ Created base chart for #${this.canvasId}`);
    return chart;
  }

  /** Adjust aspect ratio based on all lines */
  setAspectRatio() {
    const allX = this.chart.data.datasets.flatMap(d => d.data.map(p => p.x));
    const allY = this.chart.data.datasets.flatMap(d => d.data.map(p => p.y));
    if (!allX.length || !allY.length) return;

    const xMin = Math.min(...allX), xMax = Math.max(...allX);
    const yMin = Math.min(...allY), yMax = Math.max(...allY);

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const xCenter = (xMax + xMin) / 2;
    const yCenter = (yMax + yMin) / 2;

    const width = this.chart.chartArea?.width || 400;
    const height = this.chart.chartArea?.height || 400;
    const aspect = width / height;

    let newXRange = xRange, newYRange = yRange;
    if (xRange / yRange > aspect) newYRange = xRange / aspect;
    else newXRange = yRange * aspect;

    this.setAxLimits(
      xCenter - newXRange / 2, xCenter + newXRange / 2,
      yCenter - newYRange / 2, yCenter + newYRange / 2
    );
  }

  setAxLimits(xmin, xmax, ymin, ymax) {
    this.chart.options.scales.x.min = xmin;
    this.chart.options.scales.x.max = xmax;
    this.chart.options.scales.y.min = ymin;
    this.chart.options.scales.y.max = ymax;

    this.chart.update();
  }


  /** Add or update a line by label */
  addOrUpdateLine(label, x, y, options = {}) {
    
    if (!x?.length || !y?.length) {
      console.warn("⚠️ empty x or y");
      return;
    }
    // Accept Matplotlib-style aliases
    const color = options.color || options.c || this._getColor();
    const linestyle = options.linestyle || options.ls || "-";
    const linewidth = options.linewidth || options.lw || 2;
    const marker = options.marker || "none";
    const alpha = options.alpha != null ? options.alpha : 1.0;

    const newData = x.map((xi, i) => ({ x: xi, y: y[i] }));

    // === Matplotlib-style line dash mapping ===
    const dashMap = {
      "-": [],             // solid
      "--": [6, 4],        // dashed
      "-.": [6, 4, 2, 4],  // dash-dot
      ":": [2, 4]          // dotted
    };

    const borderDash = dashMap[linestyle] ?? [];

    // === Matplotlib-style marker mapping ===
    const markerMap = {
      "o": "circle",
      "s": "rect",
      "^": "triangle",
      "v": "triangle",
      "x": "cross",
      "+": "crossRot",
      "*": "star",
      "none": false,
      "": false
    };
    const pointStyle = markerMap[marker] ?? marker;

    const rgbaColor = this._applyAlpha(color, alpha);

    // Find existing dataset or create new one
    let dataset = this.chart.data.datasets.find(d => d.label === label);
    const datasetProps = {
      label,
      data: newData,
      borderColor: rgbaColor,
      borderDash,
      borderWidth: linewidth,
      tension: 0.1,
      pointStyle,
      pointRadius: marker !== "none" ? 4 : 0,
      pointBackgroundColor: rgbaColor,
      pointBorderColor: rgbaColor,
      fill: false,
    };

    if (dataset) {
      Object.assign(dataset, datasetProps);
    } else {
      this.chart.data.datasets.push(datasetProps);
    }

    this.chart.update();
  }

  /** Simple alpha compositing for rgba colors */
  _applyAlpha(color, alpha) {
    // Handle hex codes
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // Assume already rgba or named color
    return color;
  }

  /** Auto color cycle */
  // 'muted' from Paul Tol's cmaps
  _getColor() {
    const colors = ['#CC6677', '#332288', '#DDCC77', '#117733', '#88CCEE',
                    '#882255', '#44AA99', '#999933', '#AA4499', '#DDDDDD',
                    '#000000'];
    return colors[this.chart.data.datasets.length % colors.length];
  }
  

  /** Remove a line by label */
  removeLine(label) {
    this.chart.data.datasets = this.chart.data.datasets.filter(d => d.label !== label);
    this.chart.update();
  }
}



export function getColorByIndex(i) {
  const colors = ['#CC6677', '#332288', '#DDCC77', '#117733', '#88CCEE',
                  '#882255', '#44AA99', '#999933', '#AA4499', '#DDDDDD',
                  '#000000'];
  return colors[i % colors.length];
}








// /**
//  * Initialize a chart with given canvas ID and meta info
//  */
// export function init(canvasId, meta = {}) {
//   const ctx = document.getElementById(canvasId).getContext("2d");

//   const config = {
//     type: "line",
//     data: {
//       labels: [],
//       datasets: [
//         {
//           label: meta.title || "Simulation",
//           data: [],
//           fill: false,
//           tension: 0.1,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       aspectRatio: 1,
//       maintainAspectRatio: true,
//       interaction: { mode: "nearest", intersect: false },
//       scales: {
//         x: {
//             type: "linear", 
//             title: { display: true, text: meta.xlabel || "x" },
//             ticks: {
//             // optional formatting
//             callback: value => value.toFixed(1)
//             }
//         },
//         y: {
//             type: "linear", 
//             title: { display: true, text: meta.ylabel || "y" }
//         }
//       },
//       plugins: {
//         legend: { display: true },
//         title: {
//           display: !!meta.title,
//           text: meta.title,
//         },
//         tooltip: { enabled: true },
//         zoom: {
//           zoom: {
//             wheel: { enabled: true },       // Zoom with mouse wheel
//             pinch: { enabled: true },       // Zoom with pinch on touch devices
//             mode: 'xy',                     // Allow both axes to zoom
//           },
//           pan: {
//             enabled: true,                  // Enable panning
//             mode: 'xy',
//           },
//           limits: {
//             x: { min: 'original', max: 'original' },
//             y: { min: 'original', max: 'original' },
//           },
//         },
//       },
//     },
//   };

//   const chart = new Chart(ctx, config);
//   console.log(`✅ Initialized chart on #${canvasId}`);
//   return chart;
// }

// /**
//  * Update chart from a Python Result object (converted to JSON)
//  */
// export function render(chart, result) {
//   if (!result) {
//     console.warn("⚠️ No valid result data to plot");
//     return;
//   }

//   // Expect something like result.x, result.y, result.meta.title, etc.
//   const x = result.x || [];
//   const y = result.y || [];

//   if (!x.length || !y.length) {
//     console.warn("⚠️ Empty x or y arrays");
//     return;
//   }


//   // === Equal scaling logic ===
//   const xMin = Math.min(...x);
//   const xMax = Math.max(...x);
//   const yMin = Math.min(...y);
//   const yMax = Math.max(...y);

//   const xRange = xMax - xMin;
//   const yRange = yMax - yMin;

//   const xCenter = (xMax + xMin) / 2;
//   const yCenter = (yMax + yMin) / 2;

//   // Wait for layout info if not yet available
//   const width = chart.chartArea?.width || 400;
//   const height = chart.chartArea?.height || 400;
//   const aspectRatio = width / height;

//   let newXRange = xRange;
//   let newYRange = yRange;

//   if (xRange / yRange > aspectRatio) {
//     // X is wider, expand Y
//     newYRange = xRange / aspectRatio;
//   } else {
//     // Y is taller, expand X
//     newXRange = yRange * aspectRatio;
//   }

//   chart.options.scales.x.min = xCenter - newXRange / 2;
//   chart.options.scales.x.max = xCenter + newXRange / 2;
//   chart.options.scales.y.min = yCenter - newYRange / 2;
//   chart.options.scales.y.max = yCenter + newYRange / 2;

//   // update data
//   chart.labels = x;
//   chart.data.datasets[0].data = y.map((val, i) => ({ x: x[i], y: val }));
// //   if (result.meta && result.meta.title) {
// //     chart.options.plugins.title.text = result.meta.title;
// //   }
//   chart.update();
//   console.log("📈 Chart updated");
// }
