# Prompt 2 Play

A tiny static arcade designed to publish one AI-generated browser game every day. The homepage is generated from each game's metadata, so merged games automatically appear in the arcade.

## Run locally

```bash
node scripts/generate-games.mjs
python3 -m http.server 8000
```

Then open `http://localhost:8000`. No build step is required.

## Structure

Each game lives in `games/<slug>/` with an `index.html` entry point and a `prompt.json` metadata file. Its preview can live anywhere in the repository and is referenced by the project-relative `game.preview` field.

`scripts/generate-games.mjs` scans every game directory, validates its metadata and files, then writes `games.json`. The homepage loads that generated manifest and renders the arcade cards newest-first.

## Add a game

1. Create `games/<slug>/index.html` and any supporting game files.
2. Add a valid `games/<slug>/prompt.json`, including a project-relative preview path in `game.preview`.
3. Add the preview image and open a pull request. Do not edit `index.html` or `games.json`.

The GitHub Actions workflow validates every pull request. After a merge to `main`, it regenerates `games.json` and deploys the complete site to GitHub Pages.

In the repository settings, configure **Pages → Build and deployment → Source** to **GitHub Actions**.

The current GitHub links are placeholders until the repository URL is finalized.
