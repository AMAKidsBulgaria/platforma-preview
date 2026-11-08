/* Абакусът на детето по време на онлайн занятие: abacus.html?live=СТАЯ&name=Име
   Изпраща всяко движение и текущото състояние към стаята; отговаря на „sync“ (учителят иска състоянието) и на „ping“ (мерене на закъснението).
   Дете = id на устройството (пази се на устройството). */
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
    }
  });
  let seq = 0;
  function sendState(m) {
    const UI = window.ABACUS_UI; if (!UI) return;
    const st = UI.state(); ch.send("state", { id, name, seq: ++seq, st: st.map(r => [r.h, r.e]), m: m || null, task: UI.task ? UI.task() : null });
  }
  window.ABACUS_HOOK = (m) => sendState(m);
})();
