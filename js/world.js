/* Прототип „Квартал на буквите“ (техническа основа, временна графика – 23.10.2026).
   Светът се строи от завършените занятия на Букварика (config/world-rules.json):
   • заключено – занятието още не е започнато; следващо – първото незавършено;
   • завършено, чака потвърждение – всички кръгове са минати на този таблет, сървърът още не е потвърдил (къщите вече светят);
   • потвърдено – сървърът е записал отключването; за преглед – сървърът е поставил наградата за методически преглед;
   • за изравняване – завършено на таблета и всичко е изпратено (или има блокирани събития), но сървърът не е потвърдил.
   Показана награда никога не се маха (архитектурно решение): „чака“ и „за преглед“ изглеждат за детето като готови;
   разликата е само в малък знак за възрастния.
   „Избери 1 от 3“: изборът се показва веднага и се изпраща като събитие (js/sync.js → world_choice); сървърът проверява.
   Без валута и ресурси за харчене (решение за 5–7 г.). Графиката е временна – ще се смени след избора на визуална посока (D1). */
(function () {
  const DECOR_ICON = { "фенер": "🏮", "пейка": "🪑", "ограда с цветя": "🌷", "балкон със саксии": "🪴", "табела с името": "🪧", "покрив в нов цвят": "🏠", "пейка под дърво": "🌳", "кладенче": "⛲", "цветна леха": "🌼" };
  let W = null, L = null;   // правилата (world-rules.json) и разположението на кварталите (world-layout.json)
  const ready = Promise.all([fetch("config/world-rules.json?v=1").then(r => r.json()), fetch("config/world-layout.json?v=1").then(r => r.json())])
    .then(([d, l]) => { W = d; L = l; }).catch(() => {});
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const obj = id => (W.objects || []).find(o => o.id === id) || { id, title: id };
  const letterOf = id => (id.match(/house\.(.+)\.lit$/) || [])[1] || "";

  const district = id => (L && L.districts[id || "letters"]) || null;
  function states(ws, did) {
    const D = district(did), lessons = new Set(Object.keys(D.plots).concat(D.final ? [D.final.lesson] : []));
    const rules = W.rules.filter(r => r.condition && r.condition.type === "lesson_complete" && lessons.has(r.lesson)).sort((a, b) => a.lesson.localeCompare(b.lesson));
    let nextGiven = false;
    return rules.map(r => {
      const objs = (r.effect && r.effect.unlock) || [], need = (r.condition.rounds || [1, 2, 3, 4]).map(Number);
      const rounds = (ws.rounds[r.lesson] || []).map(Number);
      const done = need.every(x => rounds.includes(x));
      const confirmed = objs.length > 0 && objs.every(o => ws.confirmed[o]);
      const review = (ws.reviews || []).some(x => x.rule_id === r.rule_id);
      // „за изравняване“: всичко е изпратено (нищо не чака) или има блокирани събития, а сървърът не е потвърдил –
      // детето пак вижда наградата; учителят получава знак (архитектурно: needs_reconciliation)
      const settled = ws.lastOk && !ws.queued;
      // причината от сървъра: кои кръгове са получени и кои са валидни (ingest → progress)
      const pr = (ws.progress || {})[r.lesson], invalid = pr ? need.filter(x => (pr.received || []).includes(x) && !(pr.valid || []).includes(x)) : [];
      const reason = invalid.length ? { kind: "invalid_round", rounds: invalid } : ws.blocked ? { kind: "blocked" } : null;
      let st = confirmed ? "confirmed" : done && review ? "review" : done && (invalid.length || ws.blocked || settled) ? "reconcile" : done ? "pending" : "locked";
      if (st === "locked" && !nextGiven) { st = "next"; nextGiven = true; }
      const server = ws.choices[r.rule_id] || {}, mine = ws.myChoices[r.rule_id];
      const chosen = server.chosen || mine || null, offer = (r.effect.choice && r.effect.choice.offer) || [];
      return { rule: r, objs, rounds, need, st, reason, chosen, choiceConfirmed: !!server.chosen, offer, canChoose: (st === "confirmed" || st === "pending" || st === "review" || st === "reconcile") && offer.length && !chosen };
    });
  }

  // Етапи на строене (временна графика, независима от стила): 0 парцел · 1 основа · 2 стени · 3 покрив · 4 светва с буквата.
  // Етапите са напредък след всеки кръг; наградата („светва“, украсата) е само при завършено занятие.
  function houseSvg(letter, stage, dx, dy, s) {
    const parts = [];
    if (stage >= 1) parts.push(`<rect x="-17" y="10" width="34" height="5" rx="1.5" class="wh-found"/>`);
    if (stage >= 2) parts.push(`<rect x="-14" y="-12" width="28" height="22" rx="3" class="wh-body"/>`);
    if (stage >= 3) parts.push(`<path d="M-18 -10 L0 -28 L18 -10 Z" class="wh-roof"/>`);
    if (stage >= 4) parts.push(`<rect x="-5" y="-4" width="10" height="9" rx="1.5" class="wh-win"/><text x="0" y="-15" class="wh-l">${esc(letter)}</text>`);
    else if (stage >= 1) parts.push(`<path d="M-20 15 L-20 -16 M20 15 L20 -16 M-20 -4 L20 -4" class="wh-scaf"/>`);   // скеле, докато се строи
    return `<g transform="translate(${dx} ${dy}) scale(${s})" class="wh st${stage} ${stage >= 4 ? "lit" : "dark"}">${parts.join("")}</g>`;
  }
  // кой етап детето вече е видяло – новият се анимира само първия път
  const SEEN = "platforma.world.seen.v1";
  const seenGet = () => { try { return JSON.parse(localStorage.getItem(SEEN) || "{}"); } catch (e) { return {}; } };
  const seenSet = v => { try { localStorage.setItem(SEEN, JSON.stringify(v)); } catch (e) {} };

  function render(box, did) {
    box = box || document.getElementById("world-map"); if (!box) return;
    if (!W || !window.PILOT_SYNC) { ready.then(() => render(box)); box.innerHTML = '<p class="world-msg">Зарежда се…</p>'; return; }
    const ws = window.PILOT_SYNC.worldState();
    if (!ws) { box.innerHTML = '<p class="world-msg">Светът се строи с домашните. Отвори линка на домашната, за да видиш своя квартал.</p>'; return; }
    const D = district(did), S = states(ws, did), focusLesson = window.WORLD_FOCUS;
    const seenAll = seenGet(), seen = seenAll[ws.child] = seenAll[ws.child] || {}, seenNew = {};
    const plots = S.map((x, i) => {
      const final = !!(D.final && x.rule.lesson === D.final.lesson);
      const [px, py, pr] = final ? D.final.at : D.plots[x.rule.lesson];
      const lit = x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile";
      const stage = lit ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size);
      const isNew = stage > (seen[x.rule.lesson] || 0); if (isNew) { seen[x.rule.lesson] = stage; seenNew[x.rule.lesson] = stage; }
      const k = final ? 1.6 : Math.max(0.9, pr / 40);
      const houses = final ? `<g class="wfest ${lit ? "lit" : "dark"}"><circle r="${pr * 0.42}" class="wfest-sq"/><text y="8" class="wfest-t">${lit ? "🎉" : stage ? "🚧" : "★"}</text></g>`
        : x.objs.map((o, j) => houseSvg(letterOf(o), stage, (j - (x.objs.length - 1) / 2) * 34 * k, 0, k)).join("");
      const decor = x.chosen ? `<text class="wdecor" x="${(final ? 0 : x.objs.length * 18 * k)}" y="${-6 * k}">${DECOR_ICON[obj(x.chosen).title] || "✨"}</text>` : "";
      const gift = x.canChoose ? `<g class="wgift" transform="translate(0 ${-48 * k})"><circle r="22" class="wgift-c"/><text y="9" class="wgift-t">🎁</text></g>` : "";
      // знак за възрастния: малка точка – „чака потвърждение“ (сива) / „за преглед“ (оранжева); детето вижда готовия квартал
      const adult = x.st === "pending" ? `<circle class="wadult pend" cx="${22 * k}" cy="${14 * k}" r="5"/>` : (x.st === "review" || x.st === "reconcile") ? `<circle class="wadult rev" cx="${22 * k}" cy="${14 * k}" r="5"/>` : "";
      const focus = !!focusLesson && focusLesson === x.rule.lesson;
      return `<g class="wplot st-${x.st}${isNew ? " grow" : ""}${focus ? " focus" : ""}" data-lesson="${x.rule.lesson}" data-state="${x.st}" data-stage="${stage}" data-new="${isNew ? 1 : 0}" data-chosen="${x.chosen || ""}" transform="translate(${px} ${py})" role="button" tabindex="0" aria-label="${esc(x.rule.title || x.rule.lesson)}">
        ${focus ? `<ellipse class="wfocus" rx="${(final ? pr : pr * 1.15) * 1.25}" ry="${(final ? pr : pr * 1.15) * 0.55}" cy="${12 * k}"/>` : ""}<ellipse class="wbase" rx="${(final ? pr : pr * 1.15)}" ry="${(final ? pr : pr * 1.15) * 0.42}" cy="${12 * k}"/>${houses}${decor}${gift}${adult}</g>`;
    }).join("");
    seenSet(seenAll);
    box.innerHTML = `<svg class="world-svg" viewBox="0 0 ${D.w} ${D.h}" preserveAspectRatio="xMidYMid meet" aria-label="${esc(D.title)}">
      <image href="${D.bg}" width="${D.w}" height="${D.h}"/>${plots}</svg>`;
    const fresh = S.find(x => seenNew[x.rule.lesson]);
    if (fresh && window.MASCOT_ON && window.MASCOT_ON()) {
      const g = box.querySelector(`.wplot[data-lesson="${fresh.rule.lesson}"]`), r = g && g.getBoundingClientRect(), b0 = box.getBoundingClientRect();
      if (r) { const m = document.createElement("img"); m.className = "world-mascot"; m.alt = ""; m.src = `assets/img/mascot/${seenNew[fresh.rule.lesson] >= 4 ? "celebrate" : "joy"}.png`;
        m.style.left = (r.left - b0.left + r.width + 4) + "px"; m.style.top = Math.max(0, r.top - b0.top - 60) + "px"; box.appendChild(m); setTimeout(() => m.remove(), 3200); }
    }
    box.querySelectorAll(".wplot").forEach(g => g.addEventListener("click", () => {
      const x = S.find(y => y.rule.lesson === g.dataset.lesson); if (x && x.canChoose) openChoice(x, box);
    }));
    const w = document.getElementById("world-status");   // за възрастния: кратко състояние (не е за детето)
    if (w) w.textContent = ws.queued ? "Изпраща се…" : S.some(x => x.st === "reconcile") ? "Нужна е проверка от учителя" : S.some(x => x.st === "review") ? "Има награда за преглед" : S.some(x => x.st === "pending") ? "Чака потвърждение" : "";
  }

  function openChoice(x, box) {
    if (document.getElementById("world-choice")) return;
    const o = document.createElement("div"); o.id = "world-choice"; o.className = "world-choice"; o.setAttribute("role", "dialog");
    o.innerHTML = `<div class="wc-box"><h2>Избери украса</h2><div class="wc-opts">${x.offer.map(id => {
      const t = obj(id).title; return `<button type="button" class="wc-opt" data-id="${esc(id)}"><span class="wc-ic">${DECOR_ICON[t] || "✨"}</span><span class="wc-t">${esc(t)}</span></button>`; }).join("")}</div></div>`;
    document.body.appendChild(o);
    try { if (window.VOICE && window.VOICE.speak) window.VOICE.speak(["Избери украса за своя квартал."]); } catch (e) {}
    o.querySelectorAll(".wc-opt").forEach(b => b.addEventListener("click", () => {
      window.PILOT_SYNC.choose(x.rule.rule_id, b.dataset.id); o.remove(); render(box);
    }));
  }

  // за учителя: кои занятия на детето искат внимание и защо (без рисуване)
  async function attention(child, did) {
    await ready; if (!W || !window.PILOT_SYNC) return [];
    const ws = window.PILOT_SYNC.worldState(child); if (!ws) return [];
    return states(ws, did).filter(x => x.st === "reconcile" || x.st === "review" || x.st === "pending").map(x => ({ lesson: x.rule.lesson, title: x.rule.title, state: x.st, reason: x.reason }));
  }
  window.addEventListener("pilot-world", () => { const s = document.getElementById("screen-world"); if (s && !s.hidden) render(); });
  window.WORLD = { render, ready, attention, states: (ws, did) => states(ws, did) };
})();
