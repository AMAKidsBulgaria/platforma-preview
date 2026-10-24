/* Прототип „Квартал на буквите“ (техническа основа, временна графика – 23.10.2026).
   Светът се строи от завършените занятия на Букварика (config/world-rules.json):
   • заключено – занятието още не е започнато; следващо – първото незавършено;
   • завършено, чака потвърждение – всички кръгове са минати на този таблет, сървърът още не е потвърдил (къщите вече светят);
   • потвърдено – сървърът е записал отключването; за преглед – сървърът е поставил наградата за методически преглед;
   • за изравняване – завършено на таблета и всичко е изпратено (или има блокирани събития), но сървърът не е потвърдил.
   Показана награда никога не се маха (архитектурно решение): „чака“ и „за преглед“ изглеждат за детето като готови;
   разликата е само в малък знак за възрастния.
   „Избери 1 от 3“: изборът се показва веднага и се изпраща като събитие (js/sync.js → world_choice); сървърът проверява.
   Без валута и ресурси за харчене (решение за 5–7 г.). Графиката е временна – ще се смени след избора на визуална посока (D1).
   Вид B+ (D1.1, прототип – world=bplus): празен пейзаж + спрайтове по етапи (config/world-bplus.json); кварталът се показва
   на „улици“ по 8 занятия – детето вижда улицата на текущото си занятие; бъдещите парцели са бледи, следващият свети; Елува води. */
