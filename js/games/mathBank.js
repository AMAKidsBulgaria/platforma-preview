/* Банки по рунд за игрите по математика (config/math-banks.json, слот „MW05.Р3“) – по модела на readicaBank.js.
   В домашната играта взима задачите от слота на рунда вместо да ги тегли случайно: измерване – набор A при първото минаване,
   B при друга домашна за същия рунд; упражнение – разбъркан practice пул. Без домашна или без слот играта остава както е.
   Играта вика MATH_BANK.attach(this) в start() и чете this.mb = { slot, set, units, def } или null. Формата на units е на играта. */
(function () {
  const URL = "config/math-banks.json?v=5";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()).catch(() => ({ slots: {} })));
  function pickSet(slot, sets, hw) {
    const keys = Object.keys(sets); if (!hw || keys.length < 2) return keys[0];
    const k = "platforma.setfirst." + slot; let first = null;
    try { first = localStorage.getItem(k); if (!first) localStorage.setItem(k, first = hw); } catch (e) {}
    return first && first !== hw ? keys[1] : keys[0];
  }
  function attach(game) {
    game.mb = null; const c = game.ctx || {};
    if (!c.hw || !c.lesson || c.round == null || !String(c.lesson).startsWith("MW")) return Promise.resolve(null);
    return load().then(d => {
      // ключ „слот/игра“; когато в един рунд играта е два пъти (основа + надграждане), второто е „слот/игра/<банка>“
      // и се познава по банката от домашната, а без нея – по диапазона (settings.range)
      const slot = `${c.lesson}.Р${c.round}`, base = `${slot}/${game.gameId}`, all = d.slots || {};
      const fits = x => x && (x.range == null || game.s.range == null || Number(x.range) === Number(game.s.range));
      let def = (c.bank && all[`${base}/${c.bank}`]) || all[base];
      if (def && !fits(def)) def = Object.keys(all).filter(k => k.startsWith(base + "/")).map(k => all[k]).find(fits) || def;
      if (!def || def.game !== game.gameId) return null;
      let set, units;
      if (def.sets) { set = pickSet(def === all[base] ? slot : `${slot}/${def.range}`, def.sets, c.hw); units = def.sets[set].slice(); }
      else { set = "practice"; units = shuffle((def.practice || []).slice()); }
      const key = Object.keys(all).find(k => all[k] === def) || base;   // ключът в банката – за постоянния идентификатор на задачата
      game.mb = { slot, set, units, def, key };
      if (def.sets) game.total = units.length; else if (units.length && game.total > units.length) game.total = units.length;
      return game.mb;
    });
  }
  window.MATH_BANK = { attach, load };
})();
