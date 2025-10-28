// TrajPlotter.js
import { BasePlotter, getColorByIndex } from "../../BasePlotter_chart.js";

export class ElPlotter extends BasePlotter {
  constructor(canvasId, meta) {
    super(canvasId, meta);
  }

  render(result) {
    // Expect result to be { x: [...], y: [...] }
    const x = result.x || [];
    const y = result.y || [];


    super.addOrUpdateLine("electrons", result.xel, result.yel, {c: getColorByIndex(10), ls : "-", marker: "", alpha: 1});
    
    const ymin = -9;
    const ymax = 1;

    for (let index = 0; index < 8; index++) {
      if (index<result.Eelvis.length) {
        super.addOrUpdateLine("electrons_"+index, 
          [result.Eelvis[index], result.Eelvis[index]], 
          [ymin, ymax], 
          {c: getColorByIndex(index), ls : "-", marker: "", alpha: 0.6});
      } else {
        super.removeLine("electrons_"+index);
      }
      
    }
    // super.setAspectRatio();
    super.setAxLimits(6, 16, ymin, ymax);


    

    // Optionally extend with custom lines, points, or annotations
    // console.log("🚀 TrajPlotter rendered trajectory curve.");
  }
}
