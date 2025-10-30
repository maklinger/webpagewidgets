// FieldLinePlotter.js
import { BaseColorPlotter } from "../../BasePlotter_ColorMap.js";

export class FieldLinePlotter extends BaseColorPlotter {
  constructor(containerId, meta = {}) {
    super(containerId, { ...meta, colorscale: "Nightfall" });
  }

  render(result_dict) {

    // maybe apply log scale to Z before plotting
    if (result_dict.Z) {
      result_dict.Z = result_dict.Z.map(row => row.map(v => Math.log10(v + 1e-36)));
    }
    console.log(result_dict.Z);
    super.plot2DArray(result_dict);
    super.addOrUpdateLine("charge trajectory", result_dict.x_traj, result_dict.y_traj, {color: "grey", width: 3});
    super.addOrUpdateLine("charge position", result_dict.x_charge, result_dict.y_charge, {color: "#cec3c3f1", marker: ".", markersize: 6});


  }
}
