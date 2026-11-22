# AGENTS.md
Static site, no build step; Netlify publishes `public/`. See PLAN.md for remaining milestones.

- `public/data/<subject>.js` — each pushes `{id,title,icon,tagline,terms:[{term,riddle,hint,clue,visual,draw}]}` onto `window.VV_SUBJECTS`. Clues/riddles must not contain the term.
- `public/assets/core.js` — `window.VV` helpers, game registry (`VV.registerGame`), `VV.makeContext` (timer, status pills, cleanup), teams scoreboard in localStorage.
- `public/assets/app.js` — hash router (`#/`, `#/s/<subject>`, `#/s/<subject>/<game>`, `#/bank/<subject>`), option segmented controls (`options: [{key,label,def,choices:[[value,label]]}]`, persisted per game), plus a "mixed" all-subjects deck.
- Script load order in `index.html`: data → core.js → games → app.js.
