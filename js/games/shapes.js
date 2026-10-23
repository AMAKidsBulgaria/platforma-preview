/* Фигури (shapes, M9): само кръг, квадрат, триъгълник, правоъгълник. Три режима (settings.view), всеки със свое заглавие:
     find_shape „Намери фигурата“       – четири фигури (по една от всеки вид) в различни цветове, размери и положения; гласът казва коя;
     compose    „Коя фигура липсва?“     – картина от фигури с пунктирно празно място; детето избира фигурата от 3. В измерването верният
                                           вариант е в друго положение/пропорция (не е „съвпадение на силует“);
     real_shape „На коя фигура прилича?“ – истински предмет с плоско лице, гледан отпред; четирите фигури са бутони в постоянен ред.
   Една задача = едно решение (първият опит); при грешка – опит отново, след 2 грешки верният мига. error_type: square_rect / other_shape.
   Домашна (MATH_BANK, tools/math_banks/shapes.py). Фигура: { s, v, w, h, rot, c } – вид, вариант, размер, завъртане, цвят. */
(function () {
  const NAME = { circle: ["кръг", "кръга"], square: ["квадрат", "квадрата"], triangle: ["триъгълник", "триъгълника"], rect: ["правоъгълник", "правоъгълника"] };
  const KINDS = ["circle", "square", "triangle", "rect"];
  const CANON = { circle: ["s", "m", "l"], square: ["normal"], triangle: ["up"], rect: ["horizontal"] };
  function geom(f) { // контур в собствени координати с център (0, 0)
    const w = f.w, h = f.h;
    if (f.s === "circle") return `<circle r="${w / 2}"/>`;
    if (f.s === "triangle") return f.v === "right" ? `<path d="M${-w / 2} ${-h / 2} L${-w / 2} ${h / 2} L${w / 2} ${h / 2} Z"/>` : `<path d="M0 ${-h / 2} L${w / 2} ${h / 2} L${-w / 2} ${h / 2} Z"/>`;
    return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/>`;
  }
  const place = (f, x, y, attrs) => `<g transform="translate(${x} ${y}) rotate(${f.rot || 0})" ${attrs}>${geom(f)}</g>`;
  const shapeCard = (f, fill) => `<svg viewBox="-80 -80 160 160" aria-hidden="true">${place(f, 0, 0, `fill="${fill || f.c}" stroke="rgba(0,0,0,.25)" stroke-width="3" stroke-linejoin="round"`)}</svg>`;
  const ICON_F = { circle: { s: "circle", w: 100, h: 100 }, square: { s: "square", w: 92, h: 92 }, triangle: { s: "triangle", v: "up", w: 108, h: 94 }, rect: { s: "rect", w: 130, h: 72 } };

  // ---------- истински предмети (плоско лице, отпред), поле 200×200 ----------
  const OBJ = {
    clock: ["часовникът", '<circle cx="100" cy="100" r="82" fill="#fff" stroke="#E2493F" stroke-width="10"/>' + [0, 1, 2, 3].map(i => `<rect x="97" y="26" width="6" height="16" fill="#333" transform="rotate(${i * 90} 100 100)"/>`).join("") + '<path d="M100 100 V52 M100 100 L134 118" stroke="#333" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#333"/>'],
    plate: ["чинията", '<circle cx="100" cy="100" r="86" fill="#F4F4F4" stroke="#C9CED6" stroke-width="5"/><circle cx="100" cy="100" r="58" fill="none" stroke="#C9CED6" stroke-width="4"/>'],
    button: ["копчето", '<circle cx="100" cy="100" r="72" fill="#E2493F" stroke="#B5302A" stroke-width="6"/>' + [[82, 82], [118, 82], [82, 118], [118, 118]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#7A1E18"/>`).join("")],
    coin: ["монетата", '<circle cx="100" cy="100" r="74" fill="#F5C320" stroke="#C99A10" stroke-width="8"/><circle cx="100" cy="100" r="54" fill="none" stroke="#C99A10" stroke-width="3"/><text x="100" y="124" text-anchor="middle" font-size="64" font-weight="700" fill="#A87C06" font-family="sans-serif">1</text>'],
    cookie: ["бисквитата", '<circle cx="100" cy="100" r="78" fill="#D9A35B" stroke="#B07A3A" stroke-width="5"/>' + [[70, 76], [118, 70], [96, 110], [136, 116], [70, 132], [112, 146]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#5E3A16"/>`).join("")],
    chessboard: ["шахматната дъска", '<rect x="20" y="20" width="160" height="160" fill="#F2E3C6" stroke="#6B4E1E" stroke-width="6"/>' + Array.from({ length: 16 }, (_, i) => (i + (i >> 2)) % 2 ? `<rect x="${20 + (i % 4) * 40}" y="${20 + (i >> 2) * 40}" width="40" height="40" fill="#6B4E1E"/>` : "").join("")],
    tile: ["плочката", '<rect x="26" y="26" width="148" height="148" rx="4" fill="#2F7FE0" stroke="#1E5BA8" stroke-width="5"/><circle cx="100" cy="100" r="18" fill="#fff"/>' + [0, 1, 2, 3].map(i => `<circle cx="100" cy="70" r="12" fill="#BFE3FF" transform="rotate(${i * 90} 100 100)"/>`).join("")],
    napkin: ["салфетката", '<rect x="26" y="26" width="148" height="148" fill="#FFF" stroke="#E98AA8" stroke-width="5"/><rect x="40" y="40" width="120" height="120" fill="none" stroke="#E98AA8" stroke-width="3" stroke-dasharray="8 6"/>'],
    frame: ["рамката", '<rect x="22" y="22" width="156" height="156" fill="#B07A3A" stroke="#7A5020" stroke-width="5"/><rect x="46" y="46" width="108" height="108" fill="#BFE3FF"/><circle cx="100" cy="92" r="20" fill="#F5C320"/><path d="M46 154 L84 118 L112 140 L154 110 V154 Z" fill="#22A56A"/>'],
    note: ["листчето", '<rect x="28" y="28" width="144" height="144" fill="#FFE768" stroke="#D9BF2A" stroke-width="4"/><path d="M50 72 H150 M50 100 H140 M50 128 H120" stroke="#9A8A2A" stroke-width="5" stroke-linecap="round"/>'],
    pizza: ["парчето пица", '<path d="M100 178 L28 34 L172 34 Z" fill="#F5C320" stroke="#D08A2A" stroke-width="10" stroke-linejoin="round"/>' + [[78, 58], [120, 60], [98, 98], [100, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#D2402F"/>`).join("")],
    sign: ["пътният знак", '<path d="M100 20 L184 172 L16 172 Z" fill="#fff" stroke="#E2493F" stroke-width="14" stroke-linejoin="round"/><rect x="93" y="76" width="14" height="54" rx="5" fill="#222"/><circle cx="100" cy="148" r="8" fill="#222"/>'],
    pennant: ["флагчето", '<path d="M40 30 L176 72 L40 114 Z" fill="#22A56A" stroke="#18804F" stroke-width="5" stroke-linejoin="round"/><rect x="32" y="22" width="8" height="160" rx="4" fill="#8A5A28"/>'],
    sandwich: ["сандвичът", '<path d="M24 170 L176 170 L176 30 Z" fill="#F2D49B" stroke="#C99A55" stroke-width="7" stroke-linejoin="round"/><path d="M50 158 L164 158 L164 56" fill="none" stroke="#7ED07A" stroke-width="9" stroke-linejoin="round"/>'],
    door: ["вратата", '<rect x="52" y="14" width="96" height="176" rx="4" fill="#B07A3A" stroke="#7A5020" stroke-width="6"/><rect x="66" y="30" width="68" height="60" fill="none" stroke="#7A5020" stroke-width="4"/><rect x="66" y="104" width="68" height="70" fill="none" stroke="#7A5020" stroke-width="4"/><circle cx="132" cy="100" r="7" fill="#F5C320"/>'],
    envelope: ["пликът", '<rect x="16" y="46" width="168" height="108" fill="#FFF4D1" stroke="#C4A580" stroke-width="5"/><path d="M16 46 L100 108 L184 46" fill="none" stroke="#C4A580" stroke-width="5" stroke-linejoin="round"/>'],
    book: ["книгата", '<rect x="44" y="18" width="116" height="164" rx="4" fill="#8E5CE0" stroke="#5E3AA6" stroke-width="5"/><rect x="44" y="18" width="18" height="164" fill="#5E3AA6"/><rect x="80" y="56" width="62" height="26" rx="3" fill="#fff"/>'],
    board: ["черната дъска", '<rect x="12" y="40" width="176" height="116" fill="#2F5D45" stroke="#B07A3A" stroke-width="9"/><text x="54" y="112" font-size="40" fill="#fff" font-family="sans-serif" font-weight="700">1+2</text>'],
    ticket: ["билетът", '<rect x="14" y="58" width="172" height="84" rx="3" fill="#F08A24" stroke="#C0661A" stroke-width="5"/><path d="M140 58 V142" stroke="#fff" stroke-width="4" stroke-dasharray="6 6"/><rect x="34" y="82" width="86" height="12" rx="6" fill="#fff"/><rect x="34" y="104" width="60" height="12" rx="6" fill="#fff"/>']
  };

  class ShapesGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.examples) || 6; }
    get gameId() { return "shapes"; } get skillName() { return "Фигури"; }
    start() {
      MATH_BANK.attach(this).then(() => {
        const mb = this.mb;
        this.view = (mb && mb.def.settings && mb.def.settings.view) || this.s.view || "find_shape";
        if (mb && !mb.units.length) this.mb = null;
        else if (mb && mb.set === "practice" && mb.def.items) this.total = Math.min(mb.def.items, mb.units.length);
        super.start();
      });
    }
    render() { this.scene("wt-geo", "scene-island"); this.shell.setLabel(this.modeInfo() ? this.modeInfo()[0] : "Фигури"); this.last = ""; }
    // свободна игра: само „Намери фигурата“ и „На коя фигура прилича?“ се генерират; композициите идват от банката
    genUnit() {
      const V = { circle: ["s", "m", "l"], square: ["normal", "rotated"], triangle: ["up", "down", "side", "narrow", "wide", "right"], rect: ["horizontal", "vertical", "long"] };
      const SZ = { "circle s": [60, 60, 0], "circle m": [85, 85, 0], "circle l": [105, 105, 0], "square normal": [80, 80, 0], "square rotated": [76, 76, 45], "triangle up": [96, 84, 0], "triangle down": [96, 84, 180], "triangle side": [96, 84, 90], "triangle narrow": [50, 104, 0], "triangle wide": [120, 56, 0], "triangle right": [88, 88, 0], "rect horizontal": [116, 64, 0], "rect vertical": [60, 112, 0], "rect long": [128, 44, 0] };
      const cols = shuffle(["#E2493F", "#2F7FE0", "#F5C320", "#22A56A", "#8E5CE0", "#F08A24"]);
      for (let t = 0; t < 20; t++) {
        let u;
        if (this.view === "real_shape") { const ks = Object.keys(OBJ), o = ks[rnd(ks.length)], ans = { clock: "circle", plate: "circle", button: "circle", coin: "circle", cookie: "circle", chessboard: "square", tile: "square", napkin: "square", frame: "square", note: "square", pizza: "triangle", sign: "triangle", pennant: "triangle", sandwich: "triangle" }[o] || "rect"; u = { obj: o, answer: ans, opts: KINDS.slice() }; }
        else {
          const cards = shuffle(KINDS.slice()).map((s, i) => { const v = V[s][rnd(V[s].length)], [w, h, rot] = SZ[`${s} ${v}`]; return { s, v, w, h, rot, c: cols[i] }; });
          const target = KINDS[rnd(4)]; u = { target, cards, answer: cards.findIndex(c => c.s === target) };
        }
        const k = JSON.stringify(u); if (k !== this.last) { this.last = k; return u; }
      }
    }
    startRound() {
      this.stepWrong = 0; this.firstErr = null;
      const u = (this.mb && this.mb.units[this.idx]) || (this.view === "compose" ? null : this.genUnit());
      if (!u) { this.view = "find_shape"; return this.startRound(); }
      this.unit = u;
      const say = `<button type="button" class="geo-say" aria-label="Чуй пак">🔊</button>`;
      if (this.view === "compose") {
        const hole = u.parts[u.missing];
        const pic = u.parts.map((p, i) => i === u.missing ? place(p, p.x, p.y, `id="sh-hole" fill="#FFFDF5" stroke="#8A6A3A" stroke-width="4" stroke-dasharray="10 8"`) : place(p, p.x, p.y, `fill="${p.c}" stroke="rgba(0,0,0,.2)" stroke-width="3"`)).join("");
        this.q = "Коя фигура липсва?";
        this.box.innerHTML = `<div class="geo-q">${say}<span>${this.q}</span></div><div class="geo-card sh-scene"><svg viewBox="0 0 400 300" aria-hidden="true">${pic}</svg></div>
          <div class="pcards geo-opts">${u.opts.map(o => `<button type="button" class="pcard geo-opt sh-opt">${shapeCard(o)}</button>`).join("")}</div>`;
        this.choices = u.opts.map(o => o.s); this.right = u.answer; this.target = hole.s;
      } else if (this.view === "real_shape") {
        this.q = `На коя фигура прилича ${OBJ[u.obj][0]}?`;
        this.box.innerHTML = `<div class="geo-q">${say}<span>На коя фигура прилича?</span></div><div class="geo-card sh-obj"><svg viewBox="0 0 200 200" aria-hidden="true">${OBJ[u.obj][1]}</svg></div>
          <div class="pcards geo-opts">${u.opts.map(k => `<button type="button" class="pcard geo-opt sh-opt sh-icon" aria-label="${NAME[k][0]}">${shapeCard(ICON_F[k], "#7B5CE0")}</button>`).join("")}</div>`;
        this.choices = u.opts.slice(); this.right = u.opts.indexOf(u.answer); this.target = u.answer;
      } else {
        this.q = `Намери ${NAME[u.target][1]}.`;
        this.box.innerHTML = `<div class="geo-q">${say}<span>${this.q}</span></div><div class="pcards geo-opts sh-four">${u.cards.map(c => `<button type="button" class="pcard geo-opt sh-opt sh-big">${shapeCard(c)}</button>`).join("")}</div>`;
        this.choices = u.cards.map(c => c.s); this.right = u.answer; this.target = u.target;
      }
      [...this.box.querySelectorAll(".sh-opt")].forEach((b, i) => b.addEventListener("pointerdown", e => { e.preventDefault(); this.pick(b, i); }));
      this.box.querySelector(".geo-say").addEventListener("pointerdown", e => { e.preventDefault(); this.say(this.q); });
      this.prompt(this.q);
    }
    targetShape() { const u = this.unit; return this.view === "compose" ? u.parts[u.missing] : this.view === "find_shape" ? u.cards[u.answer] : null; }
    errorType(i) { const t = this.target, g = this.choices[i]; return (t === "square" && g === "rect") || (t === "rect" && g === "square") ? "square_rect" : "other_shape"; }
    pick(b, i) {
      if (this.finished || this.locked || b.classList.contains("bad")) return;
      const u = this.unit, ts = this.targetShape(), text = this.view === "real_shape" ? `${u.obj} → ${u.answer}` : this.view === "compose" ? `${u.scene}: ${this.target}` : `${this.target} (${ts.v})`;
      const extra = { view: this.view, bank_item: u, target_shape: this.target, target_variant: ts ? ts.v : null, canonical: ts ? CANON[ts.s].includes(ts.v) : null };
      if (i === this.right) {
        b.classList.add("good"); this.box.querySelectorAll(".geo-opt:not(.good)").forEach(x => x.classList.add("used"));
        const h = this.box.querySelector("#sh-hole"); if (h) { h.setAttribute("fill", ts.c); h.removeAttribute("stroke-dasharray"); }
        const first = this.stepWrong === 0; this.done(text);
        const last = this.log[this.log.length - 1]; if (last) Object.assign(last, extra, { answer: this.target, given: this.choices[i], error_type: first ? null : this.firstErr });
      } else {
        if (this.stepWrong === 0) this.firstErr = this.errorType(i);
        this.miss(text, this.choices[i]); const last = this.log[this.log.length - 1]; if (last) Object.assign(last, extra, { error_type: this.errorType(i) });
        b.classList.add("bad"); this.shake(b); this.shell.flash("Опитай пак", "bad"); this.later(() => this.shell.hideFlash(), 1300);
        this.say(`Това е ${NAME[this.choices[i]][0]}. ${this.q}`);
        if (this.stepWrong >= 2) this.box.querySelectorAll(".sh-opt")[this.right].classList.add("hint");
      }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.shapes = {
    id: "shapes", name: "Фигури", skill: "Фигури", top: "palm", cls: ShapesGame, tiers: [0, 1, 2],
    task: s => ({ compose: "Намери фигурата, която липсва в картината.", real_shape: "Погледни предмета и докосни фигурата, на която прилича." })[s.view] || "Чуй коя фигура търсим и я докосни.",
    settings: [
      { key: "view", label: "Режим", type: "cycle", options: [["find_shape", "Намери фигурата"], ["real_shape", "На коя фигура прилича?"]], def: "find_shape", help: "„Коя фигура липсва?“ е само в домашните (готови картини)." },
      { key: "examples", label: "Брой примери", type: "range", min: 4, max: 10, def: 6 }
    ],
    paramsLine: s => `${s.examples || 6} задачи`
  };
})();
