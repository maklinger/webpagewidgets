
# Auto-generated via generate_result_wrappers.py - do not touch

import json
class Result:
    def __init__(self, data=None, meta=None, type="dataframe"):
        self.type = type; self.data = data or {}; self.meta = meta or {}
    def to_dict(self): return {"type": self.type, "data": self.data, "meta": self.meta}
    def to_json(self): return json.dumps(self.to_dict())
    @classmethod
    def from_values(cls, **kwargs):
        data, meta = {}, {}
        # data
        if "x" in kwargs: 
            data["x"] = kwargs["x"]
        if "y" in kwargs: 
            data["y"] = kwargs["y"]
        if "z" in kwargs: 
            data["z"] = kwargs["z"]
        if "label" in kwargs: 
            data["label"] = kwargs["label"]
 
        # meta
        if "title" in kwargs: 
            meta["title"] = kwargs["title"]
        if "xlabel" in kwargs: 
            meta["xlabel"] = kwargs["xlabel"]
        if "ylabel" in kwargs: 
            meta["ylabel"] = kwargs["ylabel"]
        if "zlabel" in kwargs: 
            meta["zlabel"] = kwargs["zlabel"]
 
        return cls(data, meta)