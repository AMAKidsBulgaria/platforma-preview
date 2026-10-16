/* Грешни форми на буквите за „Буква от елементи“ (Букварика 1–13), начертани от щрихите в letterOfElements.js.
   Видовете за всяка буква идват от банката (error_types_by_letter): огледална форма, липсващ елемент, излишен елемент.
   Тук е само кой щрих липсва и кой се добавя; огледалната е отражение по вертикалата. */
(function () {
  // липсващ елемент: индекс на щриха, който се маха
  const MISS = { "А": 2, "У": 0, "И": 1, "О": 1, "Е": 3, "Ъ": 1, "М": 2, "Н": 2, "Л": 0, "Р": 0, "Й": 3, "Ю": 1, "Я": 2,
    // Б6–Б13: избрано така, че липсата да не дава друга буква (Б без горна черта = Ь, Щ без опашка = Ш и т.н.)
    "Б": 0, "В": 0, "Г": 1, "Д": 1, "Ж": 2, "З": 0, "К": 1, "П": 1, "Т": 0, "Ф": 2, "Х": 1, "Ц": 3, "Ч": 1, "Ш": 1, "Ь": 1 };
  // излишен елемент: щрих, който се добавя (в същото поле 100x150)
  const EXTRA = {
    "А": "M36 58 H64", "У": "M28 135 H48", "И": "M22 15 H80", "О": "M14 75 H86", "Е": "M22 44 H66", "Ъ": "M40 15 H66",
    "М": "M14 105 H86", "Н": "M22 42 H80", "Л": "M14 135 H82", "Р": "M40 77 L80 135", "Й": "M22 30 H80", "Ю": "M14 105 H34", "Я": "M80 135 H96",
    "Б": "M80 15 V40", "В": "M60 70 H88", "Г": "M82 15 V42", "Д": "M40 60 H76", "Ж": "M14 135 H86", "З": "M54 70 H82", "К": "M22 15 H52",
    "П": "M22 75 H80", "С": "M84 114 V92", "Т": "M14 135 H86", "Ф": "M30 135 H70", "Х": "M14 75 H86", "Ц": "M22 15 H82", "Ч": "M66 135 H96",
    "Ш": "M20 15 H80", "Щ": "M20 15 H84", "Ь": "M12 72 H30"
  };
  const VARIANT = { mirror: "огледална форма", miss: "липсващ елемент", extra: "излишен елемент" };

  function strokes(t, variant) {
    const base = (window.LETTER_STROKES || {})[t] || [];
    if (variant === VARIANT.miss) return base.filter((_, i) => i !== MISS[t]);
    if (variant === VARIANT.extra) return base.concat(EXTRA[t] ? [EXTRA[t]] : []);
    return base;
  }
  // SVG на буквата: правилна (variant празно) или в грешна форма
  window.LETTER_FORM = function (t, variant, cls) {
    const mirror = variant === VARIANT.mirror;
    const paths = strokes(t, variant).map(d => `<path d="${d}"/>`).join("");
    return `<svg class="lf ${cls || ""}" viewBox="-6 0 112 150" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"${mirror ? ' transform="translate(100 0) scale(-1 1)"' : ""}>${paths}</g></svg>`;
  };
  window.LETTER_FORM_VARIANTS = VARIANT;
})();
