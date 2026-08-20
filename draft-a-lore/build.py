#!/usr/bin/env python3
"""Web build: inlines src/ into one self-contained HTML file.

Reads src/ and assets/, writes dist/DraftALore.html plus the icons, favicon and
web app manifest it references, so dist/ is a self-contained folder that can be
copied anywhere and opened offline. A copy of the built file and the favicon is
also placed in releases/ next to the Windows installer.
"""
import os
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'src')
ASSETS = os.path.join(BASE, 'assets')
DIST = os.path.join(BASE, 'dist')
RELEASES = os.path.join(BASE, 'releases')

OUTPUT_NAME = 'DraftALore.html'

# Copied into dist/ so the built page finds the files it links to.
DIST_ASSETS = ('favicon.ico', 'manifest.webmanifest', 'logo.png')


def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def render_html():
    """Return the complete single-file HTML document as a string."""
    css = read_file(os.path.join(SRC, 'styles.css'))
    core_js = read_file(os.path.join(SRC, 'core.js'))
    views_js = read_file(os.path.join(SRC, 'views.js'))
    story_js = read_file(os.path.join(SRC, 'story-tools.js'))
    rpg_js = read_file(os.path.join(SRC, 'rpg-engine.js'))
    adventure_js = read_file(os.path.join(SRC, 'adventure-tools.js'))

    # rpg-engine defines DAL.rpg, which the adventure tools call while rendering,
    # so it has to be in place before adventure-tools.js runs.
    all_js = '\n\n'.join([core_js, views_js, story_js, rpg_js, adventure_js])

    # The export code emits an HTML document containing a literal '</script>'.
    # Left as-is, that string closes the inline <script> block of this build and
    # breaks the whole app, so escape any closing-tag sequence for inlining.
    all_js = all_js.replace('</script', '<\\/script')
    css = css.replace('</style', '<\\/style')

    # The same export code also emits literal '</body></html>'. That is valid
    # inside a <script> block, but it makes the built file contain a false
    # end-of-document marker: any tool that injects content before the last
    # </body></html> (hosting platforms, analytics snippets, live-reload
    # wrappers) will inject it into the middle of our JavaScript instead.
    # Escaping keeps the emitted export byte-identical while removing the trap.
    all_js = all_js.replace('</body', '<\\/body').replace('</html', '<\\/html')

    return f'''<!DOCTYPE html>
<!--
  Draft A Lore v1.0.0 — created by Daymien Vanhorn
  https://github.com/Hexxis-cmd/Draft-A-Lore
  Copyright 2026 Daymien Vanhorn. Free for noncommercial use under the PolyForm
  Noncommercial License 1.0.0 plus supplemental terms (LICENSE.md). Credit to the
  original author must remain visible in any distributed version. Commercial use
  requires a license — see COMMERCIAL-LICENSE.md.
-->
<html lang="en" data-theme="aurora">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="Draft A Lore — A writing and RPG adventure design tool. Write novels, build branching narratives, and manage characters and lore, with your work stored on your own device.">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0F1116">
<meta name="application-name" content="Draft A Lore">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Draft A Lore">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>Draft A Lore</title>
<link rel="icon" href="favicon.ico" sizes="16x16 24x24 32x32 48x48 64x64 128x128 256x256">
<link rel="icon" type="image/png" sizes="32x32" href="icons/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="icons/icon-512.png">
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<style>
{css}
</style>
</head>
<body>
<script>
{all_js}
</script>
<script>
if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', function() {{ DAL.init(); }});
}} else {{
    DAL.init();
}}
</script>
</body>
</html>'''


def copy_assets(destination, include_icons=True):
    os.makedirs(destination, exist_ok=True)
    for name in DIST_ASSETS:
        source = os.path.join(ASSETS, name)
        if os.path.isfile(source):
            shutil.copy2(source, os.path.join(destination, name))
    icons = os.path.join(ASSETS, 'icons')
    if include_icons and os.path.isdir(icons):
        target = os.path.join(destination, 'icons')
        if os.path.isdir(target):
            shutil.rmtree(target)
        shutil.copytree(icons, target)


def build():
    html = render_html()

    os.makedirs(DIST, exist_ok=True)
    dist_file = os.path.join(DIST, OUTPUT_NAME)
    with open(dist_file, 'w', encoding='utf-8') as f:
        f.write(html)
    copy_assets(DIST)
    print(f'Built dist/{OUTPUT_NAME} ({len(html):,} bytes)')

    # releases/ is committed so the app can be downloaded and run without a
    # build step. Only the favicon ships with it, for the Windows shortcut icon.
    os.makedirs(RELEASES, exist_ok=True)
    shutil.copy2(dist_file, os.path.join(RELEASES, OUTPUT_NAME))
    favicon = os.path.join(ASSETS, 'favicon.ico')
    if os.path.isfile(favicon):
        shutil.copy2(favicon, os.path.join(RELEASES, 'favicon.ico'))
    print(f'Copied to releases/{OUTPUT_NAME}')


if __name__ == '__main__':
    build()
