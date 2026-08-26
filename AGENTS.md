# Prompt 2 Play contributor instructions

This repository publishes small, self-contained browser games. Follow this document whenever creating or modifying a game.

## Create exactly one new game

1. Read every existing `games/*/prompt.json` file before choosing an idea.
2. Choose a name, premise, visual theme, and core mechanic that do not materially duplicate an existing game.
3. Write the complete generation prompt before implementing the game. Treat that prompt as the game's fixed design brief and do not revise it to match the finished implementation.
4. Create one new directory at `games/<slug>/`. Do not modify an existing game to make a new submission.
5. Add `games/<slug>/prompt.json` using the schema below, preserving the generation prompt verbatim in `generation.prompt`. For automated runs, create this file before writing the game's implementation files.
6. Implement a playable static browser game with an `index.html` entry point. Supporting CSS, JavaScript, audio, and image files must remain inside the new game directory unless they are the preview image referenced by metadata.
7. Add a 16:9 preview image. SVG, WebP, PNG, and JPEG are suitable. Prefer a lightweight asset and do not use copyrighted third-party artwork.
8. Run `node scripts/generate-games.mjs`. This validates the submission and regenerates `games.json`; never edit `games.json` manually.
9. Test the game from a local HTTP server, including its start, controls, win or loss condition, restart flow, and mobile-sized layout.
10. Submit only the new game files, its preview, and the regenerated `games.json`. Avoid unrelated changes.

## Game requirements

- Use browser-native HTML, CSS, and JavaScript. The published game must not require a build step or server runtime.
- Do not depend on CDNs, remote APIs, analytics, trackers, advertisements, login, or secrets.
- Make the game understandable without external instructions.
- Provide keyboard controls when appropriate and pointer or touch controls for mobile play.
- Include a clear start state, active gameplay, an end or completion state, and a replay path.
- Keep all content suitable for a general audience.
- Use semantic HTML and accessible names for interactive controls.
- Avoid changing the homepage manually. Arcade cards, numbering, game count, and the latest-game link come from `games.json`.

## Directory layout

```text
games/<slug>/
├── index.html       # required entry point
├── prompt.json      # required metadata
├── preview.svg      # recommended preview location/name
├── game.css         # optional
└── game.js          # optional
```

The preview may use another supported image format or location, but `game.preview` must contain its project-root-relative path.

## Metadata schema

Every `prompt.json` must be valid JSON with this structure:

```json
{
  "schemaVersion": 1,
  "game": {
    "slug": "example-game",
    "name": "Example Game",
    "description": "A short sentence describing the objective and primary mechanic.",
    "createdAt": "2026-08-26",
    "genre": "arcade",
    "controls": ["ArrowLeft", "ArrowRight", "Space", "Pointer"],
    "preview": "games/example-game/preview.svg"
  },
  "generation": {
    "model": "model identifier used for the implementation",
    "author": "creator or automation name",
    "harness": "codex",
    "prompt": "The exact, complete game-generation prompt written before implementation."
  }
}
```

### Field definitions

| Field | Required value |
| --- | --- |
| `schemaVersion` | Integer `1`. Change only when the repository schema changes. |
| `game.slug` | Unique lowercase kebab-case identifier. It must exactly match the directory name. |
| `game.name` | Unique human-readable game title. |
| `game.description` | One concise sentence explaining what the player does. |
| `game.createdAt` | Real creation date in `YYYY-MM-DD` format. |
| `game.genre` | Short lowercase category such as `arcade`, `puzzle`, `strategy`, or `rhythm`. |
| `game.controls` | Non-empty array naming every supported input, using values such as `ArrowLeft`, `Space`, `Pointer`, or `Touch`. |
| `game.preview` | Existing project-root-relative image path with no URL or `..` traversal. |
| `generation.model` | Exact model identifier when available. If the scheduled environment does not expose it, use `codex-default` rather than guessing. |
| `generation.author` | Human, team, or automation credited with creating the game. Scheduled runs should use `Prompt 2 Play Bot`. |
| `generation.harness` | Tool used to run the model; use `codex` for Codex-created games. |
| `generation.prompt` | Exact prompt used as the implementation brief, without summaries or later rewriting. |

The generator also requires `games/<slug>/index.html` and the referenced preview file to exist. Invalid or incomplete metadata fails CI.

## Validation

Run these checks before submitting:

```bash
node scripts/generate-games.mjs
node --check scripts/generate-games.mjs
git diff --check
python3 -m http.server 8000
```

Open `http://localhost:8000`, confirm the new card appears first when it has the newest date, open the game, and exercise every declared control. Stop the local server afterward.

## Pull request expectations

- Use a branch such as `game/<slug>`.
- Create exactly one game per pull request.
- Explain the concept, controls, model, and verification performed.
- Do not merge when validation fails.
- Automated scheduled runs should leave a reviewable commit or worktree. They may push a branch only when Git authentication and unattended network permission have been deliberately configured.
