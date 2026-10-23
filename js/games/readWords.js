/* Читарика: „Правилни думи“ (картинка + 2 думи) и „Построй изречение“ (подреди думите). */
(function () {
  const DICT = () => window.BUK.readica || {};
  const TR = Object.fromEntries([..."абвгдежзийклмнопрстуфхцчшщъьюя"].map((c, i) => [c, ["a", "b", "v", "g", "d", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "h", "ts", "ch", "sh", "sht", "a", "y", "yu", "ya"][i]]));
  const lat = w => [...w.toLowerCase()].map(c => TR[c] ?? c).join("");   // като в bankGame.js
  /* Правилни думи: ниво 1 — вярната дума към картинката срещу друга дума; ниво 2 — вярната срещу сгрешен правопис (двойката от речника). */
  class TrueWordsGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.answersQty) || 4; this.level = Number(this.s.level) || 1; }
    get gameId() { return "trueWords"; } get skillName() { return this.level === 2 ? "Правопис: разпознаване на грешка" : "Четене на дума към картинка"; }
    start() { READICA_BANK.attach(this).then(() => super.start()); }
    render() {
      let pairs = DICT().pairs || []; if (!Array.isArray(pairs)) pairs = Object.values(pairs).flat(); const byW = {}; pairs.forEach(p => { if (p && p.word) byW[String(p.word).toLowerCase()] = p.pair; });
      this.words = window.BUK_WORDS.map(w => ({ ...w, pair: byW[w.w] })).filter(w => this.level === 1 || w.pair);
      if (this.words.length < 4) this.words = window.BUK_WORDS.map(w => ({ ...w, pair: w.pair || w.w.replace(/[аоуеи]/, m => ({ а: "о", о: "а", у: "о", е: "и", и: "е" })[m]) }));
      // банка на рунда: само думите на набора (картинките са проверени); ниво 2 – двойката [вярно, сгрешено] от банката
      // свободна игра: проверените картинки от речника за свободна игра (без пилотни и без измервателните думи); ниво 2 – прегледаните двойки
      const fp = DICT().pictures && DICT().pictures["1"];
      if (!this.rb && fp && fp.length >= 4) { const set = new Set(fp), L = (this.level === 1 ? fp.map(w => ({ w })) : Object.entries(byW).filter(([w]) => set.has(w)).map(([w, pair]) => ({ w, pair }))).map(x => ({ ...x, img: `art/pics/pic_${lat(x.w)}.png` })); if (L.length >= 4) this.words = L; }
      // картинката е от проверените картинки на Букварика (assets/img/art/pics), не от старите спрайтове
      if (this.rb) this.words = this.rb.units.map(u => { const w = Array.isArray(u) ? u[0] : u; return { w, img: `art/pics/pic_${lat(w)}.png`, pair: Array.isArray(u) ? u[1] : null }; });
      this.scene("wt-tw", "scene-space-game"); this.used = new Set(); this.shell.setLabel(this.level === 2 ? "Коя дума е написана правилно?" : "Коя дума е за картинката?");
    }
    startRound() {
      this.stepWrong = 0; let c = this.words.filter(w => !this.used.has(w.w)); if (!c.length) { this.used.clear(); c = this.words.slice(); }
      const it = c[rnd(c.length)]; this.used.add(it.w); this.cur = it;
      const others = this.words.filter(w => w.w !== it.w), other = this.level === 2 ? it.pair : others[rnd(others.length)].w;
      this.opts = shuffle([it.w, other]);
      this.box.innerHTML = `<div class="pcard big-pic">${window.BUK_PIC(it)}</div><div class="pcards">${this.opts.map(o => `<button type="button" class="wtile">${o.toUpperCase()}</button>`).join("")}</div>`;
      [...this.box.querySelectorAll(".wtile")].forEach((b, i) => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b, this.opts[i]); }));
      this.prompt(this.level === 2 ? "Коя дума е написана правилно?" : "Коя дума е за картинката?");
    }
    tap(b, w) {
      if (this.finished || this.locked || b.classList.contains("bad")) return;
      if (w === this.cur.w) { b.classList.add("good"); this.done(this.cur.w, 900); }
      else { this.miss(this.cur.w, w); b.classList.add("bad"); this.shake(b); this.shell.flash(this.level === 2 ? `Правилно е „${this.cur.w}“` : `Картинката е „${this.cur.w}“`, "bad"); this.prompt(this.cur.w); this.later(() => this.shell.hideFlash(), 1300); }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.trueWords = {
    id: "trueWords", name: "Правилни думи", module: "readica", skill: "Четене на думи", cls: TrueWordsGame,
    task: s => Number(s.level) === 2 ? "Избери думата с правилния правопис към картинката." : "Избери правилната дума към картинката.",
    tiers: s => { const q = Number(s.answersQty) || 4; return [0, Math.ceil(q * 0.3), Math.ceil(q * 0.5)]; },
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 2, def: 1, help: "1: вярната дума срещу друга дума. 2: вярната дума срещу същата с грешка в правописа." },
      { key: "answersQty", label: "Количество отговори", type: "range", min: 4, max: 25, def: 4 }
    ],
    paramsLine: s => `ниво ${s.level} · ${s.answersQty} думи`
  };

  /* Построй изречение: разбъркани думи, докосни ги в правилния ред; долу се изгражда изречението. */
  /* Банка на рунда: { text, accepted_orders[] } – основният ред и предварително одобрените естествени редове (методист, 17.10.2026).
     Всеки одобрен ред е верен; не се приемат всички граматически пермутации. Без банка – един ред от общия речник. */
  const toWords = s => s.split(" ").map(w => w.replace(/[.!?]$/, ""));
  class BuildSentenceGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.answersQty) || 4; }
    get gameId() { return "buildSentence"; } get skillName() { return "Словоред в изречение"; }
    start() { READICA_BANK.attach(this).then(() => super.start()); }
    render() {
      const all = (DICT().sentences || {}); const key = String(this.s.dataComplexity || 1);
      const one = x => ({ text: x, accepted_orders: [x] });
      this.pool = this.rb ? this.rb.units.map(u => typeof u === "string" ? one(u) : u) : (all[key] || all["1"] || [["Мама чете книга"], ["Котката спи на дивана"], ["Децата играят в парка"]]).map(x => Array.isArray(x) ? x[0] : x).filter(x => x && x.split(" ").length >= 2).map(one);
      this.names = new Set(this.rb ? this.rb.names || [] : DICT().names || []);   // собствените имена остават с главна буква и на плочката
      this.scene("wt-bs", "scene-space-game"); this.used = new Set(); this.shell.setLabel("Сглоби изречението");
    }
    show(w) { return this.names.has(w) ? w : w.toLowerCase(); }
    startRound() {
      this.stepWrong = 0; let c = this.pool.filter(x => !this.used.has(x.text)); if (!c.length) { this.used.clear(); c = this.pool.slice(); }
      const it = c[rnd(c.length)]; this.used.add(it.text); this.words = toWords(it.text); this.k = 0; this.built = []; if (this.rb) this.curUnit = this.rb.units[this.pool.indexOf(it)];   // за item_uid: k тук брои думите, не задачите
      this.orders = it.accepted_orders.map(o => toWords(o).map(w => w.toLowerCase()));
      // разбъркването не бива да съвпада с никой от одобрените редове
      let tiles; let g = 0; do { tiles = shuffle(this.words.map((w, i) => ({ w, i }))); } while (this.orders.some(o => tiles.every((t, i) => t.w.toLowerCase() === o[i])) && g++ < 20 && this.words.length > 1);
      this.tiles = tiles;
      this.box.innerHTML = `<div class="bs-row" id="src">${tiles.map(t => `<button type="button" class="wtile">${this.show(t.w)}</button>`).join("")}</div><div class="bs-built" id="built">${this.words.map(() => `<span class="bs-slot"></span>`).join("")}</div>`;
      [...this.box.querySelectorAll("#src .wtile")].forEach((b, i) => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b, tiles[i]); }));
      this.prompt("Подреди думите, за да се получи изречение.");
    }
    // редовете, които още са възможни след вече подредените думи
    open() { return this.orders.filter(o => this.built.every((w, i) => o[i] === w)); }
    tap(b, t) {
      if (this.finished || this.locked || b.classList.contains("used")) return;
      const w = t.w.toLowerCase(), next = this.open().map(o => o[this.k]);
      if (next.includes(w)) {
        b.classList.add("used"); const slot = this.box.querySelectorAll(".bs-slot")[this.k], d = this.show(t.w);
        slot.textContent = (this.k === 0 ? d[0].toUpperCase() + d.slice(1) : d) + (this.k === this.words.length - 1 ? "." : ""); slot.classList.add("on");
        this.built.push(w); this.k++;
        if (this.k >= this.words.length) {
          const text = [...this.box.querySelectorAll(".bs-slot")].map(x => x.textContent).join(" ");
          this.decisions = { accepted_order: this.orders.findIndex(o => o.join(" ") === this.built.join(" ")) };   // 0 = основният ред
          this.prompt(text); this.done(text, 1400);
        }
      } else {
        this.miss(this.words.join(" "), t.w); b.classList.add("bad"); this.shake(b); this.later(() => b.classList.remove("bad"), 1000);
        this.shell.flash(this.k === 0 ? "С коя дума започва изречението?" : `Коя дума идва след „${this.show(this.words.find(x => x.toLowerCase() === this.built[this.k - 1]))}“?`, "bad"); this.later(() => this.shell.hideFlash(), 1300);
        if (this.stepWrong >= 2) [...this.box.querySelectorAll("#src .wtile")].forEach((x, i) => { if (!x.classList.contains("used") && next.includes(this.tiles[i].w.toLowerCase())) x.classList.add("hint"); });
      }
    }
  }
  window.GAMES.buildSentence = {
    id: "buildSentence", name: "Построй изречение", module: "readica", skill: "Словоред", cls: BuildSentenceGame,
    task: "Сглоби изречението: докосвай думите в правилния ред.",
    tiers: s => { const q = Number(s.answersQty) || 4; return [0, Math.ceil(q * 0.3), Math.ceil(q * 0.5)]; },
    settings: [
      { key: "answersQty", label: "Количество отговори", type: "range", min: 4, max: 25, def: 4 },
      { key: "dataComplexity", label: "Речник", type: "range", min: 1, max: 3, def: 1, help: "1: кратки изречения от 3 думи. 2 и 3: по-дълги изречения." }
    ],
    paramsLine: s => `${s.answersQty} изречения · речник ${s.dataComplexity}`
  };
})();
