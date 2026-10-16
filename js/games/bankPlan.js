/* Подбор от банките на Букварика (config/banks-b1-5.json, config/banks-b6-13.json) за една домашна сесия.
   Банката принадлежи на занятие и умение; рундът избира от нея по своите критерии.
   Планът се прави веднъж за цялата сесия, в реда reserve_order (Р3, Р4, Р1, Р2), и се пази,
   за да не се повтаря лексема между измервателните рундове. Р2 (практика) черпи първо от останалите
   и застъпва измерването само при недостиг. Работи и в браузъра, и в node (за тестовете). */
(function (root) {
  const ELEMENTS_GAME = "Буква от елементи";

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
    if (round.game === ELEMENTS_GAME) return letters.length;
    const hasElements = entries.some(e => e.game === ELEMENTS_GAME);
    return hasElements ? hi - letters.length : hi;
  }

  // Колко липсва до долната граница на показваните задачи (0 = планът е изпълним)
  function shortfall(bank, lesson, plan, letters) {
    let miss = 0;
    (bank.rounds[lesson] || []).forEach(rd => {
      const entries = bank.rounds[lesson].filter(x => x.round === rd.round);
      const lo = rd.game === ELEMENTS_GAME ? letters.length : rd.shown[0] - (entries.some(e => e.game === ELEMENTS_GAME) ? letters.length : 0);
      miss += Math.max(0, lo - ((plan[rd.round] || {})[rd.game] || []).length);
    });
    return miss;
  }
  // Пулът на някои занятия е точно колкото трябва (Б1): при недостиг се опитва друг избор, най-много 60 пъти.
  function planLesson(bank, lesson, key) {
    const n = Number(lesson.replace(/\D/g, "")), letters = (bank.letters[n] || bank.letters[String(n)] || "").split("");
    let best = null, bestMiss = Infinity;
    for (let k = 0; k < 60 && bestMiss > 0; k++) {
      const p = planOnce(bank, lesson, (key || lesson) + (k ? "#" + k : "")), m = shortfall(bank, lesson, p, letters);
      if (m < bestMiss) { best = p; bestMiss = m; }
    }
    return best;
  }

  function planOnce(bank, lesson, key) {
    const rand = seeded(key || lesson), U = units(bank, lesson), rounds = bank.rounds[lesson] || [];
    const n = Number(lesson.replace(/\D/g, "")), letters = (bank.letters[n] || bank.letters[String(n)] || "").split("");
    const used = new Set(), plan = {};
    const order = rounds.slice().sort((a, b) => a.reserve_order - b.reserve_order || (a.game === ELEMENTS_GAME) - (b.game === ELEMENTS_GAME));
    order.forEach(rd => {
      const entries = rounds.filter(x => x.round === rd.round);
      const pool = rd.eligible.map(id => U[id]).filter(Boolean);
      let pick;
      if (rd.game === ELEMENTS_GAME) {
        // една грешна форма на буква, видът е случаен сред разрешените за буквата
        pick = letters.map(t => { const c = pool.filter(u => u.target === t); return c.length ? c[Math.floor(rand() * c.length)] : null; }).filter(Boolean);
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
          pick = sh.filter(fresh).slice(0, need);
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
  const NAMES = { trueWords: "Правилни думи", phonetics: "Фонетика", constructor: "Конструктор", wordOrder: "Словоред", soundLetterParsing: "Звуково-буквен анализ",
    phonemicHearing: "Фонематичен слух", buildSentence: "Построй изречение", alphabet: "Азбука", conformity: "Съответствие" };
  function bankGameFor(bank, lesson, round, gameId) {
    const list = (bank.rounds[lesson] || []).filter(x => x.round === Number(round));
    if (gameId === "letterOfElements") return list.find(x => x.game === ELEMENTS_GAME) || null;
    return list.find(x => NAMES[gameId] && x.game.startsWith(NAMES[gameId])) || list.find(x => x.game !== ELEMENTS_GAME) || null;
  }

  const api = { planLesson, bankGameFor, units, ELEMENTS_GAME, seeded };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BANK_PLAN = api;
})(typeof window !== "undefined" ? window : globalThis);
