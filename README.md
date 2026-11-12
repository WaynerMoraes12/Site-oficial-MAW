# MAW official website

Static Astro 7 website for **MAW — Musical Artificial Workspace**, the DAW for Windows, macOS and Linux with AI in the timeline. The Windows installer includes the AI environment; the macOS and Linux packages are built in this repository from the published source. English is served at `/`, with our Portuguese translation at `/pt/` and Spanish at `/es/`. At the root, visitors who have not chosen a language are redirected according to their browser language. Specifications are in `docs/superpowers/specs/` (translation in §10); implementation plans are in `docs/superpowers/plans/`.

## Run locally

```bash
npm install
npm run dev          # http://localhost:4321
npm test             # unit tests (Vitest)
npm run test:e2e     # build + preview + Playwright (1440px desktop and 390px mobile)
npm run build && npm run check:dist   # no Portuguese on the English page; valid local links
python -m unittest discover -s tools/tests   # logo and icons
```

### Test the GitHub Pages base path

In PowerShell:

```powershell
$env:BASE_PATH = '/Site-oficial-MAW'; npm run build; npm run check:dist; Remove-Item Env:BASE_PATH
```

In Git Bash, disable path conversion. Otherwise `/Site-oficial-MAW` becomes `C:/Program Files/Git/Site-oficial-MAW`, and the checker reports hundreds of broken links:

```bash
MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run build
MSYS_NO_PATHCONV=1 BASE_PATH=/Site-oficial-MAW npm run check:dist
```

## Where to edit content

| Content | File |
| --- | --- |
| Version and flags (`neuralServerBundled`, `sourceCodeUrl`) | `src/data/site.json` |
| Social channels: fill in `href` and `value` to show them | `src/data/channels.ts` |
| All visible copy in English, Portuguese and Spanish | `src/i18n/en.ts`, `pt.ts`, `es.ts` (matching structure; tests catch untranslated English) |
| Non-text data: shortcuts, roadmap status, numbers and images | `src/data/*.ts` |
| Screenshots | `src/assets/screens/` (see `tools/screenshots/README.md`) |
| Album-art scenes behind sections (neon city in the World Tour, night forest in the FAQ, battle flag in Backstage) | `src/components/art/`; the tree, the buildings and the embers are drawn at build time with a fixed seed in `src/lib/scenery.ts` |
| Browser, Apple touch and installer icons | `python tools/make_icons.py`, using MAW's official app icon |

## Measured figures, camera and pedals

The ticker and Backstage figures follow MAW's `README.md` at `497127b` (24 October 2026), confirmed by running that build's `--run-tests` on Windows: **11,564 passing checks in 907 test blocks**, and an average **0.37% of the audio block budget for 32 tracks at 48 kHz with 512-sample blocks**. The Windows count is taken without FFmpeg on the PATH; with FFmpeg and FFprobe available, the mp3 and camera blocks check 42 more things. On Linux the suite has 905 blocks and 11,537 checks. The benchmark describes that measured configuration; it is not a performance guarantee for every computer or plugin chain. The values live in `src/data/backstage.ts`, and the ticker and Backstage texts of the three dictionaries repeat them; `tests/unit/data.test.ts` fails when they disagree.

The camera take sits below the two sides of the tracklist (`Tracklist.astro`, `tracklist.camera` in the dictionaries) and follows MAW's `Source/Video/README.md`: three files per take (an MP4 ready to post with the processed audio, the same video without audio, and a 24-bit WAV at the interface's sample rate), FFmpeg 5.1+ with FFprobe, up to 20 minutes per take, and sync calibrated with a visible clap.

The Rack draws one pedal per built-in effect, in the order of MAW's EFEITO menu (`src/data/rack.ts`). The same names are shielded from the browser's translator when they show up in the tracklist or in the Rack text.

## World Tour (roadmap)

World Tour is generated rather than maintained by hand: `npm run tour` reads MAW's GitHub repository and writes `src/data/tour.json` (specification §11).

- **On the road**: the installer version (`mawCommit` in `release.json`) and features delivered after the debut and included in that installer.
- **Rehearsing**: a feature PR, a direct `feat:` commit on `main`, or completed issue work that has not reached that installer; also open feature PRs and `feature/*` branches with work but no PR.
- **Announced**: an open MAW issue labelled `roadmap`. A PR that mentions `#number`, or a branch created from the issue (`73-…`), moves it to Rehearsing. A `feature/…` branch without a PR does not identify its related issue: cite `#number` in the PR.

