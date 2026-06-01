#!/usr/bin/env python3
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STYLE_DIR = ROOT / "src" / "styles" / "legacy"
SCRIPT_DIR = ROOT / "src" / "scripts" / "legacy"


def slug(value: str, fallback: str) -> str:
    value = (value or fallback).strip().lower()
    value = re.sub(r"[^a-z0-9_-]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or fallback


def attr_value(attrs: str, name: str) -> str:
    match = re.search(rf'\b{name}\s*=\s*["\']([^"\']+)["\']', attrs)
    return match.group(1) if match else ""


def extract_styles(html: str) -> str:
    STYLE_DIR.mkdir(parents=True, exist_ok=True)
    counter = 0

    def replace(match: re.Match) -> str:
      nonlocal counter
      attrs, content = match.group(1), match.group(2)
      style_id = attr_value(attrs, "id")
      filename = f"{counter:02d}-{slug(style_id, 'base-styles')}.css"
      rel_path = f"src/styles/legacy/{filename}"
      (STYLE_DIR / filename).write_text(content.strip() + "\n", encoding="utf-8")
      counter += 1
      id_attr = f' id="{style_id}"' if style_id else ""
      return f'<link{id_attr} rel="stylesheet" href="{rel_path}">'

    return re.sub(r"<style([^>]*)>(.*?)</style>", replace, html, flags=re.S)


def extract_scripts(html: str) -> str:
    SCRIPT_DIR.mkdir(parents=True, exist_ok=True)
    counter = 0

    def replace(match: re.Match) -> str:
      nonlocal counter
      attrs, content = match.group(1), match.group(2)
      if re.search(r"\bsrc\s*=", attrs):
          return match.group(0)
      script_id = attr_value(attrs, "id")
      filename = f"{counter:02d}-{slug(script_id, 'app-core')}.js"
      rel_path = f"src/scripts/legacy/{filename}"
      (SCRIPT_DIR / filename).write_text(content.strip() + "\n", encoding="utf-8")
      counter += 1
      id_attr = f' id="{script_id}"' if script_id else ""
      return f'<script{id_attr} src="{rel_path}"></script>'

    return re.sub(r"<script([^>]*)>(.*?)</script>", replace, html, flags=re.S)


def main() -> None:
    html = INDEX.read_text(encoding="utf-8")
    html = extract_styles(html)
    html = extract_scripts(html)
    INDEX.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
