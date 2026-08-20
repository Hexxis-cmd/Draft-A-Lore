#!/usr/bin/env python3
"""Mobile build: stages the offline web runtime used by the Capacitor Android wrapper.

Reads src/ and assets/ through the same renderer as build.py and writes www/,
the directory named by capacitor.config.json's webDir. Run this before
`npx cap sync android`.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from build import render_html

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
WWW = ROOT / "www"

ASSET_FILES = ("favicon.ico", "manifest.webmanifest", "logo.png")


def main() -> None:
    if WWW.exists():
        shutil.rmtree(WWW)
    WWW.mkdir()

    # Capacitor loads www/index.html as the app entry point.
    (WWW / "index.html").write_text(render_html(), encoding="utf-8")

    for name in ASSET_FILES:
        source = ASSETS / name
        if source.is_file():
            shutil.copy2(source, WWW / name)

    icons = ASSETS / "icons"
    if icons.is_dir():
        shutil.copytree(icons, WWW / "icons")

    staged = sorted(path.relative_to(WWW).as_posix() for path in WWW.rglob("*") if path.is_file())
    print(f"Staged {len(staged)} offline web assets in {WWW}")


if __name__ == "__main__":
    main()
