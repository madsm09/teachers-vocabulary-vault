# Vocab Vault — Plan

1. ✅ Site shell: subject picker, game picker, game stage with options, team scoreboard, printable word bank (`public/index.html`, `public/assets/`).
2. ✅ Expanded word banks (~45 terms each, with riddle, hint, crossword clue, emoji visual and drawing prompt) for 10 subjects: Sociolinguistics, EAP, ESP, Applied Linguistics, Semantics & Pragmatics, Syntax & Grammar, Discourse Analysis, Psycholinguistics, Literature, Political Science.
3. ⬜ Word banks still to write: `phonology-morphology.js`, `sociology.js` (originals in `public/data/_original_reference.html.txt`). Add their `<script>` tags back to `index.html`.
4. ⬜ Game modules in `public/assets/games/*.js`, each calling `VV.registerGame({id, name, icon, desc, howto, tags, options, minTerms, filter?, start(ctx)})`, then add a `<script>` tag before `app.js`:
   riddles, crossword (uses `clue`), pictionary (uses `visual` + `draw`, canvas), wordsearch, hangman, scramble, quiz, redstring (match riddle↔term), memory, flashcards, sprint (timed).
   CSS for all of these already exists in `styles.css`.
