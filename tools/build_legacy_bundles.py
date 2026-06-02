#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STYLE_DIR = ROOT / "src" / "styles" / "legacy"
SCRIPT_DIR = ROOT / "src" / "scripts" / "legacy"
STYLE_BUNDLE = STYLE_DIR / "bundle.css"
SCRIPT_BUNDLE = SCRIPT_DIR / "bundle.js"
RUNTIME_SKIPPED_SCRIPTS = {
    "03-weekly-note-script-v8.js",
    "04-note-separate-v12.js",
    "05-all-day-time-v52.js",
    "06-repeat-events-v53.js",
    "07-reload-calendar-on-week-change-v54.js",
    "10-empty-days-only-v83.js",
    "11-current-week-on-start-v84.js",
    "14-hide-left-dates-v103-js.js",
    "17-empty-days-all-day-v162-js.js",
    "18-footer-bg-allday-v164-js.js",
    "22-note-direct-render-v174-js.js",
    "23-note-source-fixed-v180-js.js",
    "24-note-colors-final-v181-js.js",
    "25-note-no-blue-left-yellow-v182-js.js",
    "26-weekend-created-v184-js.js",
    "27-multiline-note-page-align-v186-js.js",
    "28-final-polish-v188-js.js",
    "29-restore-controls-note-v190-js.js",
    "30-note-source-final-v193-js.js",
    "32-clean-responsible-core-v213-js.js",
}


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
        if (
            path.name == SCRIPT_BUNDLE.name
            or path.name.startswith("mutation-guard-")
            or path.name in RUNTIME_SKIPPED_SCRIPTS
        ):
            continue
        parts.append(f"// {path.name}\n{path.read_text(encoding='utf-8').strip()}\n")
    SCRIPT_BUNDLE.write_text("\n;\n".join(parts) + "\n", encoding="utf-8")


def main() -> None:
    bundle_css()
    bundle_js()


if __name__ == "__main__":
    main()
