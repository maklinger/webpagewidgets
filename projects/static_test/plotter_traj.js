// traj_plotter.js
import { BasePlotter, getColorByIndex } from "../../BasePlotter_chart.js";

export class TrajPlotter extends BasePlotter {
  constructor(canvasId, meta) {
    super(canvasId, meta);
  }

  render(result) {
    // Expect result to be { x: [...], y: [...] }
    const x = result.x || [];
    const y = result.y || [];


    super.addOrUpdateLine("normal", result.x, result.y, {c: getColorByIndex(0), ls : "-", marker: "v", alpha: 0.3});
    super.addOrUpdateLine("small", result.x, result.y2, {c: getColorByIndex(1), ls : "--", marker: ".", alpha: 0.3});
    super.setAspectRatio();

    

    // Optionally extend with custom lines, points, or annotations
    console.log("🚀 TrajPlotter rendered trajectory curve.");
  }
}
