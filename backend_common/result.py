import json
import numpy as np

class Result:

    def __init__(self, data=None):
        self.data = data or {}
    
    def __str__(self):
        # output = ""
        # for key, el in self.data:
        #     output += f"{key} : {el}, "
        return str(self.data)
    
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
        
    def to_dict(self): return self._convert(self.data)
    def to_json(self): return json.dumps(self.to_dict())
    @classmethod
    def from_values(cls, **kwargs):
        data = {}
        # data
        if "x" in kwargs: 
            data["x"] = kwargs["x"]
        if "y" in kwargs: 
            data["y"] = kwargs["y"]
        if "z" in kwargs: 
            data["z"] = kwargs["z"]
        return cls(data)