/* Соробан (японски абакус) – логика без интерфейс: състояние, движения, правилни стратегии и разпознаване на грешки.
   Всяка пръчка: 1 небесно топче (5, „активно“ = долу при летвата) и 4 земни (по 1, „активни“ = горе при летвата).
   Пръчка 0 = единици (най-дясната), 1 = десетици, 2 = стотици.
   Правила (работните имена от сегашната методика – ще се сменят): Просто (директно), Братя (допълване до 5), Приятели (допълване до 10), Преход (през 50/100), Приятели и братя.
   Ред на избор: Просто → Братя → Приятели → Приятели и братя. При Приятели първо се мести десетицата вляво (+10), после единиците.
   Движение = { rod, bead: "h" | "e", d } – d е промяната в стойността на пръчката: небесно ±5, земни ±k (k топчета наведнъж).
   Тест без браузър: tools/abacus_engine_test.js (jsc). */
(function (root) {
  const make = (rods) => Array.from({ length: rods || 3 }, () => ({ h: 0, e: 0 }));
  const rodVal = (r) => 5 * r.h + r.e;
  const value = (st) => st.reduce((s, r, i) => s + rodVal(r) * Math.pow(10, i), 0);
  const clone = (st) => st.map(r => ({ h: r.h, e: r.e }));
  function fromValue(n, rods) {
    const st = make(rods);
    for (let i = 0; i < st.length; i++) { const d = Math.floor(n / Math.pow(10, i)) % 10; st[i].h = d >= 5 ? 1 : 0; st[i].e = d % 5; }
    return st;
  }
  // приложи движение; връща ново състояние или null, ако е невъзможно (няма толкова топчета)
  function apply(st, m) {
    const s = clone(st), r = s[m.rod]; if (!r) return null;
    if (m.bead === "h") { if (m.d === 5 && r.h === 0) r.h = 1; else if (m.d === -5 && r.h === 1) r.h = 0; else return null; }
    else { const e = r.e + m.d; if (m.d === 0 || e < 0 || e > 4) return null; r.e = e; }
    return s;
  }
  // докосване на топче в интерфейса → движение. Земно k = 1..4 (1 е най-близо до летвата): неактивно → става активно заедно с тези над него; активно → пада заедно с тези под него.
  function tapMove(st, rod, bead, k) {
    const r = st[rod];
    if (bead === "h") return { rod, bead: "h", d: r.h ? -5 : 5 };
    return k > r.e ? { rod, bead: "e", d: k - r.e } : { rod, bead: "e", d: (k - 1) - r.e };
  }

  // ---- правилната последователност за +d / −d (d = 1..9) върху пръчка rod; flags отбелязва използваните правила ----
  function addDigit(st, rod, d, out, flags) {
    if (!d) return st;
    const r = st[rod]; if (!r) { flags.overflow = true; return st; }
    const v = rodVal(r);
    if (v + d <= 9) {
      if (d <= 4) {
        if (r.e + d <= 4) return push(st, { rod, bead: "e", d }, out);
        flags.brother = true; st = push(st, { rod, bead: "h", d: 5 }, out); return push(st, { rod, bead: "e", d: -(5 - d) }, out);
      }
      st = push(st, { rod, bead: "h", d: 5 }, out); return d > 5 ? push(st, { rod, bead: "e", d: d - 5 }, out) : st;
    }
    flags.friend = true;   // +d = +10 (едно в следващата пръчка) −(10−d) тук; първо десетицата, както се учи в часа
    const hi = {}; st = addDigit(st, rod + 1, 1, out, hi); if (hi.brother || hi.friend) flags.transition = true; if (hi.overflow) flags.overflow = true;
    const inner = {}; st = subDigit(st, rod, 10 - d, out, inner); if (inner.brother) flags.friendBrother = true;
    return st;
  }
  function subDigit(st, rod, d, out, flags) {
    if (!d) return st;
    const r = st[rod]; if (!r) { flags.overflow = true; return st; }
    const v = rodVal(r);
    if (v - d >= 0) {
      if (d <= 4) {
        if (r.e >= d) return push(st, { rod, bead: "e", d: -d }, out);
        flags.brother = true; st = push(st, { rod, bead: "e", d: 5 - d }, out); return push(st, { rod, bead: "h", d: -5 }, out);
      }
      st = push(st, { rod, bead: "h", d: -5 }, out); return d > 5 ? push(st, { rod, bead: "e", d: -(d - 5) }, out) : st;
    }
    flags.friend = true;   // −d = −10 (едно в следващата пръчка) +(10−d) тук; първо десетицата
    const hi = {}; st = subDigit(st, rod + 1, 1, out, hi); if (hi.brother || hi.friend) flags.transition = true; if (hi.overflow) flags.overflow = true;
    const inner = {}; st = addDigit(st, rod, 10 - d, out, inner); if (inner.brother) flags.friendBrother = true;
    return st;
  }
  function push(st, m, out) { out.push(m); return apply(st, m); }
  // „Преход“ (през 50 / 100) = Приятели, при които едното вляво само изисква Братя или Приятели (49+5 = +50 −40 −5; 95+6 = +100 −90 −4)
const ruleOf = (f) => f.transition ? "Преход" : f.friendBrother ? "Приятели и братя" : f.friend ? "Приятели" : f.brother ? "Братя" : "Просто";

  // задача: start ± n (n може да е многоцифрено – по разряди отляво надясно, както се смята на соробан)
  function plan(start, op, n, rods) {
    let st = fromValue(start, rods || 3); const moves = [], flags = {};
    const digits = String(n).split("").map(Number);
    digits.forEach((d, i) => { const rod = digits.length - 1 - i; st = op === "+" ? addDigit(st, rod, d, moves, flags) : subDigit(st, rod, d, moves, flags); });
    return { moves, rule: ruleOf(flags), flags, end: st && value(st), ok: !!st && !flags.overflow };
  }

  // ---- оценка на движенията на детето ----
  // нормализиране: поредни движения на едно и също топче в една посока се сливат (+1 +1 +1 = +3)
  function norm(ms) {
    const out = [];
    ms.forEach(m => { const l = out[out.length - 1]; if (l && l.rod === m.rod && l.bead === m.bead && Math.sign(l.d) === Math.sign(m.d)) l.d += m.d; else out.push({ rod: m.rod, bead: m.bead, d: m.d }); });
    return out;
  }
  const key = (m) => m.rod + m.bead + m.d;
  const sameMulti = (a, b) => a.length === b.length && a.map(key).sort().join() === b.map(key).sort().join();
  const net = (ms) => { const n = {}; ms.forEach(m => { n[m.rod] = (n[m.rod] || 0) + m.d; }); return n; };

  // живо: съвместимо ли е последното движение с правилния път? (за незабавна подсказка)
  function consistent(planMoves, childMoves) {
    const left = planMoves.map(m => ({ rod: m.rod, bead: m.bead, d: m.d }));
    for (const m of childMoves) {
      const i = left.findIndex(x => x.rod === m.rod && x.bead === m.bead && Math.sign(x.d) === Math.sign(m.d) && Math.abs(m.d) <= Math.abs(x.d));
      if (i < 0) return false;
      left[i].d -= m.d; if (left[i].d === 0) left.splice(i, 1);
    }
    return true;
  }

  // окончателна оценка: { correct, method, rule, code, oneByOne }
  // code: ok | wrong_method | set_result | forgot_complement | used_number_not_brother | forgot_carry | forgot_borrow | wrong_value
  function judge(task, childMoves) {
    const p = plan(task.start, task.op, task.n, task.rods);
    const target = task.op === "+" ? task.start + task.n : task.start - task.n;
    let st = fromValue(task.start, task.rods || 3); for (const m of childMoves) { st = apply(st, m); if (!st) return { correct: false, code: "impossible", rule: p.rule }; }
    const got = value(st), nc = norm(childMoves), oneByOne = nc.length < childMoves.length;
    if (got === target) {
      if (sameMulti(nc, norm(p.moves))) return { correct: true, method: true, code: "ok", rule: p.rule, oneByOne };
      const extra = nc.length > norm(p.moves).length;   // повече движения от нужното = нагласил е отговора, без правилото
      return { correct: true, method: false, code: extra ? "set_result" : "wrong_method", rule: p.rule, oneByOne };
    }
    // типични грешки
    const cn = net(childMoves), pn = net(p.moves), d = task.op === "+" ? 1 : -1;
    if (p.flags.brother && !p.flags.friend) {
      const hMove = nc.some(m => m.bead === "h"), eMove = nc.find(m => m.bead === "e");
      if (hMove && !eMove) return { correct: false, code: "forgot_complement", rule: p.rule, got, target };
      if (hMove && eMove && Math.abs(eMove.d) === task.n) return { correct: false, code: "used_number_not_brother", rule: p.rule, got, target };
    }
    if (p.flags.friend) {
      const hi = Object.keys(pn).filter(r => +r > 0);
      const missingHigh = hi.some(r => !cn[r]);
      if (missingHigh) return { correct: false, code: d > 0 ? "forgot_carry" : "forgot_borrow", rule: p.rule, got, target };
    }
    return { correct: false, code: "wrong_value", rule: p.rule, got, target };
  }

  // подредба на пръчките: единиците са НАЙ-ВДЯСНО, вляво от тях – десетиците, стотиците (стандартният соробан; така е и в дигиталния абакус в центровете – решение 9.11.2026). ?units=left обръща реда
  const UNITS_LEFT = typeof location !== "undefined" && /[?&]units=left\b/.test(location.search);
  const SIDE = UNITS_LEFT ? "вдясно" : "вляво";                    // къде е по-старшата пръчка – за подсказките
  const col = (i, R) => UNITS_LEFT ? i : R - 1 - i;               // пръчка i (0 = единиците) → колона отляво надясно
  // подсказки по стъпки (дава насока, не отговор) – текстовете се озвучават
  const NAME = { 1: "едно", 2: "две", 3: "три", 4: "четири", 5: "пет", 6: "шест", 7: "седем", 8: "осем", 9: "девет" };
  function hints(task) {
    const p = plan(task.start, task.op, task.n, task.rods), n = task.n, plus = task.op === "+";
    if (p.rule === "Просто") return [plus ? `Добави ${NAME[n] || n}. Колко топчета трябва да вдигнеш?` : `Махни ${NAME[n] || n}. Колко топчета трябва да свалиш?`, "Погледни горното топче – то е пет."];
    if (p.rule === "Братя") return plus
      ? [`Долу няма достатъчно топчета. Какво можем да направим?`, `Помогни си с брат: плюс ${NAME[n]} е плюс пет, минус ${NAME[5 - n]}.`, "Първо свали горното топче."]
      : [`Долу няма достатъчно топчета за махане. Какво можем да направим?`, `Помогни си с брат: минус ${NAME[n]} е плюс ${NAME[5 - n]}, минус пет.`, (5 - n === 1 ? "Първо вдигни едно долно топче." : `Първо вдигни ${NAME[5 - n]} долни топчета.`)];
    return plus
      ? [`На тази пръчка не стига място. Погледни съседната пръчка ${SIDE}.`, `Помогни си с приятел: плюс ${NAME[n]} е плюс едно ${SIDE} и минус ${NAME[10 - n]} тук.`]
      : [`Тук не стигат топчета. Погледни съседната пръчка ${SIDE}.`, `Помогни си с приятел: минус ${NAME[n]} е минус едно ${SIDE} и плюс ${NAME[10 - n]} тук.`];
  }
  const FEEDBACK = {
    ok: "Браво! Точно така.",
    wrong_method: "Отговорът е верен, но опитай с правилото. Ще ти покажа.",
    set_result: "Отговорът е верен, но не е сметнат с правилото. Нека опитаме заедно – стъпка по стъпка.",
    forgot_complement: "Добави пет, но не махна брата. Колко трябва да махнем?",
    used_number_not_brother: "Махни брата, а не числото. Кой е братът на това число?",
    forgot_carry: `Не забравяй едното ${SIDE} – на пръчката на десетиците.`,
    forgot_borrow: `Не забравяй да махнеш едно ${SIDE} – от десетиците.`,
    wrong_value: "Почти! Нека опитаме пак – погледни какво число показваш сега.",
    impossible: "Това движение не става – погледни топчетата."
  };

  // генератор на задачи по правило (едноцифрени, една пръчка – за първите стъпки)
  function tasksFor(rule, count, rng) {
    rng = rng || Math.random; const pool = [];
    for (let a = 0; a <= 9; a++) for (let n = 1; n <= 9; n++) for (const op of ["+", "-"]) {
      const t = op === "+" ? a + n : a - n; if (t < 0 || t > 9) continue;
      if (plan(a, op, n, 1).rule === rule) pool.push({ start: a, op, n, rods: 1 });
    }
    const out = []; for (let i = 0; i < count && pool.length; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
  }

  // верига от len действия върху една пръчка (стойности 0..max), правилата в rules; ако must е дадено – поне едно действие по него
  function chainFor(rules, len, rng, must, start) {
    rng = rng || Math.random; const max = 9;
    for (let tries = 0; tries < 200; tries++) {
      let v = start != null ? start : Math.floor(rng() * 10); const steps = [];
      for (let i = 0; i < len; i++) {
        const opts = [];
        for (let n = 1; n <= 9; n++) for (const op of ["+", "-"]) { const t = op === "+" ? v + n : v - n; if (t < 0 || t > max) continue; const r = plan(v, op, n, 1).rule; if (rules.includes(r)) opts.push({ op, n, rule: r }); }
        if (!opts.length) break;
        const pick = opts[Math.floor(rng() * opts.length)]; steps.push(pick); v = pick.op === "+" ? v + pick.n : v - pick.n;
      }
      if (steps.length === len && (!must || steps.some(s => s.rule === must))) return { start: steps.length ? (start != null ? start : null) : null, steps, end: v, startValue: null };
    }
    return null;
  }
  function chain(rules, len, rng, must) {   // с изчислена начална стойност
    rng = rng || Math.random;
    for (let k = 0; k < 50; k++) { const s0 = Math.floor(rng() * 10), c = chainFor(rules, len, rng, must, s0); if (c) { c.start = s0; let v = s0; c.steps.forEach(x => { v = x.op === "+" ? v + x.n : v - x.n; }); c.end = v; delete c.startValue; return c; } }
    return null;
  }
  // ---- тренажор „Просто“: пример = поредица от числа (първото е положително), всяка стъпка е директна (правило Просто) ----
  // o: { rods: 1..3, opMax: най-голяма цифра в числата (1..9), stateMax: най-голяма цифра на абакуса (4 | 5 | 9),
  //      round: true – само кръгли числа (10, 20… / 100, 200…), tensOnly: числата 10..19 (тема 11–19), count: брой числа }
  const TOPICS = [
    { id: "s2", name: "±1, ±2", rods: 1, opMax: 2, stateMax: 4 }, { id: "s3", name: "±3", rods: 1, opMax: 3, stateMax: 4 },
    { id: "s4", name: "±4", rods: 1, opMax: 4, stateMax: 4 }, { id: "s5", name: "±5", rods: 1, opMax: 5, stateMax: 9 },
    { id: "s6", name: "±6", rods: 1, opMax: 6, stateMax: 9 }, { id: "s7", name: "±7", rods: 1, opMax: 7, stateMax: 9 },
    { id: "s8", name: "±8", rods: 1, opMax: 8, stateMax: 9 }, { id: "s9", name: "±9", rods: 1, opMax: 9, stateMax: 9 },
    { id: "t10", name: "Кръгли десетици 10–90", rods: 2, opMax: 9, stateMax: 9, round: 1 },
    { id: "t19", name: "Числата 11–19", rods: 2, opMax: 9, stateMax: 9, teen: true },
    { id: "d44", name: "Двуцифрени до 44", rods: 2, opMax: 4, stateMax: 4 }, { id: "d55", name: "Двуцифрени до 55", rods: 2, opMax: 5, stateMax: 5 },
    { id: "d66", name: "Двуцифрени до 66", rods: 2, opMax: 6, stateMax: 9 }, { id: "d77", name: "Двуцифрени до 77", rods: 2, opMax: 7, stateMax: 9 },
    { id: "d88", name: "Двуцифрени до 88", rods: 2, opMax: 8, stateMax: 9 },   // старши (7+): новото число и новият разряд заедно
    { id: "d99", name: "Двуцифрени до 99", rods: 2, opMax: 9, stateMax: 9 },
    { id: "h100", name: "Кръгли стотици 100–900", rods: 3, opMax: 9, stateMax: 9, round: 2 },
    { id: "h444", name: "Трицифрени до 444", rods: 3, opMax: 4, stateMax: 4 }, { id: "h555", name: "Трицифрени до 555", rods: 3, opMax: 5, stateMax: 5 },
    { id: "h999", name: "Трицифрени до 999", rods: 3, opMax: 9, stateMax: 9 }];
  const digitsOf = (v, rods) => Array.from({ length: rods }, (_, i) => Math.floor(v / Math.pow(10, i)) % 10);
  function simpleOperands(o) {   // всички допустими числа за темата
    const out = [], max = Math.pow(10, o.rods) - 1;
    for (let n = 1; n <= max; n++) {
      const d = digitsOf(n, o.rods);
      if (d.some(x => x > o.opMax)) continue;
      if (o.round === 1 && n % 10) continue;
      if (o.round === 2 && n % 100) continue;
      if (o.teen && (n < 10 || n > 19) && n > 9) continue;   // 11–19: числата 1..9 и 10..19
      if (o.rods > 1 && !o.round && !o.teen && n < Math.pow(10, o.rods - 1)) continue;   // двуцифрени теми – двуцифрени числа
      out.push(n);
    }
    return out;
  }
  // Правила (10.11.2026, сравнено с тренажора на AMAKids – docs/research/ma-reference/trainer-generator.md):
  //  – само „просто“ движения; при ±1…±4 междинните резултати остават до N (в занятие 1 не се появяват 3 и 4);
  //  – няма еднакво действие подред („+2, +2“); при N ≥ 5 няма обезсилващо действие подред („+3, −3“), освен последното;
  //  – крайният отговор е до N (по разряди), освен при кръгли и 11–19;
  //  – o.must = N: примерът съдържа поне веднъж ±N (новото число на занятието).
  function simpleExample(o, rng) {
    rng = rng || Math.random; const ops = simpleOperands(o), count = Math.max(1, o.count || 5), max = Math.pow(10, o.rods) - 1;
    const N = o.opMax, smax = N < 5 ? Math.min(o.stateMax, N) : o.stateMax, plain = !o.round && !o.teen;
    for (let tries = 0; tries < 600; tries++) {
      let v = 0; const nums = [];
      for (let i = 0; i < count; i++) {
        const cand = [], last = i === count - 1, prev = nums[i - 1];
        for (const n of ops) for (const op of (i === 0 ? ["+"] : ["+", "-"])) {
          const t = op === "+" ? v + n : v - n, x = op === "+" ? n : -n; if (t < 0 || t > max) continue;
          if (digitsOf(t, o.rods).some(d => d > smax)) continue;
          if (x === prev) continue;
          if (N >= 5 && x === -prev && !last) continue;
          if (last && plain && digitsOf(t, o.rods).some(d => d > N)) continue;
          if (plan(v, op, n, o.rods).rule !== "Просто") continue;
          cand.push(x);
        }
        if (!cand.length) break;
        const pick = cand[Math.floor(rng() * cand.length)]; nums.push(pick); v += pick;
      }
      if (nums.length !== count) continue;
      if (o.must && !nums.some(n => Math.abs(n) === o.must)) continue;
      return { nums, answer: v };
    }
    return o.must ? simpleExample({ ...o, must: 0 }, rng) : null;
  }
  // оценка на верига (пример от тренажора): движенията на детето се разделят по стъпки – стъпка свършва, щом абакусът покаже междинния резултат
  // → [{ i, n, from, to, code, rule }] ; code: ok | wrong_method | set_result | ... | not_reached (не стигна до междинния резултат)
  function judgeChain(nums, childMoves, rods) {
    rods = rods || 3; const out = []; let v = 0, st = make(rods), k = 0, seg = [], start = 0;
    let target = nums[0];
    for (const m of childMoves) {
      const ns = apply(st, m); if (!ns) continue; st = ns; seg.push(m);
      if (value(st) === target) {
        const n = nums[k], task = { start, op: n >= 0 ? "+" : "-", n: Math.abs(n), rods }, j = judge(task, seg);
        out.push({ i: k, n, from: start, to: target, code: j.code, rule: j.rule });
        k++; seg = []; start = target; if (k >= nums.length) break; target = start + nums[k];
      }
    }
    if (k < nums.length) out.push({ i: k, n: nums[k], from: start, to: target, code: "not_reached", rule: plan(start, nums[k] >= 0 ? "+" : "-", Math.abs(nums[k]), rods).rule });
    return { steps: out, final: value(st), ok: k >= nums.length && value(st) === nums.reduce((a, b) => a + b, 0) };
  }
  root.ABACUS_ENGINE = { UNITS_LEFT, SIDE, col, make, fromValue, value, rodVal, apply, tapMove, plan, judge, consistent, norm, hints, FEEDBACK, tasksFor, chain, TOPICS, simpleExample, simpleOperands, judgeChain };
})(typeof window !== "undefined" ? window : this);
