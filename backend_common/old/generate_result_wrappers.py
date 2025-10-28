import json, jinja2, pathlib

schema_path = pathlib.Path("backend_common/result_schema.json")
out_dir = pathlib.Path("backend_common")
schema = json.loads(schema_path.read_text())

data_props = list(schema["properties"]["data"]["properties"].keys())
meta_props = list(schema["properties"]["meta"]["properties"].keys())

env = jinja2.Environment(trim_blocks=True, lstrip_blocks=True)

# Python template
py_template = env.from_string(r"""
# Auto-generated via generate_result_wrappers.py - do not touch

import json
class Result:
    def __init__(self, data=None, meta=None, type="dataframe"):
        self.type = type; self.data = data or {}; self.meta = meta or {}
    
    def _convert(self, obj):
        # Recursively convert NumPy arrays and types to JSON-safe objects.
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: self._convert(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._convert(v) for v in obj]
        elif isinstance(obj, (np.float32, np.float64, np.int32, np.int64)):
            return obj.item()
        else:
            return obj
    def to_dict(self): return {"type": self.type, "data": self.data, "meta": self.meta}
    def to_json(self): return json.dumps(self.to_dict())
    @classmethod
    def from_values(cls, **kwargs):
        data, meta = {}, {}
        # data
        {% for k in data_props %}
        if "{{k}}" in kwargs: 
            data["{{k}}"] = kwargs["{{k}}"]
        {% endfor %} 
        # meta
        {% for k in meta_props %}
        if "{{k}}" in kwargs: 
            meta["{{k}}"] = kwargs["{{k}}"]
        {% endfor %} 
        return cls(data, meta)
""")

# JS template
js_template = env.from_string("""
                              
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
    {% for k in data_props %}
    if ("{{k}}" in kwargs) data["{{k}}"] = kwargs["{{k}}"];
    {% endfor %}
    // meta
    {% for k in meta_props %}
    if ("{{k}}" in kwargs) meta["{{k}}"] = kwargs["{{k}}"];
    {% endfor %}
    return new Result(data, meta);
  }
}
""")

(out_dir / "result.py").write_text(py_template.render(data_props=data_props, meta_props=meta_props))
(out_dir / "result.js").write_text(js_template.render(data_props=data_props, meta_props=meta_props))
print("✅ Generated wrappers from schema.")
