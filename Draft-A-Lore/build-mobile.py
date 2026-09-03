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
WWW = ROOT / "www"
ANDROID_ASSETS = ROOT / "android" / "app" / "src" / "main" / "assets" / "public"


def main() -> None:
    if WWW.exists():
        shutil.rmtree(WWW)
    WWW.mkdir()

    (WWW / "index.html").write_text(render_html(include_web_metadata=False), encoding="utf-8")

    staged = sorted(path.relative_to(WWW).as_posix() for path in WWW.rglob("*") if path.is_file())
    print(f"Staged {len(staged)} offline web assets in {WWW}")

    # Gradle packages this mirror as the Capacitor WebView runtime.
    if ANDROID_ASSETS.parent.is_dir():
        if ANDROID_ASSETS.exists():
            shutil.rmtree(ANDROID_ASSETS)
        shutil.copytree(WWW, ANDROID_ASSETS)
        print(f"Mirrored them into {ANDROID_ASSETS} for the Android build")


if __name__ == "__main__":
    main()
