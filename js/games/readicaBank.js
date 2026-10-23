/* Банки на Читарика по рунд (config/readica-banks.json, слот „CH05.Р3“).
   В домашната речниковите игри (accents, words, sayDifferently, trueWords, buildSentence, wordOrder, constructor) взимат думите
   от слота на рунда вместо от общия речник: измерване – набор A при първото минаване, B при друга домашна за същия рунд;
   упражнение – разбъркан practice пул. Без домашна (свободна игра) или без слот играта остава на общия речник.
   Играта вика READICA_BANK.attach(this) в start() и чете this.rb = { slot, set, units, distractors, def } или null. */
(function () {
  const URL = "config/readica-banks.json?v=7";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()).catch(() => ({ slots: {} })));
  // набор за рунда: A първия път, B при друга домашна за същия рунд (стабилно на устройството) – както в sentenceTasks.js
  function pickSet(slot, sets, hw) {
    const keys = Object.keys(sets); if (!hw || keys.length < 2) return keys[0];
    const k = "platforma.setfirst." + slot; let first = null;
    try { first = localStorage.getItem(k); if (!first) localStorage.setItem(k, first = hw); } catch (e) {}
    return first && first !== hw ? keys[1] : keys[0];
  }
  function attach(game) {
    game.rb = null; const c = game.ctx || {};
    if (!c.hw || !c.lesson || c.round == null || !String(c.lesson).startsWith("CH")) return Promise.resolve(null);
    return load().then(d => {
      const slot = `${c.lesson}.Р${c.round}`, def = (d.slots || {})[slot];
      if (!def || def.game !== game.gameId) return null;
      let set, units;
      if (def.sets) { set = pickSet(slot, def.sets, c.hw); units = shuffle(def.sets[set].slice()); }
      else { set = "practice"; units = shuffle((def.practice || []).slice()); }
      game.rb = { slot, set, units, distractors: def.distractors || null, def, names: d.proper_names || [] };
      if (def.sets) game.total = units.length;   // измерване: целият набор, нито повече, нито по-малко
      return game.rb;
    });
  }
  window.READICA_BANK = { attach, load };
})();
