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

    // max 50 = Nlines in config
    for (let i = 0; i < 50; i++) {
    //   console.log(i);
      if (i<result_dict.x_field_lines.length) {
        super.addOrUpdateLine("field_line_" + i, 
            result_dict.x_field_lines[i], result_dict.y_field_lines[i], 
            {color: "#000000", width: 1, alpha: 0.4, showlegend: false});
      } else {
        super.removeLine("field_line_" + i);
      }

        
    }
    super.set_axis_limits(result_dict.X.at(0), result_dict.X.at(-1),
        result_dict.Y.at(0), result_dict.Y.at(-1));
  }
}
