# PokeDraft League

A browser-only draft and league board for friends playing **6v6 National Dex Ubers Doubles**. The first slice runs directly from `index.html`, works on GitHub Pages, and stores one league in the browser's `localStorage`.

## Current slice

- Two-player league setup with three duplicate modes.
- Random pool of 12 Pokémon from the full PokéAPI index, including ordinary and legendary species.
- Snake draft with six picks per player.
- Local roster and Pokémon details: types, ability, and base stats in the data layer.
- Match recording, standings, win/loss records, and consecutive loss streaks.
- Reroll candidate generation after losses, with candidate count equal to the loss streak and one resolved reroll per loss sequence.
- Candidate cards show types, abilities, base stats, and links to PokéDB.
- Pure game engine in `src/game/engine.js`, separate from DOM rendering.

Reroll replacement controls show every candidate and let the player accept zero, one, or multiple candidates while choosing distinct roster slots.

## Run it

Open `index.html` in a browser. No server or build tool is required for the app itself. For development, use any static-file preview extension in VS Code or a simple local static server.

The app uses PokéAPI for the complete species index and candidate details. The index and details are cached in the browser, and the bundled seed data is used if the API is unavailable. No API key is required.

The test command requires Node.js 20 or newer:

```powershell
npm test
```

## Structure

- `src/game/engine.js`: framework-free league rules and state transitions.
- `src/game/pokemon.js`: offline fallback Pokémon seed data.
- `src/game/pokemon-api.js`: cached PokéAPI index and on-demand candidate details.
- `src/ui/app.js`: DOM rendering, event wiring, and local persistence.
- `src/ui/styles.css`: responsive visual layer.
- `tests/engine.test.js`: rule-level tests.

## GitHub Pages

Commit the repository, push it to GitHub, then enable Pages from **Settings > Pages** using the repository's main branch and root folder. Because the app uses relative paths and no backend, the published site can be opened by friends immediately.

## Next increments

1. Add learnset previews, likely by linking each candidate to the relevant PokéDB learnset section.
2. Add export/import JSON so friends can share league state without a backend.
3. Add optional tournament brackets and online shared state behind the existing engine API.
