/* „Моят свят“ – начален екран на детето (прототип, тестов режим зад ?home=v2; home=v1 връща досегашното начало; помни се на устройството).
   Отговаря на три въпроса: кой съм аз (героят), какво мога да направя сега (едно основно действие), какво построих (Моят квартал).
   Навигация: Моят свят → Учебна карта (картите V1.2) | Моят квартал (B+); игра → след кръга: сградата пораства → „Следващ кръг“.
   Състояния на основното действие (решение 24.10.2026):
     • има незавършено домашно → „Продължи“ отваря следващия незавършен етап; точките = кръговете на ТОВА домашно (не общият напредък);
     • домашното е завършено → кратко поздравление; основно действие „Учебна карта“;
     • няма възложено домашно → основно действие „Учебна карта“, без празни индикатори.
   Правило при повече от едно незавършено домашно: първо НАЙ-СТАРОТО възложено (по реда на възлагане; при еднакво време – по реда на програмата).
   Домашните се възлагат от учителя (офис → „Пилот“ → „Домашни“, таблица homework_assignments); таблетът ги получава с отговора на сървъра.
   Отворен линк на домашна също се помни на устройството (преди първата връзка). За тест без сървър – ?hwdemo=BK06,BK07. Монети, звезди и серии няма – наградата е строежът в квартала. */
