/* Учебни карти V1.2 (стил B+) в реалното приложение – тестов режим зад ?maps=v12 (maps=v1 връща досегашните карти; помни се на устройството).
   Начало (острови по учебната програма) + четири карти: Букварика (градина), Читарика (книга), Математика | Околен свят (един модул, два раздела).
   Игрите, имената, групите и стартирането са същите като в досегашните карти (app.js: selectGame → настройки → игра).
   Състояния (стандарт V1.2): играна преди – малка ✓; препоръчана сега – златиста рамка (следващият кръг от домашната в този модул);
   недостъпна – по стандарта за свободна игра (config/free-play-access.json): вид A – от занятието, в което е въведена; вид B – до решение на методиста.
   Надписи: еднаква ширина в картата, цели думи, до 2 реда, 20/18 px (по-кратки имена – само с names=short, предложение за методиста). */
(function () {
  const Q = location.search + location.hash, m = Q.match(/[?&#~]maps[=_](v12|v1)/);
  try { if (m) localStorage.setItem("platforma.maps", m[1]); } catch (e) {}
  let mode = m ? m[1] : null; try { mode = mode || localStorage.getItem("platforma.maps"); } catch (e) {}
  const ON = mode === "v12", SHORTN = /[?&#~]names[=_]short/.test(Q);
  const D3 = "assets/img/world/d3/", IC = "assets/img/world/icons/app/", BP = "assets/img/world/bplus/";
  const BUK = [["alphabet", "Азбука", "zone_alphabet"], ["letterOfElements", "Елементи на букви", "zone_elements"], ["phonemicHearing", "Фонематичен слух", "zone_hearing"], ["phonetics", "Фонетика", "zone_phonetics"], ["soundLetterParsing", "Звуково-буквен анализ", "zone_parsing"], ["readca", "Читалка", "zone_reading"]];
  const READ = [["Думи", [["constructor", "Конструктор", "rz_constructor"], ["accents", "Ударения", "rz_accents"], ["guessWord", "Познай думата", "rz_guess"], ["trueWords", "Правилни думи", "rz_true"], ["words", "Думи", "rz_words"], ["sayDifferently", "Кажи друго", "rz_say"]]],
    ["Изречения", [["order", "Словоред", "rz_order"], ["buildSentence", "Построй изречение", "rz_build"], ["conformity", "Съответствие", "rz_conformity"], ["intonation", "Интонация и знак", "rz_intonation"], ["conventions", "Направи изречението ясно", "rz_conventions"], ["editSentence", "Редактирай изречението", "rz_edit"]]],
    ["Текстове", [["wordContext", "Думата в контекст", "rz_context"], ["readcaR", "Читалка", "rz_readcar"], ["sequence", "Подреди по ред", "rz_sequence"], ["text", "Текст", "rz_text"], ["story", "История", "rz_story"]]]];
  const MATH = [["Числа и брой", [["brightNumbers", "Ярки числа", "mz_bright"], ["subitize", "Колко са?", "mz_subitize"], ["order", "Последователност", "mz_order"], ["numberLine", "Числова права", "mz_numberline"], ["numberComposition", "Състав на числата", "mz_compose"], ["cobweb", "Улов", "mz_cobweb"]]],
    ["Смятам и сравнявам", [["brainCrush", "Главоблъсканица", "mz_crush"], ["brainstorm", "Мозъчна атака", "mz_storm"], ["underwaterKingdom", "Подводно царство", "mz_underwater"], ["intellectScales", "Умни везни", "mz_scales"], ["piratesTreasures", "Пиратско съкровище", "mz_treasure"], ["secretCards", "Тайни карти", "mz_cards"]]],
    ["Логика и пространство", [["patterns", "Какво следва?", "mz_patterns"], ["pirateCipher", "Пиратски шифър", "mz_cipher"], ["shadowMap", "Карта на диаманти", "mz_shadow"], ["lines", "Линии и измерване", "mz_lines"], ["shapes", "Фигури", "mz_shapes"], ["gridDictation", "Графична диктовка", "mz_grid"]]]];
  const WORLD = [["Аз и светът около мен", [["professions", "Професии", "wz_professions"], ["soonToSchool", "На училище", "wz_school"], ["cleanShipRoom", "Чиста каюта", "wz_room"], ["masksShow", "Шоу с маски", "wz_senses"]]],
    ["Природа и време", [["forestKingdom", "Горско царство", "wz_forest"], ["timeGuardian", "Страж на времето", "wz_clock"]]],
    ["Наблюдавам и запомням", [["outwardThings", "Обкръжалка", "wz_outward"], ["safari", "Сафари", "wz_safari"], ["hideAndSeek", "Криеница", "wz_hide"], ["memoryStick", "Запоминалка", "wz_memory"]]]];
  const SHORT = { "Направи изречението ясно": "Ясно изречение", "Последователност": "Числа по ред", "Главоблъсканица": "Сметни", "Запоминалка": "Запомни", "Редактирай изречението": "Поправи изречението" };
  const HWGAME = { reading: { order: "wordOrder" } };   // игра на картата → игра в домашните (където се различават)
  const PRE = { letters: "BK", reading: "CH", math: "MW", world: "MW" };
  let ACC = { games: {} }, HM = null;
  const ready = Promise.all([fetch("config/free-play-access.json?v=1").then(r => r.json()).then(d => { ACC = d; }).catch(() => {}),
    fetch("config/homework-map.json").then(r => r.json()).then(d => { HM = d; }).catch(() => {}),
    window.WORLD && window.WORLD.ready ? window.WORLD.ready : Promise.resolve()]);
  let READY = false; ready.then(() => { READY = true; });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ws = () => (window.PILOT_SYNC && window.PILOT_SYNC.worldState()) || { rounds: {}, program: "full", readingEntry: "standard" };

  // ---- състояния ----
  const REACH = {}; ((Q.match(/[?&#~]m12reach[=_]([A-Z0-9,]+)/) || [])[1] || "").split(",").forEach(x => { const mm = x.match(/^([A-Z]+)(\d+)$/); if (mm) REACH[mm[1]] = +mm[2]; });
  function reached(pre) {   // докъде е стигнало детето в модула: занятие с поне един започнат кръг (поне 1)
    let n = REACH[pre] || 1; Object.keys(ws().rounds || {}).forEach(l => { const mm = l.match(/^([A-Z]+)(\d+)$/); if (mm && mm[1] === pre && (ws().rounds[l] || []).length) n = Math.max(n, +mm[2]); }); return n;
  }
  function recommended(mod) {   // следващият неизигран кръг от домашната в модула → играта му
    if (!HM) return null; const pre = PRE[mod], r = ws().rounds || {};
    for (const l of HM.lessons.filter(x => x.id.startsWith(pre))) {
      for (const rd of l.rounds) { if (!(r[l.id] || []).map(Number).includes(rd.round)) { const g = (rd.assignments[0] || {}).game; return g || null; } }
    }
    return null;
  }
  function stateOf(mod, id, played, rec) {
    const a = ACC.games[mod + ":" + id];
    if (a) { if (a.category !== "A") return "lock"; const mm = (a.introduced_in || "").match(/^([A-Z]+)(\d+)/); if (mm && +mm[2] > reached(mm[1])) return "lock"; }
    const hw = (HWGAME[mod] || {})[id] || id;
    if (rec && rec === hw) return "rec";
    return played.has(id) ? "played" : "open";
  }

  // ---- станция (стандарт V1.2) ----
  let K = 1, MAPW = 160;
  const CW = 0.6;
  function wordsWrap(t, ch) { const w = t.split(" "); let a = "", out = []; w.forEach(x => { if (a && (a + " " + x).length > ch) { out.push(a); a = x; } else a = a ? a + " " + x : x; }); out.push(a); return out; }
  function lines(t) { for (const px of [20, 18]) { const ch = Math.floor((MAPW - 18) / (px * CW)), L = wordsWrap(t, ch); if (L.length <= 2 && L.every(l => l.length <= ch)) return [L, px]; }
    const w = t.split(" "), lg = Math.max(...w.map(x => x.length)); let L = wordsWrap(t, Math.max(lg, Math.ceil(t.length / 2))); if (L.length > 2) L = [L.slice(0, -1).join(" "), L[L.length - 1]];
    return [L, Math.max(14, Math.min(18, (MAPW - 16) / (Math.max(...L.map(l => l.length)) * CW)))]; }
  function station(g, x, y, size, st) {
    const name = SHORTN ? (SHORT[g[1]] || g[1]) : g[1], [L, px] = lines(name), fs = px / K, w = MAPW / K, h = (2 * 20 * 1.15 + 20 * 0.5) / K, off = (2 - L.length) * px * 1.15 / 2 / K, py = size * 0.3;
    const rec = st === "rec" ? `<rect class="m12-glow" x="${-Math.max(size * 1.02, w + 14 / K) / 2}" y="${-size * 0.74}" width="${Math.max(size * 1.02, w + 14 / K)}" height="${py + h - (-size * 0.74) + 10 / K}" rx="${22 / K}" stroke-width="${5 / K}"/>` : "";
    const mark = st === "played" ? `<g transform="translate(${size * 0.4} ${size * 0.15})"><circle r="${12 / K}" fill="#2E9E5B" stroke="#fff" stroke-width="${2.5 / K}"/><path d="M${-5 / K} 0 l${3.5 / K} ${3.5 / K} l${6.5 / K} ${-7 / K}" fill="none" stroke="#fff" stroke-width="${2.6 / K}" stroke-linecap="round" stroke-linejoin="round"/></g>`
      : st === "lock" ? `<g transform="translate(${size * 0.4} ${size * 0.15})"><circle r="${17 / K}" fill="#FFF8EC" stroke="#8E8576" stroke-width="${2.5 / K}"/><text text-anchor="middle" y="${6 / K}" font-size="${17 / K}">🔒</text></g>` : "";
    return `<g class="m12-st m12-${st}" data-game="${g[0]}" data-state="${st}" transform="translate(${x} ${y})" ${st === "lock" ? 'aria-disabled="true"' : 'role="button" tabindex="0"'} aria-label="${esc(name)}">${rec}
      <g class="m12-lift"><image class="m12-art" href="${IC}${g[2]}.webp" x="${-size / 2}" y="${-size * 0.72}" width="${size}" height="${size}"/>${mark}</g>
      <g transform="translate(0 ${py})"><rect x="${-w / 2}" y="0" width="${w}" height="${h}" rx="${10 / K}" fill="#FFF8EC" stroke="${st === "lock" ? "#C9BEAC" : "#2A9D8F"}" stroke-width="${2.5 / K}"/>${L.map((l, i) => `<text text-anchor="middle" y="${off + (px * 0.98 + i * px * 1.15 + 3) / K}" font-size="${fs}" font-weight="800" fill="${st === "lock" ? "#9A8F80" : "#2F2A24"}">${esc(l)}</text>`).join("")}</g></g>`;
  }
  const svg = (vb, inner) => { const v = vb.split(" ").map(Number); K = Math.min(innerWidth / v[2], (innerHeight - 90) / v[3]); return `<svg class="m12-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`; };

  // ---- екран ----
  let box = null;
  function screen() {
    box = document.getElementById("screen-m12");
    if (!box) { box = document.createElement("section"); box.id = "screen-m12"; box.className = "screen screen-m12"; box.hidden = true; document.querySelector(".screen").parentNode.appendChild(box); }
    return box;
  }
  const navBtn = (cls, go, ic, t, extra = "") => `<button type="button" class="m12-nav ${cls}" ${go ? `data-go="${go}"` : ""} ${extra}>${ic ? `<span class="m12-ic">${ic}</span>` : ""}${t}</button>`;
  const HOME_IC = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor"/></svg>';
  const quarter = did => navBtn("", "world", `<img alt="" src="${BP}bg_${did}.webp?v=4">`, "Моят квартал", `data-district="${did}"`);
  const guide = '<img class="m12-eluva" alt="" src="assets/img/mascot/hello.png">';
  function top(center, did) { return `<div class="m12-tl">${navBtn("", "modules", HOME_IC, "Начало")}</div><div class="m12-top">${guide}${center}</div><div class="m12-tr">${quarter(did)}</div>`; }
  function played() { const s = new Set(); try { (JSON.parse(localStorage.getItem("platforma.sessions.v1") || "[]")).forEach(x => { if (!x.early) s.add(x.gameId); }); } catch (e) {} return s; }

  function home() {
    const W = ws(); let acc = { letters: "open", reading: "open", mathworld: "open" }; try { if (window.WORLD && window.WORLD.access) acc = window.WORLD.access(W); } catch (e) {}
    const P = {}; ["letters", "reading", "mathworld"].forEach(k => { if (acc[k] && acc[k] !== "hidden") P[k] = acc[k] === "locked" ? "soon" : "open"; });
    const SZ = { letters: [483, 421], reading: [473, 465], mathworld: [504, 409] }, n = Object.keys(P).length;
    const LAY = n === 3 ? { reading: [400, 0, .98], letters: [0, 175, .98], mathworld: [782, 190, .98] } : n === 2 ? { letters: [70, 120, 1.15], reading: [660, 40, 1.15], mathworld: [660, 40, 1.15] } : { letters: [330, 0, 1.3], reading: [330, 0, 1.3], mathworld: [330, 0, 1.3] };
    const NAME = { letters: "Букварика", reading: "Читарика", mathworld: "Математика и околен свят" }, ICONS = { letters: ["zone_alphabet", "zone_reading"], reading: ["rz_constructor", "rz_story"], mathworld: ["mz_shapes", "wz_forest"] }, GO = { letters: "bmap", reading: "rmap", mathworld: "map" };
    let inner = "";
    ["reading", "letters", "mathworld"].filter(k => P[k]).forEach(k => {
      const [x, y, s] = LAY[k], w = SZ[k][0] * s, h = SZ[k][1] * s, cx = x + w / 2, cy = y + h * 0.52, soon = P[k] === "soon";
      const fs = Math.round(30 * s), L = wordsWrap(NAME[k], 13), pw = Math.max(...L.map(l => l.length)) * fs * 0.6 + 36, ph = L.length * fs * 1.12 + fs * 0.6, py = y + h - ph - 30 * s;
      inner += `<g class="m12-isl${soon ? " soon" : ""}" data-go="${soon ? "" : GO[k]}" data-module="${k}" data-access="${P[k]}" ${soon ? 'aria-disabled="true"' : 'role="button" tabindex="0"'} aria-label="${NAME[k]}">
        <g class="m12-isl-art"><ellipse cx="${cx}" cy="${y + h - 18 * s}" rx="${w * 0.44}" ry="${26 * s}" fill="rgba(60,45,20,.16)"/><image href="${D3}isl_${k}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>
        ${soon ? "" : `<image href="${IC}${ICONS[k][0]}.webp" x="${cx - 150 * s}" y="${cy - 150 * s}" width="${150 * s}" height="${150 * s}"/><image href="${IC}${ICONS[k][1]}.webp" x="${cx}" y="${cy - 150 * s}" width="${150 * s}" height="${150 * s}"/>`}</g>
        <g transform="translate(${cx} ${py})"><rect x="${-pw / 2}" y="0" width="${pw}" height="${ph}" rx="${fs * 0.5}" fill="#FFF8EC" stroke="${soon ? "#B9AE9C" : "#2A9D8F"}" stroke-width="5"/>${L.map((l, i) => `<text text-anchor="middle" y="${fs * 0.98 + i * fs * 1.12}" font-size="${fs}" font-weight="900" fill="${soon ? "#8E8576" : "#2F2A24"}">${esc(l)}</text>`).join("")}</g>
        ${soon ? `<g transform="translate(${cx} ${y + h * 0.32})"><rect x="-150" y="-52" width="300" height="104" rx="22" fill="#FFF8EC" stroke="#D9C6A3" stroke-width="5"/><circle cx="-108" cy="0" r="30" fill="#EFE3CC"/><text x="-108" y="11" text-anchor="middle" font-size="30">🔒</text><text x="22" y="-8" text-anchor="middle" font-size="23" font-weight="900" fill="#6E6458">Ще се отключи</text><text x="22" y="22" text-anchor="middle" font-size="23" font-weight="900" fill="#6E6458">след Букварика</text></g>` : ""}</g>`;
    });
    const first = ["letters", "reading", "mathworld"].find(k => P[k]) || "letters";
    screen().innerHTML = `<div class="m12-top"><div class="m12-title">Подготовка за училище</div></div><div class="m12-tr">${navBtn("adult", "parent", "", "За родители")}</div>
      <div class="m12-map m12-home">${svg("0 0 1280 616", inner)}</div>
      <div class="m12-bl">${navBtn("adult", "", "", "Изход", 'id="m12-exit"')}</div><div class="m12-bc">${guide.replace("m12-eluva", "m12-eluva big")}${navBtn("primary", "", '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg>', "Домашна работа", 'id="m12-hw"')}</div><div class="m12-br">${quarter(first)}</div>`;
    const hw = document.getElementById("m12-hw"); hw.addEventListener("click", () => { const b = document.getElementById("btn-homework"); if (b) b.click(); hw.lastChild.textContent = "Домашна работа: следващ етап"; setTimeout(() => { hw.lastChild.textContent = "Домашна работа"; }, 1800); });
    box.querySelectorAll(".m12-isl.soon").forEach(g => g.addEventListener("click", () => toast("Ще се отключи след Букварика!")));
  }
  function stations(mod, groupsOrList) {
    const pl = played(), rec = recommended(mod);
    return { st: g => stateOf(mod, g[0], pl, rec) };
  }
  function letters() {
    const S = stations("letters"), pos = [[340, 500], [600, 300], [960, 300], [1170, 450], [960, 690], [560, 700]];
    let inner = `<image href="${D3}map_letters.webp?v=2" width="1536" height="1024"/>`;
    const v = svg("90 40 1360 920", ""); MAPW = 190;
    BUK.forEach((g, i) => inner += station(g, pos[i][0], pos[i][1] + 20, 190, S.st(g)));
    screen().innerHTML = top(`<div class="m12-title">Букварika</div>`.replace("Букварika", "Букварика"), "letters") + `<div class="m12-map">${v.replace("</svg>", inner + "</svg>")}</div>`;
  }
  function rows(mod, groups, bands, img, vb, center, did, sz) {
    const S = stations(mod); let inner = `<image href="${D3}${img}" width="1536" height="1024" style="filter:saturate(.72) brightness(1.07)"/>`;
    const v = svg(vb, ""); MAPW = Math.min(...bands.map(([y, a, b]) => (b - a - 180 - sz * 0.62) / 5)) * K - 12;
    groups.forEach(([t, gs], r) => {
      const [y, a, b] = bands[r], x0 = a + 180, step = (b - a - 180 - sz * 0.62) / 5, th = (r === 0 ? bands[1][0] - bands[0][0] : bands[r][0] - bands[r - 1][0]) - 46;
      const one = Math.min(26, (th - 34) / (t.length * 0.62)); let TL = [[t], one];
      if (one * K < 17) { const i = t.indexOf(" ", Math.floor(t.length / 2) - 3), L = [t.slice(0, i), t.slice(i + 1)]; TL = [L, Math.min(26, (th - 34) / (Math.max(...L.map(l => l.length)) * 0.62))]; }
      const col = mod === "reading" ? ["#C99A12", "#1F6F66", "#A3487A"][r] : ["#C99A12", "#1F6F66", "#A3487A"][r];
      inner += `<g transform="translate(${a + 34} ${y})"><rect x="${TL[0].length > 1 ? -44 : -30}" y="${-th / 2}" width="${TL[0].length > 1 ? 88 : 60}" height="${th}" rx="22" fill="${col}"/>${TL[0].map((l, j) => `<text text-anchor="middle" transform="rotate(-90) translate(0 ${TL[1] * 0.36 + (j - (TL[0].length - 1) / 2) * TL[1] * 1.1})" font-size="${TL[1]}" font-weight="900" fill="#fff">${esc(l)}</text>`).join("")}</g>`;
      gs.forEach((g, i) => inner += station(g, x0 + i * step, y - 14, sz, S.st(g)));
    });
    screen().innerHTML = top(center, did) + `<div class="m12-map">${v.replace("</svg>", inner + "</svg>")}</div>`;
  }
  const SEG = on => `<div class="m12-seg"><button type="button" data-go="map" class="${on === "math" ? "on" : ""}">Математика</button><button type="button" data-go="wmap" class="${on === "world" ? "on" : ""}">Околен свят</button></div>`;
  function reading() { rows("reading", READ, [[223, 116, 1420], [470, 100, 1436], [741, 80, 1456]], "map_reading2.webp", "40 60 1456 840", `<div class="m12-title">Читарика</div>`, "reading", 160); }
  function math() { rows("math", MATH, [[214, 94, 1430], [498, 94, 1430], [796, 94, 1430]], "map_math2.webp", "40 20 1456 960", SEG("math"), "mathworld", 180); }
  function world() {
    const S = stations("world"), A = [[[300, 482, 664, 846], 300], [[1080, 1225], 385], [[445, 625, 805, 985], 700]], TP = [[580, 150], [1170, 275], [740, 545]];
    let inner = `<image href="${D3}map_world.webp" width="1536" height="1024"/>`;
    const v = svg("170 60 1300 860", ""); MAPW = 130;
    WORLD.forEach(([t, gs], r) => { const w = t.length * 16 + 48; inner += `<g transform="translate(${TP[r][0]} ${TP[r][1]})"><rect x="${-w / 2}" y="-25" width="${w}" height="50" rx="25" fill="#1F6F66"/><text text-anchor="middle" y="10" font-size="28" font-weight="900" fill="#fff">${esc(t)}</text></g>`;
      gs.forEach((g, i) => inner += station(g, A[r][0][i], A[r][1] + 30, 150, S.st(g))); });
    screen().innerHTML = top(SEG("world"), "mathworld") + `<div class="m12-map">${v.replace("</svg>", inner + "</svg>")}</div>`;
  }
  function toast(t) { const o = document.querySelector(".m12-toast"); if (o) o.remove(); const d = document.createElement("div"); d.className = "m12-toast"; d.innerHTML = `<img alt="" src="assets/img/mascot/hello.png">${esc(t)}`; document.body.appendChild(d);
    try { if (window.VOICE && window.VOICE.speak) window.VOICE.speak([t]); } catch (e) {} setTimeout(() => d.remove(), 2600); }
  function wire() {
    box.querySelectorAll(".m12-st").forEach(g => g.addEventListener("click", () => {
      if (g.dataset.state === "lock") return toast("Скоро ще открием и тази игра!");
      g.classList.add("tap", "pick"); setTimeout(() => { g.classList.remove("tap"); if (window.APP) { window.HW_CTX = null; window.APP.selectGame(g.dataset.game); window.APP.show("settings"); } }, 220);
    }));
    box.querySelectorAll("[data-district]").forEach(b => b.addEventListener("click", () => { window.WORLD_DISTRICT = b.dataset.district; }, true));
  }
  const VIEWS = { modules: home, bmap: letters, rmap: reading, map: math, wmap: world };
  function show(id) {
    screen(); document.querySelectorAll(".screen").forEach(s => s.hidden = s !== box); box.dataset.view = id;
    const draw = () => { VIEWS[id](); wire(); };
    if (!READY) { box.innerHTML = '<p class="m12-wait">Зарежда се…</p>'; ready.then(draw); } else draw();
  }
  window.M12 = { on: () => ON, show, views: Object.keys(VIEWS) };
  if (ON) document.documentElement.classList.add("maps12");
})();
