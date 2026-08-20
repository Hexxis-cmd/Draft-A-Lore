# Publishing a release

A GitHub Release lets someone download the app alone, without the source. Attach the built
files to a tag; GitHub keeps its own automatic source archives beside them.

## What to attach

| File | What it is | Who wants it |
|---|---|---|
| `DraftALore.html` | The whole app in one file. Open it in any browser. | Desktop and laptop users |
| `DraftALore.apk` | Android package, signed with the release key, for direct installation | Phone and tablet users |
| `Install-DraftALore.bat` | Optional Windows helper that places the app and makes a shortcut | Windows users who want an icon |

Do **not** attach `DraftALore.aab`. The App Bundle is only useful to Google Play, which processes it into device-specific APKs; a person downloading it cannot install it.

Build the files first, from the repository root:

```bash
python3 build.py                                      # dist/DraftALore.html, copied to releases/
python3 build-mobile.py                               # stages the web app for Android
(cd android && ./gradlew assembleRelease bundleRelease)
cp android/app/build/outputs/apk/release/app-release.apk releases/DraftALore.apk
cp android/app/build/outputs/bundle/release/app-release.aab releases/DraftALore.aab
```

Node.js is not involved; see [MOBILE-BUILD.md](MOBILE-BUILD.md) for the toolchain and for the verification step that proves the app is actually inside the APK.

## With the command line

Install the GitHub CLI once and sign in:

```bash
gh auth login
```

Then tag and publish. Run this from the repository root, on a clean, pushed working tree:

```bash
git tag -a v1.0.0 -m "Draft A Lore 1.0.0"
git push origin v1.0.0

gh release create v1.0.0 \
  releases/DraftALore.html \
  releases/DraftALore.apk \
  releases/Install-DraftALore.bat \
  --title "Draft A Lore 1.0.0" \
  --notes-file docs/release-notes/v1.0.0.md
```

Add `--draft` to review it privately first, then publish from the Releases page. Add
`--prerelease` for a build you want people to treat as a test.

To attach a rebuilt file to a release that already exists:

```bash
gh release upload v1.0.0 releases/DraftALore.apk --clobber
```

## With the website

1. Open the repository, then **Releases** in the right sidebar, then **Draft a new release**.
2. **Choose a tag**, type `v1.0.0`, and pick **Create new tag on publish**.
3. Title it `Draft A Lore 1.0.0` and paste the notes.
4. Drag `DraftALore.html`, `DraftALore.apk`, and `Install-DraftALore.bat` into the attachment box.
5. **Publish release**.

## Permanent download links

Once a release exists, these URLs always point at the newest one, so the README never needs editing:

```
https://github.com/Hexxis-cmd/Draft-A-Lore/releases/latest/download/DraftALore.html
https://github.com/Hexxis-cmd/Draft-A-Lore/releases/latest/download/DraftALore.apk
```

Keep asset filenames identical between releases or those links break.

## Version numbers

The application is 1.0.0. When that changes, change it in every place at once:

- `package.json` — `version`
- `src/views.js` — the version line in the Settings credit block
- `android/app/build.gradle` — `versionName`, and raise `versionCode` by one, since Android
  refuses to install over an existing build without a higher `versionCode`
- the tag name

## A note on repository size

`releases/DraftALore.apk` is committed, so every rebuild adds about six megabytes to the
repository's history permanently, and history cannot be slimmed without rewriting it. Once
releases are published, consider adding `releases/*.apk` to `.gitignore` and letting the
Releases page hold the binaries instead. The single-file HTML is small enough that keeping it
committed is harmless.

## Letting people try it without downloading anything

The app is one self-contained file, so GitHub Pages can serve it directly:

1. Create a branch named `gh-pages`.
2. Put the built file on it as `index.html`, along with `assets/manifest.webmanifest`,
   `assets/favicon.ico`, and `assets/icons/`.
3. In **Settings**, then **Pages**, set the source to the `gh-pages` branch.

Work saves to the browser's own storage on the visitor's device, exactly as it does from a
downloaded copy, and nothing is sent anywhere. Warn visitors that clearing site data for the
Pages address clears their projects, and point them at the export options.

## Publishing on itch.io

itch.io can host all three builds on one project page, and it is the easiest way to give
people a playable version with no download at all.

1. On itch.io, choose **Upload new project**. Set **Kind of project** to *HTML*.
2. Upload `releases/DraftALore.html` inside a zip whose entry file is named `index.html`:

       cp releases/DraftALore.html index.html
       zip DraftALore-web.zip index.html

   Tick **This file will be played in the browser** on that upload. itch.io asks which file
   is the entry point only when the zip contains several files; with a single `index.html`
   it detects it automatically. A viewport of 1280×800 with **Fullscreen button** enabled
   suits the workspace layout; the app is responsive down to phone widths.
3. Add `releases/DraftALore.apk` as a second upload and mark it **Android**. itch.io does not
   sign or repackage it — visitors download the same signed file the GitHub release serves.
4. Add `releases/DraftALore.html` a third time as a plain download (untick the browser-play
   box) if you want people to be able to keep an offline copy of the whole app.
5. Because saves live in the visitor's browser storage, itch.io's own domain rules apply: the
   embedded player and a downloaded copy keep **separate** libraries. Say so on the page and
   point people at the export buttons.

The APK on itch.io must be signed with the same key as every future update, exactly as on
GitHub — see the signing section above.