(function () {
  const Q = location.search + location.hash, m = Q.match(/[?&#~]home[=_](v2|v1)/);
  try { if (m) localStorage.setItem("platforma.home", m[1]); } catch (e) {}
  let mode = m ? m[1] : null; try { mode = mode || localStorage.getItem("platforma.home"); } catch (e) {}
  const ON = mode === "v2";
  if (ON) document.documentElement.classList.add("home2");
  const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const say = t => { try { if (window.VOICE && window.VOICE.speak) window.VOICE.speak(t, { rate: 0.95 }); } catch (e) {} };
  const HWK = "platforma.hw.v1", STK = "platforma.hw.stages.v1";
  const MOD = { BK: "Букварика", CH: "Читарика", MW: "Математика и околен свят" };
  const child = () => (window.PILOT_SYNC && window.PILOT_SYNC.status().child) || null;
  const ws = () => (window.PILOT_SYNC && window.PILOT_SYNC.worldState()) || { rounds: {} };

  // ---- етапите на домашната: същата логика като office/office.js (hwFromCfg + ctxOf + gameLink) и tools/e2e_homework.py ----
  const COUNT_KEY = { phonemicHearing: "tasks", phonetics: "answersQty", soundLetterParsing: "answersQty", letterOfElements: "rounds", alphabet: "lettersQty", readcaR: "answersQty", constructor: "answersQty", wordOrder: "answersQty", trueWords: "answersQty", buildSentence: "answersQty", conformity: "answersQty", accents: "answersQty", words: "answersQty", sayDifferently: "answersQty", guessWord: "answersQty", professions: "exampleQty", outwardThings: "exampleQty", masksShow: "exampleQty", forestKingdom: "exampleQty", timeGuardian: "exampleQty", soonToSchool: "exampleQty", hideAndSeek: "exampleQty", memoryStick: "exampleQty", readca: null, cleanShipRoom: null, safari: null, secretCards: null, shadowMap: null };
  const LESSON_NUMBER_GAMES = ["phonetics", "soundLetterParsing", "letterOfElements", "readca"];
  let HM = null, TPL = {}, LES = {};
  const ready = fetch("config/homework-map.json").then(r => r.json()).then(d => { HM = d; d.templates.forEach(t => { TPL[t.id] = t; }); d.lessons.forEach(l => { LES[l.id] = l; }); }).catch(() => {});
  function stages(lid) {
    const L = LES[lid]; if (!L) return []; const bk = lid.startsWith("BK") ? +lid.slice(2) : null, out = [];
    L.rounds.forEach(R => R.assignments.forEach(a => {
      const gid = a.fallback_game || a.game, t = TPL[gid], fb = !!a.fallback_game;
      if (!t || (t.status === "NEW" && !a.template_ready)) { out.push({ round: R.round, game: a.game, pending: true }); return; }
      const s = Object.assign({}, a.settings || {}); if (a.level != null) s.level = a.level;
      const ck = gid in COUNT_KEY ? COUNT_KEY[gid] : "examples"; if (ck) s[ck] = a.items;
      if (bk && LESSON_NUMBER_GAMES.includes(gid)) s.lessonNumber = bk;
      if (gid === "constructor" || gid === "underwaterKingdom") s.speed = 1;
      out.push({ round: R.round, gid, settings: s, skill: a.item_primary_skill, skill2: a.item_secondary_skill, meas: !!a.measurement && !fb, adaptive: !!a.adaptive, bank: a.content_bank_id, tpl: a.game, override: !!a.checkpoint_override });
    }));
    return out;
  }
  function hashFor(h, i) {   // етап i от домашната h – като линка от учителя (същият контекст: hw, st, lesson, round …)
    const s = stages(h.lesson)[i]; if (!s || s.pending) return null;
    const ctx = { lesson: h.lesson, round: s.round, skill: s.skill, skill2: s.skill2, meas: s.meas ? 1 : 0, mode: "learn", adaptive: s.adaptive ? 1 : 0, bank: s.bank, tpl: s.tpl !== s.gid ? s.tpl : null, ovr: s.override ? 1 : null };
    const ps = Object.entries(s.settings).concat([["hw", h.hw], ["st", i]], Object.entries(ctx).filter(([, v]) => v != null && v !== ""));
    return `game/${s.gid}?` + ps.map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  }
  function launch(h, i) { const x = hashFor(h, i); if (!x) return; try { sessionStorage.setItem("platforma.pickok", JSON.stringify({ c: child(), at: Date.now() })); } catch (e) {} location.hash = x; location.reload(); }

  // ---- домашните на детето на това устройство ----
  function note(c, hw, lesson, at) {
    if (!c || !hw || !lesson || !/^(BK|CH|MW)\d\d$/.test(lesson)) return;
    const all = rd(HWK, {}), l = all[c] = all[c] || [];
    if (!l.some(x => x.hw === hw)) { l.push({ hw, lesson, at: at || new Date().toISOString() }); wr(HWK, all); }
  }
  function noteStage(c, hw, st) { if (!c || !hw || st == null) return; const all = rd(STK, {}), m = all[c] = all[c] || {}, l = m[hw] = m[hw] || []; if (!l.includes(+st)) { l.push(+st); wr(STK, all); } }
  function status(c, h) {   // кои етапи и кръгове са минати: дневникът на етапите (това устройство) + дневникът на кръговете (вкл. от сървъра)
    const S = stages(h.lesson), doneSt = new Set(((rd(STK, {})[c] || {})[h.hw]) || []), rounds = ((ws().rounds || {})[h.lesson] || []).map(Number);
    const byRound = {}; S.forEach((s, i) => (byRound[s.round] = byRound[s.round] || []).push(i));
    const stDone = i => doneSt.has(i) || S[i].pending || (rounds.includes(S[i].round) && byRound[S[i].round].length === 1);
    const all = Object.keys(byRound).map(Number).sort((a, b) => a - b), rDone = r => byRound[r].every(stDone);
    // готово = всички етапи (кръг с два етапа, напр. Р4 на BK01, е готов след двата – дневникът на кръговете го отбелязва още след първия)
    const complete = all.every(rDone);
    const next = complete ? -1 : S.findIndex((s, i) => !stDone(i) && !s.pending);
    return { rounds: all.map(r => ({ r, done: rDone(r) })), next, nextRound: next >= 0 ? S[next].round : null, complete };
  }
  // единно правило: следващото домашно = най-старото възложено незавършено; при еднакво време – по реда на програмата (BK < CH < MW, по номер)
  function current(c) {
    // възложените от учителя (от сървъра) + отворените с линк на това устройство (напр. преди първата връзка); едно домашно – веднъж
    const srv = (rd("platforma.hw.server.v1", {})[c] || []), loc = (rd(HWK, {})[c] || []).filter(h => !srv.some(x => x.hw === h.hw));
    const list = srv.concat(loc).sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : a.lesson < b.lesson ? -1 : 1);
    const open = list.find(h => !status(c, h).complete);
    if (open) return { kind: "open", h: open, st: status(c, open) };
    const last = list[list.length - 1];
    return last ? { kind: "done", h: last, st: status(c, last) } : { kind: "none" };
  }
  // тест: ?hwdemo=BK06,BK07 – възлага на текущото дете тези домашни (по реда в списъка)
  const DEMOHW = ((Q.match(/[?&#~]hwdemo[=_]([A-Z0-9,]+)/) || [])[1] || "").split(",").filter(Boolean);
  function seedDemo(c) { DEMOHW.forEach((l, i) => note(c, "DEMO-" + l, l, new Date(Date.UTC(2026, 9, 20 + i)).toISOString())); }
  // линк на домашна (hw + lesson): записва се при отваряне – щом детето е известно
  function noteFromLink() { const x = window.HW_CTX; if (x && x.hw && x.lesson) note(child(), x.hw, x.lesson); }

  // ---- екран „Моят свят“ ----
  let box = null;
  function screen() {
    box = document.getElementById("screen-home2");
    if (!box) { box = document.createElement("section"); box.id = "screen-home2"; box.className = "screen screen-home2"; box.hidden = true; document.querySelector(".screen").parentNode.appendChild(box); }
    return box;
  }
  const dots = st => `<div class="h2-dots" aria-label="Кръгове от домашното">${st.rounds.map(x => `<i class="${x.done ? "on" : x.r === st.nextRound ? "now" : ""}"></i>`).join("")}</div>`;
  const BP = "assets/img/world/bplus/", D3 = "assets/img/world/d3/";
  function render(speak) {
    const c = child(), W = ws(), cur = c ? current(c) : { kind: "none" }, hero = c && window.WORLD && window.WORLD.hero ? window.WORLD.hero(c) : {};
    const face = hero.av ? window.WORLD.fig(hero.av, hero.acc, "face") : '<span class="h2-noface">🙂</span>';
    const P = cur.h && window.WORLD && window.WORLD.plotOf ? window.WORLD.plotOf(W, cur.h.lesson) : null;
    const did = (P && P.did) || "letters";
    const what = cur.h ? `${MOD[cur.h.lesson.slice(0, 2)]} · занятие ${+cur.h.lesson.slice(2)}` : "";
    const bld = P ? `<div class="h2-bld${P.stage === 0 ? " goal" : ""}"><img alt="" src="${P.src(P.stage === 0 ? 4 : P.stage)}"></div>` : "";
    let main = "", lead = "learn";
    if (cur.kind === "open") {
      lead = "go";
      main = `<div class="h2-card" data-state="open">${bld}<div class="h2-what"><span class="h2-k">Домашно</span><b>${esc(what)}</b>${dots(cur.st)}</div>
        <button type="button" class="h2-go" id="h2-go"><svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg>Продължи</button></div>`;
    } else if (cur.kind === "done") {
      main = `<div class="h2-card done" data-state="done">${bld}<div class="h2-what"><span class="h2-k">Браво!</span><b>Домашното е готово.</b>${dots(cur.st)}</div></div>`;
    }
    const tile = (id, art, t, sub, cls) => `<button type="button" class="h2-tile ${cls || ""}" id="${id}"><span class="h2-tile-art">${art}</span><span class="h2-tile-t">${t}</span><span class="h2-tile-s">${sub}</span></button>`;
    // учебната карта: островът на модула с две от игрите му (като на самата карта); кварталът: умален изглед на построеното – улицата на текущия строеж
    const mod = cur.h ? { BK: "letters", CH: "reading", MW: "mathworld" }[cur.h.lesson.slice(0, 2)] : "letters", IC = "assets/img/world/icons/app/";
    const ICS = { letters: ["zone_alphabet", "zone_reading"], reading: ["rz_constructor", "rz_story"], mathworld: ["mz_shapes", "wz_forest"] }[mod];
    const learnArt = `<svg viewBox="0 0 483 421" aria-hidden="true"><image href="${D3}isl_${mod}.webp" width="483" height="421"/><image href="${IC}${ICS[0]}.webp" x="92" y="70" width="150" height="150"/><image href="${IC}${ICS[1]}.webp" x="242" y="70" width="150" height="150"/></svg>`;
    const worldArt = (window.WORLD && window.WORLD.preview && window.WORLD.preview(W, did)) || `<img alt="" src="${BP}bg_${did}.webp?v=4">`;
    screen().innerHTML = `<div class="h2-wrap" data-lead="${lead}" data-state="${cur.kind}">
      <header class="h2-head"><button type="button" class="h2-hero" id="h2-hero" aria-label="Моят герой">${face}</button>
        <div class="h2-hello"><h1>Здравей!</h1><p>${cur.kind === "open" ? "Да продължим ли?" : cur.kind === "done" ? "Домашното ти е готово." : "Какво ще играем днес?"}</p></div>
        <div class="h2-tr">${window.PILOT_SYNC && window.PILOT_SYNC.needsPick() ? '<button type="button" class="h2-adult" id="h2-who" aria-label="Смени дете">Смени дете</button>' : ""}<button type="button" class="h2-adult" id="h2-adult" aria-label="За възрастния">За възрастния</button></div></header>
      ${main}
      <div class="h2-tiles">${tile("h2-learn", learnArt, "Учебна карта", "Занятия и игри", lead === "learn" ? "lead" : "")}${tile("h2-world", worldArt, "Моят квартал", "Какво построих", "")}</div></div>`;
    const go = document.getElementById("h2-go"); if (go) go.addEventListener("click", () => launch(cur.h, cur.st.next));
    document.getElementById("h2-learn").addEventListener("click", () => window.APP.show("learn"));
    document.getElementById("h2-world").addEventListener("click", () => { window.WORLD_DISTRICT = did; window.APP.show("world"); });
    document.getElementById("h2-hero").addEventListener("click", () => { if (window.WORLD && window.WORLD.pickHero) window.WORLD.pickHero(render, !hero.av); });
    // възрастната зона: задържане 1,5 с (детето случайно не влиза); PIN – преди реалния пилот (стъпка 8)
    { const a = document.getElementById("h2-adult"); let t = null; const stop = () => { clearTimeout(t); a.classList.remove("hold"); };
      a.addEventListener("pointerdown", () => { a.classList.add("hold"); t = setTimeout(() => { stop(); window.APP.show("parent"); }, 1500); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(e => a.addEventListener(e, stop));
      a.addEventListener("click", () => { if (!a.dataset.tip) { a.dataset.tip = a.textContent; a.textContent = "Задръж"; setTimeout(() => { a.textContent = a.dataset.tip; delete a.dataset.tip; }, 1500); } }); }
    const who = document.getElementById("h2-who"); if (who) who.addEventListener("click", () => { box.innerHTML = ""; window.PILOT_SYNC.pick(() => render(true)); });
    if (speak) say(cur.kind === "open" ? "Здравей! Натисни Продължи и сградата ти ще порасне." : cur.kind === "done" ? "Браво! Домашното е готово. Избери игра от учебната карта." : "Здравей! Избери игра от учебната карта.");
    // нов герой: първо „Избери своя герой“
    if (c && !hero.av && window.WORLD && window.WORLD.pickHero) setTimeout(() => window.WORLD.pickHero(render, true), 500);
  }
  function show() {
    screen(); document.querySelectorAll(".screen").forEach(s => s.hidden = s !== box);
    const draw = () => { const c = child(); if (c) { seedDemo(c); noteFromLink(); } render(true); };
    const w = window.WORLD && window.WORLD.ready ? window.WORLD.ready : Promise.resolve();
    // общ таблет: „Кой играе?“ веднъж при отваряне; връщане от картата/квартала не пита отново (смяна – бутон „Смени дете“)
    if (window.PILOT_SYNC && window.PILOT_SYNC.needsPick && window.PILOT_SYNC.needsPick() && !show.asked) { show.asked = true; box.innerHTML = ""; window.PILOT_SYNC.pick(() => Promise.all([ready, w]).then(draw)); }
    else Promise.all([ready, w]).then(draw);
  }

  // ---- след кръга: сградата пораства (без натискане), после „Следващ кръг“ ----
  function onFinish(r) {
    const c = child(); if (!c || !r.hw || !r.lesson || r.early) return null;
    note(c, r.hw, r.lesson); noteStage(c, r.hw, r.st);
    const h = (rd(HWK, {})[c] || []).find(x => x.hw === r.hw); if (!h) return null;
    return { h, st: status(c, h) };
  }
  function result(r) {
    ["h2-res", "h2-res-art"].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
    const x = onFinish(r); const foot = document.querySelector("#screen-result .foot-bar"); if (!foot) return;
    // заглавието за детето: без брой опити (броят остава за педагогическия анализ); сградата е наградата
    const title = document.getElementById("result-title");
    const res = document.createElement("div"); res.id = "h2-res"; res.className = "h2-res";
    const P = x && window.WORLD && window.WORLD.plotOf ? window.WORLD.plotOf(ws(), x.h.lesson) : null;
    if (x && P) {
      const prev = Math.max(0, P.stage - 1);
      // сградата и точките – в свитъка (там, където бяха звездите и числата); бутоните – долу
      const art = document.createElement("div"); art.id = "h2-res-art"; art.className = "h2-res-art";
      art.innerHTML = `<div class="h2-grow"><img class="a" alt="" src="${P.src(prev)}"><img class="b" alt="" src="${P.src(P.stage)}"></div>${dots(x.st)}`;
      const inner = document.querySelector("#screen-result .result-inner"); if (inner) inner.insertBefore(art, inner.firstChild);
      res.innerHTML = `<div class="h2-res-btns">${x.st.complete ? `<button type="button" class="h2-go" id="h2-r-world">Виж квартала</button>` : `<button type="button" class="h2-go" id="h2-r-next"><svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg>${x.st.nextRound === Number(r.round) ? "Продължи" : "Следващ кръг"}</button><button type="button" class="h2-sec" id="h2-r-world">Моят квартал</button>`}<button type="button" class="h2-sec" id="h2-r-home">Начало</button></div>`;
      if (title) title.textContent = x.st.complete ? "Браво! Сградата е готова!" : "Браво! Сградата расте!";
      say(x.st.complete ? "Браво! Сградата е готова!" : "Браво! Сградата расте!");
    } else {
      if (title) title.textContent = "Браво!";
      res.innerHTML = `<div class="h2-res-btns"><button type="button" class="h2-go" id="h2-r-again">Играй пак</button><button type="button" class="h2-sec" id="h2-r-learn">Учебна карта</button><button type="button" class="h2-sec" id="h2-r-home">Начало</button></div>`;
    }
    foot.parentNode.insertBefore(res, foot);
    const on = (id, f) => { const b = document.getElementById(id); if (b) b.addEventListener("click", f); };
    on("h2-r-next", () => launch(x.h, x.st.next));
    on("h2-r-world", () => { window.WORLD_FOCUS = x.h.lesson; window.WORLD_DISTRICT = P.did; window.APP.show("world"); });
    on("h2-r-home", () => window.APP.show("modules"));
    on("h2-r-learn", () => window.APP.show("learn"));
    on("h2-r-again", () => { const b = document.getElementById("btn-again"); if (b) b.click(); });
  }
  // отговор от сървъра (възложени домашни, напредък, герой) – „Моят свят“ се пречертава, ако е отворен
  window.addEventListener("pilot-world", () => { const b = document.getElementById("screen-home2"); if (ON && b && !b.hidden && !document.getElementById("avatar-pick")) render(false); });
  // въвеждането в играта: „Настройки“ (плъзгачите) – само за възрастния, със задържане 1,5 с
  function holdOpen(btn, go) { let t = null; const stop = () => { clearTimeout(t); btn.classList.remove("hold"); };
    btn.addEventListener("pointerdown", () => { btn.classList.add("hold"); t = setTimeout(() => { stop(); go(); }, 1500); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(e => btn.addEventListener(e, stop)); }
  function decorIntro() {
    const foot = document.getElementById("screen-intro"); if (!foot || document.getElementById("h2-gear")) return;
    const b = document.createElement("button"); b.type = "button"; b.id = "h2-gear"; b.className = "h2-adult h2-gear"; b.setAttribute("aria-label", "Настройки за възрастния (задръж)"); b.textContent = "⚙";
    foot.appendChild(b); holdOpen(b, () => { window.H2_ADULT_SETTINGS = true; window.APP.show("settings"); });
  }
  window.HOME2 = { on: () => ON, decorIntro, show, result, current: () => current(child()), stages, status: h => status(child(), h), hashFor };
})();
