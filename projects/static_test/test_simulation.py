import numpy as np
import json
# from backend_common.result import Result

def run_simulation(angle, speed):
    print("Running simulation!")
    g = 9.81
    rad = np.radians(angle)
    t = np.linspace(0, 2 * speed * np.sin(rad) / g, 100)
    x = speed * np.cos(rad) * t
    y = speed * np.sin(rad) * t - 0.5 * g * t**2

    # res = Result.from_values(
    #     x=x, y=y
    # )
    # print(res.to_json())
    # return res.to_json()
    return json.dumps({"x": list(x), "y": list(y), "y2": list(y+10)})