Direct commits and completed issues are read from the last 120 days, with at most 400 main commits, 200 closed issues and 30 issue timelines considered per sync. A closed issue needs a main commit linked by a closing event, a closing keyword, or a completion comment with an unambiguous commit SHA. Closing an issue alone never marks it delivered: every linked commit must be an ancestor of the installer commit. Maintenance-only commits are omitted, and linked PR/issue/commit representations are deduplicated. Existing stop IDs and saved translations remain available. Reaching a collection limit emits a warning; incomplete timelines do not supply completion evidence.

For each new stop, Claude CLI on this PC writes a short title in EN/PT/ES. Any text can be corrected directly in `src/data/tour.json`; existing translations are never overwritten. `npm run check:tour` (part of `check:dist`) blocks deployment if text is missing or the snapshot does not match the current installer.

A Windows Task Scheduler task named **MAW Site - World Tour** runs `scripts/tour-daily.ps1` every day at 09:00, or when the PC starts. It synchronizes the snapshot and, if anything changed, commits only the files the sync writes (`src/data/tour.json`, `release.json` and `site.json`); whenever a World Tour commit is waiting, it pushes the current branch. It skips the run when those files have uncommitted changes, or during a merge, rebase, cherry-pick or revert. The push sends the whole branch, so local commits not yet pushed are published with it. Logs are in `%LOCALAPPDATA%\MAW-site\tour-sync.log`. Register it again with `powershell -ExecutionPolicy Bypass -File scripts\register-tour-task.ps1`; remove it with `Unregister-ScheduledTask -TaskName 'MAW Site - World Tour' -Confirm:$false`.

## Installer and downloads

MAW's repository stays private. Its pipeline (`.github/workflows/windows-release.yml` there) builds the complete Windows installer, with the AI, on every merge and publishes a private `vX.Y.Z` release with a `release.json`. The downloads offered on the site come from **this** repository's releases, which are public:

1. `npm run publish-release [X.Y.Z]` (also run by the daily task before the World Tour sync) copies MAW's latest release here: every file of the private release, plus `MAW-X.Y.Z-source.zip` — a `git archive` of that commit without `entregas/`, the TCC files and `docs/superpowers/` (`tools/lib/publish.mjs`) — and `platforms.json`. It runs on this PC with the local `gh` login, resumes where it stopped (slow connections), and only publishes after every upload is checked. It needs no token and no paid GitHub minutes.
2. It then starts **Build macOS e Linux** (`.github/workflows/build-mac-linux.yml`): this public repository builds the universal `MAW.app` and the Linux x86-64 package from the published source zip (checked by its SHA-256), stamps the version, runs MAW's suite, attaches `MAW-X.Y.Z-macos-universal.zip` and `MAW-X.Y.Z-linux-x86_64.tar.gz` to the release, adds them to `platforms.json` and starts the deploy. Public repositories pay no Actions minutes, Mac included.
3. `npm run tour` adopts a new MAW version only when its public copy exists, so a failed copy never takes the working download off the site.

On Mac and Linux the AI server is set up separately (guide in the package's `README.md`); stem separation does not work on Apple-chip Macs yet. Specification: `docs/superpowers/specs/2026-11-12-download-tres-sistemas-design.md`.

## Publish

The website is hosted on GitHub Pages at https://waynermoraes12.github.io/Site-oficial-MAW/. The `.github/workflows/deploy.yml` workflow publishes every push to `main`, including the scheduled task's updates, and every run started by the macOS/Linux build. It can also be started manually through Actions → Deploy site to GitHub Pages → Run workflow. It uses `BASE_PATH=/Site-oficial-MAW`.

Before building, `tools/check-release.mjs` reads the release's `platforms.json`, downloads every file the page will link (Windows installer, macOS and Linux packages, source zip) and checks each SHA-256. Without a verified Windows installer the whole site shows “Installer coming soon”; a macOS or Linux package that is missing or different shows “coming soon” only for that system.

## Logo

MAW's logo is never altered. `python tools/logo_web.py --check` verifies that the web logo contains the same pixels as the original.
