
                              
// Auto-generated via generate_result_wrappers.py - do not touch
                              
export class Result {
  constructor(data = {}, meta = {}, type = "dataframe") {
    this.type = type; this.data = data; this.meta = meta;
  }
  toObject() { return { type: this.type, data: this.data, meta: this.meta }; }
  toJSON() { return JSON.stringify(this.toObject()); }
  static fromValues(kwargs = {}) {
    const data = {}, meta = {};
    // data
    if ("x" in kwargs) data["x"] = kwargs["x"];
    if ("y" in kwargs) data["y"] = kwargs["y"];
    if ("z" in kwargs) data["z"] = kwargs["z"];
    if ("label" in kwargs) data["label"] = kwargs["label"];
    // meta
    if ("title" in kwargs) meta["title"] = kwargs["title"];
    if ("xlabel" in kwargs) meta["xlabel"] = kwargs["xlabel"];
    if ("ylabel" in kwargs) meta["ylabel"] = kwargs["ylabel"];
    if ("zlabel" in kwargs) meta["zlabel"] = kwargs["zlabel"];
    return new Result(data, meta);
  }
}