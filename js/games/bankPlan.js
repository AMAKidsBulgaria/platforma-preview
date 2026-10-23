/* Подбор от банките на Букварика (config/banks-b1-5.json, config/banks-b6-13.json) за една домашна сесия.
   Банката принадлежи на занятие и умение; рундът избира от нея по своите критерии.
   Планът се прави веднъж за цялата сесия, в реда reserve_order (Р3, Р4, Р1, Р2), и се пази,
   за да не се повтаря лексема между измервателните рундове. Р2 (практика) черпи първо от останалите
   и застъпва измерването само при недостиг. Работи и в браузъра, и в node (за тестовете). */
(function (root) {
  const ELEMENTS_GAME = "Буква от елементи";
  // Измерване с по-малко от 4 задачи не се допуска (методист 17.10.2026): при 2–3 нови букви някоя идва с втора грешна форма.
  const elCount = letters => Math.max(letters.length, 4);

  function shuffled(a, rand) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Детерминиран генератор: един и същ ключ на сесията дава един и същ план
  function seeded(key) { let h = 2166136261; for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e9) / 1e9; }; }
  const diffRank = u => { const d = String(u.diff); return d.startsWith("2") ? 2 : 1; };

  function units(bank, lesson) {
    const m = {}; Object.values(bank.pools[lesson] || {}).forEach(list => list.forEach(u => { m[u.id] = u; })); return m;
  }

  // Колко единици показва игра в рунда: горната граница на рунда; „Буква от елементи“ взима по една на буква, останалото е за другата игра.
  function quota(round, entries, letters) {
    const hi = round.shown[1];
    if (round.game === ELEMENTS_GAME) return elCount(letters);
    const hasElements = entries.some(e => e.game === ELEMENTS_GAME);
    return hasElements ? hi - elCount(letters) : hi;
  }

  // Недостиг до долната граница на показваните задачи, по рунд и игра (празно = планът е изпълним)
  function gaps(bank, lesson, plan, letters) {
    const out = [];
    (bank.rounds[lesson] || []).forEach(rd => {
      const entries = bank.rounds[lesson].filter(x => x.round === rd.round);
      const lo = rd.game === ELEMENTS_GAME ? elCount(letters) : rd.shown[0] - (entries.some(e => e.game === ELEMENTS_GAME) ? elCount(letters) : 0);
      const got = ((plan[rd.round] || {})[rd.game] || []).length;
      if (got < lo) out.push({ round: rd.round, game: rd.game, need: lo, got, measurement: rd.role === "измерване",
        reason: `${lesson} Р${rd.round} „${rd.game}“: ${got} от нужните ${lo} – в банката няма достатъчно единици, които не се повтарят в сесията` });
    });
    return out;
  }
  function shortfall(bank, lesson, plan, letters) { return gaps(bank, lesson, plan, letters).reduce((a, g) => a + g.need - g.got, 0); }
  // Пулът на някои занятия е точно колкото трябва (Б1): при недостиг се опитва друг избор, най-много 60 пъти.
  function planLesson(bank, lesson, key) {
    const n = Number(lesson.replace(/\D/g, "")), letters = (bank.letters[n] || bank.letters[String(n)] || "").split("");
    let best = null, bestMiss = Infinity;
    for (let k = 0; k < 60 && bestMiss > 0; k++) {
      const p = planOnce(bank, lesson, (key || lesson) + (k ? "#" + k : "")), m = shortfall(bank, lesson, p, letters);
      if (m < bestMiss) { best = p; bestMiss = m; }
    }
    // Изричен отказ: не се допълва със случайни или повтарящи се задачи. Планът казва какво не стига и защо;
    // играта показва наличното, а рундът с недостиг в измерването не се брои за измерване (measurement_valid: false).
    if (bestMiss > 0) best._shortfall = gaps(bank, lesson, best, letters);
    return best;
  }

  function planOnce(bank, lesson, key) {
    const rand = seeded(key || lesson), U = units(bank, lesson), rounds = bank.rounds[lesson] || [];
    const n = Number(lesson.replace(/\D/g, "")), letters = (bank.letters[n] || bank.letters[String(n)] || "").split("");
    const used = new Set(), plan = {};
    const order = rounds.slice().sort((a, b) => a.reserve_order - b.reserve_order || (a.game === ELEMENTS_GAME) - (b.game === ELEMENTS_GAME));
    order.forEach(rd => {
      const entries = rounds.filter(x => x.round === rd.round);
      // пилотните единици (непотвърдена картинка/познатост) не влизат в измерване – само в упражнение
      const pilot = new Set(bank.pilot || []), isPilot = u => u.pilot || (u.lexemes || []).some(x => pilot.has(String(x).toLowerCase()));
      const pool = rd.eligible.map(id => U[id]).filter(Boolean).filter(u => rd.role !== "измерване" || !isPilot(u));
      let pick;
      if (rd.game === ELEMENTS_GAME) {
        // една грешна форма на буква (видът е случаен сред разрешените); докато не станат 4, буквите се повтарят с друга форма
        pick = [];
        for (let k = 0; k < elCount(letters) * 2 && pick.length < elCount(letters); k++) {
          const t = letters[k % letters.length], c = pool.filter(u => u.target === t && !pick.includes(u));
          if (c.length) pick.push(c[Math.floor(rand() * c.length)]);
        }
      } else {
        const need = Math.min(quota(rd, entries, letters), pool.length);
        const fresh = u => u.lexemes.every(x => !used.has(x));
        // единиците, нужни и на още непланирани измервателни рундове, отиват последни, за да стигне пулът за всички
        const later = new Set(order.slice(order.indexOf(rd) + 1).filter(x => x.role === "измерване" && x.round !== rd.round)
          .flatMap(x => x.eligible.map(id => U[id]).filter(Boolean).flatMap(u => u.lexemes)));
        const sh = shuffled(pool, rand).map((u, i) => [u.lexemes.some(x => later.has(x)) ? 1 : 0, i, u]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
        if (rd.contrast_max != null) {
          // Б5 Р3: всяка нова буква е верен отговор поне new_letter_min_each пъти, контрастните са най-много contrast_max
          const direct = sh.filter(u => !u.contrast_task), contrast = sh.filter(u => u.contrast_task);
          pick = [];
          letters.forEach(t => direct.filter(u => (u.choices || [])[0] === t).slice(0, rd.new_letter_min_each).forEach(u => pick.push(u)));
          const rest = direct.filter(u => !pick.includes(u)).concat(contrast.slice(0, rd.contrast_max));
          shuffled(rest, rand).forEach(u => { if (pick.length < need && (!u.contrast_task || pick.filter(x => x.contrast_task).length < rd.contrast_max)) pick.push(u); });
        } else if (rd.role === "практика") {
          pick = sh.filter(fresh).concat(sh.filter(u => !fresh(u))).slice(0, need);
        } else {
          // измерване: всяка нова буква на занятието е верен отговор поне MIN_EACH пъти (ако пулът позволява), за да я има
          // във всяка сесия – 2 пъти в Р3 (основното измерване), веднъж в другите рундове, за да остане и за тях (Б1: И има 6 думи);
          // останалото се пълни по реда на sh – първо единиците, които не трябват на следващите рундове.
          const fr = sh.filter(fresh), MIN_EACH = rd.round === 3 ? 2 : 1;
          // и в самия рунд лексема не се повтаря (двойките „Общ звук“ споделят думи: играчки + игрище, игла + играчки)
          pick = []; const inPick = new Set();
          const take = u => { if (pick.length >= need || pick.includes(u) || u.lexemes.some(x => inPick.has(x))) return false; pick.push(u); u.lexemes.forEach(x => inPick.add(x)); return true; };
          letters.forEach(t => { let n = 0; fr.filter(u => u.target === t).forEach(u => { if (n < MIN_EACH && take(u)) n++; }); });
          fr.forEach(take);
        }
        pick.sort((a, b) => diffRank(a) - diffRank(b));
      }
      pick.forEach(u => u.lexemes.forEach(x => used.add(x)));
      (plan[rd.round] = plan[rd.round] || {})[rd.game] = pick.map(u => u.id);
    });
    return plan;
  }

  // Кой запис от банката отговаря на играта от домашната: „Буква от елементи“ по име, всичко друго е другата игра на рунда.
  // Когато в рунда има две игри освен „Буква от елементи“ (Б6 Р4), се търси по името на играта.
  // Записът в банката носи името на механиката (изгледа), не на шаблона: soundLetterParsing отваря „Първа буква“, „Чета и чувам“ или „Чувам звук, избирам буква“.
  const NAMES = { trueWords: ["Правилни думи"], phonetics: ["Фонетика"], constructor: ["Конструктор"], wordOrder: ["Словоред"],
    soundLetterParsing: ["Първа буква", "Чета и чувам", "Чувам звук, избирам буква"],
    phonemicHearing: ["Фонематичен слух"], buildSentence: ["Построй изречение"], alphabet: ["Азбука"], conformity: ["Съответствие"],
    words: ["Каква е думата?"] };
  function bankGameFor(bank, lesson, round, gameId) {
    const list = (bank.rounds[lesson] || []).filter(x => x.round === Number(round));
    if (gameId === "letterOfElements") return list.find(x => x.game === ELEMENTS_GAME) || null;
    return list.find(x => (NAMES[gameId] || []).some(n => x.game.startsWith(n))) || list.find(x => x.game !== ELEMENTS_GAME) || null;
  }

  // Запазен план от по-стара банка: всяка единица трябва да я има и сега, а измерването – без пилотни единици.
  // Иначе банката е прегенерирана (същата version) и планът се прави наново.
  function stillValid(bank, lesson, plan) {
    if (!plan || typeof plan !== "object") return false;
    const U = units(bank, lesson), pilot = new Set(bank.pilot || []);
    const isPilot = u => u.pilot || (u.lexemes || []).some(x => pilot.has(String(x).toLowerCase()));
    return (bank.rounds[lesson] || []).every(rd => {
      const ids = (plan[rd.round] || {})[rd.game];
      return Array.isArray(ids) && ids.every(id => U[id] && rd.eligible.includes(id) && (rd.role !== "измерване" || !isPilot(U[id])));
    });
  }

  const api = { planLesson, stillValid, bankGameFor, units, gaps, elCount, ELEMENTS_GAME, seeded };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BANK_PLAN = api;
})(typeof window !== "undefined" ? window : globalThis);
