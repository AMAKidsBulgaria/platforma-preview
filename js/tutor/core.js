/* Автономен AI тутор по МА – ядрото на преподаването (етап 1, 12.11.2026). Без DOM – проверява се с tools/tutor_core_test.js.
   Принцип: AI решава КАК да преподава; математическото ядро (js/abacus/engine.js) гарантира КОЕ Е ВЯРНО; методиката определя КАКВО Е ДОПУСТИМО.
   Тук: (1) граф на уменията „Просто 0–9“ с предпоставки; (2) модел на усвояването (самостоятелно → наум → помни след 3–7 дни);
   (3) каталог на стратегиите и избор при затруднение (без човек); (4) план на сесията; (5) запис „стратегия → резултат“ за ученето от мащаба.
   Праговете са начални (виж „AI тутор за деца 5–6 г.“, т. 5) – ще се настроят по данните от пилота. */
(function (root) {
  const DAY = 864e5;

  // ---- (1) граф на уменията: Просто 0–9 (вариант Б) ----
  // kind: ready (готовност) · intro (запознаване с абакуса) · set (нареждане/четене на числа) · ab (действие на абакуса) · pinch (щипка) · mind (наум) · chain (вериги)
  const SKILLS = [
    { id: "G", name: "Готовност: цифрите 0–9", kind: "ready", pre: [] },
    { id: "A1", name: "Абакусът: пръчка, преграда, нулиране", kind: "intro", pre: ["G"] },
    { id: "C1", name: "Числата 1–4 на абакуса", kind: "set", pre: ["A1"], max: 4 },
    { id: "C2", name: "Небесното топче = 5; числата 5–9", kind: "set", pre: ["C1"], max: 9 }];
  const TOPIC = { 1: "s2", 2: "s2", 3: "s3", 4: "s4", 5: "s5", 6: "s6", 7: "s7", 8: "s8", 9: "s9" };
  for (let n = 1; n <= 9; n++) {
    const pre = n === 1 ? ["C1"] : n === 5 ? ["C2", "P4"] : n === 6 ? ["PN", "P5"] : ["P" + (n - 1)];
    SKILLS.push({ id: "P" + n, name: `±${n} на абакуса`, kind: "ab", pre, n, topic: TOPIC[n] });
    if (n === 5) SKILLS.push({ id: "PN", name: "Щипката: небесното и земните наведнъж", kind: "pinch", pre: ["P5"], n: 6, topic: "s6" });
    SKILLS.push({ id: "M" + n, name: `±${n} наум`, kind: "mind", pre: ["P" + n], n, topic: TOPIC[n] });
  }
  SKILLS.push({ id: "CH", name: "Звездна нощ: вериги 0–9 наум", kind: "chain", pre: ["M9"], topic: "s9" });
  const BY = {}; SKILLS.forEach((s, i) => { s.order = i; BY[s.id] = s; });

  // ---- (2) модел на усвояването ----
  // статуси: locked · ready · learning · practiced (самостоятелно на абакуса / нарежда) · pending (усвоено, чака проверка след дни) · mastered · stalled (продължително затруднение)
  const RULE = { window: 10, need: 8, mindWindow: 3, mindNeed: 2, review: [3, 7], stallSessions: 3 };
  function newState() { return { skills: {}, log: [], strat: [], sessions: 0, notices: [] }; }
  const S = (st, id) => st.skills[id] || (st.skills[id] = { id, status: "locked", tries: [], tried: [], strategy: null, errRun: 0, sessionsNoProgress: 0, nextReview: null });
  const done = (st, id) => ["practiced", "pending", "mastered"].includes(S(st, id).status);
  function refresh(st) {   // отключва уменията, чиито предпоставки са изпълнени
    SKILLS.forEach(s => { const k = S(st, s.id); if (k.status === "locked" && s.pre.every(p => done(st, p))) k.status = "ready"; });
    return st;
  }
  // запис на един опит. r = { ok, method (правилни движения), helped (имало помощ), strategy, rtMs, t }
  function record(st, id, r) {
    const s = BY[id], k = S(st, id), t = r.t || Date.now(); if (k.status === "ready") k.status = "learning";
    const indep = !!(r.ok && (r.method !== false) && !r.helped); k.tries.push({ ok: !!r.ok, indep, helped: !!r.helped, strategy: r.strategy || null, rt: r.rtMs || null, t });
    if (k.tries.length > 40) k.tries.splice(0, k.tries.length - 40);
    st.log.push({ id, ok: !!r.ok, indep, t });
    k.errRun = r.ok ? 0 : k.errRun + 1;
    // ефектът на стратегията: първият опит след нея решава дали е сработила
    if (k.strategy && k.awaitEffect) { st.strat.push({ skill: id, strategy: k.strategy, success: indep, t }); k.awaitEffect = false; if (indep) k.lastWorked = k.strategy; }
    const last = k.tries.slice(-(s.kind === "mind" || s.kind === "chain" ? RULE.mindWindow : RULE.window));
    const n = last.filter(x => x.indep).length;
    if (k.status === "learning" || k.status === "stalled") {
      if (s.kind === "mind" || s.kind === "chain") { if (last.length >= RULE.mindWindow && n >= RULE.mindNeed) promote(st, id, t); }
      else if (s.kind === "ready" || s.kind === "intro") { if (n >= 2) promote(st, id, t); }
      else if (s.kind === "set" || s.kind === "pinch") { if (last.length >= 5 && last.slice(-5).filter(x => x.indep).length >= 4) promote(st, id, t); }
      else if (last.length >= RULE.window && n >= RULE.need) promote(st, id, t);
    }
    refresh(st); return k;
  }
  function promote(st, id, t) {
    const k = S(st, id), s = BY[id];
    k.status = s.kind === "ready" || s.kind === "intro" ? "mastered" : s.kind === "ab" || s.kind === "set" || s.kind === "pinch" ? "practiced" : "pending";
    k.strategy = null; k.tried = []; k.errRun = 0; k.sessionsNoProgress = 0; k.progressedAt = t;
    // отново научено действие, чийто „наум“ вече е минат → направо в проверка след дни (иначе остава „practiced“ завинаги)
    if (s.kind === "ab" && ["pending", "mastered"].includes(S(st, "M" + s.n).status)) k.status = "pending";
    if (k.status === "pending") { k.reviewStep = 0; k.nextReview = t + RULE.review[0] * DAY; }
    // наумът потвърждава и действието на абакуса: и то минава в проверка след дни
    if (s.kind === "mind") { const a = S(st, "P" + s.n); if (a.status === "practiced") { a.status = "pending"; a.reviewStep = 0; a.nextReview = t + RULE.review[0] * DAY; } }
  }
  // проверка „помни ли“ (в друга сесия, без подсказки)
  function review(st, id, ok, t) {
    const k = S(st, id); t = t || Date.now(); if (k.status !== "pending" && k.status !== "mastered") return k;
    if (ok) { k.reviewStep = (k.reviewStep || 0) + 1; if (k.reviewStep >= 1) k.status = "mastered"; k.nextReview = k.reviewStep < RULE.review.length ? t + RULE.review[k.reviewStep] * DAY : null; }
    else { k.status = "learning"; k.tries = []; k.nextReview = null; k.reviewStep = 0; }   // забравено → обратно в упражнение (честно, без насила напред)
    return k;
  }

  // ---- (3) стратегии ----
  // каталогът (одобрен от методиката); when – кога е допустима; AI избира измежду допустимите (тук – правило по подразбиране + научено от мащаба)
  const STRATEGIES = {
    explain: { name: "Обяснение", when: () => true },
    demo: { name: "Демонстрация", when: () => true },
    together: { name: "Заедно", when: () => true },
    split: { name: "Разделяне", when: (s, e) => s.n >= 5 || e === "combined" },
    compare: { name: "Сравнение", when: () => true },
    prereq: { name: "Предпоставка", when: (s, e) => e === "prereq" },
    easier: { name: "По-лесно", when: () => true },
    video: { name: "Видео с ръце", when: (s) => s.kind === "pinch" || s.n >= 6 },
    game: { name: "Игра", when: () => true }
  };
  const LADDER = ["demo", "together", "split", "compare", "easier", "video", "game"];
  // допустимите стратегии по вид умение (методиката): за цифрите и запознаването – показване и по-лесно; наум – сравнение (картините) и по-лесно
  const FOR_KIND = { ready: ["explain", "easier"], intro: ["demo", "together", "easier"], set: ["demo", "together", "compare", "easier"],
    ab: LADDER, pinch: ["demo", "together", "split", "video", "easier", "game"], mind: ["compare", "demo", "easier"], chain: ["compare", "easier"] };
  // кое умение липсва, ако грешката е такава (от кода на ядрото: wrong_value, forgot_complement, … или от вида на движението)
  function prereqFor(id, err) {
    const s = BY[id]; if (!s || s.kind !== "ab") return null;
    if (err === "heaven" && s.n <= 5) return "C2";   // бърка небесното топче → да нареди 5–9
    if (err === "earth") return "C1";
    if (err === "combined" && s.n >= 6) return "PN";  // щипката
    return null;
  }
  // реакция при грешка → { action: "hint" | "strategy" | "prereq", strategy?, prereq? }
  function onError(st, id, err, opts) {
    const s = BY[id], k = S(st, id), scale = (opts && opts.best) || {};
    if (k.errRun <= 1) return { action: "hint" };   // една грешка – контекстна подсказка без решението
    const pr = prereqFor(id, err);
    if (pr && !k.tried.includes("prereq")) { k.tried.push("prereq"); k.strategy = "prereq"; k.awaitEffect = true; return { action: "prereq", strategy: "prereq", prereq: pr }; }
    // повтаряща се грешка → друга стратегия: първо тази, която е проработила за детето, после научената от мащаба, после стълбицата
    const allowed = FOR_KIND[s.kind] || LADDER, ok = (x) => allowed.includes(x) && !k.tried.includes(x) && STRATEGIES[x].when(s, err);
    const pick = [k.lastWorked, scale[id]].concat(allowed).find(x => x && STRATEGIES[x] && ok(x));
    if (!pick) { k.tried = []; return { action: "strategy", strategy: "easier", exhausted: true }; }
    k.tried.push(pick); k.strategy = pick; k.awaitEffect = true; return { action: "strategy", strategy: pick };
  }

  // ---- (4) сесия ----
  // умора: отговорите с 40% по-бавни от медианата на сесията или 3 грешки в последните 5
  function tired(tries) {
    if (tries.length < 6) return false; const rts = tries.map(x => x.rt).filter(Boolean), last5 = tries.slice(-5);
    if (last5.filter(x => !x.ok).length >= 3) return true;
    if (rts.length >= 6) { const sorted = rts.slice(0, -3).sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)], recent = rts.slice(-3).reduce((a, b) => a + b, 0) / 3; if (recent > med * 1.4) return true; }
    return false;
  }
  // план на следващата сесия: повторения, които са дошли; текущото умение; ново ли е; пауза при застой
  function plan(st, now) {
    now = now || Date.now(); refresh(st);
    const reviews = SKILLS.filter(s => { const k = S(st, s.id); return (k.status === "pending" || k.status === "mastered") && k.nextReview && k.nextReview <= now; }).map(s => s.id).slice(0, 2);
    const stalled = SKILLS.find(s => S(st, s.id).status === "stalled");
    const cur = SKILLS.find(s => ["learning", "ready"].includes(S(st, s.id).status));
    const pauseNew = !!stalled;
    return { reviews, current: pauseNew ? stalled.id : cur ? cur.id : null, isNew: !!cur && S(st, cur.id).status === "ready" && !pauseNew, pauseNew,
      finished: !cur && !stalled && SKILLS.every(s => ["mastered", "pending"].includes(S(st, s.id).status)) };
  }
  // край на сесия: застой → алтернативна последователност, после пауза на новото и честно известие до родителя
  function endSession(st, now) {
    now = now || Date.now(); st.sessions++;
    SKILLS.forEach(s => { const k = S(st, s.id); if (k.status !== "learning" && k.status !== "stalled") return;
      // напредък в сесията = поне 60% самостоятелно верни (единичен случаен успех не е напредък); без опити – не се брои
      const mine = k.tries.filter(x => x.t >= (k.sessionStart || 0)); if (mine.length < 5) { k.sessionStart = now; return; }
      const progressed = mine.filter(x => x.indep).length / mine.length >= .6;
      k.sessionsNoProgress = progressed ? 0 : (k.sessionsNoProgress || 0) + 1;
      if (k.sessionsNoProgress === 2) k.altSequence = true;   // неуспех в няколко сесии → алтернативна последователност (повече „заедно“, видео, игри)
      if (k.sessionsNoProgress >= RULE.stallSessions && k.status !== "stalled") { k.status = "stalled"; st.notices.push({ t: now, kind: "stalled", skill: s.id, text: `Продължително затруднение: „${s.name}“. Туторът повтаря и опитва други подходи; новото е на пауза.` }); }
      if (k.status === "stalled" && progressed) k.status = "learning";
      k.sessionStart = now; });
    return st;
  }
  function startSession(st, now) { now = now || Date.now(); SKILLS.forEach(s => { S(st, s.id).sessionStart = now; }); return plan(st, now); }

  // ---- (5) учене от мащаба: коя стратегия помага най-често за всяко умение (от записите на много деца) ----
  function bestStrategies(strat) {
    const agg = {}; strat.forEach(x => { const a = (agg[x.skill] = agg[x.skill] || {}), b = (a[x.strategy] = a[x.strategy] || [0, 0]); b[1]++; if (x.success) b[0]++; });
    const out = {}; Object.keys(agg).forEach(id => { let best = null, bv = -1; Object.entries(agg[id]).forEach(([k, [w, n]]) => { if (n < 5) return; const v = (w + 1) / (n + 2); if (v > bv) { bv = v; best = k; } }); if (best) out[id] = best; });
    return out;
  }

  root.MA_TUTOR = { FOR_KIND, SKILLS, BY, STRATEGIES, RULE, DAY, newState, refresh, record, review, onError, prereqFor, tired, plan, startSession, endSession, bestStrategies, done };
})(typeof window !== "undefined" ? window : this);
