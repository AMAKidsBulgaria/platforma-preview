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
  const ready = Promise.all([fetch("config/world-rules.json?v=2").then(r => r.json()), fetch("config/world-layout.json?v=3").then(r => r.json()),
    fetch("config/world-bplus.json?v=29").then(r => r.json()).catch(() => null)])
    .then(([d, l, b]) => { W = d; L = l; BPL = b; }).catch(() => {});
  // вид B+: world=bplus включва, world=v1 връща временната графика; помни се на устройството
  const BPQ = (location.search + location.hash).match(/[?&#~]world[=_](bplus|v1)/);
  try { if (BPQ) localStorage.setItem("platforma.world.look", BPQ[1]); } catch (e) {}
  const H2 = (/[?&#~]home[=_]v2/.test(location.search + location.hash) || (function () { try { return localStorage.getItem("platforma.home") === "v2" && !/[?&#~]home[=_]v1/.test(location.search + location.hash); } catch (e) { return false; } })());   // „Моят свят“ (home=v2) върви с квартала B+
  // прототип „долина“ (?valley=1): кварталът – част от непрекъснат пейзаж; площадките, пътеката и табелките – от кода (config valley)
  const VQ = (location.search + location.hash).match(/[?&#~]valley[=_]([01])/); try { if (VQ) localStorage.setItem("platforma.world.valley", VQ[1]); } catch (e) {}
  // в „Моят свят“ (home=v2) долината е по подразбиране; valley=0 връща досегашния квартал
  // режим „преглед“ (?review=1, за възрастния; ?review=0 го изключва): всички квартали и игри са отключени, за да се разгледат.
  // Педагогическите правила за децата не се променят – без флага всичко е както досега.
  // Пази се само в този раздел (sessionStorage) – не остава в браузъра и не се смесва с децата или с тестовете.
  const RVQ = (location.search + location.hash).match(/[?&#~]review[=_]([01])/); try { localStorage.removeItem("platforma.review"); if (RVQ) { if (RVQ[1] === "1") sessionStorage.setItem("platforma.review", "1"); else sessionStorage.removeItem("platforma.review"); } } catch (e) {}
  const REVIEW = (() => { try { return sessionStorage.getItem("platforma.review") === "1"; } catch (e) { return !!(RVQ && RVQ[1] === "1"); } })();
  window.PLATFORMA_REVIEW = REVIEW; if (REVIEW) document.documentElement.classList.add("review-mode");
  const valleyOn = () => { if (/[?&#~]home[=_]v1/.test(location.search + location.hash)) return false;   // изрично досегашният начален екран – досегашният квартал (и в тестовете)
    let v = VQ ? VQ[1] : null; try { v = v || localStorage.getItem("platforma.world.valley"); } catch (e) {} return v ? v === "1" : H2; };
  const bdist = did => (valleyOn() && BPL.valley && BPL.valley[did]) ? Object.assign({}, BPL.districts[did], BPL.valley[did]) : BPL.districts[did];
  const bpOn = () => { let v = BPQ ? BPQ[1] : (H2 ? "bplus" : null); try { v = v || localStorage.getItem("platforma.world.look"); } catch (e) {} return v === "bplus" && !!BPL; };
  const SPR = "assets/img/world/bplus/";
  // украсата в B+: 3 картинки на квартал; изборът (id от правилата) се показва с картинката n % 3 и нейното име (списъкът украси за B+ – за съгласуване)
  const decorN = id => +((id || "").match(/\.(\d+)$/) || [0, 0])[1] % 3;
  const decorSprite = (did, id) => `${SPR}${BPL.districts[did].decor}_decor_${decorN(id) + 1}.webp`;
  const decorTitle = (did, id) => ((BPL.decor_titles || {})[BPL.districts[did].decor] || [])[decorN(id)] || obj(id).title;
  const streetOf = {}, AVPK = "platforma.world.avpos.v1", AVPOS = (() => { try { return JSON.parse(localStorage.getItem(AVPK) || "{}"); } catch (e) { return {}; } })();   // AVPOS: последното място на героя (дете|квартал) – за ходенето до новия строеж
  let CAM = ((location.search + location.hash).match(/[?&#~]cam[=_](near|far)/) || [])[1] || "near";   // близък/далечен план – както досегашната карта (офис „Моят свят“: „При …“ / „Целият град“); помни се за сесията
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
        const D = bpOn() ? bdist(current) : district(current), lbg = D.areas ? D.areas[0].bg : D.bg; look();   // долината: първата зона на квартала, притъмнена
        box.innerHTML = `<div class="wlocked" data-district="${current}" data-state="locked"><svg class="world-svg" viewBox="0 0 ${D.w} ${D.h}"${D.areas ? ' preserveAspectRatio="xMidYMid slice"' : ""}><image href="${lbg}" width="${D.w}" height="${D.h}" class="wlocked-img"/></svg><div class="wlock">🔒</div>${bpOn() ? '<button type="button" class="weluva" aria-label="Елува – защо е заключено"><img alt="" src="assets/img/mascot/hello.png"><span class="weluva-say">Тази част ще се отвори, когато стигнеш до нея в занятията.</span></button>' : ""}</div>`;
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
    let B = bdist(did); const D = district(did), finalL = D.final && D.final.lesson;
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
    if (ZONE_PICK && ZONE_PICK.d === did) { streetOf[did] = { key, street: ZONE_PICK.z }; ZONE_PICK = null; }   // докосната клетка в общия свят – тази зона
    const cur = Math.max(0, Math.min(streetOf[did].street, nStreets - 1));
    // долината с зони (Читарика 3, Кварталът на числата 4): всяка зона – свой фон и свои места; финалът – само в последната зона (на площада ѝ)
    const zoned = !!B.areas; if (zoned) B = Object.assign({}, B, B.areas[cur] || B.areas[B.areas.length - 1]);
    const lit = x => x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile";
    // финалната сграда (BK14 / CH24 / MW32) е на площада и се вижда от всяка улица като голямата цел; методическите правила не се променят
    const items = S.filter(x => x.rule.lesson === finalL ? (!zoned || cur === nStreets - 1) : street(x) === cur).map(x => {
      const final = x.rule.lesson === finalL, i = regular.indexOf(x), sp0 = final ? null : pos[i], slot = final ? B.final : slotOf(sp0[0], sp0[1]);
      const [px, py] = slot;
      const stage = lit(x) ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size);
      const rk = ws.child + "|" + x.rule.lesson, isNew = stage > (seen[x.rule.lesson] || 0) || (RECENT[rk] && RECENT[rk].stage === stage && Date.now() - RECENT[rk].at < 6000);
      if (isNew) { if (stage > (seen[x.rule.lesson] || 0)) RECENT[rk] = { stage, at: Date.now() }; seen[x.rule.lesson] = stage; seenNew[x.rule.lesson] = stage; }
      // разнообразие: видовете сгради се редуват, а при второто срещане на същия вид на улицата – огледално
      const nT = B.types.length, type = final ? B.final_type : B.plot_types ? B.plot_types[i] : B.types[sp0[1] % nT], flip = !final && Math.floor(sp0[1] / nT) % 2 === 1;
      const sz = final ? B.final_size : Math.round(B.size * (slot[2] || 1));
      // един мащаб за всички етапи на обекта (от готовата сграда) и една долна точка – обектът не „скача“ между етапите
      // финалната сграда преди началото си: бледа силуетна „голяма цел“ на площада (готовият вид, без цвят)
      const goal = final && stage === 0, shown = goal ? 4 : stage;
      const sp = BPL.sprites[`${type}_${shown}`] || [1, 1], ref = BPL.sprites[`${type}_4`] || sp, k = sz / ref[0];
      const wpx = Math.round(sp[0] * k), h = Math.round(sp[1] * k), top = -h + sz * (B.anchor || 0.32);
      // празен парцел: кръгът се рисува от кода (дъските нямат нарисувани парцели) – така всяка улица показва точно толкова парцела, колкото занятия има
      const board = (B.empty_plot === "board" || B.empty_plot === "sprite" || B.empty_plot === "valley") && stage === 0 && (!final || B.empty_plot === "valley");   // долината: последната сграда преди началото – основа и табелка (обещание), не полупрозрачна сграда
      const ps = B.empty_plot === "sprite" && BPL.sprites[B.plot_sprite], pw = sz * 1.0, phh = ps ? pw * ps[1] / ps[0] : 0;
      // финалът преди началото: основата и табелката – в центъра на площада (сградата стъпва по-ниско, на долната точка)
      const vpad = B.empty_plot === "valley" ? (x.st === "next"
          ? `<ellipse class="vpad" rx="${sz * 0.5}" ry="${sz * 0.3}"/><ellipse class="vpad-cur${focusLesson || isNew ? " pulse" : ""}" rx="${sz * 0.52}" ry="${sz * 0.32}"/><g class="vsign" transform="translate(${sz * 0.34} ${-sz * 0.16})"><rect x="-3" y="0" width="6" height="${sz * 0.3}" rx="2"/><rect class="vsign-b" x="${-sz * 0.17}" y="${-sz * 0.24}" width="${sz * 0.34}" height="${sz * 0.26}" rx="6"/><image class="vsign-sil" href="${SPR}${type}_4.webp" x="${-sz * 0.13}" y="${-sz * 0.23}" width="${sz * 0.26}" height="${sz * 0.24}"/></g>`
          : goal ? `<g transform="translate(0 ${-sz * 0.09})"><ellipse class="vpad vpad-goal" rx="${sz * 0.5}" ry="${sz * 0.3}"/><g class="vsign big" transform="translate(0 ${-sz * 0.12})"><rect x="-4" y="0" width="8" height="${sz * 0.26}" rx="3"/><rect class="vsign-b" x="${-sz * 0.2}" y="${-sz * 0.3}" width="${sz * 0.4}" height="${sz * 0.32}" rx="8"/><image class="vsign-sil" href="${SPR}${type}_4.webp" x="${-sz * 0.16}" y="${-sz * 0.29}" width="${sz * 0.32}" height="${sz * 0.3}"/></g></g>`
          : regular.indexOf(x) > regular.findIndex(y => y.st === "next") + 2 && regular.some(y => y.st === "next") ? "" : `<ellipse class="vpad vpad-fut" rx="${sz * 0.42}" ry="${sz * 0.24}"/>`) : "";
      const emptyPlot = vpad ? vpad : ps ? `<image class="wslot" href="${SPR}${B.plot_sprite}.webp" x="${-pw / 2}" y="${-phh / 2}" width="${pw}" height="${phh}"/>` : `<ellipse class="wslot" rx="${sz * 0.5}" ry="${sz * 0.36}"/>`;
      const decor = x.chosen ? `<image class="wdecor-img" href="${decorSprite(did, x.chosen)}" x="${sz * 0.3}" y="${sz * 0.3 - sz * 0.45}" width="${sz * 0.3}" height="${sz * 0.45}" preserveAspectRatio="xMidYMax meet"/>` : "";
      const gift = x.canChoose ? `<g class="wgift" transform="translate(0 ${top - 10})"><circle r="30" class="wgift-c"/><text y="11" class="wgift-t">🎁</text></g>` : "";
      const adult = ws.demo ? "" : x.st === "pending" ? `<circle class="wadult pend" cx="${sz * 0.42}" cy="${sz * 0.2}" r="9"/>` : (x.st === "review" || x.st === "reconcile") ? `<circle class="wadult rev" cx="${sz * 0.42}" cy="${sz * 0.2}" r="9"/>` : "";
      const focus = !!focusLesson && focusLesson === x.rule.lesson;
      // състояния за детето: текущ строеж – пулсиращ светъл контур; готов – може да се докосне (разглеждане/украса); бъдещ – само кръгът, неактивен
      const role = x.st === "next" ? "current" : lit(x) ? "done" : "future";
      const ring = B.empty_plot === "valley" ? (board ? "" : `<ellipse class="vpad-cur${focusLesson || isNew ? " pulse" : ""}" rx="${sz * 0.52}" ry="${sz * 0.32}" cy="${sz * 0.04}"/>`)   // долината: златист контур и под започнатия строеж
        : `<ellipse class="wring" rx="${sz * 0.52}" ry="${sz * 0.37}" cy="${board ? 0 : sz * 0.04}"/>`;
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
    const avSide = cs && cs[3] === -1 ? -1 : 1, avX = cs ? cs[0] + avSide * (csz * 0.56 + fw * 0.35) : 0, avY = cs ? cs[1] + csz * 0.3 : 0;   // slot[3] = -1: героят вляво (вдясно е вода)
    const avatar = av && cs ? `<g class="wavatar${fresh || again ? " cheer" : ""}" data-avatar="${av}" transform="translate(${avX} ${avY})"><g class="wwalk"><ellipse class="wguide-sh" rx="${fh * 0.22}" ry="${fh * 0.065}"/>${figSVG(av, accOf(ws.child), -fw / 2, -fh, fw, fh)}</g></g>` : "";
    const fi = fresh ? regular.indexOf(fresh) : -1, fs = fresh ? (fresh.rule.lesson === finalL ? B.final : fi >= 0 ? slotOf(pos[fi][0], pos[fi][1]) : null) : null;
    const fsz = fs ? (fresh.rule.lesson === finalL ? B.final_size : B.size * (fs[2] || 1)) : 0, gs = fsz * 0.5;
    // правило 1: до съответната сграда, без да я закрива – страната (ляво/дясно), която е по-далеч от другите парцели и от аватара
    const others = items.map(o => o.x).filter(x => x !== fresh).map(x => { const n = regular.indexOf(x); return x.rule.lesson === finalL ? B.final : n >= 0 ? slotOf(pos[n][0], pos[n][1]) : null; }).filter(Boolean).concat(cs ? [[cs[0] + csz * 0.56, cs[1]]] : []);
    const gx = fs ? [-1, 1].map(d => fs[0] + d * (fsz * 0.56 + gs * 0.3)).map(x => [x, Math.min(...others.map(o => Math.hypot(o[0] - x, o[1] - fs[1])), 1e9)]).sort((a, b) => b[1] - a[1])[0][0] : 0;
    const eluva = fs ? `<g class="wguide visit" transform="translate(${gx} ${fs[1] + fsz * 0.3})"><ellipse class="wguide-sh" rx="${gs * 0.33}" ry="${gs * 0.1}"/><image href="assets/img/mascot/${fresh.rule.lesson === finalL || seenNew[fresh.rule.lesson] >= 4 ? "celebrate" : "joy"}.png" x="${-gs / 2}" y="${-gs}" width="${gs}" height="${gs}"/></g>` : "";
    const helper = `<button type="button" class="weluva${fs ? " away" : ""}" aria-label="Елува – подсказка"><img alt="" src="assets/img/mascot/hello.png"><span class="weluva-say" hidden></span></button>`;
    // камера (механиката на досегашната карта): близък план – текущият строеж, героят и току-що пораслата сграда; далечен – цялата улица на квартала
    const full = [0, 0, B.w, B.h], camBox = (() => {
      if (!cs) return null;
      const ar = B.w / B.h, va = box.clientWidth && box.clientHeight ? box.clientWidth / box.clientHeight : ar;
      // около половината от квартала (досегашната карта: 46–62 %); изправен таблет – кадърът е с пропорциите на екрана, за да не се реже строежът
      const w = va < 1 ? Math.min(B.w, B.h * 0.62 * va) : B.w * 0.55, h = va < 1 ? Math.min(B.h, B.h * 0.62) : w / ar;
      const cx = cs[0] + csz * 0.25, cy = cs[1] - csz * 0.3;   // строежът и героят (вдясно от него), сградата се издига нагоре
      return [Math.max(0, Math.min(B.w - w, cx - w / 2)), Math.max(0, Math.min(B.h - h, cy - h / 2)), w, h].map(v => Math.round(v));
    })();
    // току-що пораснала сграда извън близкия план: кварталът се отваря отдалеч, за да се види новото (детето приближава с бутона)
    const outside = (q, z) => camBox && (q[0] - z * 0.5 < camBox[0] || q[0] + z * 0.5 > camBox[0] + camBox[2] || q[1] - z < camBox[1] || q[1] + z * 0.3 > camBox[1] + camBox[3]);
    // само за това отваряне – изборът на детето (CAM) не се променя
    const cam = fs && outside(fs, fsz) ? "far" : CAM;
    const vb = cam === "near" && camBox ? camBox : full;
    const camBtn = camBox ? `<button type="button" class="wcam" data-mode="${cam}" aria-label="${cam === "near" ? "Виж всичко" : "Отблизо"}">${cam === "near" ? "🗺️ Виж всичко" : "🔍 Отблизо"}</button>` : "";
    box.innerHTML = `<svg class="world-svg" data-district="${did}" data-look="bplus" data-street="${cur}" data-cam="${camBox ? cam : "far"}" viewBox="${vb.join(" ")}" preserveAspectRatio="${B.empty_plot === "valley" && vb !== full ? "xMidYMid slice" : "xMidYMid meet"}" aria-label="${esc(D.title)}">
      ${B.empty_plot === "valley" ? mirrorExt(B) : ""}<image href="${B.bg}" width="${B.w}" height="${B.h}"/>${items.map(o => o.html).join("")}${avatar}${eluva}</svg>${nav}${avBtn}${helper}${camBtn}`;
    // „Виж целия свят“ (долината): общ изглед с трите квартала; докосване на квартал – обратно в него
    { const wo = BPL.world_overview; let wb = valleyOn() && wo ? document.createElement("button") : null;
      const cb0 = box.querySelector(".wcam:not(.wworld)"); if (wb && cb0) cb0.innerHTML = cam === "near" ? '<span class="wci">🏘️</span>Целият квартал' : '<span class="wci">🔍</span>Приближи';
      if (wb) { wb.type = "button"; wb.className = "wcam wworld"; wb.innerHTML = '<span class="wci">🌍</span>Целият свят'; box.appendChild(wb);
        wb.addEventListener("click", () => { const acc = (window.WORLD.access ? window.WORLD.access(ws) : {}) || {}, ov = document.createElement("div"); ov.className = "wworld-ov";
          const MZ = wo.mosaic, cw = MZ ? wo.w / 3 : 0, ch = MZ ? wo.h / 3 : 0;
          // мозайка 3×3 (25.10): всяка зона на всеки квартал – своя клетка от истинския ѝ фон, с всички построени сгради на същите места (умалени);
          // в средата – площадът с фонтана; краищата на клетките се преливат меко
          const cellOf = (k, j) => { const c = MZ && MZ.cells[k]; return c ? c[Math.min(j, c.length - 1)] : null; };
          const mosaic = MZ ? Object.keys(MZ.cells).map(k => { const B0 = bdist(k), nz = B0 && B0.areas ? B0.areas.length : 1, shown = acc[k] && acc[k] !== "hidden", open = shown && acc[k] !== "locked";
              return MZ.cells[k].slice(0, nz).map((c, j) => { const bgj = B0.areas ? B0.areas[j].bg : B0.bg;
                return `<g class="wmz${open ? "" : " off"}" data-d="${k}" data-z="${j}" transform="translate(${c[0] * cw} ${c[1] * ch}) scale(${cw / B0.w})">${open ? preview(ws, k, "mosaic", null, k !== did, j) : `<image href="${bgj}" width="${B0.w}" height="${B0.h}" mask="url(#wfz)"/>`}</g>`; }).join(""); }).join("")
            + `<svg x="${cw}" y="${ch}" width="${cw}" height="${ch}" viewBox="${MZ.center.crop.join(" ")}" preserveAspectRatio="xMidYMid slice"><image href="${MZ.center.bg}" width="${wo.w}" height="${wo.h}" mask="url(#wfc)"/></svg>` : "";
          const built = MZ ? mosaic : Object.entries(wo.districts).filter(([k, z]) => z.map && acc[k] !== "hidden" && acc[k] !== "locked" && BPL.valley && BPL.valley[k]).map(([k, z]) => `<g transform="translate(${z.map[0]} ${z.map[1]}) scale(${z.map[2]})">${preview(ws, k, z.patch ? "patch" : true, null, k !== did)}</g>`).join("");   // patch: зоната, в която детето строи – мек остров от нейния фон
          ov.innerHTML = `<svg viewBox="0 0 ${wo.w} ${wo.h}" preserveAspectRatio="xMidYMid meet"${MZ ? ` style="background:${MZ.ground}"` : ""}>${MZ ? mirrorExt({ bg: wo.bg, w: wo.w, h: wo.h }) : ""}<defs><radialGradient id="wpg"><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="wpatch" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#wpg)"/></mask><filter id="wfb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${MZ ? 70 : 34}"/></filter><mask id="wfz" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><rect x="70" y="60" width="1396" height="904" rx="160" fill="#fff" filter="url(#wfb)"/></mask><mask id="wfc" maskUnits="userSpaceOnUse" x="${MZ ? MZ.center.crop[0] : 0}" y="${MZ ? MZ.center.crop[1] : 0}" width="${MZ ? MZ.center.crop[2] : 0}" height="${MZ ? MZ.center.crop[3] : 0}"><rect x="${MZ ? MZ.center.crop[0] + 18 : 0}" y="${MZ ? MZ.center.crop[1] + 18 : 0}" width="${MZ ? MZ.center.crop[2] - 36 : 0}" height="${MZ ? MZ.center.crop[3] - 36 : 0}" rx="60" fill="#fff" filter="url(#wfb)"/></mask></defs>${MZ ? `<rect width="${wo.w}" height="${wo.h}" fill="${MZ.ground}"/><image href="${wo.bg}" width="${wo.w}" height="${wo.h}" opacity=".9"/>` : `<image href="${wo.bg}" width="${wo.w}" height="${wo.h}"/>`}${built}${Object.entries(wo.districts).filter(([k]) => acc[k] !== "hidden").map(([k, z]) => `<g class="wwd${k === did ? " on" : ""}${acc[k] === "locked" ? " soon" : ""}" data-d="${k}" transform="translate(${z.at[0]} ${z.at[1]})"><rect x="${-z.label.length * 9 - 30}" y="-30" width="${z.label.length * 18 + 60}" height="60" rx="30"/><text text-anchor="middle" y="11">${acc[k] === "locked" ? "🔒 " : ""}${esc(z.label)}</text></g>`).join("")}</svg><button type="button" class="wworld-back">◀ Моят квартал</button>`;
          document.body.appendChild(ov); const sv = ov.querySelector("svg"), full = [0, 0, wo.w, wo.h];
          const rect = d => { if (MZ && MZ.cells[d]) { const g = ov.querySelector(`.wmz[data-d="${d}"]`), zs = [].map.call(ov.querySelectorAll(`.wmz[data-d="${d}"]`), x => +x.dataset.z), zn = d === did && streetOf[d] ? streetOf[d].street : 0, c = cellOf(d, zs.includes(zn) ? zn : 0); return [c[0] * cw, c[1] * ch, cw, ch]; }
            const z = wo.districts[d], m = z && z.map, B2 = m && bdist(d); return m ? [m[0], m[1], B2.w * m[2], B2.h * m[2]] : [z.at[0] - 300, z.at[1] - 200, 600, 400]; };
          const zoom = (from, to, done) => { const t0 = performance.now(), e = u => u < .5 ? 2 * u * u : -1 + (4 - 2 * u) * u; let fin = false;
            const end = () => { if (fin) return; fin = true; sv.setAttribute("viewBox", to.join(" ")); if (done) done(); };
            const st = now => { const u = Math.min(1, (now - t0) / 700), k = e(u); sv.setAttribute("viewBox", from.map((f, i) => (f + (to[i] - f) * k).toFixed(1)).join(" ")); if (u < 1 && !fin) requestAnimationFrame(st); else end(); };
            requestAnimationFrame(st); setTimeout(end, 760); };
          zoom(rect(did), full);
          const back = d => zoom(full, rect(d), () => { ov.remove(); CAM = "far"; window.WORLD_DISTRICT = d; render(box, d); });
          ov.querySelector(".wworld-back").addEventListener("click", () => back(did));
          ov.querySelectorAll(".wwd:not(.soon)").forEach(g => g.addEventListener("click", () => back(g.dataset.d)));
          ov.querySelectorAll(".wmz:not(.off)").forEach(g => g.addEventListener("click", () => { const d = g.dataset.d, c = cellOf(d, +g.dataset.z); ZONE_PICK = { d, z: +g.dataset.z };
            zoom(full, [c[0] * cw, c[1] * ch, cw, ch], () => { ov.remove(); CAM = "far"; window.WORLD_DISTRICT = d; render(box, d); }); })); }); } }
    { const cb = box.querySelector(".wcam:not(.wworld)"); if (cb) cb.addEventListener("click", () => {   // не бутонът „Целият свят“ (същия клас) – при завършен квартал камера няма   // плавно преминаване (0,65 с), както досега
      CAM = cb.dataset.mode === "near" ? "far" : "near"; const svg = box.querySelector(".world-svg"), to = CAM === "near" ? camBox : full, from = svg.getAttribute("viewBox").split(" ").map(Number), t0 = performance.now();
      cb.dataset.mode = CAM; cb.textContent = CAM === "near" ? "🗺️ Виж всичко" : "🔍 Отблизо"; cb.setAttribute("aria-label", CAM === "near" ? "Виж всичко" : "Отблизо"); svg.dataset.cam = CAM;
      const ease = u => u < .5 ? 2 * u * u : -1 + (4 - 2 * u) * u, step = now => { const u = Math.min(1, (now - t0) / 650), k = ease(u); svg.setAttribute("viewBox", from.map((f, i) => (f + (to[i] - f) * k).toFixed(1)).join(" ")); if (u < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step); setTimeout(() => { svg.setAttribute("viewBox", to.join(" ")); if (valleyOn() && BPL.world_overview) render(box, did); }, 700); }); }   // долината: отблизо – отново „Виж целия свят“   // краен кадър и без анимация (фонов раздел, бавен таблет)
    // Елува се връща в ъгъла след краткото посещение на картата
    // героят отива до новия строеж (механиката на досегашната карта): от предишното си място на същата улица, ~1,2 с
    { const k = ws.child + "|" + did, prev = AVPOS[k], w2 = box.querySelector(".wavatar .wwalk");
      if (w2 && prev && prev.street === cur && Math.hypot(prev.x - avX, prev.y - avY) > 10) {   // стъпки по таймер (работи и без кадри на екрана): 24 × 50 мс, плавно в началото и края
        const dx = prev.x - avX, dy = prev.y - avY; let n = 0; const ease = u => u < .5 ? 2 * u * u : -1 + (4 - 2 * u) * u;
        w2.setAttribute("transform", `translate(${dx} ${dy})`); const t = setInterval(() => { n++; const k = 1 - ease(Math.min(1, n / 24)); w2.setAttribute("transform", `translate(${(dx * k).toFixed(1)} ${(dy * k).toFixed(1)})`); if (n >= 24 || !w2.isConnected) clearInterval(t); }, 50); }
      if (cs && av) { AVPOS[k] = { x: avX, y: avY, street: cur }; try { localStorage.setItem(AVPK, JSON.stringify(AVPOS)); } catch (e) {} } }
    // долината: при току-що завършено занятие изборът на украса се появява сам – след кратката анимация на строежа
    { const auto = valleyOn() && items.map(o => o.x).find(x => x.canChoose && (seenNew[x.rule.lesson] || x.rule.lesson === focusLesson));
      if (auto) setTimeout(() => { if (box.isConnected && !box.closest("[hidden]") && !document.querySelector(".world-choice:not(.avatar-pick)")) openChoice(auto, box, did); }, 1800); }
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
      else if (x.st === "next" && contHW(x.rule.lesson)) contPanel(box, g, contHW(x.rule.lesson));   // домашно: малък панел „Продължи строежа“
      else if (window.HOME2 && window.HOME2.older && window.HOME2.older(x.rule.lesson)) contPanel(box, g, window.HOME2.older(x.rule.lesson));   // по-старо незавършено домашно: „Доиграй“ (по желание)
      else if (x.st === "next") {   // текущ строеж: Елува подсказва какво следва (връзка към следващия кръг – D3)
        g.classList.add("hinted"); hint("Тук строим. Изиграй следващия кръг от домашната и сградата ще порасне.");
      }
    }));
    contBtn(box);
    const w = document.getElementById("world-status");
    if (w) w.textContent = ws.demo ? "Демо – данните са само на този таблет" : ws.queued ? "Изпраща се…" : S.some(x => x.st === "reconcile") ? "Нужна е проверка от учителя" : S.some(x => x.st === "review") ? "Има награда за преглед" : S.some(x => x.st === "pending") ? "Чака потвърждение" : "";
  }
  // „Целият квартал“ (26.10): целият квартал се вижда на всеки екран (meet); празните ивици – огледално продължение на същия терен, леко размито
  function mirrorExt(B) {
    const w = B.w, h = B.h, t = [];
    for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) { if (!dx && !dy) continue;
      t.push(`<image href="${B.bg}" width="${w}" height="${h}" transform="translate(${dx === 1 ? 2 * w : 0} ${dy === 1 ? 2 * h : 0}) scale(${dx ? -1 : 1} ${dy ? -1 : 1})"/>`); }
    return `<defs><filter id="wextf" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/><feColorMatrix type="saturate" values=".7"/></filter></defs><g class="wext" filter="url(#wextf)" opacity=".92" aria-hidden="true">${t.join("")}</g>`;
  }
  // „Продължи строежа“ (25.10): само при незавършено домашно – малко хапче до строежа от домашното (в близкия и в далечния изглед);
  // докосване на самата сграда – малък панел (занятие, кръгове, бутон). Големият оранжев „Продължи“ остава на началния екран.
  const MODN = { BK: "Букварика", CH: "Читарика", MW: "Математика" };
  function contHW(lesson) {
    const H = window.HOME2 && window.HOME2.on && window.HOME2.on() && window.HOME2.current && window.HOME2.current();
    return H && H.kind === "open" && H.st.next >= 0 && (!lesson || H.h.lesson === lesson) ? H : null;
  }
  function contBtn(box) {
    box.querySelectorAll(".wcont, .wcont-panel").forEach(e => e.remove());
    const H = contHW(); if (!H) return;
    const g = box.querySelector(`.wplot[data-lesson="${H.h.lesson}"]`); if (!g) return;   // строежът не е в този квартал/зона
    const b = document.createElement("button"); b.type = "button"; b.className = "wcont"; b.setAttribute("aria-label", "Продължи строежа");
    b.innerHTML = `<span class="wcont-pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg></span>Продължи строежа`;
    b.addEventListener("click", e => { e.stopPropagation(); window.HOME2.go(); });
    box.appendChild(b);
    // мястото следва сградата и при движение на камерата (близо ↔ отдалеч)
    const place = () => {
      if (!b.isConnected || !g.isConnected) return;
      const r = (g.querySelector(".wsprite") || g).getBoundingClientRect(), bb = box.getBoundingClientRect(), base = g.getBoundingClientRect();
      const w = b.offsetWidth, h = b.offsetHeight; let top = base.bottom - bb.top + 6;
      if (top + h > bb.height - 96) top = r.top - bb.top - h - 6;   // долу са „Назад“ и надписът – тогава над сградата
      b.style.left = Math.max(8, Math.min(bb.width - w - 8, (r.left + r.right) / 2 - bb.left - w / 2)) + "px"; b.style.top = Math.max(8, top) + "px";
      requestAnimationFrame(place);
    };
    if (getComputedStyle(box).position === "static") box.style.position = "relative";
    place(); setTimeout(place, 50);   // веднага (не само в следващия кадър)
  }
  function contPanel(box, g, H) {
    box.querySelectorAll(".wcont-panel").forEach(e => e.remove());
    const n = parseInt(H.h.lesson.slice(2), 10), all = H.st.rounds.length, done = H.st.rounds.filter(r => r.done).length;
    const p = document.createElement("div"); p.className = "wcont-panel"; p.setAttribute("role", "dialog");
    p.innerHTML = `<b>${MODN[H.h.lesson.slice(0, 2)] || ""} · Занятие ${n}</b><span class="wcp-sub">Завършени ${done} от ${all} кръга</span>
      <div class="wcp-bar">${H.st.rounds.map(r => `<i class="${r.done ? "on" : ""}"></i>`).join("")}</div><button type="button" class="wcp-go">${H.older ? "Доиграй →" : "Продължи строежа →"}</button>`;
    p.querySelector(".wcp-go").addEventListener("click", e => { e.stopPropagation(); if (H.older) window.HOME2.goOlder(H.h.lesson); else window.HOME2.go(); });
    box.appendChild(p);
    const r = g.getBoundingClientRect(), bb = box.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight;
    let left = r.right - bb.left + 12; if (left + w > bb.width - 8) left = r.left - bb.left - w - 12;
    p.style.left = Math.max(8, left) + "px"; p.style.top = Math.max(8, Math.min(bb.height - h - 8, (r.top + r.bottom) / 2 - bb.top - h / 2)) + "px";
    setTimeout(() => document.addEventListener("click", function off(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener("click", off, true); } }, true), 0);
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
      out[d] = REVIEW ? "open" : a;
    });
    return out;
  }
  let current = null, ZONE_PICK = null;
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
    if (!bpOn() || !BPL || !L || !ws || !ws.confirmed) return null;   // без дете на таблета (няма пилотен код/демо) – няма напредък
    const did = Object.keys(L.districts || {}).find(d => { const D = L.districts[d]; return D.plots[lesson] || (D.final && D.final.lesson === lesson); }); if (!did || !BPL.districts[did]) return null;
    const B = bdist(did), D = district(did), finalL = D.final && D.final.lesson, S = states(ws, did), x = S.find(y => y.rule.lesson === lesson); if (!x) return null;
    const regular = S.filter(y => y.rule.lesson !== finalL), final = lesson === finalL;
    const split = Array.isArray(B.streets) && B.streets.reduce((a, b) => a + b, 0) === regular.length ? B.streets : Array.from({ length: Math.max(1, Math.ceil(regular.length / B.street)) }, (_, j) => Math.min(B.street, regular.length - j * B.street));
    const pos = []; split.forEach((n, j) => { for (let q = 0; q < n; q++) pos.push([j, q]); });
    const lit = x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile", stage = lit ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size);
    const type = final ? B.final_type : B.plot_types ? B.plot_types[regular.indexOf(x)] : B.types[pos[regular.indexOf(x)][1] % B.types.length];
    return { did, stage, choose: !!x.canChoose, src: (n => `${SPR}${type}_${n}.webp`), title: D.title };
  }
  // умален изглед „Какво построих“ (плочката в „Моят свят“): улицата на текущия строеж – готовите сгради, строежът и героят; без анимации и без отбелязване „видяно“
  // layer = true: само сградите на детето (за общия изглед на света) – без фон, без празни площадки, без бъдещата цел
  function preview(ws, did, layer, focus, noHero, zone) {   // zone: точно тази зона (мозайката на общия свят); героят – само в зоната на текущия строеж   // noHero: в общия свят героят е само в квартала, от който детето е влязло
    if (!bpOn() || !BPL || !BPL.districts[did] || !ws || !ws.confirmed) return "";
    let B = bdist(did); const D = district(did), finalL = D.final && D.final.lesson, S = states(ws, did), regular = S.filter(x => x.rule.lesson !== finalL);
    const split = Array.isArray(B.streets) && B.streets.reduce((a, b) => a + b, 0) === regular.length ? B.streets : Array.from({ length: Math.max(1, Math.ceil(regular.length / B.street)) }, (_, j) => Math.min(B.street, regular.length - j * B.street));
    const pos = []; split.forEach((n, j) => { for (let q = 0; q < n; q++) pos.push([j, q]); });
    const slotOf = (j, q) => { const mm = (B.street_slots || {})[split[j]]; return B.slots[mm ? mm[q] : q]; };
    const fl = focus && S.find(x => x.rule.lesson === focus.lesson), nx = fl || S.find(x => x.st === "next"), natural = nx && nx.rule.lesson !== finalL ? pos[regular.indexOf(nx)][0] : split.length - 1;   // моментът на строежа – зоната на сградата от кръга
    const cur = zone != null ? Math.min(zone, split.length - 1) : natural; if (zone != null && zone !== natural) noHero = true;
    const zoned = !!B.areas; if (zoned) B = Object.assign({}, B, B.areas[cur] || B.areas[B.areas.length - 1]);
    const lit = x => x.st === "confirmed" || x.st === "pending" || x.st === "review" || x.st === "reconcile";
    let out = "", hero = "";
    S.filter(x => x.rule.lesson === finalL ? (!zoned || cur === split.length - 1) : pos[regular.indexOf(x)][0] === cur).map(x => {
      const final = x.rule.lesson === finalL, sp0 = final ? null : pos[regular.indexOf(x)], slot = final ? B.final : slotOf(sp0[0], sp0[1]);
      const stage = lit(x) ? 4 : Math.min(3, new Set(x.rounds.filter(r => x.need.includes(r))).size), type = final ? B.final_type : B.plot_types ? B.plot_types[regular.indexOf(x)] : B.types[sp0[1] % B.types.length];
      const flip = !final && Math.floor(sp0[1] / B.types.length) % 2 === 1, sz = final ? B.final_size : Math.round(B.size * (slot[2] || 1));
      return { x, slot, stage, type, flip, sz, final };
    }).sort((a, b) => a.slot[1] - b.slot[1]).forEach(o => {
      const [px, py] = o.slot, goal = o.final && o.stage === 0, shown = goal ? 4 : o.stage;
      const atF = focus && o.x.rule.lesson === focus.lesson;   // моментът на строежа: героят – до сградата от кръга (и когато тя вече е завършена)
      if (focus ? atF : o.x.st === "next") { if (!focus) out += `<ellipse cx="${px}" cy="${py}" rx="${o.sz * 0.52}" ry="${o.sz * 0.37}" fill="none" stroke="#F2B705" stroke-width="10"/>`;
        const av = avatarOf(ws.child), fh = o.sz * 0.88 * 0.7; if (av) hero = `<g transform="translate(${px + (o.slot[3] === -1 ? -1 : 1) * (o.sz * 0.56 + fh * 0.21)} ${py + o.sz * 0.3})">${figSVG(av, accOf(ws.child), -fh * 0.3, -fh, fh * 0.6, fh)}</g>`; }
      if (layer && o.stage === 0) return;
      if (o.stage === 0 && !o.final) { if (focus) return; out += `<ellipse cx="${px}" cy="${py}" rx="${o.sz * 0.5}" ry="${o.sz * 0.36}" fill="rgba(90,70,30,.12)"/>`; return; }
      const sp = BPL.sprites[`${o.type}_${shown}`] || [1, 1], ref = BPL.sprites[`${o.type}_4`] || sp, k = o.sz / ref[0], w = sp[0] * k, h = sp[1] * k, top = -h + o.sz * (B.anchor || 0.32);
      const fx = focus && o.x.rule.lesson === focus.lesson, pv = fx ? Math.max(0, Math.min(shown, focus.prev)) : null;
      const prevImg = fx && pv !== shown ? (() => { const sp2 = BPL.sprites[`${o.type}_${pv}`] || sp, w2 = sp2[0] * k, h2 = sp2[1] * k; return `<image class="fprev" href="${SPR}${o.type}_${pv}.webp" x="${-w2 / 2}" y="${-h2 + o.sz * (B.anchor || 0.32)}" width="${w2}" height="${h2}"${o.flip ? ' transform="scale(-1 1)"' : ""}/>`; })() : "";
      // завършване на сградата (експерт 25.10): различно от „построих още малко“ – покривът пада на място, прозорците светват, героят подскача (~3,5 с; докосване – пропуска)
      const fin = fx && shown === 4 && pv < 4;
      if (fin) focus.done = true;
      out += `<g class="wpv${fx ? " ffocus" : ""}${fin ? " fdone" : ""}" data-lesson="${o.x.rule.lesson}" data-stage="${shown}" data-type="${o.type}" transform="translate(${px} ${py})"${goal ? ' opacity=".35"' : ""}>${fx ? `<ellipse class="fring" rx="${o.sz * 0.55}" ry="${o.sz * 0.34}"/>` : ""}<image class="${fx && pv !== shown ? "fnew" : ""}" href="${SPR}${o.type}_${shown}.webp" x="${-w / 2}" y="${top}" width="${w}" height="${h}"${o.flip ? ' transform="scale(-1 1)"' : ""}/>${fin ? `<image class="fwin" href="${SPR}${o.type}_${shown}.webp" x="${-w / 2}" y="${top}" width="${w}" height="${h}" filter="url(#fwinf)"${o.flip ? ' transform="scale(-1 1)"' : ""}/>` : ""}${prevImg}${fx ? `<g class="fspark">${(fin ? [[-.3, -.9], [.25, -1.05], [.42, -.55], [-.45, -.45], [0, -1.2], [-.15, -.7], [.5, -.85], [-.55, -.75]] : [[-.3, -.9], [.25, -1.05], [.42, -.55], [-.45, -.45]]).map(([a, b], j) => `<circle cx="${a * o.sz}" cy="${b * o.sz}" r="${o.sz * 0.035}" style="animation-delay:${1.1 + j * .12}s"/>`).join("")}</g>` : ""}</g>`;
      if (fx) focus.at = [px, py, o.sz];
    });
    if (noHero) hero = "";
    if (layer === "mosaic") return `<image href="${B.bg}" width="${B.w}" height="${B.h}" mask="url(#wfz)"/>` + out + hero;
    if (layer === "patch") return `<image href="${B.bg}" width="${B.w}" height="${B.h}" mask="url(#wpatch)"/>` + out + hero;
    if (layer) return out + hero;
    if (focus && focus.at) { const [fx0, fy0, fz] = focus.at, vw = Math.min(B.w, fz * 4.2), vh = vw / 1.87, vx = Math.max(0, Math.min(B.w - vw, fx0 - vw * 0.45)), vy = Math.max(0, Math.min(B.h - vh, fy0 - vh * 0.62));   // кадърът – винаги в квартала
      const winf = focus.done ? `<defs><filter id="fwinf" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .86  0 0 0 0 .45  6 9 -15 0 -7.8" result="w"/><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="w"/></feMerge></filter></defs>` : "";
      return `<svg class="wfocus-svg${focus.done ? " fdone-svg" : ""}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${winf}<image href="${B.bg}" width="${B.w}" height="${B.h}"/>${out}<g class="fhero">${hero}</g></svg>`; }
    return `<svg viewBox="0 0 ${B.w} ${B.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${B.bg}" width="${B.w}" height="${B.h}"/>${out}${hero}</svg>`;
  }
  window.WORLD = { render, ready, attention, plotOf, preview, focusView: (ws, lesson, prev) => { const did = Object.keys((L && L.districts) || {}).find(d => { const D = L.districts[d]; return D.plots[lesson] || (D.final && D.final.lesson === lesson); }); return did && bpOn() && BPL.districts[did] ? preview(ws, did, false, { lesson, prev }) : ""; }, fig: figHTML, hero: child => ({ av: avatarOf(child), acc: accOf(child) }), pickHero: (cb, first) => openAvatarPick(cb, null, !!first), bplus: () => bpOn() ? BPL : null, access: ws => access(ws), states: (ws, did) => states(ws, did), districtOf: l => Object.keys((L && L.districts) || {}).find(d => { const D = L.districts[d]; return D.plots[l] || (D.final && D.final.lesson === l); }) || null };
})();
