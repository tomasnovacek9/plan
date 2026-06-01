#!/usr/bin/env python3
from pathlib import Path
import base64
import hashlib
import re


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "src" / "assets" / "generated"
TARGETS = [
    ROOT / "index.html",
    *sorted((ROOT / "src" / "styles").glob("**/*.css")),
    *sorted((ROOT / "src" / "scripts").glob("**/*.js")),
]

DATA_IMAGE = re.compile(r"data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)")


def replacement_path(source: Path, asset: Path) -> str:
    if source.suffix == ".css":
        return Path("../" * len(source.relative_to(ROOT).parent.parts)).joinpath(
            asset.relative_to(ROOT)
        ).as_posix()
    return asset.relative_to(ROOT).as_posix()


def replace_in_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    def replace(match: re.Match) -> str:
        ext = "jpg" if match.group(1) == "jpeg" else match.group(1)
        data = base64.b64decode(match.group(2))
        digest = hashlib.sha1(data).hexdigest()[:12]
        asset = ASSET_DIR / f"image-{digest}.{ext}"
        asset.parent.mkdir(parents=True, exist_ok=True)
        if not asset.exists():
            asset.write_bytes(data)
        return replacement_path(path, asset)

    updated = DATA_IMAGE.sub(replace, text)
    if updated != text:
        path.write_text(updated, encoding="utf-8")


def main() -> None:
    for path in TARGETS:
        if path.exists():
            replace_in_file(path)


if __name__ == "__main__":
    main()
