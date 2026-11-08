/* Онлайн занятие – екранът на учителя (стъпка 1): абакусите на децата на живо.
   Плочки за всички свързани деца; голям изглед за избраното дете (което смята); последните движения; закъснение (ping/pong на всеки 4 с). */
(function () {
  const E = window.ABACUS_ENGINE, Q = new URLSearchParams(location.search);
  let room = (Q.get("room") || "").toUpperCase();
  if (!room) { room = Math.random().toString(36).slice(2, 6).toUpperCase(); history.replaceState(null, "", "?room=" + room); }
  const kids = {};   // id → { name, st, seq, moves[], online, lat, last }
  let focus = null, pingN = 0, pings = {};
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const childUrl = () => location.href.replace(/live-teacher\.html.*$/, "abacus.html?rods=3&live=" + room + "&name=");

  // малък/голям абакус от състоянието [[h,e], …] (индекс 0 = единици)
  function svg(st, big) {
    const R = st.length, W = 120, H = 300, B = 95, X0 = 70, w = X0 * 2 + (R - 1) * W;
    const bead = (x, y, c) => `<path d="M${x - 46} ${y} L${x - 23} ${y - 17} L${x + 23} ${y - 17} L${x + 46} ${y} L${x + 23} ${y + 17} L${x - 23} ${y + 17} Z" fill="${c}"/>`;
    let s = `<svg viewBox="0 0 ${w} ${H + (big ? 50 : 0)}" class="${big ? "ab-big" : "ab-small"}" role="img" aria-label="Абакус"><rect x="5" y="5" width="${w - 10}" height="${H - 10}" rx="16" fill="#FBF3E4" stroke="#C89B62" stroke-width="10"/><rect x="10" y="${B - 4}" width="${w - 20}" height="8" fill="#8A6234"/>`;
    for (let i = 0; i < R; i++) {
      const x = X0 + (R - 1 - i) * W, [h, e] = st[i] || [0, 0];
      s += `<line x1="${x}" y1="12" x2="${x}" y2="${H - 12}" stroke="#7A5A35" stroke-width="5"/>`;
      s += bead(x, h ? B - 22 : 32, h ? "#2B5FA3" : "#7FA6D6");
      for (let k = 1; k <= 4; k++) s += bead(x, k <= e ? B + 22 + (k - 1) * 38 : H - 28 - (4 - k) * 38, k <= e ? "#D9531E" : "#EBA27E");
      if (big) s += `<text x="${x}" y="${H + 38}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="34" fill="#2B2620">${5 * h + e}</text>`;
    }
    return s + "</svg>";
  }
  const val = (st) => st.reduce((a, r, i) => a + (5 * r[0] + r[1]) * Math.pow(10, i), 0);
  const mtxt = (m) => m ? (m.d > 0 ? "+" : "−") + Math.abs(m.d) * Math.pow(10, m.rod) + (m.bead === "h" ? " (небесно)" : " (земни)") : "";

  document.body.innerHTML = `<div class="lv-app">
    <header class="lv-head"><div><div class="lv-title">Онлайн занятие · стая <b>${room}</b></div><div class="lv-sub" id="conn">свързване…</div></div>
      <div class="lv-join">Линк за децата (добавете името накрая):<br><span class="lv-url" id="url">${esc(childUrl())}</span> <button id="copy">Копирай</button> <button id="sync">↻ Обнови всички</button></div></header>
    <section class="lv-ctrl"><label>Тема <select id="tp">${E.TOPICS.map(t => `<option value="${t.id}">${t.name}</option>`).join("")}</select></label>
      <label>Числа <select id="cnt">${[2, 3, 4, 5, 6, 7, 8, 10].map(n => `<option ${n === 3 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>Скорост <select id="spd">${[5, 4, 3, 2.5, 2, 1.6, 1.2, 1, 0.8, 0.6].map(n => `<option value="${n}" ${n === 2 ? "selected" : ""}>${n} с</option>`).join("")}</select></label>
      <button id="send1" class="lv-send">▶ На детето на ред</button><button id="sendAll" class="lv-send alt">▶ На всички</button></section>
    <main class="lv-main"><section class="lv-focus" id="focus"><div class="lv-empty">Изберете дете отдясно – неговият абакус ще се вижда тук в голям размер.</div></section>
      <aside class="lv-tiles" id="tiles"><div class="lv-empty">Чакаме децата да се свържат…</div></aside></main></div>`;
  $("#copy").onclick = () => { try { navigator.clipboard.writeText(childUrl()); } catch (e) {} };

  const ch = LIVE_RT.join("ma-" + room, { id: "teacher", meta: { role: "teacher" } }, {
    onStatus: (s) => { $("#conn").textContent = s === "live" ? "на живо" : s === "offline" ? "няма връзка – свързване отново…" : "свързване…"; if (s === "live") ch.send("sync", {}); },
    onPresence: (list) => {
      const on = new Set(list.filter(x => x.role === "child").map(x => x.key));
      list.filter(x => x.role === "child").forEach(x => { kids[x.key] = kids[x.key] || { name: x.name, st: [[0, 0]], moves: [], seq: 0 }; kids[x.key].name = x.name; });
      Object.keys(kids).forEach(k => { kids[k].online = on.has(k); }); render();
    },
    onMsg: (ev, p) => {
      if (ev === "state" && p.id) {
        const k = kids[p.id] = kids[p.id] || { name: p.name, moves: [], seq: 0, online: true };
        if (p.seq && p.seq < k.seq) return;   // стари съобщения
        k.seq = p.seq || 0; k.st = p.st; k.name = p.name || k.name; k.last = Date.now(); k.task = p.task || null;
        if (p.m) { k.moves.unshift({ m: p.m, v: val(p.st), t: Date.now() }); k.moves = k.moves.slice(0, 12); }
        render(p.id);
      }
      if (ev === "answer" && p.id && tasks[p.task]) {
        const t = tasks[p.task], k = kids[p.id] = kids[p.id] || { name: p.name, moves: [], seq: 0, online: true };
        const j = E.judgeChain(t.nums, p.moves || [], 3);
        k.result = { task: p.task, nums: t.nums, answer: t.answer, value: p.value, ok: p.value === t.answer, sec: p.sec, steps: j.steps, moves: p.moves || [] };
        render(p.id);
      }
      if (ev === "pong" && p.id && pings[p.n]) { const k = kids[p.id]; if (k) { k.lat = Date.now() - pings[p.n]; renderTile(p.id); } }
    }
  });
  $("#sync").onclick = () => ch.send("sync", {});
  const tasks = {};
  function send(to) {
    const tp = E.TOPICS.find(t => t.id === $("#tp").value), ex = E.simpleExample(Object.assign({ count: +$("#cnt").value }, tp)); if (!ex) return;
    const id = "t" + Date.now().toString(36); tasks[id] = { nums: ex.nums, answer: ex.answer, to, at: Date.now() };
    (to === "all" ? Object.keys(kids) : [to]).forEach(k => { if (kids[k]) { kids[k].result = { pending: true, task: id, nums: ex.nums, answer: ex.answer }; kids[k].turn = to !== "all"; } });
    ch.send("task", { to, id, nums: ex.nums, speed: +$("#spd").value }); render();
  }
  $("#send1").onclick = () => { if (focus) send(focus); };
  $("#sendAll").onclick = () => send("all");
  setInterval(() => { const n = ++pingN; pings[n] = Date.now(); Object.keys(kids).forEach(id => { if (kids[id].online) ch.send("ping", { to: id, n }); }); }, 4000);

  function tileHtml(id) {
    const k = kids[id]; const v = k.st ? val(k.st) : 0;
    return `<button class="lv-tile ${focus === id ? "on" : ""} ${k.online ? "" : "off"}" data-id="${id}"><div class="lv-tname">${esc(k.name)}</div>${svg(k.st || [[0, 0]], false)}
      <div class="lv-tinfo"><b>${v}</b> · ${k.online ? (k.lat != null ? k.lat + " ms" : "на линия") : "излязъл"}</div>${resBadge(k)}</button>`;
  }
  function renderTile(id) { const el = document.querySelector(`.lv-tile[data-id="${id}"]`); if (el) { el.outerHTML = tileHtml(id); wire(); } if (focus === id) renderFocus(); }
  function wire() { document.querySelectorAll(".lv-tile").forEach(b => b.onclick = () => { focus = b.dataset.id; render(); }); }
  function renderFocus() {
    const k = kids[focus]; if (!k) return;
    $("#focus").innerHTML = `<div class="lv-fname">${esc(k.name)} ${k.online ? "" : "<span class='lv-off'>(излязъл)</span>"}</div>${svg(k.st || [[0, 0]], true)}${resPanel(k)}
      <div class="lv-moves">${k.moves.length ? k.moves.map(x => `<span>${mtxt(x.m)} → <b>${x.v}</b></span>`).join("") : "Още няма движения."}</div>
      <div class="lv-sub">Закъснение: ${k.lat != null ? k.lat + " ms (до устройството и обратно)" : "—"}</div>`;
    const rb = $("#replay"); if (rb) rb.onclick = () => replay(focus);
  }
  const CODE = { ok: "✓", wrong_method: "верен отговор, друг път", set_result: "нагласи отговора без правилото", forgot_complement: "забрави брата", used_number_not_brother: "махна числото вместо брата",
    forgot_carry: "забрави едното вляво", forgot_borrow: "забрави да махне едно вляво", wrong_value: "грешно", not_reached: "не стигна до", impossible: "невъзможно движение" };
  const fmtN = (nums) => nums.map((n, i) => i === 0 ? String(n) : (n > 0 ? "+" + n : "−" + -n)).join(" ");
  function resBadge(k) { const r = k.result; if (!r) return ""; if (r.pending) return '<div class="lv-res wait">смята…</div>';
    return `<div class="lv-res ${r.ok ? "ok" : "no"}">${r.ok ? "✓ " : "✗ "}${r.value} · ${r.sec.toFixed(1)} с</div>`; }
  function resPanel(k) {
    const r = k.result; if (!r) return "";
    if (r.pending) return `<div class="lv-rp"><div class="lv-rq">${fmtN(r.nums)} = ?</div><div class="lv-sub">смята…</div></div>`;
    const steps = r.steps.map(x => `<span class="${x.code === "ok" ? "ok" : "no"}">${x.n > 0 && x.i > 0 ? "+" + x.n : x.i > 0 ? "−" + -x.n : x.n}: ${x.code === "not_reached" ? CODE.not_reached + " " + x.to : (CODE[x.code] || x.code)}${x.rule && x.rule !== "Просто" ? " (" + x.rule + ")" : ""}</span>`).join("");
    return `<div class="lv-rp"><div class="lv-rq">${fmtN(r.nums)} = <b>${r.answer}</b></div>
      <div class="lv-ra ${r.ok ? "ok" : "no"}">${r.ok ? "Вярно" : "Грешно"}: ${r.value} · ${r.sec.toFixed(1)} с · ${r.moves.length} движения</div>
      <div class="lv-steps">${steps}</div><button class="lv-send alt" id="replay">⟲ Повтори движенията</button></div>`;
  }
  let replaying = false;
  function replay(id) {   // движенията на детето от нулата, едно по едно
    const k = kids[id]; if (!k || !k.result || !k.result.moves || replaying) return; replaying = true;
    const keep = k.st; let st = E.make(3), i = 0; const mv = k.result.moves;
    (function step() { if (i > mv.length) { setTimeout(() => { k.st = keep; replaying = false; renderFocus(); }, 1500); return; }
      if (i > 0) { const ns = E.apply(st, mv[i - 1]); if (ns) st = ns; }
      k.st = st.map(r => [r.h, r.e]); renderFocus(); i++; setTimeout(step, 700); })();
  }
  function render(changed) {
    const ids = Object.keys(kids);
    if (!ids.length) return;
    if (changed && document.querySelector(`.lv-tile[data-id="${changed}"]`)) { renderTile(changed); return; }
    $("#tiles").innerHTML = ids.map(tileHtml).join(""); wire();
    if (!focus || !kids[focus]) focus = ids[0];
    renderFocus();
  }
  window.LIVE_TEACHER = { kids, room, focus: (id) => { focus = id; render(); } };
})();
