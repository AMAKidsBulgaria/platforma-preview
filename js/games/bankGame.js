/* Домашните на Букварика 1–13 по банките (config/banks-b1-5.json и config/banks-b6-13.json).
   Когато играта е отворена от домашна (lesson=BK01…BK13 и round), обвивката ползва този клас вместо обичайната игра:
   задачите идват от плана на сесията (bankPlan.js), а изгледът следва вида на задачата в банката.
   Звукът засега е синтезиран глас; записите от диктора ще се пускат по името на файла от config/audio-b1-5.csv. */
(function () {
  const TR = Object.fromEntries([..."абвгдежзийклмнопрстуфхцчшщъьюя"].map((c, i) => [c, ["a", "b", "v", "g", "d", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "h", "ts", "ch", "sh", "sht", "a", "y", "yu", "ya"][i]]));
  const lat = w => [...w.toLowerCase()].map(c => TR[c] ?? c).join("");
  const PIC = w => `assets/img/art/pics/pic_${lat(w)}.png`;
  const VOW = "аеиоуъюя";
  // Измерване на четене (запис → звук): в тези рундове детето вижда написаното и избира как звучи – без да е чуло верния прочит.
  // Конструкторът (звук → запис) остава за упражнението. Засега със синтезиран глас; със записите на диктора става годно за измерване.
  // Име на изгледа за детето и за данните: едно име = една механика (заглавието на шаблона в домашната е само справка).
  // „Звуково-буквен анализ“ остава за класифициране на звука (гласна / съгласна / звучна / беззвучна) – тук не се ползва.
  const VIEW = {
    whichLetter: ["Начален звук", "picture_to_letter"], readPick: ["Чета и чувам", "read_to_sound"], pickSyllable: ["Чувам и избирам сричка", "sound_to_written"],
    letterChoice: ["Чувам звук, избирам буква", "sound_to_letter"], firstSound: ["Фонематичен слух", "sound_to_picture"], pair: ["Фонематичен слух", "pictures_to_letter"],
    twoPics: ["Фонематичен слух", "sound_to_picture"], azbuka: ["Азбука", "sound_to_letter"], elements: ["Буква от елементи", "letter_form"],
    construct: ["Конструктор", "sound_to_written"], wordOrder: ["Словоред", "order_syllables"], trueWords: ["Правилни думи", "read_to_picture"],
    gapTask: ["Попълни буквата", "sound_to_letter"], minPair: ["Минимална двойка", "sound_to_picture"], fixLetter: ["Поправи буквата", "read_to_picture"],
    sentence: ["Построй изречение", "order_words"], sentencePicture: ["Изречение и картина", "read_to_picture"] };
  const READPICK = { BK03: [3, 4], BK04: [1, 4], BK05: [4] };
  const NEAR = { м: "н", н: "м", л: "р", р: "л", б: "п", п: "б", д: "т", т: "д", г: "к", к: "г", в: "ф", ф: "в", з: "с", с: "з", ж: "ш", ш: "ж" };
  const VSWAP = { а: "о", о: "у", у: "а", е: "и", и: "е", ъ: "а", ю: "у", я: "а" };
  // 2 разсейващи: обратен ред (ам/ма, срички наобратно), сходна съгласна (м/н, л/р), друга гласна; само позволени букви
  function readFoils(w, known) {
    const ok = x => x !== w && [...x].every(c => known.includes(c)), out = [];
    const add = x => { if (ok(x) && !out.includes(x)) out.push(x); };
    const syl = syllables(w);
    if (w.length === 2) add(w[1] + w[0]); else if (syl.length === 2 && syl.every(x => x.length === 2)) add(syl[1] + syl[0]); // срички: ам/ма; думи: само двусрични ма-ла → ла-ма
    [...w].forEach((c, i) => { if (NEAR[c]) add(w.slice(0, i) + NEAR[c] + w.slice(i + 1)); });
    [...w].forEach((c, i) => { if (VSWAP[c]) add(w.slice(0, i) + VSWAP[c] + w.slice(i + 1)); });
    return out.slice(0, 2);
  }
  const SOUND = { "а": "а", "у": "у", "и": "и", "о": "о", "е": "е", "ъ": "ъ", "й": "й", "ю": "йу", "я": "йа" };
  // картинки без /й/ и без /ъ/ за задачите с две картинки („В коя дума чуваш…?“)
  const PLAIN = ["котка", "топка", "слон", "риба", "куче", "нос", "кола", "пчела", "домат", "часовник", "жаба", "зебра", "балон", "ваза", "пиле", "торта", "банан", "лодка"];
  const KEY = "platforma.bankplan.v1";
  const DATA = {};
  const load = n => { const f = n <= 5 ? "config/banks-b1-5.json" : n <= 13 ? "config/banks-b6-13.json?v=4" : "config/banks-b14.json?v=1"; return DATA[f] || (DATA[f] = fetch(f).then(r => r.json())); };
  const SND = c => SOUND[c] || c;

  // Деление на срички: една съгласна между гласни отива към следващата сричка, от две и повече първата остава;
  // Ь и Й пред гласна вървят с нея (шо-фьор, ма-йор). Същото правило е в tools/banks_b6_13.py.
  function syllables(w) {
    const s = w.toLowerCase(), v = [...s].map((c, i) => VOW.includes(c) ? i : -1).filter(i => i >= 0);
    if (v.length < 2) return [s];
    const cuts = []; for (let k = 0; k < v.length - 1; k++) { const g = s.slice(v[k] + 1, v[k + 1]), soft = g.length > 1 && /[ьй]$/.test(g) ? 1 : 0; cuts.push(g.length - soft <= 1 ? v[k] + 1 : v[k] + 2); }
    const out = []; let from = 0; cuts.forEach(c => { out.push(s.slice(from, c)); from = c; }); out.push(s.slice(from)); return out;
  }

  class BankGame extends BaseGame {
    constructor(shell, settings, tier, onFinish) { super(shell, settings, tier, onFinish); this.items = []; this.timers = []; this.stepWrong = 0; this.roundOk = []; }
    get gameId() { return this.gid || "bank"; }
    get skillName() { return this.bankGame ? this.bankGame.game : ""; }
    start() {
      const c = this.ctx; this.n = Number(c.lesson.replace(/\D/g, ""));
      load(this.n).then(bank => {
        if (this.finished) return;
        this.bank = bank; this.lesson = c.lesson;
        this.gid = (location.hash.match(/game\/([A-Za-z]+)/) || [])[1] || "bank";
        this.bankGame = BANK_PLAN.bankGameFor(bank, c.lesson, c.round, this.gid);
        const U = BANK_PLAN.units(bank, c.lesson);
        const plan = this.plan(bank);
        const ids = this.bankGame ? ((plan[c.round] || {})[this.bankGame.game] || []) : [];
        this.items = ids.map(id => U[id]).filter(Boolean);
        this.total = this.items.length;
        const t = document.getElementById("game-title"); if (t && this.bankGame) t.textContent = this.bankGame.game.replace(/\s*\(.*\)|\s*\/.*$/, "");
        super.start();
      }).catch(e => { console.error(e); this.shell.arena.innerHTML = `<div class="az-hint">Задачите не се заредиха: ${e.message}</div>`; });
    }
    // План за цялата сесия: пази се по домашна и занятие, за да не се повтарят думи между рундовете
    plan(bank) {
      // Б14 (checkpoint): при повторно минаване – друга домашна за същото занятие – резервният набор
      if (bank.retake === "reserve") {
        const fk = `platforma.checkpoint.${this.lesson}.firstHw`, hw = this.ctx.hw || "demo";
        let first = null; try { first = localStorage.getItem(fk); if (!first) localStorage.setItem(fk, first = hw); } catch (e) {}
        if (first && first !== hw) {
          bank.rounds = { [this.lesson]: bank.rounds[this.lesson].map(r => Object.assign({}, r, { eligible: r.reserve_eligible || r.eligible })) };
          bank.letters = bank.letters_reserve || bank.letters; this.retake = true;
        }
      }
      const k = `${KEY}:${this.ctx.hw || "demo"}:${this.lesson}:${bank.version}${this.retake ? ":r" : ""}`;
      try { const s = localStorage.getItem(k); if (s) return JSON.parse(s); } catch (e) {}
      const p = BANK_PLAN.planLesson(bank, this.lesson, k);
      try { localStorage.setItem(k, JSON.stringify(p)); } catch (e) {}
      return p;
    }
    renderProgress() { const p = this.shell.progress; p.innerHTML = ""; for (let i = 0; i < this.total; i++) { const li = document.createElement("li"); if (i < this.roundOk.length) li.className = this.roundOk[i] ? "ok" : "bad"; else if (i === this.roundOk.length) li.className = "now"; p.appendChild(li); } }
    later(fn, ms) { const t = setTimeout(() => { if (!this.finished) fn(); }, ms); this.timers.push(t); return t; }
    destroy() { this.timers.forEach(clearTimeout); super.destroy(); }
    render() {
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-meadow"/></svg><div class="az bk" id="bk"></div>`;
      this.box = this.shell.arena.querySelector("#bk");
    }
    // ---------- звук ----------
    // Едно изречение или поредица думи; засега синтезиран глас.
    speak(...parts) {
      if (!("speechSynthesis" in window) || localStorage.getItem("platforma.sound") === "off") return;
      speechSynthesis.cancel();
      const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith("bg"));
      parts.filter(Boolean).forEach(t => { const u = new SpeechSynthesisUtterance(t); u.lang = "bg-BG"; u.rate = 0.85; if (v) u.voice = v; speechSynthesis.speak(u); });
    }
    // ---------- изграждане ----------
    pic(w, cls) { return `<button type="button" class="ph-pic bk-pic ${cls || ""}" data-v="${w}" aria-label="${w}"><img src="${PIC(w)}" alt="" draggable="false"><span class="bk-ear" data-say="${w}" aria-label="Чуй думата"></span></button>`; }
    keys(list, cls) { return `<div class="ph-keys bk-keys ${cls || ""}">${list.map(k => `<button type="button" class="ph-key bk-key" data-v="${k}">${k}</button>`).join("")}</div>`; }
    replay(text) { return `<button type="button" class="bk-replay" aria-label="Чуй отново"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`; }
    wire(onPick) {
      this.box.querySelectorAll(".bk-ear").forEach(e => e.addEventListener("pointerdown", ev => { ev.preventDefault(); ev.stopPropagation(); this.speak(e.dataset.say); }));
      this.box.querySelectorAll("[data-v]").forEach(b => b.addEventListener("pointerdown", ev => { if (ev.target.closest(".bk-ear")) return; ev.preventDefault(); onPick(b); }));
      const r = this.box.querySelector(".bk-replay"); if (r) r.addEventListener("pointerdown", ev => { ev.preventDefault(); this.prompt(); });
    }
    knownVowels() { return [..."АУИОЕ"].filter(ch => [1, 2].some(m => m <= this.n && this.bank.letters[m].includes(ch))); }

    startRound() {
      this.view = null; const r = this._startRound();
      const v = VIEW[this.view] || [this.bankGame.game, null], t = document.getElementById("game-title"); if (t && this.view) t.textContent = v[0];
      return r;
    }
    // данни: реалният тип на задачата, независимо от заглавието на шаблона
    event(ok, extra) {
      const v = VIEW[this.view] || [];
      return super.event(ok, Object.assign({ game_type: this.view, view_name: v[0] || null, direction: v[1] || null, target_skill: this.u && this.u.skill || null, template_title: this.bankGame && this.bankGame.game }, extra || {}));
    }
    _startRound() {
      this.stepWrong = 0; const u = this.items[this.idx]; this.u = u; this.prompt = () => {};
      const g = this.bankGame.game;
      if (u.type === "форма" && u.variant) return this.elements(u);
      if (u.type === "форма") return this.azbuka(u);
      if (u.fix) return this.fixLetter(u);
      if (u.words) return this.sentence(u);
      if (u.mp) return this.minPair(u);
      if (u.keys) return this.letterChoice(u);
      if (u.sp) return this.sentencePicture(u);
      if (u.gap) return this.gapTask(u);
      if (u.parts) return this.wordOrder(u);
      if (u.distract && u.write) return this.trueWords(u);
      if (u.pics) return this.pair(u);
      if (u.write && !u.distract && !u.parts && !u.gap && (READPICK[this.lesson] || []).includes(Number(this.ctx.round))) return this.readPick(u);
      if (u.write && g.startsWith("Конструктор")) return this.construct(u);
      if (u.write) return this.pickSyllable(u);
      if (u.contrast) return this.twoPics(u, u.contrast, `Коя дума започва с /${SOUND[u.target.toLowerCase()]}/?`);
      if (u.ask) return this.twoPics(u, this.plainPic(u.pic), "В коя дума чуваш /й/?");
      if (u.pos === "вътре") return this.twoPics(u, this.plainPic(u.pic), "В коя дума чуваш /ъ/?");
      if (u.distract) return this.firstSound(u);
      return this.whichLetter(u);
    }
    plainPic(not) { const opts = PLAIN.filter(w => w !== not); return opts[(this.idx * 7 + not.length) % opts.length]; }

    // Фонематичен слух н.1: буква и 4 картинки, коя започва с този звук
    firstSound(u) {
      this.view = "firstSound";
      const t = u.target.toLowerCase(), opts = shuffle([u.pic, ...u.distract]);
      this.shell.setLabel(`${u.target} ${t}`);
      this.answerKey = u.pic;
      this.prompt = () => this.speak(`Коя картинка започва с ${SND(t)}?`);
      this.box.innerHTML = `<div class="az-hint">Коя картинка започва с /${SND(t)}/? ${this.replay()}</div><div class="ph-grid bk-grid">${opts.map(w => this.pic(w)).join("")}</div>`;
      this.wire(b => this.check(b, b.dataset.v === u.pic, u.pic, b.dataset.v, () => this.speak(b.dataset.v)));
      this.prompt();
    }
    // Звуково-буквен анализ н.1: една картинка, с коя буква започва думата
    whichLetter(u) {
      this.view = "whichLetter";
      const keys = this.knownVowels();
      this.shell.setLabel("");
      this.answerKey = u.target;
      this.prompt = () => this.speak(u.pic);
      this.box.innerHTML = `<div class="az-hint">С кой звук започва думата? ${this.replay()}</div><div class="ph-grid bk-grid one">${this.pic(u.pic, "static")}</div>${this.keys(keys)}`;
      this.wire(b => { if (b.classList.contains("bk-pic")) return this.speak(u.pic); this.check(b, b.dataset.v === u.target, u.target, b.dataset.v, () => this.speak(u.pic)); });
      this.prompt();
    }
    // Две картинки: коя има звука (Ъ вътре, /й/, /йу/ срещу /у/, /йа/ срещу /а/)
    twoPics(u, other, q) {
      this.view = "twoPics";
      const opts = shuffle([u.pic, other]);
      this.shell.setLabel("");
      this.answerKey = u.pic;
      this.prompt = () => this.speak(q, ...opts);
      this.box.innerHTML = `<div class="az-hint">${q} ${this.replay()}</div><div class="ph-grid bk-grid">${opts.map(w => this.pic(w)).join("")}</div>`;
      this.wire(b => this.check(b, b.dataset.v === u.pic, u.pic, b.dataset.v, () => this.speak(b.dataset.v)));
      this.prompt();
    }
    // Фонематичен слух н.2: две картинки с общ звук, кой е той
    pair(u) {
      this.view = "pair";
      const [a, b] = u.pics, inner = u.pos === "вътре", t = u.target;
      const both = ch => a.includes(ch.toLowerCase()) && b.includes(ch.toLowerCase());
      let keys = inner ? ["А", "О", "У", "И", "Ъ"] : this.knownVowels();
      keys = keys.filter(k => k === t || (inner ? !both(k) : !(a[0] === k.toLowerCase() && b[0] === k.toLowerCase())));
      const q = inner ? "Кой звук чуваш и в двете думи?" : "С кой звук започват и двете думи?";
      this.shell.setLabel("");
      this.answerKey = t;
      this.prompt = () => this.speak(a, b);
      this.box.innerHTML = `<div class="az-hint">${q} ${this.replay()}</div><div class="ph-grid bk-grid">${this.pic(a, "static")}${this.pic(b, "static")}</div>${this.keys(keys)}`;
      this.wire(el => { if (el.classList.contains("bk-pic")) return this.speak(el.dataset.v); this.check(el, el.dataset.v === t, t, el.dataset.v, () => this.speak(a, b)); });
      this.prompt();
    }
    // Азбука: целта сред неназовани форми
    azbuka(u) {
      this.view = "azbuka";
      const opts = shuffle([u.target, ...u.shapes]);
      this.shell.setLabel("");
      this.answerKey = u.target;
      this.prompt = () => this.speak(`Намери буквата ${SOUND[u.target.toLowerCase()] || u.target}`);
      this.box.innerHTML = `<div class="az-hint">Намери буквата ${this.replay()}</div>${this.keys(opts, "big")}`;
      this.wire(b => this.check(b, b.dataset.v === u.target, u.target, b.dataset.v, () => this.prompt()));
      this.prompt();
    }
    // Буква от елементи: правилната форма срещу една грешна
    elements(u) {
      this.view = "elements";
      const opts = shuffle(["ok", "bad"]);
      this.shell.setLabel(u.target);
      this.answerKey = "ok";
      this.prompt = () => this.speak(`Коя буква ${SND(u.target.toLowerCase())} е написана правилно?`);
      this.box.innerHTML = `<div class="az-hint">Коя е написана правилно? ${this.replay()}</div><div class="bk-forms">${opts.map(o => `<button type="button" class="bk-form" data-v="${o}">${window.LETTER_FORM(u.target, o === "ok" ? "" : u.variant)}</button>`).join("")}</div>`;
      this.wire(b => this.check(b, b.dataset.v === "ok", u.target, b.dataset.v === "ok" ? u.target : u.variant, () => {}));
      this.prompt();
    }
    // Звуково-буквен анализ н.2: чуй сричката, избери я сред три изписани
    pickSyllable(u) {
      this.view = "pickSyllable";
      const s = u.write, rev = s.split("").reverse().join(""), vs = "аоуеи".replace(s.slice(-1), "").replace(s[0], "");
      const swap = VOW.includes(s[1]) ? s[0] + vs[(s.charCodeAt(0)) % vs.length] : vs[(s.charCodeAt(1)) % vs.length] + s[1];
      const opts = shuffle([...new Set([s, rev, swap])]);
      this.shell.setLabel("");
      this.answerKey = s;
      this.prompt = () => this.speak(s);
      this.box.innerHTML = `<div class="az-hint">Коя сричка чуваш? ${this.replay()}</div>${this.keys(opts, "big wide")}`;
      this.wire(b => this.check(b, b.dataset.v === s, s, b.dataset.v, () => this.speak(s)));
      this.prompt();
    }
    // Запис → звук: написана сричка/дума и 3 звукови карти; докосване пуска звука и маркира, „Избирам“ потвърждава.
    // Указанието не казва верния прочит; оценява се първото „Избирам“.
    readPick(u) {
      this.view = "readPick";
      const w = u.write.toLowerCase();
      const known = Object.keys(this.bank.letters).filter(m => Number(m) <= this.n).map(m => this.bank.letters[m]).join("").toLowerCase();
      const opts = shuffle([w, ...readFoils(w, known)]); let sel = null;
      this.shell.setLabel(""); this.answerKey = w;
      const ask = "Прочети. Кое звучи като написаното? Чуй и избери.";
      this.prompt = () => this.speak(ask);
      this.box.innerHTML = `<div class="az-hint">Кое звучи като написаното? ${this.replay()}</div><div class="bk-word rp-word">${w}</div>
        <div class="rp-opts">${opts.map((o, i) => `<button type="button" class="rp-card" data-v="${o}" aria-label="Звук ${i + 1}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><b>${i + 1}</b></button>`).join("")}</div>
        <button type="button" class="st-btn rp-go" id="rp-go" disabled>Избирам</button>`;
      const go = this.box.querySelector("#rp-go");
      this.box.querySelectorAll(".rp-card").forEach(b => b.addEventListener("pointerdown", ev => {
        ev.preventDefault(); if (this.locked || b.classList.contains("bad")) return;
        this.speak(b.dataset.v); sel = b; this.box.querySelectorAll(".rp-card").forEach(x => x.classList.toggle("on", x === b)); go.disabled = false;
      }));
      go.addEventListener("click", () => { if (!sel || this.locked) return; const b = sel; sel = null; go.disabled = true; b.classList.remove("on"); this.check(b, b.dataset.v === w, w, b.dataset.v, () => {}); if (this.log.length) Object.assign(this.log[this.log.length - 1], { voice: "tts" }); });
      const r = this.box.querySelector(".bk-replay"); if (r) r.addEventListener("pointerdown", ev => { ev.preventDefault(); this.prompt(); });
      this.prompt();
    }
    // Конструктор: чуй сричката или думата и я сглоби от букви (сричка) или срички (дума)
    construct(u) {
      this.view = "construct";
      const w = u.write.toLowerCase(), parts = syllables(w).length > 1 ? syllables(w) : [...w];
      const byLetters = parts.every(p => p.length === 1);
      const known = Object.keys(this.bank.letters).filter(m => Number(m) <= this.n).map(m => this.bank.letters[m]).join("").toLowerCase().replace("ъ", "");
      const words = this.bank.bank.words_by_lesson ? this.bank.bank.words_by_lesson[this.n] : this.bank.bank[this.n >= 5 ? "words_b5" : "words_b4"];
      const pool = byLetters ? [...known].filter(c => !w.includes(c)) : (words || []).flatMap(syllables).filter(p => !parts.includes(p));
      const extra = pool.length ? [pool[(w.charCodeAt(0) + this.idx) % pool.length]] : [];
      this.buildTask(w, parts, shuffle(parts.concat(extra)), byLetters ? "Сглоби сричката" : "Сглоби думата", () => this.speak(w));
    }
    // Словоред: подреди сричките на думата
    wordOrder(u) {
      this.view = "wordOrder";
      const parts = u.parts.split("-");
      this.buildTask(u.write, parts, shuffle(parts.slice()), "Подреди думата", () => {}, true);
    }
    buildTask(word, parts, tiles, title, say, readAfter) {
      let got = 0;
      this.shell.setLabel("");
      this.answerKey = word;
      this.prompt = say;
      this.box.innerHTML = `<div class="az-hint">${title} ${readAfter ? "" : this.replay()}</div><div class="bk-slots">${parts.map(() => `<span class="bk-slot"></span>`).join("")}</div>${this.keys(tiles, "big wide")}`;
      const slots = [...this.box.querySelectorAll(".bk-slot")];
      this.wire(b => {
        if (this.locked || b.classList.contains("used")) return;
        if (b.dataset.v === parts[got]) {
          slots[got].textContent = b.dataset.v; slots[got].classList.add("on"); b.classList.add("used"); got++;
          if (got === parts.length) { if (readAfter) this.speak(word); this.done(word); }
        } else { this.miss(word, b.dataset.v); b.classList.add("bad"); this.shake(b); this.later(() => b.classList.remove("bad"), 600); if (this.stepWrong >= 2) { const h = [...this.box.querySelectorAll(".bk-key")].find(x => x.dataset.v === parts[got] && !x.classList.contains("used")); if (h) h.classList.add("hint"); } }
      });
      say();
    }
    // Правилни думи: прочети думата и избери картинката (без звук на думата)
    trueWords(u) {
      this.view = "trueWords";
      const opts = shuffle([u.pic, ...u.distract]);
      this.shell.setLabel("");
      this.answerKey = u.pic;
      this.prompt = () => this.speak("Прочети думата и избери картинката.");
      this.box.innerHTML = `<div class="bk-word">${u.write}</div><div class="ph-grid bk-grid">${opts.map(w => this.pic(w, "noear")).join("")}</div>`;
      this.wire(b => this.check(b, b.dataset.v === u.pic, u.pic, b.dataset.v, () => {}));
      this.prompt();
    }
    // Фонетика / Звуково-буквен анализ (Б6–Б13): чуй думата и избери буквата от двойката (или от няколко)
    letterChoice(u) {
      this.view = "letterChoice";
      const q = u.pos === "край" && u.keys.length > 2 ? "С кой звук завършва думата?" : u.pos === "начало" ? (u.keys.length > 2 && !this.bank.checkpoint ? "С коя буква започва думата?" : "С кой звук започва думата?") : `Кой звук чуваш в думата: ${u.keys.join(" или ")}?`;
      this.shell.setLabel("");
      this.answerKey = u.target;
      this.prompt = () => this.speak(u.pic);
      this.box.innerHTML = `<div class="az-hint">${q} ${this.replay()}</div><div class="ph-grid bk-grid one">${this.pic(u.pic, "static")}</div>${this.keys(u.keys, "big")}`;
      this.wire(b => { if (b.classList.contains("bk-pic")) return this.speak(u.pic); this.check(b, b.dataset.v === u.target, u.target, b.dataset.v, () => this.speak(u.pic)); });
      this.prompt();
    }
    // Изречение → картина (Б14): прочети изречението и избери една от двете картинки (различават се по едно нещо)
    sentencePicture(u) {
      this.view = "sentencePicture";
      const opts = shuffle([0, 1]);
      this.shell.setLabel("");
      this.answerKey = "0";
      this.prompt = () => this.speak("Прочети изречението и избери картинката.");
      this.box.innerHTML = `<div class="bk-word bk-sent">${u.write}</div><div class="ph-grid bk-grid two">${opts.map(i => `<button type="button" class="ph-pic bk-pic bk-scene" data-v="${i}"><img src="${u.sp[i]}" alt="" draggable="false"></button>`).join("")}</div>`;
      this.wire(b => this.check(b, b.dataset.v === "0", u.write, b.dataset.v, () => {}));
      this.prompt();
    }
    // Минимална двойка: чуй думата и избери картинката (картинките са без звук, за да не подсказват)
    minPair(u) {
      this.view = "minPair";
      const opts = shuffle([u.pic, u.mp]);
      this.shell.setLabel("");
      this.answerKey = u.pic;
      this.prompt = () => this.speak(u.pic);
      this.box.innerHTML = `<div class="az-hint">Коя е думата, която чуваш? ${this.replay()}</div><div class="ph-grid bk-grid">${opts.map(w => this.pic(w, "noear")).join("")}</div>`;
      this.wire(b => this.check(b, b.dataset.v === u.pic, u.pic, b.dataset.v, () => this.speak(u.pic)));
      this.prompt();
    }
    // Поправи буквата: картинката показва значението, една буква в думата е сгрешена – докосни я
    fixLetter(u) {
      this.view = "fixLetter";
      const f = u.fix, letters = [...f.shown];
      this.shell.setLabel("");
      this.answerKey = String(f.index);
      this.prompt = () => this.speak("Една буква е сгрешена. Докосни я.");
      this.box.innerHTML = `<div class="az-hint">Една буква е сгрешена. Докосни я. ${this.replay()}</div><div class="ph-grid bk-grid one">${this.pic(u.pic, "static noear")}</div><div class="ph-keys bk-keys big bk-fix">${letters.map((c, i) => `<button type="button" class="ph-key bk-key" data-v="${i}">${c}</button>`).join("")}</div>`;
      this.wire(b => {
        if (b.classList.contains("bk-pic")) return;
        const ok = Number(b.dataset.v) === f.index;
        if (ok) b.textContent = f.right.toLowerCase();
        this.check(b, ok, u.write, f.shown, () => {});
      });
      this.prompt();
    }
    // Построй изречение (Б10): подреди думите; плочките са без главна буква и точка, за да се чете смисълът
    sentence(u) {
      this.view = "sentence";
      const parts = u.words.map(w => w.replace(/[.!?]$/, "").toLowerCase());
      this.buildTask(u.write, parts, shuffle(parts.slice()), "Подреди думите в изречение", () => {}, true);
    }
    // Попълни буквата: чуй думата и избери липсващата буква
    gapTask(u) {
      this.view = "gapTask";
      const html = u.gap.replace("_", `<span class="bk-gap">?</span>`);
      this.shell.setLabel("");
      this.answerKey = u.choices[0];
      this.prompt = () => this.speak(u.write);
      this.box.innerHTML = `<div class="az-hint">Коя буква липсва? ${this.replay()}</div><div class="bk-word">${html}</div>${this.keys(shuffle(u.choices.slice()), "big")}`;
      this.wire(b => { const ok = b.dataset.v === u.choices[0]; if (ok) this.box.querySelector(".bk-gap").textContent = b.dataset.v.toLowerCase(); this.check(b, ok, u.write, b.dataset.v, () => this.speak(u.write)); });
      this.prompt();
    }
    // ---------- отговор ----------
    shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
    check(el, ok, answer, given, onWrong) {
      if (this.finished || this.locked || el.classList.contains("bad")) return;
      if (ok) { el.classList.add("good"); this.done(answer); return; }
      this.miss(answer, given); el.classList.add("bad"); this.shake(el); onWrong();
      if (this.stepWrong >= 2) { const h = [...this.box.querySelectorAll("[data-v]")].find(x => x.dataset.v === String(this.answerKey)); if (h) h.classList.add("hint"); }
    }
    miss(text, given) { this.wrong++; this.streak = 0; this.stepWrong++; this.log.push(this.event(false, { text, answer: text, given, ok: false, ms: Date.now() - this.roundStart, bank_item: this.u.id, attempt: true })); this.loseLife(); }
    done(text) {
      this.correct++; this.renderScore();
      this.log.push(this.event(true, { text, answer: text, given: text, ok: true, ms: Date.now() - this.roundStart, bank_item: this.u.id, first_attempt_correct: this.stepWrong === 0, attempt_count: this.stepWrong + 1 }));
      this.roundOk.push(this.stepWrong === 0); this.idx++; this.renderProgress(); this.locked = true;
      this.shell.flash("Точно така!", "good");
      this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 1100);
    }
  }
  window.BANK_GAME = BankGame;
  window.BANK_SYLLABLES = syllables;
})();
