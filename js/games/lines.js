/* Линии и измерване (lines, M7). Четири режима (settings.view) – четири действия, всяко със свое заглавие (js/games/modes.js):
     line_kind     „Права или крива?“        – една линия (в измерването чиста, в упражнението и предмет: път, въже, змия, дъга, линийка);
     compare       „Сравни и покажи“         – два предмета от един вид, в еднакво положение; гласът пита „Коя лента е по-дълга?“;
     measure       „Измери“                  – предмет с наредени еднакви мерки (само кубчета или само кламери); детето избира числото;
     measure_check „Кое е измерено правилно?“ – три реда с мерки под един предмет: правилно и с по една грешка (празнина, припокриване, не от края).
   Една задача = едно решение (първият опит); при грешка – опит отново, след 2 грешки верният мига. Видът грешка се записва (error_type).
   Домашна (MATH_BANK, tools/math_banks/lines.py): задачите идват от слота на рунда; в упражнението на compare лесните подравнени двойки са първи. */
(function () {
  const U = 60; // ширината на една мярка в точки на картинката
  const OBJ = { // име, род (ж/м/ср), членувано
    ribbon: ["лента", "f", "лентата"], stick: ["пръчка", "f", "пръчката"], scarf: ["шал", "m", "шалът"], caterpillar: ["гъсеница", "f", "гъсеницата"],
    train: ["влакче", "n", "влакчето"], spoon: ["лъжица", "f", "лъжицата"], snake: ["змия", "f", "змията"], tower: ["кула", "f", "кулата"],
    tree: ["дърво", "n", "дървото"], door: ["врата", "f", "вратата"], window: ["прозорец", "m", "прозорецът"]
  };
  const ADJ = { longer: ["по-дълга", "по-дълъг", "по-дълго"], shorter: ["по-къса", "по-къс", "по-късо"], taller: ["по-висока", "по-висок", "по-високо"],
    lower: ["по-ниска", "по-нисък", "по-ниско"], wider: ["по-широка", "по-широк", "по-широко"], narrower: ["по-тясна", "по-тесен", "по-тясно"] };
  const LONG = { f: "дълга", m: "дълъг", n: "дълго" };
  const G = { f: 0, m: 1, n: 2 }, WHICH = ["Коя", "Кой", "Кое"];
  const UNIT = { cube: ["кубчета", "кубче", "кубчетата", "кубчета"], clip: ["кламера", "кламер", "кламерите", "кламери"] };   // след „колко“ / ед. ч. / членувано / след „с“
  const NUM = ["нула", "едно", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет", "десет"];

  // ---------- линии ----------
  const PATH = {
    line: "M-220 0 L220 0", arc: "M-220 50 Q0 -130 220 50", wave: "M-220 0 C-150 -90 -80 90 0 0 S150 -90 220 0",
    s: "M-220 45 C-20 45 20 -45 220 -45", bend: "M-220 12 Q0 -42 220 12", hook: "M-190 -70 C190 -70 210 90 -10 70"
  };
  function lineSvg(u) {
    const d = PATH[u.form] || PATH.line, k = Math.abs(u.angle) > 45 ? 0.85 : 1;
    let body;
    switch (u.obj) {
      case "road": body = `<path d="${d}" stroke="#8A8F96" stroke-width="54"/><path d="${d}" stroke="#fff" stroke-width="5" stroke-dasharray="22 18"/>`; break;
      case "rope": body = `<path d="${d}" stroke="#C08A4A" stroke-width="16"/><path d="${d}" stroke="#8A5A28" stroke-width="16" stroke-dasharray="5 9"/>`; break;
      case "snake": body = `<path d="${d}" stroke="#2E9C5A" stroke-width="30"/><path d="${d}" stroke="#F5C320" stroke-width="8" stroke-dasharray="4 26"/><g class="geo-lhead"></g>`; break;
      case "rainbow": body = ["#E2493F", "#F08A24", "#F5C320", "#22A56A", "#2F7FE0"].map((c, i) => `<path d="${d}" stroke="${c}" stroke-width="${70 - i * 14}" stroke-linecap="butt"/>`).join(""); break;
      case "ruler": body = `<path d="${d}" stroke="#F5C320" stroke-width="56" stroke-linecap="butt"/><path d="${d}" transform="translate(0 -14)" stroke="#6B4E1E" stroke-width="22" stroke-dasharray="3 19" stroke-linecap="butt"/>`; break;
      case "stick": body = `<path d="${d}" stroke="#8A5A28" stroke-width="18"/>`; break;
      case "thread": body = `<path d="${d}" stroke="#E2493F" stroke-width="5"/>`; break;
      default: body = `<path d="${d}" stroke="${u.color || "#2F7FE0"}" stroke-width="12"/>`;
    }
    return `<svg class="geo-lsvg" viewBox="0 0 600 460" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(300 230) rotate(${u.angle || 0}) scale(${k})">${body}</g></svg>`;
  }
  const ICON = {
    straight: '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M10 30 L110 30" stroke="#3B2A14" stroke-width="8" stroke-linecap="round" fill="none"/></svg>',
    curved: '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M10 30 C30 0 50 0 60 30 S90 60 110 30" stroke="#3B2A14" stroke-width="8" stroke-linecap="round" fill="none"/></svg>'
  };

  // ---------- предмети за сравняване и мерене (дължина len в мерки U) ----------
  function hObj(obj, x, y, w) { // хоризонтален предмет от x до x+w; y – средата
    switch (obj) {
      case "ribbon": return `<path d="M${x} ${y - 17} H${x + w} L${x + w - 12} ${y} L${x + w} ${y + 17} H${x} L${x + 12} ${y} Z" fill="#E2493F"/>`;
      case "stick": return `<rect x="${x}" y="${y - 9}" width="${w}" height="18" rx="9" fill="#8A5A28"/><circle cx="${x + w * .3}" cy="${y}" r="3" fill="#5E3A16"/>`;
      case "scarf": { let s = `<rect x="${x}" y="${y - 20}" width="${w}" height="40" rx="4" fill="#2F7FE0"/>`; for (let i = x + 24; i < x + w - 10; i += 48) s += `<rect x="${i}" y="${y - 20}" width="14" height="40" fill="#F5C320"/>`; return s; }
      case "caterpillar": { let s = "", r = 18, n = Math.max(2, Math.round(w / (r * 2))), st = w / n; for (let i = 0; i < n; i++) s += `<circle cx="${x + st * i + st / 2}" cy="${y}" r="${st / 2}" fill="${i === n - 1 ? "#5DB85C" : "#7ED07A"}" stroke="#3E8E3C" stroke-width="2"/>`; return s + `<circle cx="${x + w - st * .35}" cy="${y - 4}" r="3.5" fill="#222"/>`; }
      case "train": { let s = "", n = Math.max(1, Math.round(w / 120)), cw = w / n; for (let i = 0; i < n; i++) s += `<rect x="${x + cw * i + 2}" y="${y - 22}" width="${cw - 4}" height="34" rx="5" fill="${i === 0 ? "#E2493F" : "#2F7FE0"}"/><circle cx="${x + cw * i + cw * .27}" cy="${y + 16}" r="8" fill="#333"/><circle cx="${x + cw * i + cw * .73}" cy="${y + 16}" r="8" fill="#333"/>`; return s; }
      case "spoon": return `<ellipse cx="${x + 34}" cy="${y}" rx="34" ry="20" fill="#B8C0C8"/><rect x="${x + 60}" y="${y - 6}" width="${w - 60}" height="12" rx="6" fill="#B8C0C8"/>`;
      case "snake": return `<path d="M${x + 14} ${y} H${x + w - 14}" stroke="#2E9C5A" stroke-width="26" stroke-linecap="round"/><circle cx="${x + w - 16}" cy="${y - 3}" r="3.5" fill="#222"/>`;
    }
    return `<rect x="${x}" y="${y - 15}" width="${w}" height="30" fill="#999"/>`;
  }
  function vObj(obj, cx, base, h, w) { // вертикален предмет с основа base; h – височина, w – ширина
    switch (obj) {
      case "tower": { let s = "", n = Math.max(1, Math.round(h / 40)), bh = h / n; for (let i = 0; i < n; i++) s += `<rect x="${cx - 35}" y="${base - bh * (i + 1)}" width="70" height="${bh - 2}" rx="4" fill="${i % 2 ? "#F5C320" : "#E2493F"}"/>`; return s; }
      case "tree": return `<rect x="${cx - 10}" y="${base - h * .3}" width="20" height="${h * .3}" fill="#8A5A28"/><path d="M${cx} ${base - h} L${cx + 46} ${base - h * .28} H${cx - 46} Z" fill="#22A56A"/>`;
      case "door": return `<rect x="${cx - w / 2}" y="${base - h}" width="${w}" height="${h}" rx="4" fill="#B07A3A" stroke="#7A5020" stroke-width="4"/><circle cx="${cx + w / 2 - 14}" cy="${base - h / 2}" r="6" fill="#F5C320"/>`;
      case "window": return `<rect x="${cx - w / 2}" y="${base - h}" width="${w}" height="${h}" fill="#BFE3FF" stroke="#FFFFFF" stroke-width="8"/><path d="M${cx} ${base - h} V${base} M${cx - w / 2} ${base - h / 2} H${cx + w / 2}" stroke="#fff" stroke-width="6"/>`;
    }
    return "";
  }
  function unitSvg(kind, x, y, i) {
    if (kind === "clip") return `<g transform="translate(${x} ${y})"><rect x="2" y="2" width="${U - 4}" height="22" rx="11" fill="none" stroke="#5B6470" stroke-width="3.5"/><rect x="10" y="7" width="${U - 22}" height="12" rx="6" fill="none" stroke="#5B6470" stroke-width="3"/></g>`;
    return `<rect x="${x}" y="${y}" width="${U}" height="${U}" rx="5" fill="${i % 2 ? "#F5C320" : "#2F7FE0"}" stroke="#2A2A2A" stroke-width="2.5"/>`;
  }
  const unitH = kind => kind === "clip" ? 26 : U;
  // ред мерки под предмета: ok – от края, без празни места; gap – с празнини; overlap – с припокриване; offset – не от края
  function unitRow(kind, n, how, x0, y) {
    let xs = [];
    // празнините и припокриването са разпределени така, че редът пак е точно от края до края на предмета (само една грешка)
    if (how === "gap") { const k = n - 1, g = U / (k - 1); xs = Array.from({ length: k }, (_, i) => x0 + i * (U + g)); }
    else if (how === "overlap") { const k = n + 2, o = 2 * U / (k - 1); xs = Array.from({ length: k }, (_, i) => x0 + i * (U - o)); }
    else { const s = how === "offset" ? .6 * U : 0; xs = Array.from({ length: n }, (_, i) => x0 + s + i * U); }
    return xs.map((x, i) => unitSvg(kind, x, y, i)).join("");
  }
  function measureSvg(u, how, k = 1.15) {
    const x0 = 30, w = u.len * U, H = 70 + unitH(u.unit) + 14, W = x0 * 2 + w + (how === "offset" ? U : 0);
    return `<svg class="geo-msvg" viewBox="0 0 ${W} ${H}" width="${Math.round(W * k)}" height="${Math.round(H * k)}" aria-hidden="true"><line x1="${x0}" y1="6" x2="${x0}" y2="${H - 4}" stroke="#C4A580" stroke-width="2" stroke-dasharray="5 5"/><line x1="${x0 + w}" y1="6" x2="${x0 + w}" y2="${H - 4}" stroke="#C4A580" stroke-width="2" stroke-dasharray="5 5"/>${hObj(u.obj, x0, 36, w)}${unitRow(u.unit, u.len, how || "ok", x0, 76)}</svg>`;
  }
  const question = u => `Колко ${UNIT[u.unit][0]} е ${LONG[OBJ[u.obj][1]]} ${OBJ[u.obj][2]}?`;

  class LinesGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.examples) || 6; }
    get gameId() { return "lines"; } get skillName() { return "Линии и измерване"; }
    start() {
      MATH_BANK.attach(this).then(() => {
        const mb = this.mb;
        this.view = (mb && mb.def.settings && mb.def.settings.view) || this.s.view || "line_kind";
        if (mb && !mb.units.length) this.mb = null;
        else if (mb && mb.set === "practice") {
          if (mb.def.items) this.total = Math.min(mb.def.items, mb.units.length);
          if (this.view === "compare") mb.units.sort((a, b) => (a.stage || 2) - (b.stage || 2)); // първо лесните подравнени двойки
        }
        super.start();
      });
    }
    render() { this.scene("wt-geo", "scene-meadow"); this.shell.setLabel(this.modeInfo() ? this.modeInfo()[0] : "Линии"); this.last = ""; }
    genUnit() {
      const v = this.view; let u;
      for (let t = 0; t < 20; t++) {
        if (v === "compare") {
          const q = ["longer", "shorter", "taller", "lower", "wider", "narrower"][rnd(6)], obj = { longer: ["ribbon", "scarf", "train"], shorter: ["ribbon", "scarf", "snake"], taller: ["tower", "tree"], lower: ["tower", "tree"], wider: ["door", "window"], narrower: ["door", "window"] }[q];
          const a = 3 + rnd(5); let b; do b = 3 + rnd(5); while (b === a);
          const big = a > b, want = ["longer", "taller", "wider"].includes(q);
          u = { q, obj: obj[rnd(obj.length)], sizes: [a, b], align: !rnd(3) ? false : true, answer: big === want ? 0 : 1 };
          if (!["ribbon", "scarf", "snake", "train"].includes(u.obj)) u.align = true;
        } else if (v === "measure" || v === "measure_check") {
          const obj = ["ribbon", "stick", "scarf", "caterpillar", "train", "spoon"][rnd(6)], unit = rnd(2) ? "cube" : "clip", len = 3 + rnd(v === "measure" ? 7 : 4);
          if (v === "measure") { const lo = Math.max(1, len - rnd(3)); u = { obj, unit, len, opts: [lo, lo + 1, lo + 2] }; }
          else { const rows = shuffle(["ok"].concat(shuffle(["gap", "overlap", "offset"]).slice(0, 2))); u = { obj, unit, len, rows, answer: rows.indexOf("ok") }; }
        } else {
          const straight = !!rnd(2);
          u = { kind: straight ? "straight" : "curved", form: straight ? "line" : ["arc", "wave", "s", "bend", "hook"][rnd(5)], angle: [0, 0, 30, -30, 90][rnd(5)], color: ["#E2493F", "#2F7FE0", "#22A56A", "#8E5CE0"][rnd(4)], obj: null };
        }
        const k = JSON.stringify(u); if (k !== this.last) { this.last = k; break; }
      }
      return u;
    }
    startRound() {
      this.stepWrong = 0;
      const u = (this.mb && this.mb.units[this.idx]) || this.genUnit(); this.unit = u;
      const v = this.view;
      if (v === "compare") return this.showCompare(u);
      if (v === "measure") return this.showMeasure(u);
      if (v === "measure_check") return this.showCheck(u);
      return this.showLine(u);
    }
    bind(sel, fn) { [...this.box.querySelectorAll(sel)].forEach((b, i) => b.addEventListener("pointerdown", e => { e.preventDefault(); fn(b, i); })); }
    speak(t) { this.q = t; this.prompt(t); }   // методист 19.10: в играта без автоматичен глас; 🔊 „Чуй пак“ остава
    sayBtn(t) { return `<button type="button" class="geo-say" aria-label="Чуй пак">🔊</button>`; }
    wireSay() { const b = this.box.querySelector(".geo-say"); if (b) b.addEventListener("pointerdown", e => { e.preventDefault(); this.say(this.q); }); }

    // ---- права или крива ----
    showLine(u) {
      this.box.innerHTML = `<div class="geo-q">${this.sayBtn()}<span>Права или крива?</span></div><div class="geo-card geo-lcard">${lineSvg(u)}</div>
        <div class="pcards geo-opts"><button type="button" class="wtile geo-opt geo-lopt" aria-label="права">${ICON.straight}</button><button type="button" class="wtile geo-opt geo-lopt" aria-label="крива">${ICON.curved}</button></div>`;
      const head = this.box.querySelector(".geo-lhead");
      if (head) { const p = head.parentNode.querySelector("path"), a = p.getPointAtLength(0); head.innerHTML = `<circle cx="${a.x}" cy="${a.y}" r="22" fill="#2E9C5A"/><circle cx="${a.x - 6}" cy="${a.y - 6}" r="4" fill="#fff"/><circle cx="${a.x + 6}" cy="${a.y - 6}" r="4" fill="#fff"/>`; }
      this.opts = ["straight", "curved"]; this.bind(".geo-lopt", (b, i) => this.pick(b, i)); this.wireSay();
      this.speak(u.obj ? "Погледни линията. Права ли е, или крива?" : "Тази линия права ли е, или крива?");
    }
    // ---- сравни ----
    showCompare(u) {
      const hor = ["ribbon", "scarf", "snake", "train"].includes(u.obj), name = OBJ[u.obj], g = G[name[1]];
      let cards;
      if (hor) {
        const L = Math.max(...u.sizes), px = 70, W = L * px + 80 + (u.align ? 0 : 2 * px);
        cards = u.sizes.map((s, i) => {
          const other = u.sizes[1 - i], x = u.align || s >= other ? 20 : 20 + (other - s) * px + 1.5 * px; // по-късият „стърчи“ надясно
          return `<button type="button" class="geo-opt geo-row geo-copt"><svg viewBox="0 0 ${W} 70" style="width:min(100%, ${W}px)" aria-hidden="true">${hObj(u.obj, x, 35, s * px)}</svg></button>`;
        }).join("");
        cards = `<div class="geo-rows">${cards}</div>`;
      } else {
        const wid = u.obj === "door" || u.obj === "window";
        cards = `<div class="pcards geo-pair">${u.sizes.map(s => `<button type="button" class="geo-opt geo-tall geo-copt"><svg viewBox="0 0 220 340" aria-hidden="true"><line x1="0" y1="320" x2="220" y2="320" stroke="#8A6A3A" stroke-width="4"/>${wid ? vObj(u.obj, 110, 320, u.obj === "door" ? 260 : 220, s * 34) : vObj(u.obj, 110, 320, s * 42)}</svg></button>`).join("")}</div>`;
      }
      const q = `${WHICH[g]} ${name[0]} е ${ADJ[u.q][g]}?`;
      this.box.innerHTML = `<div class="geo-q">${this.sayBtn()}<span>${q}</span></div>${cards}`;
      this.opts = [0, 1]; this.bind(".geo-copt", (b, i) => this.pick(b, i)); this.wireSay(); this.speak(q);
    }
    // ---- измери ----
    showMeasure(u) {
      const q = question(u);
      this.box.innerHTML = `<div class="geo-q">${this.sayBtn()}<span>${q}</span></div><div class="geo-card geo-mcard">${measureSvg(u)}</div>
        <div class="pcards geo-opts">${u.opts.map(o => `<button type="button" class="wtile geo-opt geo-mopt">${o}</button>`).join("")}</div>`;
      this.opts = u.opts.slice(); this.bind(".geo-mopt", (b, i) => this.pick(b, i)); this.wireSay(); this.speak(q);
    }
    // ---- кое е измерено правилно ----
    showCheck(u) {
      const q = "Кое е измерено правилно?";
      this.box.innerHTML = `<div class="geo-q">${this.sayBtn()}<span>${q}</span></div><div class="geo-rows">${u.rows.map(r => `<button type="button" class="geo-opt geo-row geo-mcopt">${measureSvg(u, r, .72)}</button>`).join("")}</div>`;
      this.opts = u.rows.slice(); this.bind(".geo-mcopt", (b, i) => this.pick(b, i)); this.wireSay();
      this.speak(`Измерили сме ${OBJ[u.obj][2].replace(/ът$/, "а")} с ${UNIT[u.unit][3]} по три начина. Кое е измерено правилно?`);   // кратък член за м. р. в допълнение: шала, прозореца
    }

    rightIdx() { const u = this.unit, v = this.view; return v === "compare" ? u.answer : v === "measure" ? u.opts.indexOf(u.len) : v === "measure_check" ? u.answer : (u.kind === "straight" ? 0 : 1); }
    errorType(i) {
      const u = this.unit, v = this.view;
      if (v === "line_kind") return u.kind === "straight" ? (u.angle ? "oblique_straight_as_curved" : "straight_as_curved") : (u.form === "bend" ? "slight_curve_as_straight" : "curved_as_straight");
      if (v === "compare") { if (!u.align) { const sticks = u.sizes[i] < u.sizes[1 - i]; return sticks ? "chose_end_further" : "opposite"; } return "opposite"; }
      if (v === "measure") { const d = u.opts[i] - u.len; return d === 1 ? "count_one_more" : d === -1 ? "count_one_less" : "count_other"; }
      if (v === "measure_check") return "accepts_" + u.rows[i];
      return "other";
    }
    text() { const u = this.unit, v = this.view; return v === "line_kind" ? `${u.kind} ${u.form}${u.obj ? " " + u.obj : ""}` : v === "compare" ? `${u.q} ${u.obj} ${u.sizes.join("/")}${u.align ? "" : " неподр."}` : v === "measure" ? `${u.obj} = ${u.len} ${u.unit}` : `${u.obj} ${u.unit} ${u.rows.join("/")}`; }
    given(i) { const u = this.unit, v = this.view; return v === "line_kind" ? this.opts[i] : v === "compare" ? String(u.sizes[i]) : v === "measure" ? String(u.opts[i]) : u.rows[i]; }
    pick(b, i) {
      if (this.finished || this.locked || b.classList.contains("bad")) return;
      const ok = i === this.rightIdx(), u = this.unit, extra = { view: this.view, bank_item: u };
      if (ok) {
        b.classList.add("good"); this.box.querySelectorAll(".geo-opt:not(.good)").forEach(x => x.classList.add("used"));
        const first = this.stepWrong === 0;
        this.done(this.text());
        const last = this.log[this.log.length - 1]; if (last) Object.assign(last, extra, { answer: this.given(i), given: this.given(i), error_type: first ? null : this.firstErr });
      } else {
        if (this.stepWrong === 0) this.firstErr = this.errorType(i);
        this.miss(this.text(), this.given(i)); const last = this.log[this.log.length - 1]; if (last) Object.assign(last, extra, { error_type: this.errorType(i) });
        b.classList.add("bad"); this.shake(b);
        this.shell.flash("Опитай пак", "bad"); this.later(() => this.shell.hideFlash(), 1300);
        this.say(this.view === "measure" ? `Не са ${NUM[this.unit.opts[i]] || this.unit.opts[i]}. Преброй ${UNIT[u.unit][2]} пак.` : this.view === "measure_check" ? "Виж има ли празни места и откъде започват." : "Погледни пак.");
        if (this.stepWrong >= 2) this.box.querySelectorAll(".geo-opt")[this.rightIdx()].classList.add("hint");
      }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.lines = {
    id: "lines", name: "Линии и измерване", skill: "Линии и измерване", top: "palm", cls: LinesGame, tiers: [0, 1, 2],
    task: s => ({ compare: "Сравни двата предмета и докосни този, за който пита гласът.", measure: "Преброй мерките под предмета и докосни числото.", measure_check: "Докосни реда, в който предметът е измерен правилно." })[s.view] || "Погледни линията и кажи права ли е, или крива.",
    settings: [
      { key: "view", label: "Режим", type: "cycle", options: [["line_kind", "Права или крива?"], ["compare", "Сравни и покажи"], ["measure", "Измери"], ["measure_check", "Кое е измерено правилно?"]], def: "line_kind" },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 10, def: 6 }
    ],
    paramsLine: s => `${s.examples || 6} задачи`
  };
})();
