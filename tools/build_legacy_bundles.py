#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STYLE_DIR = ROOT / "src" / "styles" / "legacy"
SCRIPT_DIR = ROOT / "src" / "scripts" / "legacy"
STYLE_BUNDLE = STYLE_DIR / "bundle.css"
SCRIPT_BUNDLE = SCRIPT_DIR / "bundle.js"


def bundle_css() -> None:
    parts = []
    for path in sorted(STYLE_DIR.glob("*.css")):
        if path.name == STYLE_BUNDLE.name:
            continue
        parts.append(f"/* {path.name} */\n{path.read_text(encoding='utf-8').strip()}\n")
    STYLE_BUNDLE.write_text("\n".join(parts) + "\n", encoding="utf-8")


def bundle_js() -> None:
    parts = []
    for path in sorted(SCRIPT_DIR.glob("*.js")):
        if path.name == SCRIPT_BUNDLE.name or path.name.startswith("mutation-guard-"):
            continue
        parts.append(f"// {path.name}\n{path.read_text(encoding='utf-8').strip()}\n")
    SCRIPT_BUNDLE.write_text("\n;\n".join(parts) + "\n", encoding="utf-8")


def main() -> None:
    bundle_css()
    bundle_js()


if __name__ == "__main__":
    main()
