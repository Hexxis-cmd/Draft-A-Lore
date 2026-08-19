#!/usr/bin/env python3
"""Build script for Draft A Lore — inlines all CSS/JS into a single index.html.

Icons, the web app manifest and the viewport/theme metadata are emitted here so
the built file behaves like an installed app (Windows shortcut icon, Android
home-screen icon, correct scaling on any display) while staying fully offline.
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'src')

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def build():
    css = read_file(os.path.join(SRC, 'styles.css'))
    core_js = read_file(os.path.join(SRC, 'core.js'))
    views_js = read_file(os.path.join(SRC, 'views.js'))
    story_js = read_file(os.path.join(SRC, 'story-tools.js'))
    adventure_js = read_file(os.path.join(SRC, 'adventure-tools.js'))

    all_js = '\n\n'.join([core_js, views_js, story_js, adventure_js])

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

    html = f'''<!DOCTYPE html>
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
<meta name="description" content="Draft A Lore — A comprehensive writing and RPG adventure design tool. Write novels, build branching narratives, manage characters and lore, all offline in a single file.">
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<script>
{all_js}
</script>
<script>
// Initialize the app when DOM is ready
if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', function() {{ DAL.init(); }});
}} else {{
    DAL.init();
}}
</script>
</body>
</html>'''

    out_path = os.path.join(BASE, 'index.html')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Built index.html ({len(html):,} bytes)')

if __name__ == '__main__':
    build()
