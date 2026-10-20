# MAW official website

Static Astro 7 website for **MAW — Musical Artificial Workspace**, the DAW for Windows, macOS and Linux with AI in the timeline. The Windows installer includes the AI environment; macOS and Linux show “coming soon” until MAW's release pipeline publishes those packages. English is served at `/`, with our Portuguese translation at `/pt/` and Spanish at `/es/`. At the root, visitors who have not chosen a language are redirected according to their browser language. Specifications are in `docs/superpowers/specs/` (translation in §10); implementation plans are in `docs/superpowers/plans/`.

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
| Browser, Apple touch and installer icons | `python tools/make_icons.py`, using MAW's official app icon |

## Measured figures and camera

The ticker and Backstage figures come from MAW's `docs/TCC-artigo.md` at revision `f33b0eb` (19 October 2026): **10,949 passing checks in 853 test blocks**, and an average **0.37% of the audio block budget for 32 tracks at 48 kHz with 512-sample blocks**. The benchmark describes that measured configuration; it is not a performance guarantee for every computer or plugin chain. Numeric display values live in `src/data/backstage.ts`; their labels and ticker text are translated in the three dictionaries.

The camera block in `Tracklist.astro` preserves the existing 16-track list and describes the three files produced by each take: an **MP4 ready to post with processed audio**, an **MP4 with video only**, and a **24-bit WAV with effects at the audio interface sample rate**. It also states the FFmpeg 5.1+/FFprobe requirement, the 20-minute take limit and the need to calibrate sync with a visible clap. The copy is available in English, Portuguese and Spanish; the logo, purple palette and slogan remain unchanged.

## World Tour (roadmap)

World Tour is generated rather than maintained by hand: `npm run tour` reads MAW's GitHub repository and writes `src/data/tour.json` (specification §11).

- **On the road**: the version included in the website's installer (`mawCommit` in `release.json`).
- **Rehearsing**: a feature PR (`feature/*` or a `feat…` title) merged into MAW's `main` after that installer, an open feature PR, or a `feature/*` branch with work but no PR.
- **Announced**: an open MAW issue labelled `roadmap`. A PR that mentions `#number`, or a branch created from the issue (`73-…`), moves it to Rehearsing. A `feature/…` branch without a PR does not identify its related issue: cite `#number` in the PR.

For each new stop, Claude CLI on this PC writes a short title in EN/PT/ES. Any text can be corrected directly in `src/data/tour.json`; existing translations are never overwritten. `npm run check:tour` (part of `check:dist`) blocks deployment if text is missing or the snapshot does not match the current installer.

A Windows Task Scheduler task named **MAW Site - World Tour** runs `scripts/tour-daily.ps1` every day at 09:00, or when the PC starts. It synchronizes the snapshot and, if it changes, commits only `src/data/tour.json` and pushes the current branch. It does not run with uncommitted changes to `tour.json` or `release.json`, or during a merge/rebase. A push sends the whole branch, including any other local commits not yet pushed. Logs are in `%LOCALAPPDATA%\MAW-site\tour-sync.log`. Register it again with `powershell -ExecutionPolicy Bypass -File scripts\register-tour-task.ps1`; remove it with `Unregister-ScheduledTask -TaskName 'MAW Site - World Tour' -Confirm:$false`.

## Installer

The installer is now built by MAW's repository pipeline (`.github/workflows/windows-release.yml` and its `installer/` directory). Each PR merged into MAW's `main` produces a `vX.Y.Z` release with the complete installer, including AI, and a `release.json`. `npm run tour`, including its scheduled task, downloads the latest release's `release.json` into `src/data/release.json` and tracks its version in `src/data/site.json`. The download button points to MAW's releases (`releaseBaseUrl`). While MAW's repository is private, that link is not public, and `check-release` prevents an inaccessible installer from being offered. Specification: `docs/superpowers/specs/2026-09-28-esteira-e-atualizacao-design.md`.

This repository's `npm run installer` command (Inno Setup using a local `MAW_APP.exe`) is the legacy method, to be removed once MAW's pipeline publishes its first release. Without `release.json`, the download button displays “Installer coming soon”.

## Publish

The website is hosted on GitHub Pages at https://waynermoraes12.github.io/Site-oficial-MAW/. This repository is public; access to MAW's repository and releases is managed separately. The `.github/workflows/deploy.yml` workflow publishes every push to `main`, including the scheduled task's World Tour and release updates. It can also be started manually through Actions → Deploy site to GitHub Pages → Run workflow. It uses `BASE_PATH=/Site-oficial-MAW`.

The download button appears only when the installer described by `release.json` is available and matches its metadata. `tools/check-release.mjs` downloads the file and checks its SHA-256. If verification fails, including when MAW's releases are private, deployment removes `release.json` and the website displays “Installer coming soon”. Once MAW's releases become public under the project's licensing decision, the button appears automatically on the next successful deployment.

## Logo

MAW's logo is never altered. `python tools/logo_web.py --check` verifies that the web logo contains the same pixels as the original.
