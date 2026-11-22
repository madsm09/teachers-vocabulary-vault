/* Vocab Vault core: shared helpers, game registry, timers, toasts, teams. */
(function () {
  const VV = (window.VV = window.VV || {});
  VV.games = [];

  VV.registerGame = function (game) {
    VV.games.push(game);
  };

  /* ---------- small utils ---------- */
  VV.esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };
  VV.letters = function (term) {
    return String(term).toUpperCase().replace(/[^A-Z]/g, "");
  };
  VV.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  VV.take = function (arr, n) {
    if (n === "all" || n == null) return arr.slice();
    return arr.slice(0, Number(n));
  };
  VV.rand = function (n) {
    return Math.floor(Math.random() * n);
  };
  VV.distractors = function (pool, correct, n) {
    const others = VV.shuffle(pool.filter((t) => t.term !== correct.term));
    return others.slice(0, n);
  };
  VV.h = function (html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  /** Mask the answer inside free text (useful if a clue accidentally contains it). */
  VV.mask = function (text, term) {
    if (!text) return "";
    let out = String(text);
    String(term)
      .split(/[\s-]+/)
      .filter((w) => w.length > 3)
      .forEach((w) => {
        const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        out = out.replace(re, "_____");
      });
    return out;
  };

  /* ---------- toast ---------- */
  let toastTimer;
  VV.toast = function (msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1900);
  };

  /* ---------- sounds (tiny, optional) ---------- */
  let audioCtx;
  VV.beep = function (kind) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const f = { good: [660, 990], bad: [220, 160], tick: [880, 880], end: [440, 220] }[kind] || [600, 600];
      o.frequency.setValueAtTime(f[0], audioCtx.currentTime);
      o.frequency.linearRampToValueAtTime(f[1], audioCtx.currentTime + 0.15);
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.26);
    } catch (e) {
      /* audio not available */
    }
  };

  /* ---------- confetti-lite celebration ---------- */
  VV.celebrate = function () {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.textContent = ["🎉", "⭐", "🗝️", "✨", "📜"][i % 5];
      s.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-30px;font-size:${18 + Math.random() * 18}px;z-index:60;pointer-events:none;transition:transform ${1.4 + Math.random()}s cubic-bezier(.2,.6,.4,1),opacity 1.8s`;
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${window.innerHeight + 60}px) rotate(${Math.random() * 720}deg)`;
        s.style.opacity = "0.2";
      });
      setTimeout(() => s.remove(), 2600);
    }
  };

  /* ---------- result screen ---------- */
  VV.resultScreen = function (el, { emoji, title, text, onReplay }) {
    el.innerHTML = `
      <div class="panel result">
        <div class="big">${emoji || "🏁"}</div>
        <h3>${VV.esc(title)}</h3>
        <p class="muted">${text || ""}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn pink" data-replay>Play again</button>
          <a class="btn secondary" href="${location.hash.replace(/\/[^/]+$/, "")}">Choose another game</a>
        </div>
      </div>`;
    el.querySelector("[data-replay]").addEventListener("click", onReplay);
  };

  /* ---------- Teams scoreboard (persists in localStorage) ---------- */
  const TEAM_KEY = "vv-teams";
  function loadTeams() {
    try {
      const t = JSON.parse(localStorage.getItem(TEAM_KEY));
      if (Array.isArray(t) && t.length) return t;
    } catch (e) {}
    return [
      { name: "Team Red", score: 0 },
      { name: "Team Blue", score: 0 },
    ];
  }
  function saveTeams(t) {
    try {
      localStorage.setItem(TEAM_KEY, JSON.stringify(t));
    } catch (e) {}
  }
  VV.renderTeams = function () {
    const bar = document.getElementById("teamsBar");
    const teams = loadTeams();
    bar.innerHTML = `<div class="teams-inner">
      <span class="pill">🏆 Scores</span>
      ${teams
        .map(
          (t, i) => `<span class="team" data-i="${i}">
            <input aria-label="Team name" value="${VV.esc(t.name)}">
            <button data-d="-1" aria-label="Minus one">−</button><b>${t.score}</b><button data-d="1" aria-label="Plus one">+</button>
          </span>`
        )
        .join("")}
      <button class="btn small secondary" data-add>+ Team</button>
      <button class="btn small secondary" data-reset>Reset</button>
    </div>`;
    bar.querySelectorAll(".team").forEach((node) => {
      const i = Number(node.dataset.i);
      node.querySelector("input").addEventListener("change", (e) => {
        const t = loadTeams();
        t[i].name = e.target.value || `Team ${i + 1}`;
        saveTeams(t);
      });
      node.querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => {
          const t = loadTeams();
          t[i].score += Number(b.dataset.d);
          saveTeams(t);
          VV.renderTeams();
        })
      );
    });
    bar.querySelector("[data-add]").addEventListener("click", () => {
      const t = loadTeams();
      if (t.length >= 6) return VV.toast("Up to 6 teams");
      t.push({ name: `Team ${t.length + 1}`, score: 0 });
      saveTeams(t);
      VV.renderTeams();
    });
    bar.querySelector("[data-reset]").addEventListener("click", () => {
      const t = loadTeams().map((x) => ({ ...x, score: 0 }));
      saveTeams(t);
      VV.renderTeams();
    });
  };

  /* ---------- Game context factory ---------- */
  VV.makeContext = function ({ el, statusEl, timerEl, terms, subject, opts, restart }) {
    const timers = new Set();
    const cleanups = [];
    const ctx = {
      el,
      terms,
      subject,
      opts,
      restart,
      toast: VV.toast,
      setStatus(items) {
        statusEl.innerHTML = items.map((x) => `<span class="pill light">${x}</span>`).join("");
      },
      /** Countdown shown in the header. Returns {stop, reset, remaining}. */
      startTimer(seconds, onEnd) {
        ctx.stopTimers();
        if (!seconds || seconds === "off") {
          timerEl.hidden = true;
          return { stop() {}, reset() {}, remaining: () => Infinity };
        }
        let left = Number(seconds);
        timerEl.hidden = false;
        const draw = () => {
          const m = Math.floor(left / 60);
          const s = String(left % 60).padStart(2, "0");
          timerEl.textContent = `⏱ ${m}:${s}`;
          timerEl.classList.toggle("low", left <= 10);
        };
        draw();
        const id = setInterval(() => {
          left -= 1;
          draw();
          if (left <= 5 && left > 0) VV.beep("tick");
          if (left <= 0) {
            clearInterval(id);
            timers.delete(id);
            VV.beep("end");
            onEnd && onEnd();
          }
        }, 1000);
        timers.add(id);
        return {
          stop() {
            clearInterval(id);
            timers.delete(id);
          },
          reset() {
            left = Number(seconds);
            draw();
          },
          remaining: () => left,
        };
      },
      stopTimers() {
        timers.forEach((id) => clearInterval(id));
        timers.clear();
      },
      onCleanup(fn) {
        cleanups.push(fn);
      },
      destroy() {
        ctx.stopTimers();
        timerEl.hidden = true;
        cleanups.splice(0).forEach((fn) => {
          try {
            fn();
          } catch (e) {}
        });
      },
    };
    return ctx;
  };
})();
