import numpy as np
import json

def run_simulation(angle, speed):
    g = 9.81
    rad = np.radians(angle)
    t = np.linspace(0, 2 * speed * np.sin(rad) / g, 100)
    x = speed * np.cos(rad) * t
    y = speed * np.sin(rad) * t - 0.5 * g * t**2

    return json.dumps({"x": list(x), "y": list(y), "y2": list(y+10)})
