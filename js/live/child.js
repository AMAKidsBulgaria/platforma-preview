/* Абакусът на детето по време на онлайн занятие: abacus.html?live=СТАЯ&name=Име
   Изпраща всяко движение и текущото състояние към стаята; отговаря на „sync“ (учителят иска състоянието) и на „ping“ (закъснение).
   Пример от учителя („task“): абакусът се нулира, числата се показват едно след друго със зададената скорост, детето смята на абакуса
   и натиска „Готово“ → отговорът, времето и всички движения отиват при учителя („answer“). Дете = id на устройството. */
(function () {
  const Q = new URLSearchParams(location.search), room = Q.get("live"); if (!room || !window.LIVE_RT) return;
  let id = null; try { id = localStorage.getItem("live.id"); if (!id) { id = "c" + Math.random().toString(36).slice(2, 9); localStorage.setItem("live.id", id); } } catch (e) { id = "c" + Math.random().toString(36).slice(2, 9); }
  const name = (Q.get("name") || "Дете").slice(0, 24);
  const badge = document.createElement("div"); badge.className = "live-badge"; badge.textContent = "● свързване…"; document.body.appendChild(badge);
  const ch = LIVE_RT.join("ma-" + room, { id, meta: { role: "child", name } }, {
    onStatus: (s) => { badge.textContent = s === "live" ? "● на живо · " + name : s === "offline" ? "○ няма връзка…" : "● свързване…"; badge.dataset.s = s; if (s === "live") sendState(null); },
    onMsg: (ev, p) => {
      if (ev === "sync") sendState(null);
      if (ev === "ping" && p.to === id) ch.send("pong", { id, n: p.n });
      if (ev === "task" && (p.to === id || p.to === "all")) runTask(p).catch(() => {});
      if (ev === "cancel" && (p.to === id || p.to === "all")) cancel();
    }
  });
  let seq = 0, cur = null, gen = 0;
  function sendState(m) {
    const UI = window.ABACUS_UI; if (!UI) return;
    const st = UI.state(); ch.send("state", { id, name, seq: ++seq, st: st.map(r => [r.h, r.e]), m: m || null, task: cur ? cur.id : null });
  }
  window.ABACUS_HOOK = (m) => { if (cur && m) cur.moves.push(m); sendState(m); };

  // ---- пример от учителя ----
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => { const g = gen; return new Promise((r, rej) => setTimeout(() => g === gen ? r() : rej("stale"), ms)); };
  let doneBtn = null;
  function ensureBtn() {
    if (doneBtn) return doneBtn;
    doneBtn = document.createElement("button"); doneBtn.className = "ab-btn primary live-done"; doneBtn.textContent = "✓ Готово"; doneBtn.hidden = true;
    doneBtn.onclick = finish; document.body.appendChild(doneBtn); return doneBtn;
  }
  function show(txt, cls) { const t = $("#ab-task"); if (t) { t.textContent = txt; t.className = "ab-task " + (cls || ""); } }
  async function runTask(p) {
    gen++; const UI = window.ABACUS_UI; if (!UI) return;
    cur = { id: p.id, nums: p.nums, speed: p.speed, moves: [], t0: 0 };
    ensureBtn().hidden = true; UI.set(0); cur.moves = [];
    const say = $("#ab-say"); if (say) { say.textContent = "Смятай на абакуса!"; say.className = "ab-say info"; }
    for (const k of [3, 2, 1]) { show(String(k)); await wait(600); }
    show(""); await wait(300); cur.t0 = Date.now();
    const ms = (p.speed || 2) * 1000, gap = Math.min(250, Math.max(60, ms * 0.12));
    for (let i = 0; i < p.nums.length; i++) { const n = p.nums[i]; show(i === 0 ? String(n) : (n > 0 ? "+" + n : "−" + -n), n < 0 && i > 0 ? "minus" : "plus"); await wait(ms - gap); show(""); await wait(gap); }
    show("= ?"); if (say) say.textContent = "Готово ли е? Натисни „Готово“."; ensureBtn().hidden = false;
  }
  function finish() {
    if (!cur) return; const UI = window.ABACUS_UI, st = UI.state();
    const value = st.reduce((a, r, i) => a + (5 * r.h + r.e) * Math.pow(10, i), 0);
    ch.send("answer", { id, name, task: cur.id, value, moves: cur.moves, sec: (Date.now() - cur.t0) / 1000 });
    doneBtn.hidden = true; show("Изпратено ✓"); const say = $("#ab-say"); if (say) say.textContent = "Учителят вижда отговора ти.";
    cur = null;
  }
  function cancel() { gen++; cur = null; if (doneBtn) doneBtn.hidden = true; show(""); }
  window.LIVE_CHILD = { id, finish, cur: () => cur };
})();
