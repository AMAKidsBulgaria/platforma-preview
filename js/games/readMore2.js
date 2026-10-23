/* Читарика: „Конструктор“ (летящи облачета), „Словоред“ (5 нива), „Съответствие“ (изречение ↔ картинка), „Читалка“ (срички, думи, изречения, текст). */
(function () {
  const DICT = () => window.BUK.readica || {};
  const norm = w => w.replace(/\//g, "").toLowerCase();
  const VOW = "аъоуеиюя";
  const sylls2 = () => { const s = DICT().syllables || {}; const d = s["difficult-2"] || {}; return (d.opened || []).flat().concat((d.closed || []).flat()).map(x => x.toLowerCase()); };
  const words = (cx, maxLen, minLen = 2) => { const b = DICT().base || {}; return (b[String(cx)] || b["1"] || ["мА/ма", "кО/те", "во/дА"]).filter(w => { const n = norm(w); return n.length <= maxLen && n.length >= minLen; }); };

  /* Конструктор: облачета летят по полето; ниво 1 — намери показаната сричка; ниво 2 — сглоби думата от срички поред; нива 3 и 4 — намери същата дума (на ниво 4 половината са обърнати). */
  class ConstructorGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.answersQty) || 4; this.level = Number(this.s.level) || 1; this.speed = Number(this.s.speed) || 1; this.fly = this.level <= 2 ? (Number(this.s.flyElemsQty) || 6) : 6; }
    get gameId() { return "constructor"; } get skillName() { return this.level === 1 ? "Разпознаване на срички" : this.level === 2 ? "Сглобяване на дума от срички" : "Разпознаване на думи"; }
    start() { READICA_BANK.attach(this).then(() => super.start()); }
    render() { this.scene("wt-cn", "scene-space-game"); this.box.innerHTML = `<div class="cn-target" id="target"></div><div class="cn-sky" id="sky"></div>`; this.sky = this.box.querySelector("#sky"); this.target = this.box.querySelector("#target"); this.pool = shuffle(words(this.s.dataComplexity, Number(this.s.maxLettersQty) || 4).slice()); this.k = 0; this.shell.setLabel(this.level === 2 ? "Сглоби думата" : this.level === 1 ? "Намери сричката" : "Намери думата"); }
    startRound() {
      this.stepWrong = 0; const S = sylls2();
      // банка на рунда: целите вървят поред, а облачетата-разсейващи идват от разсейващите на слота
      const B = this.rb, D = B && B.def.distractors ? B.def.distractors.map(norm) : null;
      if (B && this.level !== 2) { const t = norm(B.units[this.k++ % B.units.length]); this.answers = [t]; this.items = [t]; const pool = shuffle(D.filter(x => x !== t)); while (this.items.length < Math.min(this.level === 1 ? this.fly : 6, pool.length + 1)) this.items.push(pool[this.items.length - 1]); this.target.innerHTML = `<span class="cn-word">${t}</span>`; }
      else if (this.level === 1) { const t = S[rnd(S.length)]; this.answers = [t]; this.items = [t]; while (this.items.length < this.fly) { const x = S[rnd(S.length)]; if (!this.items.includes(x)) this.items.push(x); } this.target.innerHTML = `<span class="cn-word">${t}</span>`; }
      else if (this.level === 2) { const raw = this.pool[this.k++ % this.pool.length]; const parts = raw.toLowerCase().split("/"); this.answers = parts; this.items = parts.slice(); while (this.items.length < Math.max(this.fly, parts.length + 2)) { const x = S[rnd(S.length)]; if (!this.items.includes(x)) this.items.push(x); } this.target.innerHTML = `<span class="cn-word">${norm(raw)}</span><span class="cn-built" id="built">${parts.map(() => "<i></i>").join("")}</span>`; }
      else { const raw = this.pool[this.k++ % this.pool.length]; const t = norm(raw); this.answers = [t]; this.items = [t]; while (this.items.length < 6) { const x = norm(this.pool[rnd(this.pool.length)]); if (!this.items.includes(x)) this.items.push(x); } this.target.innerHTML = `<span class="cn-word">${t}</span>`; }
      this.pos = 0; this.sky.innerHTML = "";
      const dur = ({ 1: 14, 2: 10, 3: 7 })[this.speed] || 14;
      shuffle(this.items).forEach((txt, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "cn-cloud" + (this.level === 4 && Math.random() < 0.5 ? " flip" : ""); b.innerHTML = `<span>${txt}</span>`; b.dataset.t = txt;
        b.style.top = (8 + (i % 4) * 22 + Math.random() * 6) + "%"; b.style.setProperty("--dur", (dur + Math.random() * 4).toFixed(1) + "s"); b.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s";
        b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b); }); this.sky.appendChild(b);
      });
      this.prompt(this.level === 2 ? `Сглоби думата ${norm(this.pool[(this.k - 1) % this.pool.length])}` : `Намери ${this.answers[0]}`);
    }
    tap(b) {
      if (this.finished || this.locked || b.classList.contains("gone")) return;
      const t = b.dataset.t;
      if (t === this.answers[this.pos]) {
        b.classList.add("pop"); this.later(() => b.classList.add("gone"), 400); this.pos++;
        if (this.level === 2) { const cell = this.box.querySelectorAll("#built i")[this.pos - 1]; cell.textContent = t; cell.classList.add("on"); }
        if (this.pos >= this.answers.length) { this.prompt(this.answers.join("")); this.done(this.answers.join(""), 900); }
      } else { this.miss(this.answers[this.pos], t); this.shake(b); this.shell.flash(this.level === 2 ? `Следва „${this.answers[this.pos]}“` : `Търси „${this.answers[0]}“`, "bad"); this.later(() => this.shell.hideFlash(), 1200); }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.constructor = {
    id: "constructor", name: "Конструктор", module: "readica", skill: "Срички и думи", cls: ConstructorGame,
    task: s => ({ 1: "Намери същото буквосъчетание сред летящите облачета.", 2: "Сглоби думата: докосвай сричките в правилния ред.", 3: "Намери същата дума сред летящите облачета.", 4: "Намери същата дума. Някои облачета са обърнати." })[Number(s.level) || 1],
    tiers: s => { const q = Number(s.answersQty) || 4; return [0, Math.ceil(q * 0.3), Math.ceil(q * 0.5)]; },
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 4, def: 1 },
      { key: "answersQty", label: "Количество отговори", type: "range", min: 4, max: 25, def: 4 },
      { key: "dataComplexity", label: "Речник", type: "range", min: 1, max: 2, def: 1, enabledIf: s => Number(s.level) >= 2 },
      { key: "speed", label: "Скорост", type: "range", min: 1, max: 3, def: 1, help: "Колко бързо летят облачетата." },
      { key: "flyElemsQty", label: "Летящи облачета", type: "range", min: 6, max: 9, def: 6, enabledIf: s => Number(s.level) <= 2 },
      { key: "maxLettersQty", label: "Максимум букви в дума", type: "range", min: 4, max: 8, def: 4, enabledIf: s => Number(s.level) >= 2 }
    ],
    paramsLine: s => `ниво ${s.level} · ${s.answersQty} отговора · скорост ${s.speed}`
  };

  /* Словоред: 1/2 подреди срички (1 с картинка и цветове), 3 подреди букви (първа и последна дадени), 4/5 поправи сгрешена буква в дума/изречение. */
  const PAIRS = { б: "п", п: "б", в: "ф", ф: "в", г: "к", к: "г", д: "т", т: "д", ж: "ш", ш: "ж", з: "с", с: "з" };
  const COLORS = ["#E9573F", "#F2A65A", "#F2C838", "#3FBF8F", "#4A6FE0", "#8E5BD9", "#F26D8F", "#5CD0D6"];
  class OrderGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.answersQty) || 4; this.level = Number(this.s.level) || 1; }
    get gameId() { return "wordOrder"; } get skillName() { return this.level <= 2 ? "Подреждане на срички" : this.level === 3 ? "Подреждане на букви" : "Откриване на правописна грешка"; }
    start() { READICA_BANK.attach(this).then(() => super.start()); }
    render() {
      const maxL = Number(this.s.maxLettersQty) || 4; const sv = (DICT().shortVocab || {})["1"] || [];
      const pics = Object.fromEntries(window.BUK_WORDS.map(w => [w.w, w]));
      if (this.level === 1) { this.pool = sv.filter(w => norm(w).length <= maxL && w.includes("/")); const withPic = this.pool.filter(w => pics[norm(w)]); if (withPic.length >= 3) this.pool = withPic; this.pics = pics; }
      else if (this.level === 2) this.pool = words(this.s.dataComplexity, maxL).filter(w => w.includes("/"));
      else if (this.level === 3) this.pool = words(this.s.dataComplexity, maxL, 3);
      else if (this.level === 4) this.pool = words(this.s.dataComplexity, maxL, 3).filter(w => [...norm(w)].some(l => PAIRS[l]));
      else { const all = DICT().sentences || {}; this.pool = (all[String(this.s.dataComplexity)] || all["1"] || ["мама чете книга"]).map(x => Array.isArray(x) ? x[0] : x).filter(s => [...s.toLowerCase()].filter(l => PAIRS[l]).length >= 2); }
      if (!this.pool.length) this.pool = ["ма/ма", "та/та", "ко/те"];
      const SAFE = DICT().safe; if (!this.rb && SAFE && this.level >= 4) { const k = x => this.level === 4 ? norm(x) : x.toLowerCase().replace(/[.!?]$/, ""), f = this.pool.filter(x => (SAFE[k(x)] || []).length >= (this.level === 4 ? 1 : 2)); if (f.length >= 4) this.pool = f; }
      if (this.rb) this.pool = this.rb.units.slice();   // банка на рунда; нива 4 и 5 – двойки [вярно, показано]
      this.pool = shuffle(this.pool.slice()); this.k = 0; this.scene("wt-or", "scene-space-game");
      this.shell.setLabel(({ 1: "Подреди сричките", 2: "Подреди сричките", 3: "Подреди буквите", 4: "Поправи грешката", 5: "Поправи грешките" })[this.level]);
    }
    startRound() {
      this.stepWrong = 0; const raw = this.pool[this.k++ % this.pool.length];
      if (this.level <= 2) {
        this.parts = raw.toLowerCase().split("/"); this.pos = 0; const pic = this.level === 1 && this.pics[norm(raw)];
        const order = shuffle(this.parts.map((p, i) => ({ p, i })));
        this.box.innerHTML = `${pic ? `<div class="pcard big-pic small">${window.BUK_PIC(pic)}</div>` : ""}<div class="or-slots">${this.parts.map((p, i) => `<span class="or-slot ghost" ${this.level === 1 ? `style="--c:${COLORS[i % 8]}"` : ""}>${p}</span>`).join("")}</div><div class="or-tiles">${order.map(o => `<button type="button" class="wtile" data-i="${o.i}" ${this.level === 1 ? `style="--c:${COLORS[o.i % 8]}"` : ""}>${o.p}</button>`).join("")}</div>`;
        this.box.querySelectorAll(".or-tiles .wtile").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tapPart(b); }));
        this.prompt("Подреди сричките, за да се получи дума.");
      } else if (this.level === 3) {
        const w = norm(raw); this.word = w; this.pos = 1; const mid = [...w].slice(1, -1).map((l, i) => ({ l, i: i + 1 }));
        this.box.innerHTML = `<div class="or-slots">${[...w].map((l, i) => `<span class="or-slot${i === 0 || i === w.length - 1 ? " on fixed" : ""}">${i === 0 || i === w.length - 1 ? l : ""}</span>`).join("")}</div><div class="or-tiles">${shuffle(mid).map(o => `<button type="button" class="ac-l" data-i="${o.i}">${o.l}</button>`).join("")}</div>`;
        this.box.querySelectorAll(".or-tiles .ac-l").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tapLetter(b); }));
        this.prompt("Постави буквите на мястото им.");
      } else {
        if (Array.isArray(raw)) {   // от банката: грешките са подбрани (видими, не в последната буква, сгрешената дума не е истинска)
          const lc = this.level === 4 ? x => x.toLowerCase() : x => x; this.text = lc(raw[0]); this.shown = [...lc(raw[1])];
          this.errs = new Set([...this.text].map((l, i) => l !== this.shown[i] ? i : -1).filter(i => i >= 0));
        } else {
          // свободна игра: изречението е с главна буква и точка; грешката не е в последната буква на дума (както в банките)
          const text = this.level === 4 ? norm(raw) : raw[0].toUpperCase() + raw.slice(1).replace(/[.!?]?$/, "."); const safe = (DICT().safe || {})[this.level === 4 ? norm(raw) : raw.toLowerCase().replace(/[.!?]$/, "")];   // места, при които сгрешената дума не е истинска
          const idx = safe || [...text].map((l, i) => PAIRS[l] && /[а-я]/.test(text[i + 1] || "") ? i : -1).filter(i => i >= 0); const n = this.level === 4 ? 1 : 2;
          this.errs = new Set(shuffle(idx).slice(0, n)); this.text = text; this.shown = [...text].map((l, i) => { if (!this.errs.has(i)) return l; const x = PAIRS[l.toLowerCase()]; return l === l.toLowerCase() ? x : x.toUpperCase(); });
        }
        this.left = this.errs.size;
        this.box.innerHTML = `<div class="az-hint">${this.level === 4 ? "В думата има една сгрешена буква. Докосни я." : "В изречението има две сгрешени букви. Докосни ги."}</div><div class="or-text">${this.shown.map((l, i) => l === " " ? `<span class="or-sp"></span>` : `<button type="button" class="ac-l ac-s" data-i="${i}">${l}</button>`).join("")}</div>`;
        this.box.querySelectorAll(".ac-l").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tapErr(b); }));
        this.prompt(this.level === 4 ? "Поправи грешката в думата." : "Поправи грешките в изречението.");
      }
    }
    tapPart(b) {
      if (this.finished || this.locked || b.classList.contains("used")) return;
      const i = Number(b.dataset.i);
      if (i === this.pos) { b.classList.add("used"); const s = this.box.querySelectorAll(".or-slot")[this.pos]; s.textContent = this.parts[i]; s.classList.remove("ghost"); s.classList.add("on"); this.pos++; if (this.pos >= this.parts.length) { this.prompt(this.parts.join("")); this.done(this.parts.join(""), 900); } }
      else { this.miss(this.parts.join(""), this.parts[i]); b.classList.add("bad"); this.shake(b); this.later(() => b.classList.remove("bad"), 800); this.shell.flash(this.pos === 0 ? "С коя сричка започва думата?" : `Коя сричка идва след „${this.parts[this.pos - 1]}“?`, "bad"); this.later(() => this.shell.hideFlash(), 1200); }
    }
    tapLetter(b) {
      if (this.finished || this.locked || b.disabled) return;
      const i = Number(b.dataset.i);
      if (i === this.pos) { b.disabled = true; b.classList.add("used"); const s = this.box.querySelectorAll(".or-slot")[this.pos]; s.textContent = this.word[i]; s.classList.add("on"); this.pos++; if (this.pos >= this.word.length - 1) { this.prompt(this.word); this.done(this.word, 900); } }
      else { this.miss(this.word, this.word[i]); b.classList.add("bad"); this.shake(b); this.later(() => b.classList.remove("bad"), 800); this.shell.flash(`Коя буква идва след „${this.word[this.pos - 1]}“?`, "bad"); this.later(() => this.shell.hideFlash(), 1200); }
    }
    tapErr(b) {
      if (this.finished || this.locked || b.classList.contains("good")) return;
      const i = Number(b.dataset.i);
      if (this.errs.has(i)) { b.textContent = this.text[i]; b.classList.add("good"); this.left--; if (this.left <= 0) { this.prompt(this.text); this.done(this.text, 1000); } }
      else { this.miss(this.text, this.shown[i]); b.classList.add("bad"); this.shake(b); this.later(() => b.classList.remove("bad"), 800); this.shell.flash("Тази буква е вярна. Търси сгрешената.", "bad"); this.later(() => this.shell.hideFlash(), 1200); if (this.stepWrong >= 2) this.box.querySelectorAll(".ac-l").forEach(x => { if (this.errs.has(Number(x.dataset.i)) && !x.classList.contains("good")) x.classList.add("hint"); }); }
    }
  }
  window.GAMES.wordOrder = {
    id: "wordOrder", name: "Словоред", module: "readica", skill: "Строеж на думата", cls: OrderGame,
    task: s => ({ 1: "Подреди сричките, за да се получи дума. Всяка сричка е оцветена в различен цвят.", 2: "Подреди сричките, за да се получи дума.", 3: "Постави буквите на мястото им, за да получиш правилната дума.", 4: "Поправи грешката в думата: една буква е сгрешена.", 5: "Поправи грешките в изречението: две букви са сгрешени." })[Number(s.level) || 1],
    tiers: s => { const q = Number(s.answersQty) || 4; return [0, Math.ceil(q * 0.3), Math.ceil(q * 0.5)]; },
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 5, def: 1 },
      { key: "dataComplexity", label: "Речник", type: "range", min: 1, max: 2, def: 1, enabledIf: s => Number(s.level) !== 1 },
      { key: "maxLettersQty", label: "Максимум букви в дума", type: "range", min: 4, max: 15, def: 4, enabledIf: s => ![1, 5].includes(Number(s.level)) },
      { key: "answersQty", label: "Количество отговори", type: "range", min: 4, max: 25, def: 4 }
    ],
    paramsLine: s => `ниво ${s.level} · ${s.answersQty} задачи`
  };

  /* Съответствие: ниво 1 — изречение и 2 картинки; ниво 2 — картинка и 2 изречения.
     В домашната двойките идват от банката (config/conformity-bank-draft.json) по занятие и рунд, без повторение между рундовете;
     извън нея (свободна игра) — също от банката, по „Речник“ (ниво на изреченията); старият речник е само резерв. Вярно може да е всяко от двете изречения на двойката. Изречението не се чете на глас преди избора
     (детето чете само); гласът потвърждава след верен отговор. Картинка: assets/img/art/sent/<id>a.jpg (изречението) и <id>b.jpg (двойката);
     докато я няма, картата е временна, с текста. */
  const CF_BANK_URL = "config/conformity-bank-draft.json?v=4";
  let cfBank = null;
  const CF_SEEN = "platforma.cf.seen.v1";
  const cfSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(CF_SEEN) || "[]")); } catch (e) { return new Set(); } };
  const cfMarkSeen = id => { try { const s = cfSeen(); s.add(id); localStorage.setItem(CF_SEEN, JSON.stringify([...s])); } catch (e) {} };
  const loadCfBank = () => cfBank || (cfBank = fetch(CF_BANK_URL).then(r => r.ok ? r.json() : null).catch(() => null));
  class ConformityGame extends CardGame {
    constructor(...a) { super(...a); this.total = Number(this.s.answersQty) || 4; this.level = Number(this.s.level) || 1; }
    get gameId() { return "conformity"; } get skillName() { return "Разбиране на изречение"; }
    start() {
      const c = this.ctx;
      // свободна игра: двойките с картинки от банката (ниво на изреченията = „Речник“), без измерване
      if (!c.lesson || c.round == null || !window.CF_PLAN) return loadCfBank().then(bank => {
        if (bank) { const lv = Number(this.s.dataComplexity) || 1, pool = bank.pairs.filter(p => p.level === lv && p.free_play !== false && !p.pilot_only); if (pool.length) { this.slotPairs = pool; this.measured = false; } }
        if (!this.finished) super.start();
      });
      loadCfBank().then(bank => {
        if (bank) this.fromBank(bank, c);
        if (!this.finished) super.start();
      });
    }
    // план на занятието: веднъж за сесията (домашна + занятие + версия на банката), за всички рундове с играта
    fromBank(bank, c) {
      const P = window.CF_PLAN, key = `${c.lesson}.Р${c.round}`, slot = (bank.slots || {})[key], byId = {}; bank.pairs.forEach(p => { byId[p.id] = p; });
      const pk = `platforma.cfplan.v1:${c.hw || "free"}:${c.lesson}:${bank.version}`;
      const plan = () => { let pl = null; try { pl = JSON.parse(localStorage.getItem(pk) || "null"); } catch (e) {} if (!pl) { pl = P.planLesson(bank, c.lesson, cfSeen(), pk); try { localStorage.setItem(pk, JSON.stringify(pl)); } catch (e) {} } return pl || {}; };
      const fallback = !slot || slot.fallback || (c.tpl && c.tpl !== "conformity");
      if (fallback) {
        // временна замяна: не показва двойките, които планът на занятието е избрал за измерване (без предварително излагане)
        const ex = new Set(); if (slot && slot.exclude_eligible_for) { const pl = plan(); slot.exclude_eligible_for.forEach(k => (pl[k] || []).forEach(id => ex.add(id))); }
        this.slotPairs = P.fallbackPool(bank, c.lesson, (slot && slot.level) || this.level).filter(p => !ex.has(p.id)); if (slot && slot.level) this.level = slot.level;
        this.measured = false; this.bankItem = true; return;
      }
      const ids = plan()[key] || [];
      if (!ids.length) return;
      this.slotPairs = ids.map(id => byId[id]).filter(Boolean); this.keepOrder = true; this.level = slot.level || this.level; this.total = this.slotPairs.length; this.measured = !!slot.measurement; this.bankItem = true;
    }
    render() {
      const ph = DICT().phrases || {};
      this.pool = this.keepOrder ? this.slotPairs.slice() : shuffle(this.slotPairs ? this.slotPairs.slice() : (ph[String(this.s.dataComplexity)] || ph["1"] || [{ phrase: "Котката спи.", pair: "Кучето спи." }]).slice());
      this.k = 0; this.scene("wt-cf", "scene-space-game"); this.shell.setLabel(this.level === 1 ? "Коя картинка отговаря?" : "Кое изречение отговаря?");
    }
    // side: "a" — изречението от двойката, "b" — двойката
    pic(it, side) {
      const text = side === "a" ? it.phrase : it.pair;
      const img = it.id ? `<img class="cf-img" src="assets/img/art/sent/${it.id}${side}.jpg" alt="">` : "";
      return `<span class="pic" style="--pic-bg:#E8E3FA">${img}<svg viewBox="0 0 100 100"${img ? " hidden" : ""}><use href="#pic-cat-emotion"/></svg><b${img ? " hidden" : ""}>${text}</b></span>`;
    }
    startRound() {
      this.stepWrong = 0; const it = this.pool[this.k++ % this.pool.length];
      const t = Math.random() < 0.5 ? "a" : "b", o = t === "a" ? "b" : "a"; const txt = side => side === "a" ? it.phrase : it.pair;
      this.cur = { it, t, text: txt(t) }; const opts = shuffle([t, o]);
      if (this.level === 1) this.box.innerHTML = `<div class="pcards">${opts.map(sd => `<button type="button" class="pcard cf-pic" data-side="${sd}">${this.pic(it, sd)}</button>`).join("")}</div><div class="qtext cf-q">${txt(t)}</div>`;
      else this.box.innerHTML = `<div class="pcard cf-pic big">${this.pic(it, t)}</div><div class="cf-opts">${opts.map(sd => `<button type="button" class="wtile cf-s" data-side="${sd}">${txt(sd)}</button>`).join("")}</div>`;
      this.box.querySelectorAll("[data-side]").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.tap(b); }));
      // няма картинка още: временната карта с текста
      this.box.querySelectorAll("img.cf-img").forEach(im => im.addEventListener("error", () => { const pc = im.parentNode; im.remove(); pc.querySelectorAll("[hidden]").forEach(x => x.removeAttribute("hidden")); }));
    }
    event(ok, extra) { const e = super.event(ok, extra); if (this.bankItem && this.cur && this.cur.it.id) { e.bank_item = `${this.cur.it.id}${this.cur.t}`; if (this.cur.it.level < this.level) e.lower_level = true; if (!this.measured) e.fallback = true; } return e; }
    tap(b) {
      if (this.finished || this.locked) return;
      const cur = this.cur, ok = b.dataset.side === cur.t; this.locked = true;
      if (this.measured && cur.it.id) cfMarkSeen(cur.it.id);
      if (ok) { b.classList.add("good"); this.prompt(cur.text); this.done(cur.text, 1400); }
      else { const given = b.dataset.side === "a" ? cur.it.phrase : cur.it.pair; this.miss(cur.text, given); b.classList.add("bad"); this.shake(b); this.box.querySelectorAll("[data-side]").forEach(x => { if (x.dataset.side === cur.t) x.classList.add("hint"); }); this.shell.flash("Вярното е отбелязано", "bad"); this.roundOk.push(false); this.idx++; this.renderProgress(); this.log.push(this.event(false, { text: cur.text, answer: cur.text, given, ok: false, ms: Date.now() - this.roundStart, adapt: 0, first_attempt_correct: false })); /* краен запис на задачата, не „опит“ */ this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 1500); }
    }
  }
  window.GAMES.conformity = {
    id: "conformity", name: "Съответствие", module: "readica", skill: "Разбиране при четене", cls: ConformityGame,
    task: s => Number(s.level) === 2 ? "Избери подходящото изречение към картинката." : "Избери подходящата картинка към изречението.",
    tiers: s => { const q = Number(s.answersQty) || 4; return [0, Math.ceil(q * 0.3), Math.ceil(q * 0.5)]; },
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 2, def: 1 },
      { key: "answersQty", label: "Количество отговори", type: "range", min: 4, max: 25, def: 4 },
      { key: "dataComplexity", label: "Речник", type: "range", min: 1, max: 2, def: 1 }
    ],
    paramsLine: s => `ниво ${s.level} · ${s.answersQty} изречения`
  };

  /* Читалка (Читарика): 1 срички, 2 думи, 3 изречения, 4 текст. Броят единици = Количество отговори; резултат = скорост на четене. */
  class ReadcaRGame extends CardGame {
    constructor(...a) { super(...a); this.level = Number(this.s.level) || 1; this.total = Number(this.s.answersQty) || 3; this.auto = this.s.autoSwitch === "on"; this.speed = Number(this.s.speed) || 1; }
    get gameId() { return "readcaR"; } get skillName() { return ({ 1: "Четене на срички", 2: "Четене на думи", 3: "Четене на изречения", 4: "Четене на текст" })[this.level]; }
    renderLives() { this.shell.lives.innerHTML = ""; }
    render() {
      const D = DICT(); let pool;
      // 19.10: ниво 1 – само срички (2–3 букви; 4-буквените като „балк“ четат като космически думи);
      // ниво 2 – двата речника са еднакви, затова „Сложност“ е дължината: 1 – думи от 1–2 срички, 2 – от 3 и повече
      if (this.level === 1) pool = ((D.mixed || {})["1"] || ["МА", "НА"]).filter(x => x.length <= 3).map(x => x.toLowerCase());
      else if (this.level === 2) pool = words(1, 15).filter(w => Number(this.s.dataComplexity) === 2 ? w.split("/").length >= 3 : w.split("/").length <= 2).map(norm);
      else if (this.level === 3) pool = ((D.sentences || {})[String(this.s.dataComplexity)] || (D.sentences || {})["1"] || ["мама чете книга"]).map(x => (Array.isArray(x) ? x[0] : x));
      else pool = ((D.texts || {})["1"] || [["Заглавие", "Текст."]]).map(x => ({ title: x[0], text: x[1] }));
      this.items = shuffle(pool.slice()).slice(0, this.total); this.k = 0;
      this.scene("wt-rd rd", "scene-space-game"); this.shell.setLabel(({ 1: "Прочети сричките", 2: "Прочети думите", 3: "Прочети изреченията", 4: "Прочети текста" })[this.level]);
      this.box.innerHTML = `<div class="rd-card${this.level >= 3 ? " wide" : ""}"><div class="rd-word${this.level >= 3 ? " text" : ""}" id="word"></div></div>${this.auto ? `<div class="rd-auto">Сменя се автоматично на всеки ${this.speed} сек.</div>` : `<button type="button" class="gbtn gbtn-green rd-next" id="next">Следваща</button>`}<div class="rd-count">Прочетени: <b id="cnt">0</b> от ${this.total}</div>`;
      this.word = this.box.querySelector("#word"); this.cnt = this.box.querySelector("#cnt"); const n = this.box.querySelector("#next"); if (n) n.addEventListener("click", () => this.next());
    }
    startRound() { this.show(); if (this.auto && !this.iv) this.iv = setInterval(() => this.next(), this.speed * 1000); }
    show() { const it = this.items[this.k]; this.word.innerHTML = this.level === 4 ? `<h3>${it.title}</h3><p>${it.text}</p>` : (this.level === 1 ? it.toUpperCase() : it); this.word.classList.remove("in"); void this.word.offsetWidth; this.word.classList.add("in"); this.roundStart = Date.now(); }
    next() { if (this.finished) return; const it = this.items[this.k]; this.correct++; this.log.push(this.event(true, { text: typeof it === "string" ? it : it.title, answer: "", given: "", ok: true, ms: Date.now() - this.roundStart, adapt: 0 , first_attempt_correct: this.stepWrong === 0, attempt_count: this.stepWrong + 1 })); this.roundOk.push(true); this.idx++; this.renderProgress(); this.k++; this.cnt.textContent = this.k; if (this.k >= this.total) { clearInterval(this.iv); this.finish(); } else this.show(); }
    destroy() { clearInterval(this.iv); super.destroy(); }
  }
  window.GAMES.readcaR = {
    id: "readcaR", name: "Читалка", module: "readica", skill: "Четене", cls: ReadcaRGame,
    task: s => ({ 1: "Прочети сричките.", 2: "Прочети думите.", 3: "Прочети изреченията.", 4: "Прочети текста." })[Number(s.level) || 1],
    tiers: () => [0, 0, 0],
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 4, def: 1 },
      { key: "answersQty", label: "Количество отговори", type: "range", min: 3, max: 100, def: 3, help: "Колко срички, думи, изречения или текста ще прочете детето." },
      { key: "autoSwitch", label: "Автоматично превключване", type: "cycle", options: [["off", "Изключено"], ["on", "Включено"]], def: "off" },
      { key: "speed", label: "Скорост", type: "range", min: 1, max: 7, def: 1, unit: "сек.", enabledIf: s => s.autoSwitch === "on" },
      { key: "dataComplexity", label: "Сложност", type: "range", min: 1, max: 2, def: 1, enabledIf: s => [2, 3].includes(Number(s.level)), help: "Ниво 2 (думи): 1 – думи от 1–2 срички, 2 – от 3 и повече срички. Ниво 3 (изречения): 1 – кратки (около 3 думи), 2 – по-дълги (около 5 думи)." }
    ],
    paramsLine: s => `ниво ${s.level} · ${s.answersQty} единици` + (s.autoSwitch === "on" ? ` · авто ${s.speed} сек.` : "")
  };
})();
