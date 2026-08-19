#!/usr/bin/env python3
"""Stage the offline web runtime used by the Capacitor Android wrapper."""

from __future__ import annotations

import re
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent
WWW = ROOT / "www"

RUNTIME_FILES = (
    "index.html",
    "styles.css",
    "core.js",
    "views.js",
    "story-tools.js",
    "adventure-tools.js",
    "favicon.ico",
    "manifest.webmanifest",
    "logo.png",
)


def copy_file(name: str) -> None:
    source = ROOT / name
    if source.is_file():
        destination = WWW / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def main() -> None:
    if WWW.exists():
        shutil.rmtree(WWW)
    WWW.mkdir()

    for name in RUNTIME_FILES:
        copy_file(name)

    icons = ROOT / "icons"
    if icons.is_dir():
        shutil.copytree(icons, WWW / "icons")

    # The source page requests hosted Google fonts. Removing only those staged
    # links makes the packaged app fully offline; CSS fallback fonts still apply.
    index = WWW / "index.html"
    text = index.read_text(encoding="utf-8")
    text = re.sub(
        r'^[ \t]*<link[^>]+https://fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*\n?',
        "",
        text,
        flags=re.MULTILINE,
    )
    index.write_text(text, encoding="utf-8")

    staged = sorted(path.relative_to(WWW).as_posix() for path in WWW.rglob("*") if path.is_file())
    print(f"Staged {len(staged)} offline web assets in {WWW}")


if __name__ == "__main__":
    main()
