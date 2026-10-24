/* Обвивка: екрани, карта с острови, настройки по схема, игра, резултат, прогрес. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CHILD = { name: "Мила" };
  const STORE_KEY = "platforma.sessions.v1";
  // визия „един свят“ (макет): ?look=2 включва, ?look=1 връща сегашната; помни се на устройството
  (function () { const m = (location.search + location.hash).match(/look=(\d)/); try { if (m) localStorage.setItem("platforma.look", m[1]); } catch (e) {}
    let v = m ? m[1] : null; try { v = v || localStorage.getItem("platforma.look"); } catch (e) {} if (v === "2") document.documentElement.classList.add("look2"); })();
  const LOOK2 = () => document.documentElement.classList.contains("look2");
  // лабиринтът (Азбука, ниво 4): рисувани храстчета вместо плоските кръгчета
  window.LOOK2_LAB = svg => { if (!LOOK2()) return; svg.querySelectorAll("g.flag[transform]").forEach(g => { const t = g.getAttribute("transform"); g.innerHTML = `<image href="assets/img/art/hub/bush.png" x="-28" y="-36" width="56" height="55"/>`; g.setAttribute("transform", t); }); };
  // „един свят“: буквените духчета (рисувани, топли) вместо плоските чудовища над буквите
  window.MO_ART = () => LOOK2() ? `<img class="mo mo-spr" src="assets/img/art/hub/spr_${1 + Math.floor(Math.random() * 6)}.png" alt="" draggable="false">` : null;
  const HUB_ART = { alphabet: "buk_alphabet", letterOfElements: "buk_elements", phonemicHearing: "buk_hearing", phonetics: "buk_phonetics", soundLetterParsing: "buk_parsing", readca: "buk_reading" };
  const G = window.GAMES || {};
  let current = null;      // текущата игра (описание от регистъра)
  let settings = {};       // настройки на текущата игра
  let game = null;         // инстанция по време на игра

  // Редът и върховете на островите в Математика (12 игри; наличните са в GAMES)
  const MATH_ORDER = [
    ["brightNumbers", "Ярки числа", "crystal"], ["subitize", "Колко са?", "trees"], ["order", "Последователност", "volcano"], ["numberLine", "Числова права", "trees"], ["numberComposition", "Състав на числата", "palm"], ["cobweb", "Улов", "jungle"],
    ["brainCrush", "Главоблъсканица", "waterfall"], ["brainstorm", "Мозъчна атака", "slime"], ["underwaterKingdom", "Подводно царство", "gold"], ["intellectScales", "Умни везни", "pink"], ["piratesTreasures", "Пиратско съкровище", "chest"], ["secretCards", "Тайни карти", "trees"],
    ["patterns", "Какво следва?", "trees"], ["pirateCipher", "Пиратски шифър", "deadtree"], ["shadowMap", "Карта на диаманти", "bluecrystal"], ["lines", "Линии и измерване", "trees"], ["shapes", "Фигури", "trees"], ["gridDictation", "Графична диктовка", "trees"]
  ];
  // три реда по смисъл (методист): всеки със собствена лека пътечка и малко заглавие вляво
  const MATH_GROUPS = [["Числа и брой", 0], ["Смятам и сравнявам", 6], ["Логика и пространство", 12]];
  // Ред на къщичките в Букварика (6 игри)
  const BUK_ORDER = [
    ["alphabet", "Азбука", 1], ["letterOfElements", "Елементи на букви", 2], ["phonemicHearing", "Фонематичен слух", 3],
    ["phonetics", "Фонетика", 4], ["soundLetterParsing", "Звуково-буквен анализ", 5], ["readca", "Читалка", 6]
  ];
  // Планети на Читарика и палатки на Околен свят
  const READ_ORDER = [
    ["constructor", "Конструктор", "#E9573F", "#B23A2A"], ["order", "Словоред", "#F2A65A", "#C77A2C"], ["accents", "Ударения", "#8E5BD9", "#5E3AA6"], ["guessWord", "Познай думата", "#3FBF8F", "#2A8F68"], ["trueWords", "Правилни думи", "#4A6FE0", "#2F4DB0"],
    ["buildSentence", "Построй изречение", "#F26D8F", "#C04468"], ["conformity", "Съответствие", "#5CD0D6", "#2E9AA0"], ["readcaR", "Читалка", "#C9CCD6", "#8E93A3"], ["words", "Думи", "#F2C838", "#C79A12"], ["sayDifferently", "Кажи друго", "#9CB74A", "#6B8F2E"],
    ["sequence", "Подреди по ред", "#4DB6AC", "#2E8178"], ["intonation", "Интонация и знак", "#9AA9F5", "#6676C8"], ["text", "Текст", "#C9A27A", "#8F6A45"], ["story", "История", "#D877B8", "#A3488A"]
  ];
  const WORLD_ORDER = [
    ["professions", "Професии", "#E9573F", "#B23A2A"], ["outwardThings", "Обкръжалка", "#4A6FE0", "#2F4DB0"], ["masksShow", "Шоу с маски", "#8E5BD9", "#5E3AA6"], ["cleanShipRoom", "Чиста каюта", "#3FBF8F", "#2A8F68"], ["forestKingdom", "Горско царство", "#2E8F3B", "#1F6B2A"],
    ["timeGuardian", "Страж на времето", "#F2A65A", "#C77A2C"], ["safari", "Сафари", "#F2C838", "#C79A12"], ["soonToSchool", "На училище", "#F26D8F", "#C04468"], ["hideAndSeek", "Криеница", "#5CD0D6", "#2E9AA0"], ["memoryStick", "Запоминалка", "#9CB74A", "#6B8F2E"]
  ];
  const TOPS = {
    crystal: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#B07AF0"/><polygon points="58,80 68,34 80,80" fill="#8C5BE0"/><polygon points="78,80 92,22 106,80" fill="#B48CF2"/><polygon points="100,82 112,46 122,82" fill="#7A4FD0"/><polygon points="80,80 92,22 96,60" fill="#D7C2FA" opacity=".7"/>`,
    palm: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#E9A34F"/><rect x="76" y="40" width="7" height="44" fill="#8B4A1E"/><g fill="#4FB04A"><ellipse cx="62" cy="40" rx="24" ry="8" transform="rotate(-25 62 40)"/><ellipse cx="98" cy="40" rx="24" ry="8" transform="rotate(25 98 40)"/><ellipse cx="80" cy="32" rx="8" ry="22"/></g><circle cx="56" cy="78" r="7" fill="#F2C14E"/><circle cx="102" cy="76" r="6" fill="#F2C14E"/>`,
    volcano: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#5C4A4A"/><polygon points="44,82 72,30 90,30 118,82" fill="#5C4A4A"/><polygon points="72,30 90,30 84,44 78,44" fill="#FF7A2F"/><path d="M78 44 q-6 20 2 38 M84 44 q10 18 4 38" stroke="#FF7A2F" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="24" r="8" fill="#9A8C8C" opacity=".8"/><circle cx="100" cy="18" r="6" fill="#9A8C8C" opacity=".7"/>`,
    jungle: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#6DB553"/><rect x="60" y="46" width="6" height="36" fill="#8B4A1E"/><rect x="96" y="52" width="6" height="30" fill="#8B4A1E"/><g fill="#2E8F3B"><ellipse cx="63" cy="44" rx="20" ry="8"/><ellipse cx="99" cy="50" rx="18" ry="7"/></g><ellipse cx="80" cy="80" rx="14" ry="5" fill="#4FC3D9"/>`,
    deadtree: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#B08A5A"/><path d="M80 84 v-40 M80 60 l-16 -18 M80 52 l14 -16 M64 42 l-8 -6 M94 36 l8 -8" stroke="#6B3E1E" stroke-width="6" fill="none" stroke-linecap="round"/><polygon points="52,86 58,70 64,86" fill="#8D6A44"/>`,
    waterfall: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#6DB553"/><polygon points="56,82 80,30 104,82" fill="#8FA7B8"/><polygon points="72,48 80,30 88,48" fill="#E8F1F7"/><path d="M92 62 q4 14 0 26" stroke="#8FD3F0" stroke-width="7" fill="none" stroke-linecap="round"/><g fill="#2E8F3B"><polygon points="44,84 52,64 60,84"/><polygon points="102,84 110,66 118,84"/></g>`,
    bluecrystal: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#C8965A"/><polygon points="62,82 74,40 86,82" fill="#5FC8F0"/><polygon points="82,82 96,28 110,82" fill="#8EDBF7"/><polygon points="48,84 56,60 64,84" fill="#5FC8F0"/><polygon points="82,82 96,28 100,60" fill="#DDF3FF" opacity=".7"/>`,
    slime: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#7B6E8C"/><path d="M50 84 q30 -30 60 0 z" fill="#9CE86A"/><path d="M62 74 l-10 -30 l14 22 M98 74 l10 -30 l-14 22 M80 66 l0 -34 l6 30" stroke="#5E5470" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="72" cy="78" r="4" fill="#5FD64A"/><circle cx="90" cy="80" r="3" fill="#5FD64A"/>`,
    gold: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#F2C14E"/><polygon points="52,82 80,30 108,82" fill="#F5CE5C"/><polygon points="80,30 108,82 80,82" fill="#D9A63A"/><rect x="72" y="60" width="16" height="22" fill="#B9860A"/><g fill="#4FB04A"><ellipse cx="60" cy="40" rx="12" ry="5" transform="rotate(-25 60 40)"/></g><rect x="58" y="40" width="4" height="30" fill="#8B4A1E"/>`,
    pink: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#E86AA6"/><polygon points="54,82 70,32 86,82" fill="#F08BBD"/><polygon points="82,82 96,40 110,82" fill="#D94A93"/><polygon points="70,32 86,82 76,70" fill="#FBC4E0" opacity=".8"/><g fill="#F26D8F"><circle cx="112" cy="72" r="6"/><circle cx="50" cy="74" r="5"/></g>`,
    trees: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#6DB553"/><rect x="66" y="52" width="6" height="30" fill="#8B4A1E"/><rect x="92" y="56" width="6" height="26" fill="#8B4A1E"/><circle cx="69" cy="46" r="14" fill="#2E8F3B"/><circle cx="95" cy="52" r="11" fill="#4FB04A"/><rect x="74" y="70" width="18" height="12" fill="#F2C14E"/><rect x="74" y="66" width="18" height="6" fill="#D9A63A"/>`,
    chest: `<ellipse cx="80" cy="82" rx="46" ry="12" fill="#6FB79E"/><rect x="62" y="56" width="36" height="26" rx="4" fill="#8B4A1E"/><rect x="62" y="50" width="36" height="10" rx="5" fill="#A65A26"/><rect x="76" y="58" width="8" height="8" fill="#F2C14E"/><g fill="#F5D76E"><circle cx="70" cy="48" r="4"/><circle cx="84" cy="44" r="4"/><circle cx="92" cy="49" r="3"/></g><g fill="#2E8F3B"><polygon points="46,84 54,62 62,84"/><polygon points="102,84 108,68 116,84"/></g>`
  };
  const islandSvg = top => `<svg class="island-art" viewBox="0 0 160 150" aria-hidden="true"><use href="#isl-base" width="160" height="150"/><g transform="translate(80 84) scale(1.35) translate(-80 -84)">${TOPS[top] || TOPS.palm}</g><path d="M30 80 q10 -6 20 0 q10 -6 20 0 q10 -6 20 0 q10 -6 20 0 q10 -6 20 0" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-linecap="round"/></svg>`;

  // ---------- навигация ----------
  function show(id) {
    // „Моят свят“ (тестов режим ?home=v2, js/home2.js): началото е Моят свят; „learn“ = Учебната карта (островите на картите V1.2)
    // „Моят свят“: плъзгачите (ниво, скорост, брой) са за възрастния – детето отива направо на въвеждането; възрастният ги отваря със задържане (HOME2.adultSettings)
    if (window.HOME2 && window.HOME2.on() && id === "settings" && !window.H2_ADULT_SETTINGS) id = "intro";
    window.H2_ADULT_SETTINGS = false;
    if (window.HOME2 && window.HOME2.on()) { if (id === "modules") { if (game) { game.destroy(); game = null; } window.HOME2.show(); return; } if (id === "learn") id = "m12home"; }
    if (id === "m12home") { if (game) { game.destroy(); game = null; } window.M12.show("modules"); return; }
    // учебни карти V1.2 (тестов режим ?maps=v12): началото и четирите карти идват от js/maps12.js; игрите и останалите екрани – както досега
    if (window.M12 && window.M12.on() && window.M12.views.includes(id)) { if (game) { game.destroy(); game = null; } window.M12.show(id); return; }
    $$(".screen").forEach(s => s.hidden = s.id !== `screen-${id}`);
    window.scrollTo(0, 0);
    if (id === "map") renderMap();
    if (id === "bmap") renderVillage();
    if (id === "world" && window.WORLD) {
      // общ таблет: от картата първо „Кой играе?“ (всяко дете вижда своя квартал); след кръг („Виж квартала“) детето вече е известно
      const focus = window.WORLD_FOCUS; setTimeout(() => { window.WORLD_FOCUS = null; }, 0);
      if (!focus && window.PILOT_SYNC && window.PILOT_SYNC.needsPick()) { $("#world-map").innerHTML = ""; window.PILOT_SYNC.pick(() => window.WORLD.render()); }
      else window.WORLD.render();
    }
    if (id === "rmap") { if (LOOK2() && document.documentElement.classList.contains("hub-c")) renderMeadow("#planets", READ_ORDER2.map(i => READ_ORDER.find(o => o[0] === i) || (G[i] ? [i, G[i].name] : null)).filter(Boolean), READ_ZONES, [2, 22], true, READ_GROUPS);
      else { const bx = $("#planets"); bx.classList.remove("meadow"); bx.style.cssText = ""; renderNodes("#planets", READ_ORDER, "planet", "planet-art", "--p1", "--p2"); } }
    if (id === "wmap") { if (LOOK2() && document.documentElement.classList.contains("hub-c")) renderMeadow("#booths", WORLD_ORDER2.map(i => WORLD_ORDER.find(o => o[0] === i)).filter(Boolean), WORLD_ZONES, [2, 22], true, WORLD_GROUPS, true);
      else { const bx = $("#booths"); bx.classList.remove("meadow"); bx.style.cssText = ""; renderNodes("#booths", WORLD_ORDER, "booth", "booth-art", "--b1", "--b2"); } }
    if (id === "intro") { renderIntro(); if (window.HOME2 && window.HOME2.on()) window.HOME2.decorIntro(); }
    if (id === "settings") renderSettings();
    if (id === "parent") renderParent();
    if (id !== "game" && game) { game.destroy(); game = null; }
  }
  window.APP = { show, selectGame: id => selectGame(id) };
  document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (!b || !b.dataset.go) return; let go = b.dataset.go; if (go === "map" && current && current.module && !b.closest("#screen-m12")) go = ({ bukvarica: "bmap", readica: "rmap", theWorld: "wmap" })[current.module] || "map"; show(go); });

  // ---------- данни ----------
  const sessions = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; } };
  // запис в localStorage без изключение: при пълна памет (общ таблет, месеци история) играта не бива да спира
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  // пилот: ПЪРВО към опашката за базата (js/sync.js) – пълната локална история не бива да спира изпращането (23.10);
  // после локалната история: подробностите (дневник на отговорите) се пазят само за последните 30, при пълна памет – по-къса история
  const saveSession = r => {
    if (window.PILOT_SYNC) { try { window.PILOT_SYNC.enqueue(r); } catch (e) {} }
    const all = sessions(); all.unshift(r);
    const slim = (x, i) => i < 30 ? x : Object.assign({}, x, { log: undefined, events: undefined, adaptLog: undefined });
    for (const n of [200, 80, 30, 10, 1]) if (lsSet(STORE_KEY, JSON.stringify(all.slice(0, n).map(slim)))) return;
  };
  const setKey = id => `platforma.settings.${id}`;
  function loadSettings(def) {
    const base = {}; def.settings.forEach(c => base[c.key] = String(c.def));
    return Object.assign(base, JSON.parse(localStorage.getItem(setKey(def.id)) || "{}"));
  }
  function selectGame(id) {
    current = G[id]; settings = loadSettings(current);
    // „един свят“: модулът на играта (по картата, на която стои) – за фона и рамката в игрите
    { const inn = (o, i) => o.some(x => (Array.isArray(x) ? x[0] : x) === i);
      document.documentElement.dataset.mod = inn(BUK_ORDER, id) ? "buk" : inn(MATH_ORDER, id) ? "math" : (typeof READ_ORDER2 !== "undefined" && READ_ORDER2.includes(id)) || inn(READ_ORDER, id) ? "read" : "world"; }
    // Фонът на настройки/инструкция/игра следва модула: пиратски за Математика, селце за Букварика.
    $$("use.bg-theme").forEach(u => { if (!u.dataset.def) u.dataset.def = u.getAttribute("href"); u.setAttribute("href", ({ bukvarica: u.dataset.buk, readica: u.dataset.read, theWorld: u.dataset.world })[current.module] || u.dataset.def); });
  }

  // ---------- модули ----------
  // „един свят“: началният екран – четири карти с рисуван пейзаж
  if (LOOK2()) {
    { const pb = document.createElement("button"); pb.type = "button"; pb.className = "parent-link"; pb.dataset.go = "parent"; pb.textContent = "За родители"; const fb = $(".screen-modules .foot-bar"); fb.insertBefore(pb, fb.lastElementChild); }
    const box = $(".screen-modules .modules"), card = m => box.querySelector(`[data-module="${m}"]`);
    // Математика и Околен свят – две отделни карти (един модул в програмата, но различни игри)
    const art = { bukvarica: ["Букварика", "card_buk"], readica: ["Читарика", "card_read2"], mathematics: ["Математика", "card_math2"], theWorld: ["Околен свят", "card_world2"] };   // ред: Букварика, Читарика, Математика, Околен свят
    { const h = $(".screen-modules .title-outline"); if (h && !h.querySelector("svg")) { const t = h.textContent;   // заглавието – лека дъга
      h.innerHTML = `<svg class="title-arc" viewBox="0 0 1400 200" role="img" aria-label="${t}"><defs><path id="arcP" d="M40 175 Q700 95 1360 175"/></defs><text><textPath href="#arcP" startOffset="50%" text-anchor="middle">${t}</textPath></text></svg>`; } }
    Object.entries(art).forEach(([m, [n, img]]) => { const c = card(m); c.innerHTML = `<img class="module-art" src="assets/img/art/hub/${img}.jpg" alt="" draggable="false"><span class="module-name">${n}</span>`; box.appendChild(c); });
    // макет за станциите на Букварика: ?hub=c (по подразбиране) – поляна с 6 мини-зони и пътечка; ?hub=a – картинки в мрежа; ?hub=b – предмети на поляна
    const hm = (location.search + location.hash).match(/hub=([abc])/); try { if (hm) localStorage.setItem("platforma.hub", hm[1]); } catch (e) {}
    let hv = hm ? hm[1] : null; try { hv = hv || localStorage.getItem("platforma.hub"); } catch (e) {} document.documentElement.classList.add(hv === "b" ? "hub-b" : hv === "a" ? "hub-a" : "hub-c");
  }
  $$(".module-card").forEach(c => c.addEventListener("click", () => { if (c.dataset.module === "mathematics") show("map"); else if (c.dataset.module === "bukvarica") show("bmap"); else if (c.dataset.module === "readica") show("rmap"); else if (c.dataset.module === "theWorld") show("wmap"); }));
  $("#btn-homework").addEventListener("click", () => { const b = $("#btn-homework"); b.textContent = "Домашна работа: следващ етап"; setTimeout(() => b.textContent = "Домашна работа", 1800); });

  // ---------- карта с острови ----------
  function renderMap() {
    if (LOOK2() && !document.documentElement.classList.contains("hub-a") && !document.documentElement.classList.contains("hub-b")) return renderMeadow("#islands", MATH_ORDER, MATH_ZONES, [2, 22], true, MATH_GROUPS);
    { const bx = $("#islands"); bx.classList.remove("meadow"); bx.style.cssText = ""; }
    const box = $("#islands"); box.innerHTML = "";
    const done = new Set(sessions().filter(s => !s.early).map(s => s.gameId));
    MATH_ORDER.forEach(([id, name, top]) => {
      const b = document.createElement("button");
      b.className = "island" + (done.has(id) ? " done" : ""); b.setAttribute("role", "listitem");
      const available = !!G[id];
      if (!available) b.disabled = true;
      b.innerHTML = `${islandSvg(top)}<span class="done-mark" aria-label="Изиграна"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#fff"/></svg></span><span class="island-label">${name}</span>`;
      if (available) b.addEventListener("click", () => { window.HW_CTX = null; selectGame(id); show("settings"); }); // от картата = свободна игра, не домашна
      box.appendChild(b);
    });
  }

  // ---------- селце на Букварика ----------
  // „един свят“, вариант В (по подразбиране): поляна с 6 мини-зони, свързани с мека пътечка; леко движение; отметки „днес/ново/любима“
  // [картинка, x %, y %, мащаб, жива следа: notes/steam/sparkle/beat]
  // компактна „подкова“ (методист): по-ранните игри вляво, по-сложните вдясно, Читалка – финал долу по средата
  const ZONES = { alphabet: ["zone_alphabet", 29, 66, 1.1, "sparkle"], letterOfElements: ["zone_elements", 29, 29, 1, "sparkle"], phonemicHearing: ["zone_hearing", 51, 20, 1, "notes"],
                  phonetics: ["zone_phonetics", 71, 31, 1, "beat"], soundLetterParsing: ["zone_parsing", 74, 71, 1, "steam"], readca: ["zone_reading", 50, 78, .86, "sparkle"] };
  // Математика – 18 игри в 3 реда по 6 (по групите горе); вляво – табелите на редовете
  const MATH_ZONES = { brightNumbers: ["mz_bright", 20, 20, .95, "sparkle"], subitize: ["mz_subitize", 34, 20, .95, "sparkle"], order: ["mz_order", 48, 20, .95, "sparkle"], numberLine: ["mz_numberline", 62, 20, .95, "sparkle"], numberComposition: ["mz_compose", 76, 20, .95, "sparkle"], cobweb: ["mz_cobweb", 90, 20, .95, "sparkle"], brainCrush: ["mz_crush", 20, 52, .95, "sparkle"], brainstorm: ["mz_storm", 34, 52, .95, "sparkle"], underwaterKingdom: ["mz_underwater", 48, 52, .95, "sparkle"], intellectScales: ["mz_scales", 62, 52, .95, "sparkle"], piratesTreasures: ["mz_treasure", 76, 52, .95, "sparkle"], secretCards: ["mz_cards", 90, 52, .95, "sparkle"], patterns: ["mz_patterns", 20, 84, .95, "sparkle"], pirateCipher: ["mz_cipher", 34, 84, .95, "sparkle"], shadowMap: ["mz_shadow", 48, 84, .95, "sparkle"], lines: ["mz_lines", 62, 84, .95, "sparkle"], shapes: ["mz_shapes", 76, 84, .95, "sparkle"], gridDictation: ["mz_grid", 90, 84, .95, "sparkle"] };
  // Околен свят – „експедиция“: три природни зони като станции в парк (свободна подредба, различни височини), табелка до всяка зона
  const WORLD_GROUPS = [["Аз и светът около мен", 0, [16, 12]], ["Природа и време", 4, [74, 13]], ["Наблюдавам и запомням", 6, [17, 56]]];   // [име, от, позиция на табелката]
  const WORLD_ORDER2 = ["professions", "soonToSchool", "cleanShipRoom", "masksShow", "forestKingdom", "timeGuardian", "outwardThings", "safari", "hideAndSeek", "memoryStick"];
  const WORLD_IMG = { professions: "wz_professions", outwardThings: "wz_outward", soonToSchool: "wz_school", cleanShipRoom: "wz_room", forestKingdom: "wz_forest", timeGuardian: "wz_clock",
                      masksShow: "wz_senses", safari: "wz_safari", hideAndSeek: "wz_hide", memoryStick: "wz_memory" };
  const WORLD_K = { professions: .9, cleanShipRoom: .92 };   // по-тежките картинки – малко по-малки
  const WORLD_POS = { professions: [13, 34], soonToSchool: [27, 27], cleanShipRoom: [41, 35], masksShow: [55, 27],   // горе вляво – 4
                      forestKingdom: [73, 35], timeGuardian: [87, 28],                                          // горе вдясно – 2
                      outwardThings: [25, 72], safari: [41, 67], hideAndSeek: [58, 73], memoryStick: [74, 69] };   // долу – 4   // долу – 4   // долу   // долу
  const WORLD_ZONES = Object.fromEntries(WORLD_ORDER2.map(id => [id, [WORLD_IMG[id], WORLD_POS[id][0], WORLD_POS[id][1], WORLD_K[id] || 1, "sparkle"]]));
  // Читарика – 17 игри в 3 реда (думи, изречения, текстове); трите нови са и за свободна игра
  const READ_GROUPS = [["Думи", 0], ["Изречения", 6], ["Текстове", 12]];
  const READ_ORDER2 = ["constructor", "accents", "guessWord", "trueWords", "words", "sayDifferently", "order", "buildSentence", "conformity", "intonation", "conventions", "editSentence",
                       "wordContext", "readcaR", "sequence", "text", "story"];
  const READ_IMG = { constructor: "rz_constructor", accents: "rz_accents", guessWord: "rz_guess", trueWords: "rz_true", words: "rz_words", sayDifferently: "rz_say", order: "rz_order",
                     buildSentence: "rz_build", conformity: "rz_conformity", intonation: "rz_intonation", conventions: "rz_conventions", editSentence: "rz_edit", wordContext: "rz_context",
                     readcaR: "rz_readcar", sequence: "rz_sequence", text: "rz_text", story: "rz_story" };
  const rowZones = (ids, img, rows) => { const z = {}, ys = [22, 53, 84];
    rows.forEach(([a, b], r) => { const n = b - a, step = 14, x0 = 55 - (n - 1) * step / 2; for (let i = a; i < b; i++) z[ids[i]] = [img[ids[i]], x0 + (i - a) * step, ys[r], 1, "sparkle"]; }); return z; };
  const READ_ZONES = rowZones(READ_ORDER2, READ_IMG, [[0, 6], [6, 12], [12, 17]]);
  const NEW_GAMES = new Set(["subitize", "numberLine", "patterns", "lines", "shapes", "gridDictation", "conventions", "editSentence", "wordContext"]);   // нови от вълна 2
  function renderMeadow(sel = "#houses", order = BUK_ORDER, zonesMap = ZONES, start = [14, 104], small = false, groups = null, organic = false) {
    const ZONES = zonesMap;
    const box = $(sel); box.innerHTML = ""; box.classList.add("meadow"); box.classList.toggle("meadow-small", small);
    box.style.cssText = "position:absolute;top:90px;left:0;right:0;height:calc(100% - 160px);width:100%;align-self:auto;max-width:none;margin:0;padding:0;display:block";
    const all = sessions(), today = new Date().toISOString().slice(0, 10), cnt = {};
    all.forEach(x => { cnt[x.gameId] = (cnt[x.gameId] || 0) + 1; });
    const fav = Object.entries(cnt).filter(([id]) => ZONES[id]).sort((a, b) => b[1] - a[1])[0];
    const pts = order.map(([id]) => ZONES[id]).filter(Boolean);
    const rowPath = ids => { const p = ids.map(id => ZONES[id]).filter(Boolean).map(z => [z[1], z[2] + 8]); return p.map((q, i) => i === 0 ? `M${q[0] - 7} ${q[1]} L${q[0]} ${q[1]}` : organic ? `Q${(p[i - 1][0] + q[0]) / 2} ${(p[i - 1][1] + q[1]) / 2 + 6} ${q[0]} ${q[1]}` : `L${q[0]} ${q[1]}`).join(" ") + ` L${p[p.length - 1][0] + 7} ${p[p.length - 1][1]}`; };
    const d = groups ? groups.map(([, from], gi) => rowPath(order.slice(from, groups[gi + 1] ? groups[gi + 1][1] : order.length).map(o => o[0]))).join(" ") : [start].concat(pts.map(p => [p[1], p[2] + 9])).map((p, i, a) => i === 0 ? `M${p[0]} ${p[1]}` : `Q${(a[i - 1][0] + p[0]) / 2 + (i % 2 ? 6 : -6)} ${(a[i - 1][1] + p[1]) / 2 + (i % 2 ? -6 : 6)} ${p[0]} ${p[1]}`).join(" ");
    // земна пътечка: тъмен ръб + неравна пръст (filter) + камъчета (пунктир)
    box.insertAdjacentHTML("beforeend", `<svg class="meadow-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="dirt" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".35" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs>
      <path class="p-edge" d="${d}" vector-effect="non-scaling-stroke" filter="url(#dirt)"/><path class="p-dirt" d="${d}" vector-effect="non-scaling-stroke" filter="url(#dirt)"/><path class="p-peb" d="${d}" vector-effect="non-scaling-stroke"/></svg>`);
    if (groups) groups.forEach(([t, from, at]) => { let z = ZONES[order[from][0]]; if (z && at) z = [z[0], at[0], at[1] + 13]; if (z) box.insertAdjacentHTML("beforeend", `<span class="row-title${organic ? " row-title-near" : ""}" style="left:${organic ? z[1] : small ? 7 : z[1] - 11}%;top:${organic ? z[2] - 13 : small ? z[2] - 2 : z[2] - 15}%;--x:${z[1]}%;order:${from * 2}">${t}</span>`); });
    order.forEach(([id, name], i) => {
      const z = ZONES[id]; if (!z) return;
      const played = all.some(x => x.gameId === id && String(x.at || "").slice(0, 10) === today), isNew = NEW_GAMES.has(id) && !cnt[id], isFav = fav && fav[0] === id && fav[1] >= 3;
      const b = document.createElement("button"); b.type = "button"; b.className = `zone fx-${z[4]}`; b.style.left = z[1] + "%"; b.style.top = z[2] + "%"; b.style.setProperty("--d", (i * 0.7) + "s"); b.style.setProperty("--k", z[3]); b.style.order = i * 2 + 1;
      if (!G[id]) b.disabled = true;
      b.innerHTML = `<img src="assets/img/art/hub/${z[0]}.png" alt="" draggable="false" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'zone-missing'}))"><span class="zone-label">${name.replace("Звуково-буквен ", "Звуково-буквен<br>")}</span>` +
        (!G[id] ? '<span class="zone-badge lock" aria-label="Скоро">⏳</span>' : isFav ? '<span class="zone-badge fav" aria-label="Любима">♥</span>' : played ? '<span class="zone-badge star" aria-label="Играна днес">★</span>' : isNew ? '<span class="zone-badge new" aria-label="Нова игра">ново</span>' : "") +
        '<span class="zone-fx" aria-hidden="true"><i></i><i></i><i></i></span>';
      if (G[id]) b.addEventListener("click", () => { box.querySelectorAll(".zone.sel").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); window.HW_CTX = null; setTimeout(() => { selectGame(id); show("settings"); }, 180); });
      box.appendChild(b);
    });
  }
  function renderVillage() {
    if (LOOK2() && document.documentElement.classList.contains("hub-c")) return renderMeadow();
    const box = $("#houses"); box.innerHTML = ""; box.classList.remove("meadow"); box.style.cssText = "";
    const done = new Set(sessions().filter(s => !s.early).map(s => s.gameId));
    BUK_ORDER.forEach(([id, name, art]) => {
      const b = document.createElement("button");
      b.className = "house" + (done.has(id) ? " done" : ""); b.setAttribute("role", "listitem");
      const available = !!G[id];
      if (!available) b.disabled = true;
      b.innerHTML = `${LOOK2() && HUB_ART[id] ? `<img class="house-art" src="assets/img/art/hub/${HUB_ART[id]}.png" alt="" draggable="false">` : `<svg class="house-art" viewBox="0 0 200 200" aria-hidden="true"><use href="#house-${art}"/></svg>`}<span class="done-mark" aria-label="Изиграна"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#fff"/></svg></span><span class="house-label">${name}</span>`;
      if (available) b.addEventListener("click", () => { window.HW_CTX = null; selectGame(id); show("settings"); }); // от картата = свободна игра, не домашна
      box.appendChild(b);
    });
  }

  // ---------- планети / палатки (общ рендер на възли на карта) ----------
  function renderNodes(sel, order, cls, artCls, v1, v2) {
    const box = $(sel); box.innerHTML = "";
    const done = new Set(sessions().filter(s => !s.early).map(s => s.gameId));
    order.forEach(([id, name, c1, c2]) => {
      const b = document.createElement("button");
      b.className = `${cls}${done.has(id) ? " done" : ""}`; b.setAttribute("role", "listitem"); b.style.setProperty(v1, c1); b.style.setProperty(v2, c2);
      const available = !!G[id]; if (!available) b.disabled = true;
      b.innerHTML = `<svg class="${artCls}" viewBox="0 0 200 200" aria-hidden="true"><use href="#${cls}"/></svg><span class="done-mark" aria-label="Изиграна"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#fff"/></svg></span><span class="node-label">${name}</span>`;
      if (available) b.addEventListener("click", () => { window.HW_CTX = null; selectGame(id); show("settings"); }); // от картата = свободна игра, не домашна
      box.appendChild(b);
    });
  }

  // ---------- настройки по схема ----------
  const cardsBox = $("#cards"), infoPanel = $("#info-panel");
  // ръчна промяна в настройките = свободна игра: контекстът на домашната (урок, рунд) вече не определя играта
  function renderSettings() {
    $("#settings-title").textContent = current.name;
    cardsBox.innerHTML = ""; cardsBox.classList.toggle("cards-choice", current.settings.some(c => c.type === "choice")); infoPanel.innerHTML = ""; infoPanel.hidden = true;
    current.settings.forEach(c => {
      const v = settings[c.key];
      let el;
      if (c.type === "range") {
        el = document.createElement("label"); el.className = "card";
        el.innerHTML = `<span class="card-title">${c.label}</span><span class="card-value-row"><output class="card-value" id="out-${c.key}">${c.show ? c.show(v) : v}</output>${c.unit ? `<span class="unit">${c.unit}</span>` : ""}</span><input type="range" name="${c.key}" min="${c.min}" max="${c.max}" step="${c.step || 1}" value="${v}" aria-label="${c.label}"><span class="range-ends"><i>${c.show ? c.show(c.min) : c.min}</i><i>${c.show ? c.show(c.max) : c.max}</i></span>`;
        el.querySelector("input").addEventListener("input", e => { window.HW_CTX = null; settings[c.key] = e.target.value; el.querySelector("output").value = c.show ? c.show(e.target.value) : e.target.value; applyEnabled(); });
      } else if (c.type === "select") {
        el = document.createElement("label"); el.className = "card";
        el.innerHTML = `<span class="card-title">${c.label}</span><span class="select-wrap"><select name="${c.key}" aria-label="${c.label}">${c.options.map(o => `<option value="${o}" ${String(o) === String(v) ? "selected" : ""}>${o}</option>`).join("")}</select></span>`;
        el.querySelector("select").addEventListener("change", e => { window.HW_CTX = null; settings[c.key] = e.target.value; });
      } else if (c.type === "cycle") {
        el = document.createElement("div"); el.className = "card";
        const label = () => c.options.find(o => o[0] === settings[c.key])[1];
        el.innerHTML = `<span class="card-title">${c.label}</span><div class="arrows"><button type="button" class="arrow" data-d="-1" aria-label="Предишно"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><output class="arrow-value">${label()}</output><button type="button" class="arrow" data-d="1" aria-label="Следващо"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
        $$(".arrow", el).forEach(a => a.addEventListener("click", () => { window.HW_CTX = null; const i = c.options.findIndex(o => o[0] === settings[c.key]); const n = (i + Number(a.dataset.d) + c.options.length) % c.options.length; settings[c.key] = c.options[n][0]; el.querySelector("output").value = label(); applyEnabled(); }));
      } else if (c.type === "choice") {
        // широка карта: всички възможности се виждат като плочки (за дълги имена); optionOff(стойност, настройки) затъмнява неподходящите
        const off = o => !!(c.optionOff && c.optionOff(o[0], settings));
        if (off(c.options.find(o => o[0] === settings[c.key]) || c.options[0])) settings[c.key] = (c.options.find(o => !off(o)) || c.options[0])[0];
        el = document.createElement("div"); el.className = "card card-choice";
        el.innerHTML = `<span class="card-title">${c.label}</span><div class="choice-grid" role="radiogroup" aria-label="${c.label}" style="--cols:${c.options.length <= 5 ? c.options.length : Math.ceil(c.options.length / 2)}">${c.options.map(o => `<button type="button" class="choice${o[0] === settings[c.key] ? " on" : ""}" role="radio" aria-checked="${o[0] === settings[c.key]}" data-v="${o[0]}" ${off(o) ? "disabled" : ""}><b>${o[1]}</b>${o[2] ? `<small>${o[2]}</small>` : ""}</button>`).join("")}</div>`;
        $$(".choice", el).forEach(b => b.addEventListener("click", () => { window.HW_CTX = null; settings[c.key] = b.dataset.v; renderSettings(); }));
      }
      el.dataset.key = c.key;
      cardsBox.appendChild(el);
      if (c.help) { const p = document.createElement("p"); p.innerHTML = `<b>${c.label}</b> — ${c.help}`; infoPanel.appendChild(p); }
    });
    applyEnabled();
    if (LOOK2() && document.documentElement.classList.contains("hub-c")) kidLayer();
  }
  // „един свят“: два слоя на настройките – за детето (картинка на играта, трудност с листенца, голям „Старт“ в свитъка);
  // останалите настройки са за родителя/учителя зад зъбното колелце
  function hubImg(id) {
    const all = Object.assign({}, ...[ZONES, MATH_ZONES, WORLD_ZONES, READ_ZONES].map(z => Object.fromEntries(Object.entries(z).map(([k, v]) => [k, v[0]]))));
    return all[id] || null;
  }
  // „един свят“ (бележки 19.10): всички настройки остават видими и с имена; отгоре – картинката на играта, отдолу – голям „Старт“ в свитъка;
  // числа с малко възможности (до 6) – като плочки „1 2 3“ вместо плъзгач; към всяко име – малка иконка
  // иконки само където помагат (методист 19.10): ниво и скорост; останалите – само името
  const SET_ICON = k => /^level$|tier|difficulty/i.test(k) ? "⭐" : /speed|tempo|time|sec/i.test(k) ? "🐢" : "";   // само ниво и скорост
  const TIERS = () => ((typeof current.tiers === "function" ? current.tiers(settings) : current.tiers) || [0, 1, 2]).slice(0, 3).map(Number);
  const SET_MAIN = k => /^(level|examples|exampleQty|range|op|count|qty|series|seri|items|n)$/i.test(k);   // основни настройки – по-силен контраст
  // 23.10 (проучване): настройките са за възрастния – отключват се със задържане 1,5 сек.; след това остават отключени до края на сесията
  const ADULT_KEY = "platforma.adult";
  const adultOn = () => { try { return sessionStorage.getItem(ADULT_KEY) === "1"; } catch (e) { return false; } };
  function holdButton(btn, ms, onDone) {
    let t = null; const stop = () => { clearTimeout(t); t = null; btn.classList.remove("holding"); };
    btn.addEventListener("pointerdown", e => { e.preventDefault(); btn.classList.add("holding"); t = setTimeout(() => { stop(); onDone(); }, ms); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener("click", e => e.preventDefault());
  }
  function kidLayer() {
    const form = $("#settings-form"); let kid = $("#kid-layer"); if (kid) kid.remove();
    form.querySelectorAll(".kid-start").forEach(b => b.remove());   // настройките се рисуват наново при всяка промяна – един „Старт“
    form.querySelectorAll(".more-toggle").forEach(b => b.remove());
    const img = hubImg(current.id);
    const card = current.id === "sorting" ? "card_world2" : ({ bukvarica: "card_buk", readica: "card_read2", theWorld: "card_world2", mathematics: "card_math2" })[current.module] || "card_math2";
    kid = document.createElement("div"); kid.id = "kid-layer"; kid.className = "kid-layer";
    kid.innerHTML = img ? `<img class="kid-art" src="assets/img/art/hub/${img}.png" alt="" draggable="false">` : `<img class="kid-art kid-art-card" src="assets/img/art/hub/${card}.jpg" alt="" draggable="false">`;
    form.insertBefore(kid, form.firstChild.nextSibling);
    const shown = current.settings.filter(c => !(c.hiddenIf && c.hiddenIf(settings))).length;
    form.classList.toggle("set-many", shown > 3);   // повече от 3 настройки – картинката става малка, за да се събере всичко
    form.classList.add("set-mode");
    const st = document.createElement("button"); st.type = "button"; st.className = "kid-start"; st.id = "kid-start"; st.textContent = "Старт";
    st.addEventListener("click", () => { lsSet(setKey(current.id), JSON.stringify(settings)); infoPanel.hidden = true; startGame(Number(settings.__tier != null ? settings.__tier : TIERS()[1])); });
    form.appendChild(st);
    form.querySelectorAll(".adult-gate").forEach(b => b.remove());
    form.classList.toggle("adult-locked", !adultOn());
    if (!adultOn()) {
      const g = document.createElement("button"); g.type = "button"; g.className = "adult-gate";
      g.innerHTML = `<i></i><span>⚙ Настройки за възрастен</span><small>задръж</small>`;
      holdButton(g, 1500, () => { try { sessionStorage.setItem(ADULT_KEY, "1"); } catch (e) {} form.classList.remove("adult-locked"); g.remove(); });
      form.appendChild(g);
    }
    // i – пълното описание на играта (за родител/учител)
    const full = typeof current.task === "function" ? current.task(settings) : current.task;
    if (full && !infoPanel.querySelector(".info-full")) infoPanel.insertAdjacentHTML("afterbegin", `<p class="info-full"><b>Как се играе</b> — ${full}</p>`);
    current.settings.forEach(c => {
      const el = cardsBox.querySelector(`[data-key="${c.key}"]`); if (!el) return;
      el.classList.toggle("card-minor", c.type !== "choice" && !SET_MAIN(c.key));   // избор с плочки (кой текст, коя задача, режим) е съдържание – винаги видим
      const t = el.querySelector(".card-title"); if (t && !t.dataset.ic && SET_ICON(c.key)) { t.dataset.ic = 1; t.insertAdjacentHTML("afterbegin", `<span class="set-ic" aria-hidden="true">${SET_ICON(c.key)}</span> `); }
      if (c.type === "range" && Number(c.max) - Number(c.min) <= 5) {
        const inp = el.querySelector("input"); if (!inp) return;
        const vals = Array.from({ length: Number(c.max) - Number(c.min) + 1 }, (_, k) => Number(c.min) + k);
        const box = document.createElement("div"); box.className = "set-chips"; box.setAttribute("role", "radiogroup");
        box.innerHTML = vals.map(v => `<button type="button" class="set-chip${String(v) === String(settings[c.key]) ? " on" : ""}" data-v="${v}">${c.show ? c.show(v) : v}</button>`).join("");   // show: как се изписва стойността (напр. Фонетика 2/3 → 1/2)
        box.querySelectorAll(".set-chip").forEach(b => b.addEventListener("click", () => { inp.value = b.dataset.v; inp.dispatchEvent(new Event("input", { bubbles: true })); box.querySelectorAll(".set-chip").forEach(x => x.classList.toggle("on", x === b)); }));
        el.classList.add("card-chips"); el.appendChild(box);
        if (c.valueOff) { const n = document.createElement("div"); n.className = "set-off-hint"; n.hidden = true; n.textContent = c.offHint || ""; el.appendChild(n); }
      }
    });
    // допустими грешки – като настройка (✓ без грешки · ♥ 1 · ♥♥♥ 3)
    // еднакво: без грешки · 1 · 3. Скрито там, където грешката не струва „живот“ (проверено в кода на игрите, 19.10):
    // четенето (Читалка ×2), Сафари (търсене на двойки), Светът около мен (две стъпки, без живот), трите игри с изречения
    const NO_LIVES = ["readca", "readcaR", "safari", "sorting", "conventions", "editSentence", "wordContext"];
    const tiers = [0, 1, 3], noLives = NO_LIVES.includes(current.id);
    if (settings.__tier == null || !tiers.includes(Number(settings.__tier))) settings.__tier = 1;
    if (noLives) settings.__tier = TIERS()[1];
    if (!noLives) {
    const tc = document.createElement("div"); tc.className = "card card-tiers"; tc.dataset.key = "__tier";
    tc.innerHTML = `<span class="card-title">Допустими грешки</span><div class="set-chips tier-chips" role="radiogroup">${tiers.map(n => `<button type="button" class="set-chip tier-chip${Number(settings.__tier) === n ? " on" : ""}" data-v="${n}"><span class="tc-ic">${n === 0 ? "✓" : "♥".repeat(n)}</span><small>${n === 0 ? "без грешки" : n === 1 ? "1 грешка" : n + " грешки"}</small></button>`).join("")}</div>`;
    tc.querySelectorAll(".tier-chip").forEach(b => b.addEventListener("click", () => { settings.__tier = Number(b.dataset.v); tc.querySelectorAll(".tier-chip").forEach(x => x.classList.toggle("on", x === b)); }));
    cardsBox.insertBefore(tc, cardsBox.firstChild); }   // винаги най-горе (методист 19.10)
    // второстепенните – под „Още настройки“
    const minors = [...cardsBox.querySelectorAll(".card.card-minor:not([hidden])")];
    // когато всичко се побира (до 2 реда по 3 карти; карта с плочки = 2), се показва всичко – без „Още настройки“
    const weight = [...cardsBox.querySelectorAll(".card:not([hidden]):not(.card-tiers)")].reduce((n, c) => n + (c.classList.contains("card-choice") ? 2 : 1), 0);
    form.classList.toggle("fits-all", weight <= 6);
    form.classList.toggle("two-rows", weight > 3 && (weight <= 6 || form.classList.contains("more-open")));   // 2 реда карти – плътни карти, без картинката
    if (minors.length && weight > 6) {
      const open = form.classList.contains("more-open");
      const mt = document.createElement("button"); mt.type = "button"; mt.className = "more-toggle"; mt.textContent = open ? "Скрий настройките ▴" : `Още настройки (${minors.length}) ▾`;
      mt.addEventListener("click", () => { form.classList.toggle("more-open"); renderSettings(); });
      cardsBox.insertBefore(mt, minors[0]);
    }
  }
  // Настройка, която не важи за избраното ниво, стои на екрана, но е затъмнена (както в оригинала).
  function applyEnabled() {
    // широкото подреждане е само когато има видима настройка с плочки
    cardsBox.classList.toggle("cards-choice", current.settings.some(c => c.type === "choice" && !(c.hiddenIf && c.hiddenIf(settings))));
    current.settings.forEach(c => {
      // hiddenIf: настройката изобщо не важи за избрания режим – скрива се, вместо да стои затъмнена
      if (c.hiddenIf) { const el = cardsBox.querySelector(`[data-key="${c.key}"]`); if (el) el.hidden = !!c.hiddenIf(settings); }
    });
    // скритите отиват в края, за да не заемат местата в подредбата (тя е по пореден номер на картата)
    current.settings.forEach(c => { const el = cardsBox.querySelector(`:scope > [data-key="${c.key}"]`); if (el && el.hidden) cardsBox.appendChild(el); });
    current.settings.forEach(c => { const el = cardsBox.querySelector(`:scope > [data-key="${c.key}"]`); if (el && !el.hidden) cardsBox.insertBefore(el, cardsBox.querySelector(":scope > [hidden]")); });   // само пряко дете – вътре в картите също има скрити елементи
    // valueOff: стойности без материал (напр. Читалка – ниво без думички с изучените букви) са заключени; избраната се сваля до най-близката отключена
    current.settings.forEach(c => {
      if (!c.valueOff) return;
      const el = document.querySelector(`#screen-settings [data-key="${c.key}"], .screen-settings [data-key="${c.key}"]`) || cardsBox.querySelector(`[data-key="${c.key}"]`); if (!el) return;   // в „един свят“ картата може да е в детския слой
      const chips = [...el.querySelectorAll(".set-chip")], off = v => !!c.valueOff(v, settings);
      chips.forEach(b => { const o = off(b.dataset.v); b.disabled = o; b.classList.toggle("off", o); b.title = o ? (c.offHint || "") : ""; });
      const hint = el.querySelector(".set-off-hint"); if (hint) hint.hidden = !chips.some(b => b.disabled);
      if (off(settings[c.key])) {
        const okv = chips.map(b => b.dataset.v).filter(v => !off(v)), cur = Number(settings[c.key]);
        const pick = okv.filter(v => Number(v) < cur).pop() || okv[0];
        if (pick != null) { settings[c.key] = pick; const inp = el.querySelector("input"); if (inp) inp.value = pick; chips.forEach(b => b.classList.toggle("on", b.dataset.v === String(pick))); }
      }
    });
    current.settings.forEach(c => {
      if (!c.enabledIf) return;
      const on = c.enabledIf(settings), el = cardsBox.querySelector(`[data-key="${c.key}"]`);
      if (!el) return;
      el.classList.toggle("card-off", !on);
      $$("input,select,button", el).forEach(i => i.disabled = !on);
    });
  }
  $("#btn-info").addEventListener("click", () => {
    infoPanel.hidden = !infoPanel.hidden;
    // „един свят“: прозорчето излиза точно под „i“, подравнено вдясно към него (не в долната част на свитъка)
    if (!infoPanel.hidden && LOOK2()) {
      const b = $("#btn-info").getBoundingClientRect(), par = (infoPanel.offsetParent || document.body).getBoundingClientRect();
      Object.assign(infoPanel.style, { top: (b.bottom - par.top + 8) + "px", right: Math.max(8, par.right - b.right) + "px", left: "auto", bottom: "auto", transform: "none" });
      infoPanel.classList.add("near-i");
    }
  });
  $("#settings-form").addEventListener("submit", e => e.preventDefault());
  $("#btn-settings-start").addEventListener("click", () => { lsSet(setKey(current.id), JSON.stringify(settings)); infoPanel.hidden = true; show("intro"); });

  // ---------- инструкция ----------
  function renderIntro() {
    $("#intro-title").textContent = current.name;
    $("#intro-level").textContent = `Ниво ${settings.level || 1}`;
    $("#intro-task").textContent = typeof current.task === "function" ? current.task(settings) : current.task;
    $("#intro-params").textContent = current.paramsLine ? current.paramsLine(settings) : "";
    const tiers = (typeof current.tiers === "function" ? current.tiers(settings) : current.tiers) || [0, 1, 2];
    $$(".tier").forEach((lab, i) => {
      const n = tiers[i]; const inp = lab.querySelector("input"); inp.value = n; inp.checked = i === 1;
      lab.querySelector("b").textContent = n === 0 ? "Не допускай грешки" : n === 1 ? "Имаш право на 1 грешка" : `Имаш право на ${n} грешки`;
      const h = lab.querySelector(".hearts"); h.innerHTML = ""; h.classList.toggle("zero", n === 0);
      for (let k = 0; k < Math.max(Math.min(n, 6), 1); k++) h.appendChild(document.createElement("i"));
    });
    if (LOOK2() && document.documentElement.classList.contains("hub-c")) introLook2();
  }
  // „един свят“: инструкцията в стила на света – картинката на играта, една кратка изречена задача, сърцата като главното, „Старт“ под тях
  function shortTask(t) {   // маха изречение, което се повтаря в следващото („Избери картинка. Избери картинката, …“)
    const parts = String(t).split(/(?<=[.!?])\s+/).filter(Boolean);
    return parts.filter((p, i) => !parts.slice(i + 1).some(q => q.toLowerCase().startsWith(p.replace(/[.!?]$/, "").toLowerCase()))).join(" ");
  }
  function introLook2() {
    const left = $(".intro-left"), panel = $(".intro-panel");
    const task = shortTask($("#intro-task").textContent); $("#intro-task").textContent = task;
    let art = left.querySelector(".intro-zone"); if (art) art.remove();
    const img = hubImg(current.id), card = current.id === "sorting" ? "card_math" : ({ bukvarica: "card_buk", readica: "card_read", theWorld: "card_math", mathematics: "card_math2" })[current.module] || "card_math2";
    left.insertAdjacentHTML("afterbegin", img ? `<img class="intro-zone" src="assets/img/art/hub/${img}.png" alt="" draggable="false">` : `<img class="intro-zone intro-zone-card" src="assets/img/art/hub/${card}.jpg" alt="" draggable="false">`);
    $$(".tier").forEach(lab => { const n = Number(lab.querySelector("input").value); lab.querySelector("b").textContent = n === 0 ? "0 грешки" : n === 1 ? "1 грешка" : `${n} грешки`;
      if (n === 0) { const h = lab.querySelector(".hearts"); h.innerHTML = '<span class="tier-star" aria-hidden="true">★</span>'; } });
    const st = $("#btn-start"); if (st.parentElement !== panel) panel.appendChild(st);
    $$(".screen-intro [data-go=settings]").forEach(b => b.textContent = "← Настройки");
    clearTimeout(introLook2.t); introLook2.t = setTimeout(() => { if (!$("#screen-intro").hidden && soundOn) window.VOICE.speak(task, { rate: 0.9 }); }, 450);   // задачата се чува сама
  }
  $("#btn-speak").addEventListener("click", () => {
    window.VOICE.speak($("#intro-task").textContent, { rate: 0.9 });
  });
  $("#btn-start").addEventListener("click", () => { window.VOICE.cancel(); startGame(Number($("input[name=tier]:checked").value)); });

  // ---------- игра ----------
  // Глас: инструкции, числа и обратна връзка се четат на български. Може да се изключи от бутона в играта.
  const SOUND_KEY = "platforma.sound";
  let soundOn = localStorage.getItem(SOUND_KEY) !== "off";
  function say(text) {
    if (!soundOn || !text) return;
    window.VOICE.speak(text, { rate: 0.95 }); // запис на диктора, ако го има; иначе синтезиран глас
  }
  // 👂 „Чуй инструкцията“ (методист 19.10): инструкцията се казва сама само при старта; после – единствено с този бутон.
  // Броим повторенията (не са помощ и не са грешка): instruction_replay_count, време до първото, на кой въпрос.
  { const tb = $("#btn-task"); if (tb) tb.addEventListener("click", () => { if (!taskLine) return; window.VOICE.speak(taskLine, { rate: 0.9 });
    if (game && game.startedAt && !game.finished) (game.instrReplays = game.instrReplays || []).push({ ms: Date.now() - game.startedAt, item: game.idx || 0 }); }); }
  const soundBtn = $("#btn-sound");
  function renderSound() { soundBtn.classList.toggle("off", !soundOn); soundBtn.setAttribute("aria-label", soundOn ? "Изключи звука" : "Включи звука"); }
  soundBtn.addEventListener("click", () => { soundOn = !soundOn; lsSet(SOUND_KEY, soundOn ? "on" : "off"); if (!soundOn) window.VOICE.cancel(); renderSound(); });
  renderSound();
  const shell = {
    arena: $("#arena"), timer: $("#timer"), score: $("#score"), lives: $("#lives"), progress: $("#progress"), say,
    setLabel: t => { $("#example").textContent = t; },
    flash: (text, kind) => { const f = $("#feedback"); f.textContent = text; f.className = `feedback show ${kind}`; mascot(kind === "good" ? (/готова|Браво/.test(text) ? "celebrate" : "joy") : "tryagain", kind === "good" ? 1300 : 1600); },
    hideFlash: () => { $("#feedback").className = "feedback"; }
  };
  // пълна памет (23.10): резултат, който не е записан нито на таблета, нито на сървъра, живее само в отворената страница.
  // Детето не вижда техническа грешка; следващата игра не започва; знакът за възрастен обяснява какво да се направи.
  const unsaved = () => (window.PILOT_SYNC && window.PILOT_SYNC.status().unsaved) || 0;
  function adultWarn() {
    let w = document.getElementById("unsaved-warn");
    if (!unsaved()) { if (w) w.remove(); return; }
    if (w) return;
    w = document.createElement("button"); w.type = "button"; w.id = "unsaved-warn"; w.className = "unsaved-warn"; w.setAttribute("aria-label", "За възрастен: резултатът не е записан"); w.textContent = "!";
    w.addEventListener("click", () => {
      if (document.getElementById("unsaved-panel")) return;
      const p = document.createElement("div"); p.id = "unsaved-panel"; p.className = "unsaved-panel"; p.setAttribute("role", "alertdialog");
      p.innerHTML = `<h3>За възрастен</h3><p>Резултатът от последната игра <b>още не е записан</b>: паметта на таблета е пълна и няма връзка с базата.</p>
        <p><b>Не затваряйте и не презареждайте страницата.</b> Свържете таблета с интернет – резултатът ще се изпрати сам. Ако не стане, потърсете учителя или техническа помощ.</p>
        <button type="button" class="unsaved-close">Разбрах</button>`;
      p.querySelector(".unsaved-close").addEventListener("click", () => p.remove()); document.body.appendChild(p);
    });
    document.body.appendChild(w);
  }
  window.addEventListener("pilot-sync", adultWarn);
  window.addEventListener("beforeunload", e => { if (unsaved()) { e.preventDefault(); e.returnValue = ""; } });   // предупреждение при затваряне
  function startGame(tier) {
    if (unsaved()) {   // следващата игра чака, докато резултатът се запише или изпрати
      adultWarn(); if (window.PILOT_SYNC) window.PILOT_SYNC.flush();
      let o = document.getElementById("wait-sync");
      if (!o) { o = document.createElement("div"); o.id = "wait-sync"; o.className = "wait-sync"; o.innerHTML = "<div><b>Почакай малко…</b></div>"; document.body.appendChild(o); }
      const tryAgain = () => { if (unsaved()) return; window.removeEventListener("pilot-sync", tryAgain); const x = document.getElementById("wait-sync"); if (x) x.remove(); startGame(tier); };
      window.addEventListener("pilot-sync", tryAgain); return;
    }
    // общ таблет в пилота: преди домашна – „Кой играе?“ (js/sync.js), за да отиде резултатът при правилното дете
    // „Моят свят“ (home=v2): детето вече е избрано на началния екран и е натиснало „Продължи“/„Следващ кръг“ – не се пита втори път (същият раздел, до 2 минути, същото дете)
    const pickOk = (() => { try { const x = JSON.parse(sessionStorage.getItem("platforma.pickok") || "null"); sessionStorage.removeItem("platforma.pickok"); return !!(x && Date.now() - x.at < 120000 && window.PILOT_SYNC && x.c === window.PILOT_SYNC.status().child); } catch (e) { return false; } })();
    if (window.HW_CTX && window.PILOT_SYNC && window.PILOT_SYNC.needsPick() && !startGame.picked && !pickOk) { return window.PILOT_SYNC.pick(() => { startGame.picked = true; startGame(tier); startGame.picked = false; }); }
    $("#game-title").textContent = current.name;
    if (game) { try { game.destroy(); } catch (e) {} game = null; }
    shell.arena.innerHTML = "";   // без остатък от предишната игра, докато се чува кратката инструкция
    shell.arena.classList.remove("uw-arena");   // собственият фон на игра (Подводно царство) не остава за следващата
    show("game"); shell.hideFlash(); shell.setLabel("");
    // лентата със задачата е на 2 реда → точките за напредъка слизат надолу
    { const ex = document.querySelector(".hud-example"); if (ex && !ex.dataset.ro) { ex.dataset.ro = 1; new ResizeObserver(() => { const st = ex.closest(".stage"); if (st) st.style.setProperty("--hud-extra", Math.max(0, ex.offsetHeight - 56) + "px"); }).observe(ex); } }
    const ready = (window.BUK && window.BUK.ready) ? window.BUK.ready : Promise.resolve();
    ready.then(() => { if (!document.getElementById("screen-game").hidden) { const hw = window.HW_CTX || {}; const own = current.id === "soundLetterParsing" && String(settings.classify) === "1"; // класифициране на звука – собствената игра, не изглед от банката
    const Cls = window.BANK_GAME && !own && /^BK(0[1-9]|1[0-4])$/.test(hw.lesson || "") && hw.round ? window.BANK_GAME : current.cls; game = new Cls(shell, settings, tier, onFinish); window.__game = game;   // за автоматичните проверки
      const g = game, go = () => { document.documentElement.classList.remove("task-intro"); { const m = $("#mascot"); if (m) m.classList.remove("on"); } if (game === g && !g.started) { g.started = true; dupGuard.arm(st); g.start(); } };
      const st = LOOK2() && window.shortTaskFor ? window.shortTaskFor(current.id, settings) : "";
      if (!st) return setTimeout(go, 16);
      // „един свят“: кратката инструкция се изговаря преди първия въпрос и се вижда като лента; играта започва след нея
      shell.setLabel(st); taskLine = st; g.instructionText = st; document.documentElement.classList.add("task-intro"); mascot("explain", 0);
      if (!soundOn) return setTimeout(go, 1600);
      let done = false; const fin = () => { if (!done) { done = true; setTimeout(go, 250); } };
      window.VOICE.speak(st, { rate: 0.9, onEnd: fin }); setTimeout(fin, 6000);
    } });
  }
  let taskLine = "";
  // Първата реплика на играта веднага след кратката инструкция не се изговаря, ако не носи нищо ново
  // („Кои букви са обърнати?“ след „Намери буквите, които са обърнати наопаки.“). Нова информация = дума, която я няма
  // в инструкцията (по корен), отделна буква или число – тогава се казва („Коя картинка започва с А?“).
  const dupGuard = (() => {
    const STOP = new Set("кой коя кое кои какво каква какъв колко къде кога е са и с на в по да ли ще това тази този тези от за към при до който която които което се си го ги я му ѝ им а но или".split(" "));
    const words = t => String(t).toLowerCase().replace(/[^а-яa-z0-9ѝ ]+/g, " ").split(/\s+/).filter(Boolean);
    const stem = w => w.slice(0, 5);
    let ref = null, until = 0;
    const redundant = text => {
      const all = new Set(words(ref));
      if (words(text).some(w => (w.length === 1 && !all.has(w)) || /\d/.test(w))) return false;   // отделна буква или число = нова информация
      const base = new Set(words(ref).filter(w => !STOP.has(w)).map(stem));
      const ws = words(text).filter(w => !STOP.has(w));
      if (!ws.length) return false;
      return ws.every(w => w.length > 1 && !/\d/.test(w) && base.has(stem(w)));
    };
    const orig = window.VOICE.speak;
    window.VOICE.speak = (lines, opt) => {
      if (ref && Date.now() < until) {
        const arr = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
        if (arr.length) { const first = arr[0]; ref = null; if (redundant(first)) { const rest = arr.slice(1); if (!rest.length) { opt && opt.onEnd && opt.onEnd(); return () => {}; } return orig(rest, opt); } }
      }
      return orig(lines, opt);
    };
    return { arm: t => { ref = t; until = Date.now() + 2500; } };
  })();
  $("#btn-exit-game").addEventListener("click", () => { if (game) game.finish(true); });
  { const gs = $("#btn-game-settings"), go = () => { if (game) { game.destroy(); game = null; } show("settings"); };
    // в игра: за възрастния – със задържане (детето не излиза случайно); отключено ли е – с едно натискане
    gs.addEventListener("click", () => { if (!LOOK2() || adultOn()) go(); });
    holdButton(gs, 1500, () => { if (LOOK2() && !adultOn()) go(); }); }
  const DAY_KEY = () => "platforma.playtime." + new Date().toISOString().slice(0, 10);
  function onFinish(r) {
    game = null; r.child = CHILD.name; r.gameName = current.name; if (window.HW_CTX) Object.assign(r, window.HW_CTX); saveSession(r);
    const today = Number(localStorage.getItem(DAY_KEY()) || 0) + r.seconds; lsSet(DAY_KEY(), today);
    r.todaySeconds = today;
    renderResult(r); show("result");
    if (window.HOME2 && window.HOME2.on()) window.HOME2.result(r);
    // прототип „Моят квартал“: след кръг от домашна по Букварика – „Виж квартала“ (къщата е пораснала)
    const les = String(r.lesson_id || r.lesson || ""), sw = $("#btn-see-world");
    if (sw) sw.hidden = !(window.HW_CTX && /^(BK|CH|MW)\d/.test(les) && !r.early && window.PILOT_SYNC && window.PILOT_SYNC.status().child && window.WORLD);
    window.WORLD_FOCUS = sw && !sw.hidden ? les : null;   // кварталът се отваря с акцент върху това занятие
    window.WORLD_DISTRICT = sw && !sw.hidden && window.WORLD.districtOf ? window.WORLD.districtOf(les) : null;
  }

  // ---------- резултат ----------
  const STAR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor"/></svg>`;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  // Пазител-персонаж Елува (светулка; работно име, тест с деца предстои; пробно, ?mascot=1): появява се при инструкцията и след отговора; докато детето решава – скрит
  const MASCOT = (() => { const m = (location.search + location.hash).match(/mascot=(\d)/); try { if (m) localStorage.setItem("platforma.mascot", m[1]); return localStorage.getItem("platforma.mascot") === "1"; } catch (e) { return !!(m && m[1] === "1"); } })();
  let mascotT = null;
  window.MASCOT_ON = () => !!MASCOT && LOOK2();   // за „Моят квартал“ (js/world.js)
  function mascot(pose, ms) {
    if (!MASCOT || !LOOK2()) return;
    let el = $("#mascot"); if (!el) { el = document.createElement("img"); el.id = "mascot"; el.alt = ""; el.setAttribute("aria-hidden", "true"); $("#stage").appendChild(el); }
    el.src = `assets/img/mascot/${pose}.png?v=1`; el.className = "mascot on " + pose;
    clearTimeout(mascotT); if (ms) mascotT = setTimeout(() => el.classList.remove("on"), ms);
  }
  function renderResult(r) {
    // свободно четене (Читалка след урока): без звезди и без верни/грешни – платформата не проверява устното четене
    const practice = r.gameId === "readca" && (r.settings || {}).mode !== "timed";
    $("#result-stars").hidden = practice; const stats = $("#r-correct").closest("dl"); if (stats) stats.hidden = practice;
    $("#result-stars").innerHTML = [0, 1, 2].map(i => STAR.replace("<svg", `<svg class="${i < r.stars ? "on" : ""}"`)).join("");
    $("#result-title").textContent = r.mode === "learn" ? (r.wrong ? `Готово, ${r.child}! Опита ${r.answered + r.wrong} пъти и стигна до края.` : `Готово, ${r.child}! Всичко от първия път.`) : r.stars === 3 ? `Без грешка, ${r.child}!` : r.stars === 2 ? `Браво, ${r.child}!` : r.stars === 1 ? `Добър опит, ${r.child}` : `Опитай пак, ${r.child}`;
    if (practice) { $("#result-title").textContent = `Браво, ${r.child}! Прочете ${r.answered} ${r.answered === 8 ? "срички" : "думи"}.`; $("#result-sub").textContent = "Упражнение без оценка. Прочети ги още веднъж на възрастен."; }
    else $("#result-sub").textContent = r.early ? `Спря на ${r.answered} от ${r.total} примера.` : `${r.total} примера, ${r.skill.toLowerCase()}.`;
    $("#r-correct").textContent = r.correct; $("#r-wrong").textContent = r.wrong; $("#r-time").textContent = fmt(r.seconds); $("#r-streak").textContent = r.bestStreak; $("#r-streak").parentNode.hidden = !r.bestStreak; // в режим „учене“ серия няма
    $("#p-skill").textContent = r.skill; $("#p-acc").textContent = r.answered ? Math.round(r.accuracy * 100) + " %" : "—";
    $("#p-rt").textContent = r.avgRt != null ? r.avgRt + " сек." : "—"; $("#p-hard").textContent = r.hard.length ? r.hard.join(", ") : "нито един";
    const rest = $("#rest-note"); const mins = Math.round((r.todaySeconds || 0) / 60);
    if (mins >= 15) { rest.hidden = false; rest.textContent = `Днес общо в игрите: ${mins} минути. Време е за почивка, утре пак.`; $("#btn-again").textContent = "Още един урок"; }
    else { rest.hidden = true; $("#btn-again").textContent = "Още един урок"; }
    say(r.stars === 3 ? "Браво! Без нито една грешка." : r.stars >= 1 ? "Браво! Урокът е готов." : "Нищо, следващия път ще стане.");
    if (LOOK2() && document.documentElement.classList.contains("hub-c")) {   // „един свят“: само за детето – звезди, картинка, похвала, „Играй пак“
      if (!practice && r.early) $("#result-sub").textContent = r.answered ? "Следващия път ще стигнеш по-далеч!" : "Опитай пак – ще се получи!";
      if (!practice && r.early && !r.answered) $("#result-title").textContent = `Опитай пак, ${r.child}!`;
      const inner = $(".result-inner"); let art = inner.querySelector(".result-zone"); if (art) art.remove();
      const img = hubImg(current.id); if (img) inner.insertAdjacentHTML("afterbegin", `<img class="result-zone" src="assets/img/art/hub/${img}.png" alt="" draggable="false">`);
      $("#btn-again").textContent = "Играй пак";
      const ag = $("#btn-again"); if (ag.parentElement !== $(".result-scroll")) $(".result-scroll").appendChild(ag);
    }
  }
  $("#btn-again").addEventListener("click", () => show(LOOK2() && document.documentElement.classList.contains("hub-c") ? "settings" : "intro"));

  // ---------- прогрес за родителя ----------
  function renderParent() {
    const all = sessions(), bySkill = {};
    all.forEach(s => (bySkill[s.skill] = bySkill[s.skill] || []).push(s));
    const list = $("#skill-list"); list.innerHTML = all.length ? "" : `<p class="hint">Още няма изиграна сесия.</p>`;
    Object.entries(bySkill).forEach(([skill, ss]) => {
      const acc = ss.reduce((a, s) => a + s.accuracy, 0) / ss.length, lvl = Math.max(...ss.map(s => s.level)), seg = Math.round(acc * 8);
      const label = acc >= 0.9 ? "Уверено" : acc >= 0.7 ? "В процес" : "Начало";
      const div = document.createElement("div"); div.className = "skill";
      div.innerHTML = `<b>${skill}</b><span class="lvl">${label} · ниво ${lvl} · ${ss.length} ${ss.length === 1 ? "сесия" : "сесии"}</span><span class="bar">${Array.from({ length: 8 }, (_, i) => `<i class="${i < seg ? "on" : ""}"></i>`).join("")}</span>`;
      list.appendChild(div);
    });
    const tb = $("#sessions tbody"); tb.innerHTML = "";
    all.slice(0, 10).forEach(s => { const d = new Date(s.at); const tr = document.createElement("tr"); tr.innerHTML = `<td>${d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" })} ${d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}</td><td>${s.gameName || s.gameId}</td><td>${s.level}</td><td>${s.correct}</td><td>${s.wrong}</td><td>${fmt(s.seconds)}</td>`; tb.appendChild(tr); });
  }

  // ---------- старт + маршрути за преглед: #map, #settings/<игра>, #intro/<игра>, #game/<игра>, #result, #parent ----------
  // Отворени от офиса (?office=1): бутон за връщане към страницата на офиса в същия прозорец
  if (/[?&]office=1/.test(location.search)) { document.documentElement.classList.add("in-office"); let back = ""; try { if (document.referrer && !/office=1/.test(document.referrer)) sessionStorage.setItem("platforma.officeUrl", document.referrer); back = sessionStorage.getItem("platforma.officeUrl") || ""; } catch (e) {} const b = document.createElement("a"); b.textContent = "← Моят свят"; b.className = "office-back"; b.href = back || "#"; if (window.parent !== window) b.addEventListener("click", ev => { ev.preventDefault(); window.parent.postMessage("office-back", "*"); }); else if (!back) b.addEventListener("click", ev => { ev.preventDefault(); history.back(); }); document.body.appendChild(b); }
  // Кодиран маршрут за споделени линкове: #g~<игра>~ключ_стойност~... (артефактният адрес пропуска само букви, цифри и ~ _ . -)
  let rawHash = (location.hash || "").slice(1);
  if (rawHash.startsWith("g~")) { const parts = rawHash.split("~").slice(1); rawHash = "game/" + parts[0] + "?" + parts.slice(1).map(kv => { const i = kv.indexOf("_"); return i < 0 ? kv : kv.slice(0, i) + "=" + kv.slice(i + 1); }).join("&"); }
  const [h, argRaw] = rawHash.split("/");
  const [arg, qs] = (argRaw || "").split("?");
  // стойностите се декодират (кирилица в линка идва като %D0%..); при повреден код – както са
  const overrides = Object.fromEntries((qs || "").split("&").filter(Boolean).map(kv => { const i = kv.indexOf("="), k = i < 0 ? kv : kv.slice(0, i), v = i < 0 ? "" : kv.slice(i + 1); try { return [k, decodeURIComponent(v)]; } catch (e) { return [k, v]; } }));
  // контекст на домашната (hw = домашна, st = етап): записва се в сесията, за да се движи картата на детето
  const CTX_KEYS = ["hw", "st", "lesson", "round", "skill", "skill2", "meas", "mode", "adaptive", "bank", "tpl", "mm", "ovr"];
  if (CTX_KEYS.some(k => k in overrides)) { window.HW_CTX = {}; CTX_KEYS.forEach(k => { if (k in overrides) { window.HW_CTX[k] = k === "st" ? Number(overrides[k] || 0) : overrides[k]; delete overrides[k]; } }); }
  if (["settings", "intro", "game"].includes(h)) { selectGame(G[arg] ? arg : "underwaterKingdom"); Object.assign(settings, overrides); if (h === "game") { show("intro"); startGame(1); if (overrides.sim === "box") setTimeout(() => { if (game) game.advance = () => {}; const b=document.querySelector(".abox"); b&&b.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); }, 1500); else if (overrides.sim === "2") setTimeout(() => { const f=document.querySelector("#fields .field"); f.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); const t=[...document.querySelectorAll("#numrow .numtile")].find(x=>Number(x.textContent)===Number(f.dataset.count)); t&&t.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); }, 1500); else if (overrides.sim) setTimeout(() => { const fs=[...document.querySelectorAll("#fields .field")]; const cs=fs.map(f=>Number(f.dataset.count)); const i=cs.indexOf(Math.min(...cs)); fs[i]&&fs[i].dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); }, 1500); } else show(h); }
  else if (h === "result") { selectGame("underwaterKingdom"); renderResult({ child: CHILD.name, stars: 2, early: false, total: 8, answered: 8, correct: 7, wrong: 1, seconds: 74, bestStreak: 5, skill: "Събиране до 6", accuracy: 7 / 8, avgRt: 2.4, hard: ["3 + 2"] }); show("result"); }
  else if (["map", "bmap", "rmap", "wmap", "parent", "world"].includes(h)) show(h);
  else show("modules");
})();
