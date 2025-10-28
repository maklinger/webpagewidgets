// TrajPlotter.js
import { BasePlotter, getColorByIndex } from "../../BasePlotter_chart.js";

export class PhPlotter extends BasePlotter {
  constructor(canvasId, meta) {
    super(canvasId, meta);
  }

  render(result) {
    // Expect result to be { x: [...], y: [...] }
    const x = result.x || [];
    const y = result.y || [];


    super.addOrUpdateLine("photons", result.xphot, result.yphot, 
      {c: getColorByIndex(10), ls : "-", marker: "", alpha: 1});

    for (let index = 0; index < 8; index++) {
      if (index<result.Eelvis.length) {
        super.addOrUpdateLine("photons_"+index, result.xphot, 
          result["Ephvis_" + index], 
          {c: getColorByIndex(index), ls : "-", marker: "", alpha: 0.6});
      } else {
        super.removeLine("photons_"+index);
      }
      
    }
    
    // super.addOrUpdateLine("small", result.x, result.y2, {c: getColorByIndex(1), ls : "--", marker: ".", alpha: 0.3});
    // super.setAspectRatio();
    super.setAxLimits(-9, 11, -9, 1);
    

    // Optionally extend with custom lines, points, or annotations
    // console.log("🚀 TrajPlotter rendered trajectory curve.");
  }
}
