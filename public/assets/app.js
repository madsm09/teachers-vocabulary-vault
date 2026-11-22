/* Vocab Vault app shell: routing, subject + game pickers, game stage, word bank. */
(function () {
  const VV = window.VV;
  const app = document.getElementById("app");
  const esc = VV.esc;

  const SUBJECTS = (window.VV_SUBJECTS || []).map((s) => ({
    ...s,
    terms: s.terms.map((t) => ({ ...t, subject: s.title, subjectId: s.id })),
  }));
  const MIXED = {
    id: "mixed",
    title: "Mixed Vault (All Subjects)",
    icon: "🎲",
    tagline: "A shuffled blend of every subject — perfect for revision days.",
    terms: SUBJECTS.flatMap((s) => s.terms),
  };
  const ALL = SUBJECTS.concat([MIXED]);
  const findSubject = (id) => ALL.find((s) => s.id === id);
  const findGame = (id) => VV.games.find((g) => g.id === id);
  const totalTerms = SUBJECTS.reduce((n, s) => n + s.terms.length, 0);

  let activeCtx = null;

  /* ---------- Routing ---------- */
  function route() {
    if (activeCtx) {
      activeCtx.destroy();
      activeCtx = null;
    }
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    document.querySelectorAll(".topnav a").forEach((a) => a.classList.remove("active"));
    if (parts[0] === "bank") {
      document.getElementById("navBank").classList.add("active");
      renderBank(parts[1]);
    } else if (parts[0] === "s" && findSubject(parts[1])) {
      const subject = findSubject(parts[1]);
      const game = parts[2] && findGame(parts[2]);
      if (game) renderStage(subject, game);
      else renderGamePicker(subject);
    } else {
      renderHome();
    }
    window.scrollTo({ top: 0 });
    app.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);

  /* ---------- Home ---------- */
  function renderHome() {
    document.title = "Vocab Vault — Classroom Word Games, Crosswords, Riddles & Pictionary";
    const sample = MIXED.terms[VV.rand(MIXED.terms.length)] || { riddle: "", term: "" };
    app.innerHTML = `
      <section class="hero">
        <div>
          <span class="eyebrow">Digital classroom resource</span>
          <h1>Crack the vault, one <em>word</em> at a time.</h1>
          <p class="lead">Pick a subject, choose a game, and project it for the class. Riddles, crosswords with real clues,
          Pictionary with visual prompts, word searches and more — all built from the same academic word banks.</p>
          <div class="hero-stats">
            <div class="stat"><b>${SUBJECTS.length}</b><span>Subjects</span></div>
            <div class="stat"><b>${totalTerms}</b><span>Terms &amp; riddles</span></div>
            <div class="stat"><b>${VV.games.length}</b><span>Games</span></div>
          </div>
        </div>
        <aside class="hero-dossier" aria-label="Sample riddle">
          <span class="stamp">Classified</span>
          <span class="eyebrow" style="color:var(--muted)">Sample case · ${esc(sample.subject || "")}</span>
          <p class="riddle-sample">“${esc(sample.riddle)}”</p>
          <p style="margin:0">Answer: <span class="answer-blur" tabindex="0" title="Hover or focus to reveal">${esc(sample.term)}</span></p>
        </aside>
      </section>

      <div class="section-head">
        <div><span class="step">Step 1</span><h2>Select an academic discipline</h2></div>
      </div>
      <div class="tile-grid">
        ${ALL.map(
          (s) => `
          <a class="tile" href="#/s/${s.id}">
            <span class="tile-icon">${s.icon}</span>
            <h3>${esc(s.title)}</h3>
            <p>${esc(s.tagline || "")}</p>
            <span class="meta"><span class="tag">${s.terms.length} terms</span><span class="tag">${VV.games.length} games</span></span>
          </a>`
        ).join("")}
      </div>

      <div class="section-head">
        <div><span class="step">Step 2</span><h2>Then choose any game</h2></div>
      </div>
      <div class="tile-grid">
        ${VV.games
          .map(
            (g) => `<div class="tile game" style="cursor:default">
              <span class="tile-icon">${g.icon}</span><h3>${esc(g.name)}</h3><p>${esc(g.desc)}</p>
            </div>`
          )
          .join("")}
      </div>`;
  }

  /* ---------- Game picker ---------- */
  function renderGamePicker(subject) {
    document.title = `${subject.title} — Vocab Vault`;
    app.innerHTML = `
      <div class="crumbs"><a href="#/">Subjects</a> › <span>${esc(subject.title)}</span></div>
      <div class="section-head">
        <div>
          <span class="step">${subject.icon} ${subject.terms.length} terms loaded</span>
          <h2>${esc(subject.title)} — choose a game</h2>
          <p class="howto">${esc(subject.tagline || "")}</p>
        </div>
        <a class="btn secondary small" href="#/bank/${subject.id}">📜 View full word bank</a>
      </div>
      <div class="tile-grid">
        ${VV.games
          .map(
            (g) => `
          <a class="tile game" href="#/s/${subject.id}/${g.id}">
            <span class="tile-icon">${g.icon}</span>
            <h3>${esc(g.name)}</h3>
            <p>${esc(g.desc)}</p>
            <span class="meta">${(g.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</span>
          </a>`
          )
          .join("")}
      </div>`;
  }

  /* ---------- Stage ---------- */
  function loadOpts(game) {
    const defaults = {};
    (game.options || []).forEach((o) => (defaults[o.key] = o.def));
    try {
      const saved = JSON.parse(localStorage.getItem("vv-opt-" + game.id)) || {};
      (game.options || []).forEach((o) => {
        if (saved[o.key] !== undefined && o.choices.some((c) => String(c[0]) === String(saved[o.key]))) defaults[o.key] = saved[o.key];
      });
    } catch (e) {}
    return defaults;
  }
  function saveOpts(game, opts) {
    try {
      localStorage.setItem("vv-opt-" + game.id, JSON.stringify(opts));
    } catch (e) {}
  }

  function renderStage(subject, game) {
    document.title = `${game.name} · ${subject.title} — Vocab Vault`;
    const opts = loadOpts(game);
    app.innerHTML = `
      <div class="crumbs no-print"><a href="#/">Subjects</a> › <a href="#/s/${subject.id}">${esc(subject.title)}</a> › <span>${esc(game.name)}</span></div>
      <div class="stage-head">
        <div>
          <h2><span>${game.icon}</span>${esc(game.name)}</h2>
          <p class="howto">${esc(game.howto || game.desc)}</p>
        </div>
        <div class="scorebox"><span class="pill timer" data-timer hidden></span><span data-status class="scorebox"></span></div>
      </div>
      <div class="panel no-print">
        <div class="options" data-options>
          ${(game.options || [])
            .map(
              (o) => `<div class="opt"><label>${esc(o.label)}</label>
              <div class="seg" role="group" aria-label="${esc(o.label)}" data-key="${o.key}">
                ${o.choices
                  .map((c) => `<button type="button" data-v="${esc(c[0])}" aria-pressed="${String(c[0]) === String(opts[o.key])}">${esc(c[1])}</button>`)
                  .join("")}
              </div></div>`
            )
            .join("")}
          <div class="opt"><button class="btn pink" data-new>↻ New game</button></div>
        </div>
      </div>
      <div class="game-area" data-area></div>`;

    const area = app.querySelector("[data-area]");
    const statusEl = app.querySelector("[data-status]");
    const timerEl = app.querySelector("[data-timer]");

    function start() {
      if (activeCtx) activeCtx.destroy();
      area.innerHTML = "";
      statusEl.innerHTML = "";
      let pool = subject.terms.filter((t) => (game.filter ? game.filter(t, opts) : true));
      if (pool.length < (game.minTerms || 4)) {
        area.innerHTML = `<div class="panel center">Not enough suitable terms in this subject for ${esc(game.name)}. Try another subject or option.</div>`;
        return;
      }
      pool = VV.shuffle(pool);
      activeCtx = VV.makeContext({
        el: area,
        statusEl,
        timerEl,
        terms: pool,
        subject,
        opts: { ...opts },
        restart: start,
      });
      game.start(activeCtx);
    }

    app.querySelectorAll(".seg").forEach((seg) => {
      seg.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const key = seg.dataset.key;
        const optDef = game.options.find((o) => o.key === key);
        const choice = optDef.choices.find((c) => String(c[0]) === b.dataset.v);
        opts[key] = choice[0];
        seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        saveOpts(game, opts);
        start();
      });
    });
    app.querySelector("[data-new]").addEventListener("click", start);
    start();
  }

  /* ---------- Word bank ---------- */
  function renderBank(subjectId) {
    const subject = findSubject(subjectId) || MIXED;
    document.title = `Word Bank · ${subject.title} — Vocab Vault`;
    app.innerHTML = `
      <div class="crumbs no-print"><a href="#/">Subjects</a> › <span>Word Bank</span></div>
      <div class="section-head">
        <div><span class="step">📜 Classroom deck</span><h2>Word Bank — ${esc(subject.title)}</h2>
        <p class="howto">Every term with its riddle, coded hint, crossword clue and Pictionary visual. Print it for a paper deck.</p></div>
      </div>
      <div class="bank-tools">
        <select class="text-input" style="max-width:300px" data-subj aria-label="Subject">
          ${ALL.map((s) => `<option value="${s.id}" ${s.id === subject.id ? "selected" : ""}>${s.icon} ${esc(s.title)}</option>`).join("")}
        </select>
        <input class="text-input" style="max-width:260px" placeholder="Search terms…" data-q aria-label="Search terms">
        <button class="btn secondary" data-print>🖨 Print</button>
        <a class="btn" href="#/s/${subject.id}">🎮 Play games</a>
        <span class="pill light" data-count></span>
      </div>
      <div style="overflow:auto"><table class="bank-table">
        <thead><tr><th>#</th><th>Term</th><th>Riddle</th><th>Hint</th><th>Crossword clue</th><th>Visual</th>${subject.id === "mixed" ? "<th>Subject</th>" : ""}</tr></thead>
        <tbody data-body></tbody>
      </table></div>`;
    const body = app.querySelector("[data-body]");
    const count = app.querySelector("[data-count]");
    function draw(q) {
      const qq = (q || "").toLowerCase();
      const rows = subject.terms.filter((t) => !qq || (t.term + " " + t.riddle + " " + t.clue).toLowerCase().includes(qq));
      count.textContent = `${rows.length} terms`;
      body.innerHTML = rows
        .map(
          (t, i) => `<tr><td>${i + 1}</td><td class="t">${esc(t.term)}</td><td>${esc(t.riddle)}</td><td><i>${esc(t.hint)}</i></td><td>${esc(t.clue)}</td><td class="v" title="${esc(t.draw)}">${esc(t.visual)}</td>${
            subject.id === "mixed" ? `<td>${esc(t.subject)}</td>` : ""
          }</tr>`
        )
        .join("");
    }
    draw("");
    app.querySelector("[data-q]").addEventListener("input", (e) => draw(e.target.value));
    app.querySelector("[data-subj]").addEventListener("change", (e) => (location.hash = "#/bank/" + e.target.value));
    app.querySelector("[data-print]").addEventListener("click", () => window.print());
  }

  /* ---------- Teams toggle ---------- */
  const teamsBar = document.getElementById("teamsBar");
  document.getElementById("teamsToggle").addEventListener("click", () => {
    teamsBar.hidden = !teamsBar.hidden;
    if (!teamsBar.hidden) VV.renderTeams();
    try {
      localStorage.setItem("vv-teams-open", teamsBar.hidden ? "0" : "1");
    } catch (e) {}
  });
  try {
    if (localStorage.getItem("vv-teams-open") === "1") {
      teamsBar.hidden = false;
      VV.renderTeams();
    }
  } catch (e) {}

  route();
})();
