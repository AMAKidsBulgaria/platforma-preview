/* Постоянен идентификатор на задачата в записите (техническа спецификация v1.0, корекция 1; config/item-registry.json).
   Идентичността е съдържанието, не позицията: банки Б1–Б14 и Светът – по id на задачата; Читарика и Математика – по отпечатък
   на съдържанието в слота (canon + FNV-1a, същите като в tools/item_registry.py). Регистърът се зарежда само в домашна.
   Играта може да посочи текущата задача изрично с this.curUnit; иначе се взима по реда на банката. */
(function () {
  const URL = "config/item-registry.json?v=9";
  let reg = null, loading = null;
  const load = () => loading || (loading = fetch(URL).then(r => r.json()).then(d => (reg = d)).catch(() => null));
  function canon(x) {
    if (Array.isArray(x)) return "[" + x.map(canon).join(",") + "]";
    if (x && typeof x === "object") return "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + canon(x[k])).join(",") + "}";
    return JSON.stringify(x);
  }
  function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); }
  const XTAG = { editSentence: "sentence", wordContext: "sentence", conventions: "sentence", text: "text", story: "story", intonation: "intonation", sequence: "sequence", conformity: "conformity" };
  function look(ctx, key) { const m = reg && reg.ctx[ctx]; return m ? m[key] || null : null; }
  function of(g, extra) {
    if (!reg) return null; extra = extra || {};
    if (extra.unit_id && String(g.ctx && g.ctx.lesson || "").startsWith("MW")) return look("W", extra.unit_id);
    if (g.u && g.u.id && g.lesson) return look("B|" + g.lesson, g.u.id);
    // Читарика – банки с id на задачата: текущата задача е this.items[this.idx] (записът става преди idx++)
    // собствено свойство: XTAG["constructor"] иначе е Object (наследено) и „Конструктор“ губеше uid-а си
    const tag = Object.prototype.hasOwnProperty.call(XTAG, g.gameId) ? XTAG[g.gameId] : null;
    if (tag) {
      const it = g.items && g.items[g.idx] || {};
      const id = tag === "conformity" ? g.cur && g.cur.it && g.cur.it.id
        : tag === "intonation" && it.sc ? `${it.sc.id}:${it.line && it.line.n}`
        : it.type === "order" && tag === "story" ? `${g.d && g.d.id || "story"}:${g.view || ""}`
        : it.type === "line" && tag === "story" && g.d ? `${g.d.id || "story"}:line:${(g.d.lines || []).indexOf(it.l)}`   // „Кой казва?“ – реплика по място в историята
        : tag === "text" && it.t && (it.type === "title" || it.type === "keywords") ? `${it.t.id}:${it.type}`   // „заглавие“, „ключови думи“ – една задача на текст
        : tag === "text" && it.type === "ask" && it.t && it.a ? `${it.t.id}:ask:${it.a.id}`
        : it.q && it.q.id || it.id;
      return id ? look("X|" + tag, id) : null;
    }
    const b = g.rb ? { tag: "R", slot: g.rb.slot, units: g.rb.units } : g.mb ? { tag: "M", slot: g.mb.key || g.mb.slot, units: g.mb.units } : null;
    if (!b || !b.units || !b.units.length) return null;
    let u = g.curUnit;
    if (u === undefined) u = b.tag === "R" && g.k != null ? b.units[(g.k - 1 + b.units.length) % b.units.length] : b.units[(g.idx || 0) % b.units.length];
    return u == null ? null : look(b.tag + "|" + b.slot, fnv(canon(u)));
  }
  window.ITEM_UID = { load, of, canon, fnv, version: () => reg && reg.bank_version, info: uid => reg && reg.items[uid] };
  // в домашна регистърът се зарежда веднага (малко преди първата задача)
  if (/[?&#~]hw[=_]/.test(location.search + location.hash)) load();
})();
