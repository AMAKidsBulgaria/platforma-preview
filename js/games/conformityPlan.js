/* Подбор за „Съответствие“ от банката (config/conformity-bank-draft.json): общ пул по занятие + правила за допустимост.
   Двойката изброява рундовете, за които е допустима (eligible_rounds); планът на занятието се прави веднъж за сесията,
   измервателните рундове първи (по slot.order), без повторение между тях и без двойки, които детето вече е видяло в измерване.
   Практиката черпи първо от неизползваните и застъпва само при недостиг. Временните замени (fallback) теглят от занятия
   до текущото и могат да повтарят. Работи и в браузъра, и в jsc (за тестовете). */
(function (root) {
  function shuffled(a, rand) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function seeded(key) { let h = 2166136261; for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e9) / 1e9; }; }
  // поредност на занятията: Букварика, после Читарика (математиката не ползва играта)
  const lessonIndex = id => { const n = Number(String(id).slice(2)); return id.startsWith("BK") ? n : id.startsWith("CH") ? 14 + n : 100 + n; };
  const eligible = p => p.eligible_rounds || p.slots || [];
  const usable = p => p.pilot_status !== "rejected";

  function slotsOf(bank, lesson) {
    return Object.entries(bank.slots || {}).filter(([k, s]) => k.startsWith(lesson + ".") && !s.fallback)
      .map(([k, s]) => Object.assign({ key: k }, s)).sort((a, b) => (a.order || 9) - (b.order || 9) || (b.measurement ? 1 : 0) - (a.measurement ? 1 : 0));
  }

  function planOnce(bank, lesson, seen, key) {
    const rand = seeded(key), slots = slotsOf(bank, lesson), used = new Set(), plan = {};
    slots.forEach((sl, si) => {
      const measOk = p => p.measurement_ok !== false && !p.pilot_only && !p.practice_only;
      let pool = bank.pairs.filter(p => usable(p) && eligible(p).includes(sl.key) && (!sl.measurement || measOk(p)));
      const lv = pool.filter(p => p.level === sl.level); if (lv.length) pool = lv;
      const pr = sl.prefer || {};
      if (pr.strict && pr.reading_demand) pool = pool.filter(p => pr.reading_demand.includes(p.reading_demand));
      // нужни и на следващите измервателни рундове на занятието → последни
      const later = new Set(slots.slice(si + 1).filter(x => x.measurement).flatMap(x => bank.pairs.filter(p => eligible(p).includes(x.key)).map(p => p.id)));
      const prefer = pr.reading_demand || null, easy = pr.difficulty || null;
      const rank = p => (later.has(p.id) ? 4 : 0) + (prefer && !prefer.includes(p.reading_demand) ? 2 : 0) + (easy && !easy.includes(p.difficulty) ? 1 : 0);
      const sh = shuffled(pool, rand).map((p, i) => [rank(p), i, p]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
      let pick;
      if (sl.measurement) {
        const fresh = sh.filter(p => !used.has(p.id) && !seen.has(p.id)), seenOnly = sh.filter(p => !used.has(p.id) && seen.has(p.id));
        // резерв: по-ниско ниво от занятия до текущото, само когато невидените от нивото на рунда не стигат
        let lower = [];
        if (fresh.length < sl.items) { const li = lessonIndex(lesson); lower = shuffled(bank.pairs.filter(p => usable(p) && measOk(p) && p.level < sl.level && !used.has(p.id) && !seen.has(p.id) && eligible(p).some(k => lessonIndex(k.split(".")[0]) <= li)), rand); }
        pick = fresh.concat(lower, seenOnly).slice(0, sl.items);
        // min_share: поне този дял от изтеглените е с предпочитаното четене (CH16: отношение / цялостен смисъл)
        if (prefer && pr.min_share) {
          const need = Math.ceil(pr.min_share * pick.length), good = p => prefer.includes(p.reading_demand);
          const extra = fresh.concat(seenOnly).filter(p => good(p) && !pick.includes(p));
          while (pick.filter(good).length < need && extra.length) { const i = pick.map(good).lastIndexOf(false); if (i < 0) break; pick[i] = extra.shift(); }
        }
      } else pick = sh.filter(p => !used.has(p.id)).concat(sh.filter(p => used.has(p.id))).slice(0, sl.items);
      pick.sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
      pick.forEach(p => used.add(p.id));
      plan[sl.key] = pick.map(p => p.id);
    });
    return plan;
  }
  // колко липсват до нужното и колко вече видени попадат в измерване (по-малко е по-добре)
  function cost(bank, lesson, plan, seen) {
    let c = 0; slotsOf(bank, lesson).forEach(sl => { const ids = plan[sl.key] || []; c += (sl.items - ids.length) * 100; if (sl.measurement) c += ids.filter(id => seen.has(id)).length; }); return c;
  }
  function planLesson(bank, lesson, seen, key) {
    seen = seen || new Set(); let best = null, bc = Infinity;
    for (let k = 0; k < 30 && bc > 0; k++) { const p = planOnce(bank, lesson, seen, (key || lesson) + (k ? "#" + k : "")), c = cost(bank, lesson, p, seen); if (c < bc) { best = p; bc = c; } }
    return best;
  }
  // временна замяна: двойки от занятия до текущото, в нивото на рунда; повторения са допустими
  function fallbackPool(bank, lesson, level, exclude) {
    const li = lessonIndex(lesson), ex = exclude || [];
    const ok = bank.pairs.filter(p => usable(p) && eligible(p).some(k => lessonIndex(k.split(".")[0]) <= li) && !eligible(p).some(k => ex.includes(k)));
    const lv = ok.filter(p => p.level === level); return lv.length >= 4 ? lv : ok;
  }

  const api = { planLesson, fallbackPool, slotsOf, lessonIndex, seeded };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CF_PLAN = api;
})(typeof window !== "undefined" ? window : globalThis);
