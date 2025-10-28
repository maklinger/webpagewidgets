#!/usr/bin/env python3
import yaml
import pathlib
from jinja2 import Environment, FileSystemLoader

ROOT = pathlib.Path(__file__).parent
env = Environment(loader=FileSystemLoader(str(ROOT)))

template = env.from_string("""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>{{ title }}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>{{ title }}</h1>
  <div class="gallery">
    {% for p in projects %}
    <a class="card" href="{{ p.path }}">
      <img src="{{ p.image }}" alt="{{ p.name }}">
      <h2>{{ p.name }}</h2>
      <p>{{ p.description }}</p>
    </a>
    {% endfor %}
  </div>
</body>
</html>
""")

def generate_index():
    cfg = yaml.safe_load(open("projects.yaml", "r"))
    html = template.render(**cfg)
    (ROOT / "index.html").write_text(html, encoding="utf-8")
    print("✅ Generated index.html")

if __name__ == "__main__":
    generate_index()