(function () {
  const DECOR_ICON = { "фенер": "🏮", "пейка": "🪑", "ограда с цветя": "🌷", "балкон със саксии": "🪴", "табела с името": "🪧", "покрив в нов цвят": "🏠", "пейка под дърво": "🌳", "кладенче": "⛲", "цветна леха": "🌼" };
  let W = null, L = null, BPL = null;   // правилата (world-rules.json), разположението (world-layout.json) и вида B+ (world-bplus.json)
  const ready = Promise.all([fetch("config/world-rules.json?v=2").then(r => r.json()), fetch("config/world-layout.json?v=2").then(r => r.json()),
    fetch("config/world-bplus.json?v=9").then(r => r.json()).catch(() => null)])
    .then(([d, l, b]) => { W = d; L = l; BPL = b; }).catch(() => {});
  // вид B+: world=bplus включва, world=v1 връща временната графика; помни се на устройството
  const BPQ = (location.search + location.hash).match(/[?&#~]world[=_](bplus|v1)/);
  try { if (BPQ) localStorage.setItem("platforma.world.look", BPQ[1]); } catch (e) {}
  const H2 = (/[?&#~]home[=_]v2/.test(location.search + location.hash) || (function () { try { return localStorage.getItem("platforma.home") === "v2" && !/[?&#~]home[=_]v1/.test(location.search + location.hash); } catch (e) { return false; } })());   // „Моят свят“ (home=v2) върви с квартала B+
  const bpOn = () => { let v = BPQ ? BPQ[1] : (H2 ? "bplus" : null); try { v = v || localStorage.getItem("platforma.world.look"); } catch (e) {} return v === "bplus" && !!BPL; };
  const SPR = "assets/img/world/bplus/";
  // украсата в B+: 3 картинки на квартал; изборът (id от правилата) се показва с картинката n % 3 и нейното име (списъкът украси за B+ – за съгласуване)
  const decorN = id => +((id || "").match(/\.(\d+)$/) || [0, 0])[1] % 3;
  const decorSprite = (did, id) => `${SPR}${BPL.districts[did].decor}_decor_${decorN(id) + 1}.webp`;
  const decorTitle = (did, id) => ((BPL.decor_titles || {})[BPL.districts[did].decor] || [])[decorN(id)] || obj(id).title;
  const streetOf = {};
  // аватар на детето (проба, D-аватар 24.10.2026): жител на квартала – стои до текущия строеж, радва се при нов етап, участва в избора на украса.
  // Изборът се пази по дете на таблета (platforma.world.avatar.v1); avatar=a1..a6|n1..n4 в адреса го задава (демо). Без движение, валута и магазин.
  const AVK = "platforma.world.avatar.v1", AVQ = (location.search + location.hash).match(/[?&#~]avatar[=_]([an][0-9])/);
  const avatarOf = child => { if (window.PILOT_SYNC && window.PILOT_SYNC.avatarOf && !AVQ) return window.PILOT_SYNC.avatarOf(child); let m = {}; try { m = JSON.parse(localStorage.getItem(AVK) || "{}"); } catch (e) {}
    if (AVQ && child && m[child] !== AVQ[1]) { m[child] = AVQ[1]; try { localStorage.setItem(AVK, JSON.stringify(m)); } catch (e) {} } return (child && m[child]) || null; };
  // „Избери своя герой“: 10 големи фигурки, без текст; при първо отваряне на квартала и от бутона с лицето на героя
  const AVATARS = ["a1", "a2", "a3", "a4", "a5", "a6", "n1", "n2", "n3", "n4"];
  // героят с шапка: фигурката + шапката, поставена по главата ѝ (config/world-bplus.json: avatar_heads, accessories)
  const accOf = child => (window.PILOT_SYNC && window.PILOT_SYNC.accessoryOf ? window.PILOT_SYNC.accessoryOf(child) : null);
  function hatBox(av, acc) {   // шапката в дялове от фигурката: [left, top, width] (top може да е отрицателен – над темето)
    const Hd = BPL && BPL.avatar_heads && BPL.avatar_heads[av], A = BPL && BPL.accessories; if (!Hd || !A || !acc || !A.fit[acc]) return null;
    const [fw, off] = A.fit[acc], w = Hd.w * fw, h = w * Hd.aspect / A.aspect[acc];
    return [Hd.cx - w / 2, Hd.top - h * (1 - off), w, h];
  }
  // начален каталог V1: аксесоарът е ГОТОВА комбинация (част от 3D фигурката) – acc/<герой>_<аксесоар>.webp, поставена с обувките върху обувките на основата
  // (така №4 сменя каскета си с шапката, а героите с очила сменят очилата си – без втори чифт); [left, top, width, height] в дялове от основата
  const comboOf = (av, acc) => (acc && BPL && BPL.accessories && BPL.accessories.combo && BPL.accessories.combo[av] && BPL.accessories.combo[av][acc]) || null;
  const comboSrc = (av, acc) => `assets/img/world/avatars/acc/${av}_${acc}.webp?v=2`;
  function figHTML(av, acc, cls) {
    const cb = comboOf(av, acc), hb = cb ? null : hatBox(av, acc);
    if (cb) return `<span class="avfig ${cls || ""}"><img class="avghost" alt="" src="assets/img/world/avatars/${av}.webp?v=3"><img class="avcombo" alt="" src="${comboSrc(av, acc)}" style="left:${cb[0] * 100}%;top:${cb[1] * 100}%;width:${cb[2] * 100}%;height:${cb[3] * 100}%"></span>`;
    return `<span class="avfig ${cls || ""}"><img alt="" src="assets/img/world/avatars/${av}.webp?v=3">${hb ? `<img class="avhat" alt="" src="assets/img/world/avatars/${acc}.webp?v=1" style="left:${hb[0] * 100}%;top:${hb[1] * 100}%;width:${hb[2] * 100}%">` : ""}</span>`;
  }
  function figSVG(av, acc, x, y, bw, bh) {   // фигурката в кутия bw×bh, стъпила на долния ѝ край, по средата
    // еднакъв ръст за всички 10 героя: височината е винаги bh (от темето до обувките), ширината следва пропорцията на фигурката
    const Hd = BPL && BPL.avatar_heads && BPL.avatar_heads[av], asp = Hd ? Hd.aspect : 0.5, h = bh, w = h * asp, x0 = x + (bw - w) / 2, y0 = y + bh - h, cb = comboOf(av, acc), hb = cb ? null : hatBox(av, acc);
    if (cb) return `<image class="avcombo" data-acc="${acc}" href="${comboSrc(av, acc)}" x="${x0 + cb[0] * w}" y="${y0 + cb[1] * h}" width="${cb[2] * w}" height="${cb[3] * h}"/>`;
    return `<image href="assets/img/world/avatars/${av}.webp?v=3" x="${x0}" y="${y0}" width="${w}" height="${h}"/>` + (hb ? `<image class="avhat" href="assets/img/world/avatars/${acc}.webp?v=1" x="${x0 + hb[0] * w}" y="${y0 + hb[1] * h}" width="${hb[2] * w}" height="${hb[3] * h}"/>` : "");
  }
  // „Избери своя герой“: стъпка 1 – 10 фигурки; стъпка 2 – шапка (4 начални или без), преглед върху избраната фигурка, „Готово“
  function openAvatarPick(box, did, first) {
    if (document.getElementById("avatar-pick")) return;
    const ws = window.PILOT_SYNC && window.PILOT_SYNC.worldState(); if (!ws) return;
    const o = document.createElement("div"); o.id = "avatar-pick"; o.className = "world-choice avatar-pick"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Избери своя герой");
    document.body.appendChild(o);
    const say = t => { try { if (window.VOICE && window.VOICE.speak) window.VOICE.speak([t]); } catch (e) {} };
    const close = first ? "" : '<button type="button" class="ap-close" aria-label="Затвори">✕</button>';
    function step1() {
      const cur = avatarOf(ws.child);
      o.innerHTML = `<div class="ap-box"><h2>Избери своя герой</h2><div class="ap-grid">${AVATARS.map((a, i) => `<button type="button" class="ap-opt${a === cur ? " on" : ""}" data-a="${a}" aria-label="Герой ${i + 1}">${figHTML(a, null)}</button>`).join("")}</div>${close}</div>`;
      o.querySelectorAll(".ap-opt").forEach(b => b.addEventListener("click", () => step2(b.dataset.a)));
      bindClose(); say("Избери своя герой. Той ще живее в твоя квартал.");
    }
    function step2(av) {
      const A = (BPL && BPL.accessories) || { start: [] }; let acc = accOf(ws.child);
      const draw = () => {
        o.innerHTML = `<div class="ap-box ap2"><h2>Избери шапка или очила</h2><div class="ap-hero">${figHTML(av, acc, "big")}</div>
          <div class="ap-hats"><button type="button" class="ap-hat${!acc ? " on" : ""}" data-h="" aria-label="Без аксесоар">${figHTML(av, null, "face")}<span class="ap-none">✕</span></button>${A.start.map(h => `<button type="button" class="ap-hat${h === acc ? " on" : ""}" data-h="${h}" aria-label="${esc(A.names[h] || h)}">${comboOf(av, h) ? figHTML(av, h, "face") : `<img alt="" src="assets/img/world/avatars/${h}.webp?v=1">`}</button>`).join("")}</div>
          <div class="ap-actions"><button type="button" class="ap-back" aria-label="Друг герой">◀</button><button type="button" class="ap-done" aria-label="Готово">✓ Готово</button></div>${close}</div>`;
        o.querySelectorAll(".ap-hat").forEach(b => b.addEventListener("click", () => { acc = b.dataset.h || null; draw(); }));
        o.querySelector(".ap-back").addEventListener("click", step1);
        o.querySelector(".ap-done").addEventListener("click", () => { window.PILOT_SYNC.chooseAvatar(av, ws.child, acc); o.remove(); if (typeof box === "function") box(); else render(box, did); });
        bindClose();
      };
      draw(); say("Избери шапка или очила за своя герой. После натисни Готово.");
    }
    function bindClose() { const x = o.querySelector(".ap-close"); if (x) x.addEventListener("click", () => o.remove()); }
    step1();
  }   // коя улица гледа детето във всеки квартал (за тази сесия)
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
      const chosen = mine || server.chosen || null,   // моят (последен) избор; изборите от друг таблет идват в „моите“ от sync.js
      offer = (r.effect.choice && r.effect.choice.offer) || [];
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
  const RECENT = {};   // нов етап, видян преди малко: при повторно рисуване (отговор от сървъра) анимацията и радостта не се губят
  const seenGet = () => { try { return JSON.parse(localStorage.getItem(SEEN) || "{}"); } catch (e) { return {}; } };
  const seenSet = v => { try { localStorage.setItem(SEEN, JSON.stringify(v)); } catch (e) {} };

  function render(box, did) {
    box = box || document.getElementById("world-map"); if (!box) return;
    if (W && L && window.PILOT_SYNC && window.PILOT_SYNC.worldState()) {
      const ws0 = window.PILOT_SYNC.worldState(), acc = access(ws0);
      const want = did || window.WORLD_DISTRICT || current;
      current = want && acc[want] && acc[want] !== "hidden" ? want : (Object.keys(L.districts).find(d => acc[d] === "open") || "letters");
      did = current; window.WORLD_DISTRICT = null; tabs(ws0, acc, box);
      if (acc[current] === "locked") {   // заключен квартал: картата е притъмнена; за възрастния – кога се отваря
        const D = bpOn() ? BPL.districts[current] : district(current); look();
        box.innerHTML = `<div class="wlocked" data-district="${current}" data-state="locked"><svg class="world-svg" viewBox="0 0 ${D.w} ${D.h}"><image href="${D.bg}" width="${D.w}" height="${D.h}" class="wlocked-img"/></svg><div class="wlock">🔒</div>${bpOn() ? '<button type="button" class="weluva" aria-label="Елува – защо е заключено"><img alt="" src="assets/img/mascot/hello.png"><span class="weluva-say">Тази част ще се отвори, когато стигнеш до нея в занятията.</span></button>' : ""}</div>`;
        const w = document.getElementById("world-status"); if (w) w.textContent = "Отключва се след завършване на BK14";
        return;
      }
    }
    if (!W || !window.PILOT_SYNC) { ready.then(() => render(box)); box.innerHTML = '<p class="world-msg">Зарежда се…</p>'; return; }
    const ws = window.PILOT_SYNC.worldState();
    if (!ws) { box.innerHTML = '<p class="world-msg">Светът се строи с домашните. Отвори линка на домашната, за да видиш своя квартал.</p>'; return; }
    const D = district(did), S = states(ws, did), focusLesson = window.WORLD_FOCUS; look();
    if (bpOn() && BPL.districts[did || "letters"]) return renderBplus(box, did || "letters", ws, S, focusLesson);
    const seenAll = seenGet(), seen = seenAll[ws.child] = seenAll[ws.child] || {}, seenNew = {};
    const plots = S.map((x, i) => {
      const final = !!(D.final && x.rule.lesson === D.final.lesson);
      const [px, py, pr] = final ? D.final.at : D.plots[x.rule.lesson];
      const lit = x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile";
      const stage = lit ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size);
      const rk = ws.child + "|" + x.rule.lesson, isNew = stage > (seen[x.rule.lesson] || 0) || (RECENT[rk] && RECENT[rk].stage === stage && Date.now() - RECENT[rk].at < 6000);
      if (isNew) { if (stage > (seen[x.rule.lesson] || 0)) RECENT[rk] = { stage, at: Date.now() }; seen[x.rule.lesson] = stage; seenNew[x.rule.lesson] = stage; }
      const k = final ? 1.6 : Math.max(0.9, pr / 40);
      const houses = final ? `<g class="wfest ${lit ? "lit" : "dark"}"><circle r="${pr * 0.42}" class="wfest-sq"/><text y="8" class="wfest-t">${lit ? "🎉" : stage ? "🚧" : "★"}</text></g>`
        : x.objs.map((o, j) => houseSvg(letterOf(o), stage, (j - (x.objs.length - 1) / 2) * 34 * k, 0, k)).join("");
      const decor = x.chosen ? `<text class="wdecor" x="${(final ? 0 : x.objs.length * 18 * k)}" y="${-6 * k}">${DECOR_ICON[obj(x.chosen).title] || "✨"}</text>` : "";
      const gift = x.canChoose ? `<g class="wgift" transform="translate(0 ${-48 * k})"><circle r="22" class="wgift-c"/><text y="9" class="wgift-t">🎁</text></g>` : "";
      // знак за възрастния: малка точка – „чака потвърждение“ (сива) / „за преглед“ (оранжева); детето вижда готовия квартал
      const adult = ws.demo ? "" : x.st === "pending" ? `<circle class="wadult pend" cx="${22 * k}" cy="${14 * k}" r="5"/>` : (x.st === "review" || x.st === "reconcile") ? `<circle class="wadult rev" cx="${22 * k}" cy="${14 * k}" r="5"/>` : "";
      const focus = !!focusLesson && focusLesson === x.rule.lesson;
      return `<g class="wplot st-${x.st}${isNew ? " grow" : ""}${focus ? " focus" : ""}" data-lesson="${x.rule.lesson}" data-state="${x.st}" data-stage="${stage}" data-new="${isNew ? 1 : 0}" data-chosen="${x.chosen || ""}" transform="translate(${px} ${py})" role="button" tabindex="0" aria-label="${esc(x.rule.title || x.rule.lesson)}">
        ${focus ? `<ellipse class="wfocus" rx="${(final ? pr : pr * 1.15) * 1.25}" ry="${(final ? pr : pr * 1.15) * 0.55}" cy="${12 * k}"/>` : ""}<ellipse class="wbase" rx="${(final ? pr : pr * 1.15)}" ry="${(final ? pr : pr * 1.15) * 0.42}" cy="${12 * k}"/>${houses}${decor}${gift}${adult}</g>`;
    }).join("");
    seenSet(seenAll);
    box.innerHTML = `<svg class="world-svg" data-district="${did || "letters"}" viewBox="0 0 ${D.w} ${D.h}" preserveAspectRatio="xMidYMid meet" aria-label="${esc(D.title)}">
      <image href="${D.bg}" width="${D.w}" height="${D.h}"/>${plots}</svg>`;
    const fresh = S.find(x => seenNew[x.rule.lesson]);
    if (fresh && window.MASCOT_ON && window.MASCOT_ON()) {
      const g = box.querySelector(`.wplot[data-lesson="${fresh.rule.lesson}"]`), r = g && g.getBoundingClientRect(), b0 = box.getBoundingClientRect();
      if (r) { const m = document.createElement("img"); m.className = "world-mascot"; m.alt = ""; m.src = `assets/img/mascot/${seenNew[fresh.rule.lesson] >= 4 ? "celebrate" : "joy"}.png`;
        m.style.left = (r.left - b0.left + r.width + 4) + "px"; m.style.top = Math.max(0, r.top - b0.top - 60) + "px"; box.appendChild(m); setTimeout(() => m.remove(), 3200); }
    }
    box.querySelectorAll(".wplot").forEach(g => g.addEventListener("click", () => {
      const x = S.find(y => y.rule.lesson === g.dataset.lesson); if (x && x.canChoose) openChoice(x, box, did);
    }));
    const w = document.getElementById("world-status");   // за възрастния: кратко състояние (не е за детето)
    if (w) w.textContent = ws.demo ? "Демо – данните са само на този таблет" : ws.queued ? "Изпраща се…" : S.some(x => x.st === "reconcile") ? "Нужна е проверка от учителя" : S.some(x => x.st === "review") ? "Има награда за преглед" : S.some(x => x.st === "pending") ? "Чака потвърждение" : "";
  }

  function look() { const s = document.getElementById("screen-world"); if (s) s.classList.toggle("bplus", bpOn()); }

  // ---- вид B+ (D1.1): сглобява квартала от празен пейзаж и спрайтове; същите data-атрибути като временната графика ----
  function renderBplus(box, did, ws, S, focusLesson) {
    const B = BPL.districts[did], D = district(did), finalL = D.final && D.final.lesson;
    const seenAll = seenGet(), seen = seenAll[ws.child] = seenAll[ws.child] || {}, seenNew = {};
    const regular = S.filter(x => x.rule.lesson !== finalL);
    // улици: разделянето е от конфигурацията (напр. Букварика 7 + 6), за да няма празни парцели без занятие; иначе – по B.street
    const split = Array.isArray(B.streets) && B.streets.reduce((a, b) => a + b, 0) === regular.length ? B.streets
      : Array.from({ length: Math.max(1, Math.ceil(regular.length / B.street)) }, (_, j) => Math.min(B.street, regular.length - j * B.street));
    const nStreets = split.length, pos = [];   // pos[i] = [улица, място в улицата] за i-тото обикновено занятие
    split.forEach((n, j) => { for (let p = 0; p < n; p++) pos.push([j, p]); });
    const slotOf = (j, p) => { const m = (B.street_slots || {})[split[j]]; return B.slots[m ? m[p] : p]; };
    const street = x => x.rule.lesson === finalL ? nStreets - 1 : pos[regular.indexOf(x)][0];
    // улицата следва текущото занятие (или акцента); ръчно избраната улица важи, докато текущото занятие не се смени
    const want = S.find(x => focusLesson && x.rule.lesson === focusLesson) || S.find(x => x.st === "next");
    const key = (want ? want.rule.lesson : "") + "|" + ws.child, so = streetOf[did];
    if (!so || so.key !== key || focusLesson) streetOf[did] = { key, street: want ? street(want) : nStreets - 1 };
    const cur = Math.max(0, Math.min(streetOf[did].street, nStreets - 1));
    const lit = x => x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile";
    // финалната сграда (BK14 / CH24 / MW32) е на площада и се вижда от всяка улица като голямата цел; методическите правила не се променят
    const items = S.filter(x => x.rule.lesson === finalL || street(x) === cur).map(x => {
      const final = x.rule.lesson === finalL, i = regular.indexOf(x), sp0 = final ? null : pos[i], slot = final ? B.final : slotOf(sp0[0], sp0[1]);
      const [px, py] = slot;
      const stage = lit(x) ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size);
      const rk = ws.child + "|" + x.rule.lesson, isNew = stage > (seen[x.rule.lesson] || 0) || (RECENT[rk] && RECENT[rk].stage === stage && Date.now() - RECENT[rk].at < 6000);
      if (isNew) { if (stage > (seen[x.rule.lesson] || 0)) RECENT[rk] = { stage, at: Date.now() }; seen[x.rule.lesson] = stage; seenNew[x.rule.lesson] = stage; }
      // разнообразие: видовете сгради се редуват, а при второто срещане на същия вид на улицата – огледално
      const nT = B.types.length, type = final ? B.final_type : B.types[sp0[1] % nT], flip = !final && Math.floor(sp0[1] / nT) % 2 === 1;
      const sz = final ? B.final_size : Math.round(B.size * (slot[2] || 1));
      // един мащаб за всички етапи на обекта (от готовата сграда) и една долна точка – обектът не „скача“ между етапите
      // финалната сграда преди началото си: бледа силуетна „голяма цел“ на площада (готовият вид, без цвят)
      const goal = final && stage === 0, shown = goal ? 4 : stage;
      const sp = BPL.sprites[`${type}_${shown}`] || [1, 1], ref = BPL.sprites[`${type}_4`] || sp, k = sz / ref[0];
      const wpx = Math.round(sp[0] * k), h = Math.round(sp[1] * k), top = -h + sz * (B.anchor || 0.32);
      // празен парцел: кръгът се рисува от кода (дъските нямат нарисувани парцели) – така всяка улица показва точно толкова парцела, колкото занятия има
      const board = (B.empty_plot === "board" || B.empty_plot === "sprite") && stage === 0 && !final;
      const ps = B.empty_plot === "sprite" && BPL.sprites[B.plot_sprite], pw = sz * 1.0, phh = ps ? pw * ps[1] / ps[0] : 0;
      const emptyPlot = ps ? `<image class="wslot" href="${SPR}${B.plot_sprite}.webp" x="${-pw / 2}" y="${-phh / 2}" width="${pw}" height="${phh}"/>` : `<ellipse class="wslot" rx="${sz * 0.5}" ry="${sz * 0.36}"/>`;
      const decor = x.chosen ? `<image class="wdecor-img" href="${decorSprite(did, x.chosen)}" x="${sz * 0.3}" y="${sz * 0.3 - sz * 0.45}" width="${sz * 0.3}" height="${sz * 0.45}" preserveAspectRatio="xMidYMax meet"/>` : "";
      const gift = x.canChoose ? `<g class="wgift" transform="translate(0 ${top - 10})"><circle r="30" class="wgift-c"/><text y="11" class="wgift-t">🎁</text></g>` : "";
      const adult = ws.demo ? "" : x.st === "pending" ? `<circle class="wadult pend" cx="${sz * 0.42}" cy="${sz * 0.2}" r="9"/>` : (x.st === "review" || x.st === "reconcile") ? `<circle class="wadult rev" cx="${sz * 0.42}" cy="${sz * 0.2}" r="9"/>` : "";
      const focus = !!focusLesson && focusLesson === x.rule.lesson;
      // състояния за детето: текущ строеж – пулсиращ светъл контур; готов – може да се докосне (разглеждане/украса); бъдещ – само кръгът, неактивен
      const role = x.st === "next" ? "current" : lit(x) ? "done" : "future";
      const ring = `<ellipse class="wring" rx="${sz * 0.52}" ry="${sz * 0.37}" cy="${board ? 0 : sz * 0.04}"/>`;
      return { y: py, x, html: `<g class="wplot bp st-${x.st} r-${role}${final ? " final" : ""}${isNew ? " grow" : ""}${focus ? " focus" : ""}" data-lesson="${x.rule.lesson}" data-state="${x.st}" data-stage="${stage}" data-new="${isNew ? 1 : 0}" data-chosen="${x.chosen || ""}" transform="translate(${px} ${py})" ${role === "future" ? 'aria-disabled="true"' : 'role="button" tabindex="0"'} aria-label="${esc(x.rule.title || x.rule.lesson)}">
        ${focus ? `<ellipse class="wfocus" rx="${sz * 0.62}" ry="${sz * 0.42}" cy="${board ? 0 : sz * 0.04}"/>` : ""}${role === "current" ? ring : ""}
        ${board ? emptyPlot : `<image class="wsprite${goal ? " wgoal" : ""}" href="${SPR}${type}_${shown}.webp" x="${-wpx / 2}" y="${top}" width="${wpx}" height="${h}"${flip ? ' transform="scale(-1 1)"' : ""}/>`}${decor}${gift}${adult}</g>` };
    }).sort((a, b) => a.y - b.y);   // по-долните пред по-горните
    seenSet(seenAll);
    // следващата улица се отваря, когато първото ѝ занятие е достъпно (по реда на правилата), а не след брой занятия
    const opened = j => j <= cur || regular.some((x, n) => pos[n][0] === j && x.st !== "locked");
    const nav = nStreets > 1 ? `<button type="button" class="wstreet prev" aria-label="Предишна улица" ${cur === 0 ? "disabled" : ""}>◀</button><button type="button" class="wstreet next${cur < nStreets - 1 && !opened(cur + 1) ? " locked" : ""}" aria-label="Следваща улица" ${cur === nStreets - 1 || !opened(cur + 1) ? "disabled" : ""}>${cur < nStreets - 1 && !opened(cur + 1) ? "🔒" : "▶"}</button><div class="wstreet-dots">${Array.from({ length: nStreets }, (_, j) => `<i class="${j === cur ? "on" : opened(j) ? "" : "off"}"></i>`).join("")}</div>` : "";
    // Елува в „Моят квартал“ е помощник ИЗВЪН картата (долу вдясно); главният герой тук е аватарът.
    // Излиза на картата само за кратко при събитие: ново занятие/нова улица – до новата сграда; цял квартал – празнува с аватара.
    const fresh = items.map(o => o.x).find(x => seenNew[x.rule.lesson]);
    // аватарът: до текущия строеж, стъпил на терена вдясно от парцела (не върху контура); ръст = AVS от досегашния (тест 65/70/75 %, по подразбиране 70 %)
    const av = avatarOf(ws.child), avBtn = `<button type="button" class="wavatar-btn" aria-label="Моят герой">${av ? figHTML(av, accOf(ws.child), "face") : "🙂"}</button>`, curX = items.map(o => o.x).find(x => x.st === "next"), ci = curX ? regular.indexOf(curX) : -1;
    const cs = curX ? (curX.rule.lesson === finalL ? B.final : slotOf(pos[ci][0], pos[ci][1])) : null, csz = cs ? (curX.rule.lesson === finalL ? B.final_size : B.size * (cs[2] || 1)) : 0;
    // повторно изиграно, вече готово занятие (акцент от „Виж квартала“): без нов обект – само кратка радост на героя до готовата сграда
    const again = !fresh && focusLesson && items.map(o => o.x).find(x => x.rule.lesson === focusLesson && lit(x));
    const AVS = (+(new URLSearchParams(location.search).get("avsize")) || 70) / 100, fh = csz * 0.88 * AVS, fw = fh * 0.6;
    const avatar = av && cs ? `<g class="wavatar${fresh || again ? " cheer" : ""}" data-avatar="${av}" transform="translate(${cs[0] + csz * 0.56 + fw * 0.35} ${cs[1] + csz * 0.3})"><ellipse class="wguide-sh" rx="${fh * 0.22}" ry="${fh * 0.065}"/>${figSVG(av, accOf(ws.child), -fw / 2, -fh, fw, fh)}</g>` : "";
    const fi = fresh ? regular.indexOf(fresh) : -1, fs = fresh ? (fresh.rule.lesson === finalL ? B.final : fi >= 0 ? slotOf(pos[fi][0], pos[fi][1]) : null) : null;
    const fsz = fs ? (fresh.rule.lesson === finalL ? B.final_size : B.size * (fs[2] || 1)) : 0, gs = fsz * 0.5;
    // правило 1: до съответната сграда, без да я закрива – страната (ляво/дясно), която е по-далеч от другите парцели и от аватара
    const others = items.map(o => o.x).filter(x => x !== fresh).map(x => { const n = regular.indexOf(x); return x.rule.lesson === finalL ? B.final : n >= 0 ? slotOf(pos[n][0], pos[n][1]) : null; }).filter(Boolean).concat(cs ? [[cs[0] + csz * 0.56, cs[1]]] : []);
    const gx = fs ? [-1, 1].map(d => fs[0] + d * (fsz * 0.56 + gs * 0.3)).map(x => [x, Math.min(...others.map(o => Math.hypot(o[0] - x, o[1] - fs[1])), 1e9)]).sort((a, b) => b[1] - a[1])[0][0] : 0;
    const eluva = fs ? `<g class="wguide visit" transform="translate(${gx} ${fs[1] + fsz * 0.3})"><ellipse class="wguide-sh" rx="${gs * 0.33}" ry="${gs * 0.1}"/><image href="assets/img/mascot/${fresh.rule.lesson === finalL || seenNew[fresh.rule.lesson] >= 4 ? "celebrate" : "joy"}.png" x="${-gs / 2}" y="${-gs}" width="${gs}" height="${gs}"/></g>` : "";
    const helper = `<button type="button" class="weluva${fs ? " away" : ""}" aria-label="Елува – подсказка"><img alt="" src="assets/img/mascot/hello.png"><span class="weluva-say" hidden></span></button>`;
    box.innerHTML = `<svg class="world-svg" data-district="${did}" data-look="bplus" data-street="${cur}" viewBox="0 0 ${B.w} ${B.h}" preserveAspectRatio="xMidYMid meet" aria-label="${esc(D.title)}">
      <image href="${B.bg}" width="${B.w}" height="${B.h}"/>${items.map(o => o.html).join("")}${avatar}${eluva}</svg>${nav}${avBtn}${helper}`;
    // Елува се връща в ъгъла след краткото посещение на картата
    // правило 2–3: нищо не чака натискане; при преминаване към друг екран/улица посещението просто изчезва с картата (таймерът се спира)
    clearTimeout(box._ev); if (fs) box._ev = setTimeout(() => { const v = box.querySelector(".wguide.visit"), h = box.querySelector(".weluva"); if (v) v.classList.add("gone"); if (h) h.classList.remove("away"); }, 3800);
    const hint = t => { const h = box.querySelector(".weluva"); if (!h) return; const b = h.querySelector(".weluva-say"); b.textContent = t; b.hidden = false; h.classList.remove("hop"); void h.offsetWidth; h.classList.add("hop");
      clearTimeout(h._t); h._t = setTimeout(() => { b.hidden = true; }, 3500); try { if (window.VOICE && window.VOICE.speak) window.VOICE.speak([t]); } catch (err) {} };
    box.querySelector(".weluva").addEventListener("click", () => hint(curX ? "Изиграй следващия кръг от домашната и сградата ще порасне." : "Докосни сграда, за да я разгледаш."));
    box.querySelector(".wavatar-btn").addEventListener("click", () => openAvatarPick(box, did, false));
    // първо отваряне без избран герой: питаме едва когато сървърът е отговорил за детето (нов таблет – героят може вече да е избран другаде)
    if (!av && !ws.demoNoPick) { const known = !window.PILOT_SYNC.stateKnown || window.PILOT_SYNC.stateKnown(ws.child);
      if (known) setTimeout(() => openAvatarPick(box, did, true), 400); else setTimeout(() => { const s2 = document.getElementById("screen-world"); if (s2 && !s2.hidden) render(box, did); }, 1500); }
    box.querySelectorAll(".wstreet").forEach(b => b.addEventListener("click", () => {
      if (b.disabled) return;
      streetOf[did] = { key, street: Math.max(0, Math.min(nStreets - 1, cur + (b.classList.contains("next") ? 1 : -1))) }; window.WORLD_FOCUS = null; render(box, did); }));
    box.querySelectorAll(".wplot").forEach(g => g.addEventListener("click", () => {
      const x = S.find(y => y.rule.lesson === g.dataset.lesson); if (!x) return;
      if (x.canChoose) openChoice(x, box, did); else if (lit(x)) openView(x, g, box, did);   // готов обект: разглеждане
      else if (x.st === "next") {   // текущ строеж: Елува подсказва какво следва (връзка към следващия кръг – D3)
        g.classList.add("hinted"); hint("Тук строим. Изиграй следващия кръг от домашната и сградата ще порасне.");
      }
    }));
    const w = document.getElementById("world-status");
    if (w) w.textContent = ws.demo ? "Демо – данните са само на този таблет" : ws.queued ? "Изпраща се…" : S.some(x => x.st === "reconcile") ? "Нужна е проверка от учителя" : S.some(x => x.st === "review") ? "Има награда за преглед" : S.some(x => x.st === "pending") ? "Чака потвърждение" : "";
  }
  // готов обект: детето го разглежда отблизо (сградата и украсата); затваря се с докосване
  // готов обект: разглеждане отблизо – сградата „оживява“ (светват прозорците, дим от комина), героят идва и се радва; украсата може да се смени
  function openView(x, g, box, did) {
    if (document.getElementById("world-view")) return;
    const sp = g.querySelector(".wsprite"), dc = g.querySelector(".wdecor-img"); if (!sp) return;
    const ws = window.PILOT_SYNC && window.PILOT_SYNC.worldState(), av = ws && avatarOf(ws.child);
    const o = document.createElement("div"); o.id = "world-view"; o.className = "world-choice world-view"; o.setAttribute("role", "dialog");
    o.innerHTML = `<div class="wv-box"><div class="wv-scene"><img class="wv-b" alt="" src="${sp.getAttribute("href")}">${dc ? `<img class="wv-d" alt="" src="${dc.getAttribute("href")}">` : ""}${av ? figHTML(av, accOf(ws.child), "wv-av") : ""}</div>
      ${x.offer && x.offer.length && x.chosen ? '<button type="button" class="wv-change">Смени украсата</button>' : ""}</div>`;
    o.addEventListener("click", e => { if (e.target.closest(".wv-change")) { o.remove(); openChoice(x, box, did); return; } o.remove(); });
    document.body.appendChild(o);
  }

  function openChoice(x, box, did) {
    if (document.getElementById("world-choice")) return;
    const o = document.createElement("div"); o.id = "world-choice"; o.className = "world-choice"; o.setAttribute("role", "dialog");
    const av = window.PILOT_SYNC && avatarOf((window.PILOT_SYNC.worldState() || {}).child);
    o.innerHTML = `<div class="wc-box">${av ? figHTML(av, accOf((window.PILOT_SYNC.worldState() || {}).child), "wc-avatar") : ""}<h2>Избери украса</h2><div class="wc-opts">${x.offer.map(id => {
      const t = did && bpOn() ? decorTitle(did, id) : obj(id).title, ic = did && bpOn() ? `<img class="wc-img" alt="" src="${decorSprite(did, id)}">` : `<span class="wc-ic">${DECOR_ICON[t] || "✨"}</span>`;
      return `<button type="button" class="wc-opt" data-id="${esc(id)}">${ic}<span class="wc-t">${esc(t)}</span></button>`; }).join("")}</div></div>`;
    document.body.appendChild(o);
    try { if (window.VOICE && window.VOICE.speak) window.VOICE.speak(["Избери украса за своя квартал."]); } catch (e) {}
    o.querySelectorAll(".wc-opt").forEach(b => b.addEventListener("click", () => {
      window.PILOT_SYNC.choose(x.rule.rule_id, b.dataset.id); o.remove(); render(box);
    }));
  }

  // ---- кварталите според учебната програма (достъп) – обектите вътре са според завършените занятия ----
  // open | hidden | after_BK14 (стандартно начало в Читарика: след учебно завършване на BK14; при директен прием – отворено)
  function lessonDone(ws, lesson) {
    const r = (W.rules || []).find(x => x.lesson === lesson && x.condition && x.condition.type === "lesson_complete"); if (!r) return false;
    const need = (r.condition.rounds || [1, 2, 3, 4]).map(Number), got = (ws.rounds[lesson] || []).map(Number);
    return need.every(x => got.includes(x)) || ((r.effect && r.effect.unlock) || []).every(o => ws.confirmed[o]);
  }
  function access(ws) {
    const P = (L.programs || {})[ws.program] || (L.programs || {}).full, out = {};
    Object.keys(L.districts).forEach(d => {
      let a = (P && P.districts[d]) || "hidden";
      if (a === "after_BK14") a = ws.readingEntry === "direct" || lessonDone(ws, "BK14") ? "open" : "locked";
      out[d] = a;
    });
    return out;
  }
  let current = null;
  function tabs(ws, acc, box) {
    const t = document.getElementById("world-tabs"); if (!t) return;
    const vis = Object.keys(L.districts).filter(d => acc[d] !== "hidden");
    t.innerHTML = vis.length > 1 ? vis.map(d => `<button type="button" class="wtab ${d === current ? "on" : ""} ${acc[d]}" data-d="${d}" aria-label="${esc(L.districts[d].title)}${acc[d] === "locked" ? " – заключено" : ""}">${acc[d] === "locked" ? "🔒 " : ""}${esc(L.districts[d].title)}</button>`).join("") : "";
    t.querySelectorAll(".wtab").forEach(b => b.addEventListener("click", () => { current = b.dataset.d; render(box); }));
  }
  // за учителя: кои занятия на детето искат внимание и защо (без рисуване)
  async function attention(child, did) {
    await ready; if (!W || !window.PILOT_SYNC) return [];
    const ws = window.PILOT_SYNC.worldState(child); if (!ws) return [];
    const ds = did ? [did] : Object.keys(L.districts);
    return [].concat(...ds.map(d => states(ws, d))).filter(x => x.st === "reconcile" || x.st === "review" || x.st === "pending").map(x => ({ lesson: x.rule.lesson, title: x.rule.title, state: x.st, reason: x.reason }));
  }
  window.addEventListener("pilot-world", () => { const s = document.getElementById("screen-world"); if (s && !s.hidden) render(); });
  // сградата на занятието (за началния екран „Моят свят“ и екрана след кръга): същият вид и етап като в квартала B+
  function plotOf(ws, lesson) {
    if (!bpOn() || !BPL || !L) return null;
    const did = Object.keys(L.districts || {}).find(d => { const D = L.districts[d]; return D.plots[lesson] || (D.final && D.final.lesson === lesson); }); if (!did || !BPL.districts[did]) return null;
    const B = BPL.districts[did], D = district(did), finalL = D.final && D.final.lesson, S = states(ws, did), x = S.find(y => y.rule.lesson === lesson); if (!x) return null;
    const regular = S.filter(y => y.rule.lesson !== finalL), final = lesson === finalL;
    const split = Array.isArray(B.streets) && B.streets.reduce((a, b) => a + b, 0) === regular.length ? B.streets : Array.from({ length: Math.max(1, Math.ceil(regular.length / B.street)) }, (_, j) => Math.min(B.street, regular.length - j * B.street));
    const pos = []; split.forEach((n, j) => { for (let q = 0; q < n; q++) pos.push([j, q]); });
    const lit = x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile", stage = lit ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size);
    const type = final ? B.final_type : B.types[pos[regular.indexOf(x)][1] % B.types.length];
    return { did, stage, src: (n => `${SPR}${type}_${n}.webp`), title: D.title };
  }
  // умален изглед „Какво построих“ (плочката в „Моят свят“): улицата на текущия строеж – готовите сгради, строежът и героят; без анимации и без отбелязване „видяно“
  function preview(ws, did) {
    if (!bpOn() || !BPL || !BPL.districts[did]) return "";
    const B = BPL.districts[did], D = district(did), finalL = D.final && D.final.lesson, S = states(ws, did), regular = S.filter(x => x.rule.lesson !== finalL);
    const split = Array.isArray(B.streets) && B.streets.reduce((a, b) => a + b, 0) === regular.length ? B.streets : Array.from({ length: Math.max(1, Math.ceil(regular.length / B.street)) }, (_, j) => Math.min(B.street, regular.length - j * B.street));
    const pos = []; split.forEach((n, j) => { for (let q = 0; q < n; q++) pos.push([j, q]); });
    const slotOf = (j, q) => { const mm = (B.street_slots || {})[split[j]]; return B.slots[mm ? mm[q] : q]; };
    const nx = S.find(x => x.st === "next"), cur = nx && nx.rule.lesson !== finalL ? pos[regular.indexOf(nx)][0] : split.length - 1;
    const lit = x => x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile";
    let out = "", hero = "";
    S.filter(x => x.rule.lesson === finalL || pos[regular.indexOf(x)][0] === cur).map(x => {
      const final = x.rule.lesson === finalL, sp0 = final ? null : pos[regular.indexOf(x)], slot = final ? B.final : slotOf(sp0[0], sp0[1]);
      const stage = lit(x) ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size), type = final ? B.final_type : B.types[sp0[1] % B.types.length];
      const flip = !final && Math.floor(sp0[1] / B.types.length) % 2 === 1, sz = final ? B.final_size : Math.round(B.size * (slot[2] || 1));
      return { x, slot, stage, type, flip, sz, final };
    }).sort((a, b) => a.slot[1] - b.slot[1]).forEach(o => {
      const [px, py] = o.slot, goal = o.final && o.stage === 0, shown = goal ? 4 : o.stage;
      if (o.x.st === "next") { out += `<ellipse cx="${px}" cy="${py}" rx="${o.sz * 0.52}" ry="${o.sz * 0.37}" fill="none" stroke="#F2B705" stroke-width="10"/>`;
        const av = avatarOf(ws.child), fh = o.sz * 0.88 * 0.7; if (av) hero = `<g transform="translate(${px + o.sz * 0.56 + fh * 0.21} ${py + o.sz * 0.3})">${figSVG(av, accOf(ws.child), -fh * 0.3, -fh, fh * 0.6, fh)}</g>`; }
      if (o.stage === 0 && !o.final) { out += `<ellipse cx="${px}" cy="${py}" rx="${o.sz * 0.5}" ry="${o.sz * 0.36}" fill="rgba(90,70,30,.12)"/>`; return; }
      const sp = BPL.sprites[`${o.type}_${shown}`] || [1, 1], ref = BPL.sprites[`${o.type}_4`] || sp, k = o.sz / ref[0], w = sp[0] * k, h = sp[1] * k, top = -h + o.sz * (B.anchor || 0.32);
      out += `<g transform="translate(${px} ${py})"${goal ? ' opacity=".35"' : ""}><image href="${SPR}${o.type}_${shown}.webp" x="${-w / 2}" y="${top}" width="${w}" height="${h}"${o.flip ? ' transform="scale(-1 1)"' : ""}/></g>`;
    });
    return `<svg viewBox="0 0 ${B.w} ${B.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${B.bg}" width="${B.w}" height="${B.h}"/>${out}${hero}</svg>`;
  }
  window.WORLD = { render, ready, attention, plotOf, preview, fig: figHTML, hero: child => ({ av: avatarOf(child), acc: accOf(child) }), pickHero: (cb, first) => openAvatarPick(cb, null, !!first), bplus: () => bpOn() ? BPL : null, access: ws => access(ws), states: (ws, did) => states(ws, did), districtOf: l => Object.keys((L && L.districts) || {}).find(d => { const D = L.districts[d]; return D.plots[l] || (D.final && D.final.lesson === l); }) || null };
})();
