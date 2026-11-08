/* Текстовете на треньора (соробан) – на едно място, за да може да се изброят всички и да се озвучат предварително
   (tools/abacus_audio.py → assets/audio/abacus/*.mp3, config/abacus-audio.json).
   Изговорените текстове избягват „абакуса/абакусът“ – синтезираният глас слага грешно ударение в членуваните форми (8.11.2026); „абакус“ е наред. Подсказките и обратната връзка за грешките са в engine.js. */
(function (root) {
  const T = {
    free: "Докосни топчетата и покажи число.",
    ok: "Браво! Точно така.",
    okTogether: "Браво! Точно така. Опитай да местиш топчетата заедно.",
    now: "Сега ти!",
    look: "Гледай!",
    whatNumber: "Какво число беше?",
    lookRemember: "Гледай и запомни!",
    rebuild: "Нареди топчетата така, както бяха. После натисни Готово.",
    mentalBuild: "Нареди топчетата, както са сега в ума ти. После натисни Готово.",
    start: (a, op, n) => `Имаме ${a}. ${op === "+" ? "Добави" : "Махни"} ${n}.`,
    chainStart: (a, op, n) => `Имаме ${a}. Първо ${op === "+" ? "плюс" : "минус"} ${n}.`,
    chainNext: (op, n) => `Добре! Сега ${op === "+" ? "плюс" : "минус"} ${n}.`,
    op: (op, n) => `${op === "+" ? "плюс" : "минус"} ${n}`,
    remember: (a) => `Запомни: ${a}.`,
    flashWrong: (v) => `Това е числото ${v}. Погледни го още веднъж.`,
    showWrong: (v) => `Правилният отговор е ${v}. Ето как изглежда.`,
    demo: (moves) => "Гледай: " + moves.map(m => (m.d > 0 ? "плюс " : "минус ") + Math.abs(m.d)).join(", ") + ".",
    number: (v) => String(v)
  };
  // всички изречения, които прототипът може да каже (за една пръчка: стойности 0..9; числата за отговорите – до 99)
  T.all = function (E) {
    const out = new Set(Object.values(T).filter(v => typeof v === "string"));
    for (let a = 0; a <= 9; a++) for (let n = 1; n <= 9; n++) for (const op of ["+", "-"]) {
      const t = op === "+" ? a + n : a - n; if (t < 0 || t > 9) continue;
      out.add(T.start(a, op, n)); out.add(T.chainStart(a, op, n));
      const task = { start: a, op, n, rods: 1 }; E.hints(task).forEach(h => out.add(h));
      out.add(T.demo(E.plan(a, op, n, 1).moves));
    }
    for (let n = 1; n <= 9; n++) for (const op of ["+", "-"]) { out.add(T.chainNext(op, n)); out.add(T.op(op, n)); }
    for (let v = 0; v <= 9; v++) out.add(T.remember(v));
    for (let v = 0; v <= 99; v++) { out.add(T.flashWrong(v)); out.add(T.showWrong(v)); out.add(T.number(v)); }
    Object.values(E.FEEDBACK).forEach(f => out.add(f));
    return [...out];
  };
  root.ABACUS_TEXTS = T;
})(typeof window !== "undefined" ? window : this);
