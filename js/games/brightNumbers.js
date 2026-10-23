/* Ярки числа — оцветяване по числа. По кода им (21.js): Ниво 1..3, Картинка 1..N, Диапазон 9..20 и Действие (само ниво 3).
   Проверено на живо: избираш цвят от палитрата (всеки цвят има число), после докосваш частите с това число;
   при вярно частта се оцветява, при грешно остава бяла и се брои грешка. Норми 1 / 3 / 5. */
(function () {
  const PALETTE = ["#E63E6C", "#F5B532", "#3FB58B", "#2E7BC4", "#8E6BE0", "#F26D3F", "#7BC96F", "#3FC1D6"];
  // Картинки: части (path) с индекс на цвят. viewBox 0 0 400 320.
  const PICS = [
    { name: "Кораб", parts: [
      ["M40 220 L360 220 L330 290 L70 290 Z", 0], ["M40 220 L360 220 L352 236 L48 236 Z", 5], ["M120 60 L200 60 L200 200 L120 200 Z", 1], ["M215 40 L300 40 L300 200 L215 200 Z", 3],
      ["M110 30 L120 30 L120 210 L110 210 Z", 4], ["M205 20 L215 20 L215 210 L205 210 Z", 4], ["M110 30 L150 40 L110 52 Z", 0], ["M205 20 L245 30 L205 42 Z", 0],
      ["M0 290 L400 290 L400 320 L0 320 Z", 6], ["M60 250 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", 2], ["M150 250 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", 2], ["M240 250 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", 2], ["M330 250 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", 2] ] },
    { name: "Риба", parts: [
      ["M120 160 C160 60 300 60 340 160 C300 260 160 260 120 160 Z", 3], ["M40 100 L120 160 L40 220 Z", 0], ["M180 110 C220 90 260 90 300 110 C260 130 220 130 180 110 Z", 7], ["M180 210 C220 230 260 230 300 210 C260 190 220 190 180 210 Z", 7],
      ["M290 140 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0", 1], ["M200 40 L240 20 L250 70 Z", 4], ["M200 280 L240 300 L250 250 Z", 4], ["M0 0 L400 0 L400 320 L0 320 Z M120 160 C160 60 300 60 340 160 C300 260 160 260 120 160 Z", 6] ] },
    { name: "Сандък", parts: [
      ["M60 140 L340 140 L340 290 L60 290 Z", 5], ["M60 140 a140 60 0 0 1 280 0 Z", 1], ["M60 140 L340 140 L340 160 L60 160 Z", 4], ["M180 150 L220 150 L220 200 L180 200 Z", 1],
      ["M90 60 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0", 1], ["M290 50 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0", 1], ["M200 30 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0", 1], ["M0 290 L400 290 L400 320 L0 320 Z", 2],
      ["M60 200 L340 200 L340 215 L60 215 Z", 4], ["M0 0 L400 0 L400 290 L0 290 Z M60 140 a140 60 0 0 1 280 0 L340 290 L60 290 Z", 3] ] },
    { name: "Палма", parts: [
      ["M0 240 L400 240 L400 320 L0 320 Z", 1], ["M180 240 C170 160 190 100 200 60 L220 60 C210 100 230 160 220 240 Z", 5], ["M200 60 C140 40 90 60 60 100 C120 90 160 90 200 80 Z", 2], ["M200 60 C260 40 310 60 340 100 C280 90 240 90 200 80 Z", 2],
      ["M200 60 C170 20 130 10 90 20 C140 30 170 50 200 70 Z", 6], ["M200 60 C230 20 270 10 310 20 C260 30 230 50 200 70 Z", 6], ["M186 70 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0", 5], ["M320 40 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0", 1],
      ["M0 0 L400 0 L400 240 L0 240 Z M180 240 C170 160 190 100 200 60 L220 60 C210 100 230 160 220 240 Z", 3] ] }
  ];
  const RANGES = { 1: [1, 10], 2: [10, 20] };
  function exprFor(answer, range, op) {
    const kind = op === "mix" ? (Math.random() < .5 ? "add" : "sub") : op;
    if (kind === "add") { const a = rnd(answer + 1); return `${a} + ${answer - a}`; }
    const a = answer + rnd(Math.max(1, range - answer + 1)); return `${a} − ${a - answer}`;
  }
  // 19.10: истински картинки за оцветяване (config/bright-pics.json + assets/img/bright: линии и карта на частите; tools/bright_pics).
  // Старите SVG картинки (PICS) остават резерва, ако банката не се зареди.
  let BANK = null; const bankP = fetch("config/bright-pics.json?v=3").then(r => r.json()).then(j => { BANK = j.pics; }).catch(() => {});
  const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
  class BrightNumbersGame extends BaseGame {
    get gameId() { return "brightNumbers"; }
    get skillName() { return Number(this.s.level) === 3 ? `Смятане до ${this.s.range} чрез оцветяване` : `Разпознаване на числа ${Number(this.s.level) === 2 ? "до 20" : "до 10"}`; }
    start() { bankP.then(() => { if (!BANK || !BANK.length) return super.start(); const P = BANK[(Number(this.s.picture || 1) - 1) % BANK.length];
      Promise.all([img(`assets/img/bright/${P.id}_lines.png`), img(`assets/img/bright/${P.id}_map.png`)]).then(([L, M]) => { this.P = P; this.L = L; this.M = M; super.start(); }).catch(() => super.start()); }); }
    numbers(n) {   // n различни числа за цветовете
      this.level = Number(this.s.level || 1); this.range = Number(this.s.range || 10);
      const [lo, hi] = RANGES[this.level] || [1, this.range]; const nums = new Set(); while (nums.size < Math.min(n, hi - lo + 1)) nums.add(lo + rnd(hi - lo + 1)); return [...nums];
    }
    render() { if (this.P) return this.renderPic(); return this.renderSvg(); }
    renderPic() {
      const P = this.P, nc = P.colors.length, nums = this.numbers(nc);
      this.numOf = {}; this.labelOf = {}; P.colors.forEach((_, c) => { this.numOf[c] = nums[c % nums.length]; this.labelOf[c] = this.level === 3 ? exprFor(this.numOf[c], this.range, this.s.op) : String(this.numOf[c]); });
      // твърде малките части (човка, листенце) идват готово оцветени – числото трябва да се събира; на ниво 3 (задачи) прагът е по-висок
      const minR = this.level === 3 ? 0.032 : 0.024; P.parts.forEach(q => { q.on = q.c >= 0 && q.r >= minR; });
      this.parts = P.parts.map((q, i) => ({ ...q, i })).filter(q => q.on); this.total = this.parts.length; this.done = 0; this.sel = null;
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-beach"/></svg>
        <div class="bn bn2"><div class="bn-frame"><canvas id="bn-cv" width="${P.w}" height="${P.h}"></canvas><div class="bn-nums" id="bn-nums"></div></div><div class="bn-pal" id="bn-pal"></div></div>`;
      const cv = this.shell.arena.querySelector("#bn-cv"), ctx = cv.getContext("2d");
      // карта на частите
      const mc = document.createElement("canvas"); mc.width = P.w; mc.height = P.h; const mx = mc.getContext("2d"); mx.drawImage(this.M, 0, 0);
      const md = mx.getImageData(0, 0, P.w, P.h).data; this.lab = new Uint16Array(P.w * P.h); for (let k = 0; k < this.lab.length; k++) this.lab[k] = md[4 * k] + 256 * md[4 * k + 1];
      // запълване: частите за оцветяване – бели, готовите – с цвета си
      this.fill = ctx.createImageData(P.w, P.h); this.col = P.parts.map(q => q.on ? [255, 255, 255] : hex(q.c >= 0 ? P.colors[q.c] : q.fill));
      const f = this.fill.data; for (let k = 0; k < this.lab.length; k++) { const c = this.col[this.lab[k]]; f[4 * k] = c[0]; f[4 * k + 1] = c[1]; f[4 * k + 2] = c[2]; f[4 * k + 3] = 255; }
      this.ctx = ctx; this.draw();
      const nb = this.shell.arena.querySelector("#bn-nums");
      nb.innerHTML = this.parts.map(q => `<span data-i="${q.i}" style="left:${q.x * 100}%;top:${q.y * 100}%;--fs:${Math.max(.85, Math.min(1.5, q.r * 28)) * (this.level === 3 ? .8 : 1)}">${this.labelOf[q.c]}</span>`).join("");
      cv.addEventListener("pointerdown", e => { e.preventDefault(); const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * P.w), y = Math.floor((e.clientY - r.top) / r.height * P.h); const i = this.lab[y * P.w + x]; const q = P.parts[i]; if (q && q.on) this.paintPart(i); });
      const pal = this.shell.arena.querySelector("#bn-pal");
      shuffle(P.colors.map((_, c) => c).filter(c => this.parts.some(q => q.c === c))).forEach(c => { const b = document.createElement("button"); b.type = "button"; b.className = "bn-sw bn-marker"; b.style.setProperty("--c", P.colors[c]); b.dataset.c = c; b.innerHTML = `<i></i><b>${this.labelOf[c]}</b>`; b.addEventListener("pointerdown", e => { e.preventDefault(); this.select(b); }); pal.appendChild(b); });
      this.select(pal.firstChild);
      this.renderProgress = () => { const p = this.shell.progress; p.innerHTML = ""; for (let i = 0; i < this.total; i++) { const li = document.createElement("li"); li.className = i < this.done ? "ok" : ""; p.appendChild(li); } };
    }
    draw() { this.ctx.putImageData(this.fill, 0, 0); this.ctx.drawImage(this.L, 0, 0); }
    paintPart(i) {
      if (this.finished) return; const q = this.P.parts[i]; if (q.doneP) return;
      const ok = String(q.c) === this.sel.dataset.c; this.locked = false;
      if (!this.answer(ok, { text: `част ${this.labelOf[q.c]}`, answer: this.labelOf[q.c], given: this.labelOf[this.sel.dataset.c] })) return;
      this.locked = false; const span = this.shell.arena.querySelector(`#bn-nums span[data-i="${i}"]`);
      if (ok) {
        q.doneP = true; const c = hex(this.P.colors[q.c]), f = this.fill.data; for (let k = 0; k < this.lab.length; k++) if (this.lab[k] === i) { f[4 * k] = c[0]; f[4 * k + 1] = c[1]; f[4 * k + 2] = c[2]; }
        this.draw(); if (span) span.classList.add("done"); this.done++; this.idx = this.done; this.renderProgress();
        if (this.done === this.total) { this.shell.flash("Картината е готова!", "good"); this.say("Браво! Картината е готова."); setTimeout(() => this.finish(false), 1400); }
      } else { if (span) { span.classList.remove("wrong"); void span.offsetWidth; span.classList.add("wrong"); } this.shell.flash(`Тук е ${this.labelOf[q.c]}`, "bad"); setTimeout(() => this.shell.hideFlash(), 1200); }
    }
    renderSvg() {
      this.level = Number(this.s.level || 1); this.pic = PICS[(Number(this.s.picture || 1) - 1) % PICS.length]; this.range = Number(this.s.range || 10);
      const colorsUsed = [...new Set(this.pic.parts.map(p => p[1]))];
      const [lo, hi] = RANGES[this.level] || [1, this.range]; const nums = new Set(); while (nums.size < colorsUsed.length) nums.add(lo + rnd(hi - lo + 1));
      this.numOf = {}; [...nums].forEach((n, i) => this.numOf[colorsUsed[i]] = n);
      this.labelOf = {}; colorsUsed.forEach(c => this.labelOf[c] = this.level === 3 ? exprFor(this.numOf[c], this.range, this.s.op) : String(this.numOf[c]));
      this.total = this.pic.parts.length; this.done = 0; this.sel = null;
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-beach"/></svg>
        <div class="bn"><svg class="bn-pic" viewBox="0 0 400 320" id="bn-pic"></svg><div class="bn-pal" id="bn-pal"></div></div>`;
      const svg = this.shell.arena.querySelector("#bn-pic");
      this.pic.parts.forEach(([d, c], i) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.classList.add("bn-part"); g.dataset.c = c;
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); p.setAttribute("fill-rule", "evenodd"); g.appendChild(p);
        // етикет в центъра на частта
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text"); t.textContent = this.labelOf[c]; t.setAttribute("text-anchor", "middle"); g.appendChild(t);
        svg.appendChild(g);
        const b = p.getBBox(); t.setAttribute("x", b.x + b.width / 2); t.setAttribute("y", b.y + b.height / 2 + 6);
        g.addEventListener("pointerdown", e => { e.preventDefault(); this.paint(g); });
      });
      const pal = this.shell.arena.querySelector("#bn-pal");
      shuffle(colorsUsed.slice()).forEach(c => { const b = document.createElement("button"); b.type = "button"; b.className = "bn-sw"; b.style.setProperty("--c", PALETTE[c]); b.dataset.c = c; b.innerHTML = `<i></i><b>${this.labelOf[c]}</b>`; b.addEventListener("pointerdown", e => { e.preventDefault(); this.select(b); }); pal.appendChild(b); });
      this.select(pal.firstChild);
      this.renderProgress = () => { const p = this.shell.progress; p.innerHTML = ""; for (let i = 0; i < this.total; i++) { const li = document.createElement("li"); li.className = i < this.done ? "ok" : ""; p.appendChild(li); } };
    }
    startRound() { this.shell.setLabel(`Оцвети ${this.labelOf[this.sel.dataset.c]}`); if (this.idx === 0) this.prompt("Избери цвят и оцвети частите с това число"); }
    select(b) { [...b.parentElement.children].forEach(x => x.classList.remove("sel")); b.classList.add("sel"); this.sel = b; this.shell.setLabel(`Оцвети ${this.labelOf[b.dataset.c]}`); this.prompt(this.labelOf[b.dataset.c].replace("+", "плюс").replace("−", "минус")); }
    paint(g) {
      if (this.finished || g.classList.contains("done")) return;
      const ok = g.dataset.c === this.sel.dataset.c;
      this.locked = false;
      if (!this.answer(ok, { text: `част ${this.labelOf[g.dataset.c]}`, answer: this.labelOf[g.dataset.c], given: this.labelOf[this.sel.dataset.c] })) return;
      this.locked = false;
      if (ok) { g.querySelector("path").style.fill = PALETTE[g.dataset.c]; g.classList.add("done"); this.done++; this.idx = this.done; this.renderProgress(); if (this.done === this.total) { this.shell.flash("Картината е готова!", "good"); this.say("Браво! Картината е готова."); setTimeout(() => this.finish(false), 1200); } }
      else { g.classList.add("wrong"); setTimeout(() => g.classList.remove("wrong"), 500); this.shell.flash(`Тук е ${this.labelOf[g.dataset.c]}`, "bad"); this.say(`Не. Тук е ${this.labelOf[g.dataset.c].replace("+", "плюс").replace("−", "минус")}`); setTimeout(() => this.shell.hideFlash(), 1200); }
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.brightNumbers = {
    id: "brightNumbers", name: "Ярки числа", skill: "Смятане чрез оцветяване", top: "crystal", cls: BrightNumbersGame, tiers: [1, 3, 5],
    task: "Оцвети всяка част от картината с подходящия цвят.",
    settings: [
      { key: "level", label: "Ниво", type: "range", min: 1, max: 3, def: 1, help: "Ниво 1: числа до 10. Ниво 2: числа до 20. Ниво 3: примери, чийто отговор е числото на цвета." },
      { key: "picture", label: "Картинка", type: "range", min: 1, max: 8, def: 1, help: "1 Бухалче, 2 Корабче, 3 Рибка, 4 Охлюв, 5 Ракета, 6 Таралеж, 7 Котенце, 8 Мече." },
      { key: "range", label: "Диапазон на смятане", type: "range", min: 9, max: 20, def: 10, hiddenIf: s => Number(s.level) !== 3, help: "Само за ниво 3." },
      { key: "op", label: "Избор на действие", type: "cycle", options: [["add", "Събиране"], ["sub", "Изваждане"], ["mix", "Смесено"]], def: "add", hiddenIf: s => Number(s.level) !== 3, help: "Само за ниво 3." }
    ],
    paramsLine: s => `картинка ${s.picture}` + (Number(s.level) === 3 ? ` · до ${s.range} · ${({ add: "събиране", sub: "изваждане", mix: "смесено" })[s.op]}` : "")
  };
})();
