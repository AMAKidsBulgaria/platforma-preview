/* Тайни карти — маджонг с примери. По кода им (23.js) и на живо: карти с число, пример или картинка, подредени на пластове;
   взимат се само свободни („крайни“) карти — без карта отгоре и със свободна лява или дясна страна; покритите са сиви.
   Двойка: пример ↔ числото-отговор, картинка ↔ същата картинка. Играе се на време: цели 2:30 / 2:00 / 1:30. */
(function () {
  const IMGS = ["garden_r/yabalka", "garden_r/chereshi", "garden_r/yagoda", "garden_r/krusha", "garden_r/peperuda", "garden_r/lale"];   // 19.10: без рибки
  // Карти: [x, y, layer] в единици 1 = ширина на карта; координатите може да са дробни (полукарти)
  // 19.10 (методист): картата = пространствена трудност, отделно от математиката
  // 1 – две групи (най-ясна), 2 – пирамида (средна), 3 – централен куп на пластове (най-сложна)
  const MAPS = {
    1: [[0,0,0],[1,0,0],[3,0,0],[4,0,0],[0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],[0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],[0,3,0],[1,3,0],[3,3,0],[4,3,0],[0.5,0.5,1],[3.5,0.5,1],[0.5,2.5,1],[3.5,2.5,1],[2,1.5,1],[2,1.5,2]],
    2: [[2,0,0],[1,1,0],[2,1,0],[3,1,0],[0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],[1,3,0],[2,3,0],[3,3,0],[2,4,0],[1.5,1.5,1],[2.5,1.5,1],[1.5,2.5,1],[2.5,2.5,1],[2,2,2]],
    3: [[0,0,0],[1,0,0],[2,0,0],[3,0,0],[4,0,0],[0,1,0],[1,1,0],[2,1,0],[3,1,0],[4,1,0],[0,2,0],[1,2,0],[2,2,0],[3,2,0],[4,2,0],[1.5,0.5,1],[2.5,0.5,1],[1.5,1.5,1],[2.5,1.5,1],[2,1,2]]
  };
  const LEVELS = { 1: "Две групи", 2: "Пирамида", 3: "Купчина" };
  // малка картинка на подредбата за настройките
  const thumb = n => { const M = MAPS[n], w = Math.max(...M.map(c => c[0])) + 1, h = Math.max(...M.map(c => c[1])) + 1;
    return `<svg viewBox="-0.2 -0.4 ${w + .4} ${(h + .5) * 1.4}" width="84" height="56" aria-hidden="true">${M.slice().sort((a, b) => a[2] - b[2]).map(([x, y, l]) => `<rect x="${x - l * .12}" y="${y * 1.4 - l * .14}" width=".9" height="1.26" rx=".14" fill="${l ? (l > 1 ? "#E9C27A" : "#F4DDB0") : "#FFF8E6"}" stroke="#A97A3E" stroke-width=".07"/>`).join("")}</svg>`; };
  class SecretCardsGame extends BaseGame {
    get gameId() { return "secretCards"; }
    get skillName() { return `Примери и отговори до ${this.s.range}`; }
    render() {
      this.map = MAPS[Number(this.s.map || 1)] || MAPS[1]; this.range = Number(this.s.range || 5); this.pairsLeft = 0;
      const n = this.map.length, pairs = n / 2, imgPairs = Math.min(3, Math.floor(pairs * 0.3)), exPairs = pairs - imgPairs;
      const cards = [];
      for (let i = 0; i < exPairs; i++) { const add = this.s.op === "mix" ? Math.random() < .5 : this.s.op !== "sub"; let a, b; if (add) { a = rnd(this.range + 1); b = rnd(this.range - a + 1); } else { a = rnd(this.range + 1); b = rnd(a + 1); } const ans = add ? a + b : a - b; const key = "p" + i; cards.push({ kind: "ex", text: `${a} ${add ? "+" : "−"} ${b}`, key, val: ans }, { kind: "num", text: String(ans), key, val: ans }); }
      const imgs = shuffle(IMGS.slice()).slice(0, imgPairs); imgs.forEach((im, i) => { cards.push({ kind: "img", img: im, key: "i" + i }, { kind: "img", img: im, key: "i" + i }); });
      // раздаване с гарантирано решение: махаме свободни двойки „отзад напред“ и им слагаме двойките карти
      const order = this.solvableOrder(); const byKey = {}; cards.forEach(c => (byKey[c.key] = byKey[c.key] || []).push(c));
      const pairList = shuffle(Object.values(byKey)); const dealt = new Array(n);
      if (order) order.forEach(([p, q], i) => { const pr = shuffle(pairList[i].slice()); dealt[p] = pr[0]; dealt[q] = pr[1]; });
      else { shuffle(cards); cards.forEach((c, i) => dealt[i] = c); }
      cards.length = 0; dealt.forEach(c => cards.push(c));
      this.total = pairs; this.pairsLeft = pairs; this.matched = 0;
      this.shell.arena.innerHTML = `<svg class="sea" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><use href="#scene-night"/></svg><div class="sc"><div class="sc-board" id="sc-board"></div></div>`;
      const board = this.shell.arena.querySelector("#sc-board");
      const maxX = Math.max(...this.map.map(m => m[0])) + 1, maxY = Math.max(...this.map.map(m => m[1])) + 1; board.style.setProperty("--cols", maxX); board.style.setProperty("--rows", maxY);
      this.cards = this.map.map((m, i) => { const c = cards[i]; const el = document.createElement("button"); el.type = "button"; el.className = "sc-card"; el.style.setProperty("--x", m[0]); el.style.setProperty("--y", m[1]); el.style.setProperty("--l", m[2]); el.dataset.key = c.key; el.innerHTML = c.kind === "img" ? `<img src="assets/img/${c.img}.png?v=p2" alt="" draggable="false">` : `<span>${c.text}</span>`; el.addEventListener("pointerdown", e => { e.preventDefault(); this.pick(el); }); board.appendChild(el); return { el, x: m[0], y: m[1], l: m[2], c, alive: true }; });
      this.refreshFree(); this.sel = null;
      this.renderProgress = () => { const p = this.shell.progress; p.innerHTML = ""; for (let i = 0; i < this.total; i++) { const li = document.createElement("li"); li.className = i < this.matched ? "ok" : ""; p.appendChild(li); } };
    }
    startRound() { this.shell.setLabel("Събери двойките"); if (this.idx === 0) this.prompt("Събери картите по двойки. Взимат се само крайните карти."); }
    // ред на махане по двойки на позициите (с твърд опит за случаен избор); null, ако не се намери
    solvableOrder() {
      const M = this.map, free = (alive, i) => { const [x, y, l] = M[i];
        if (M.some((o, j) => alive[j] && o[2] === l + 1 && Math.abs(o[0] - x) < 1 && Math.abs(o[1] - y) < 1)) return false;
        const left = M.some((o, j) => alive[j] && j !== i && o[2] === l && Math.abs(o[1] - y) < 1 && o[0] < x && x - o[0] < 1.01);
        const right = M.some((o, j) => alive[j] && j !== i && o[2] === l && Math.abs(o[1] - y) < 1 && o[0] > x && o[0] - x < 1.01);
        return !(left && right); };
      for (let tries = 0; tries < 200; tries++) {
        const alive = M.map(() => true), out = []; let ok = true;
        while (alive.some(Boolean)) {
          const f = shuffle(M.map((_, i) => i).filter(i => alive[i] && free(alive, i)));
          if (f.length < 2) { ok = false; break; }
          out.push([f[0], f[1]]); alive[f[0]] = alive[f[1]] = false;
        }
        if (ok) return out;
      }
      return null;
    }
    // след всяка двойка: ако няма свободна вярна двойка (възможно при съвпадащи отговори), картите се пренареждат решимо
    ensureMove() {
      const alive = this.cards.filter(k => k.alive); if (!alive.length) return;
      const free = alive.filter(k => this.isFree(k)), sig = c => c.kind === "img" ? "i:" + c.img : (c.kind === "ex" ? "e:" : "n:") + c.val;
      const has = free.some((a, i) => free.some((b, j) => j > i && (a.c.kind === "img" ? b.c.kind === "img" && a.c.img === b.c.img : a.c.kind !== b.c.kind && b.c.kind !== "img" && a.c.val === b.c.val)));
      if (has) return;
      const saved = this.map; this.map = alive.map(k => [k.x, k.y, k.l]); const order = this.solvableOrder(); this.map = saved; if (!order) return;
      // двойки съдържание: всеки пример с число със същия отговор; картинките по две
      const pool = alive.map(k => k.c), pairs = [], used = new Set();
      pool.forEach((c, i) => { if (used.has(i)) return; const j = pool.findIndex((d, jj) => jj !== i && !used.has(jj) && (c.kind === "img" ? d.kind === "img" && d.img === c.img : d.kind !== c.kind && d.kind !== "img" && d.val === c.val)); if (j >= 0) { used.add(i); used.add(j); pairs.push([c, pool[j]]); } });
      shuffle(pairs).forEach((pr, i) => { const [p, q] = order[i] || []; if (p == null) return; [alive[p], alive[q]].forEach((k, s) => { k.c = pr[s]; k.el.dataset.key = pr[s].key; k.el.innerHTML = pr[s].kind === "img" ? `<img src="assets/img/${pr[s].img}.png?v=p2" alt="" draggable="false">` : `<span>${pr[s].text}</span>`; }); });
      this.refreshFree();
    }
    isFree(k) {
      if (!k.alive) return false;
      const covered = this.cards.some(o => o.alive && o.l === k.l + 1 && Math.abs(o.x - k.x) < 1 && Math.abs(o.y - k.y) < 1);
      if (covered) return false;
      const left = this.cards.some(o => o.alive && o !== k && o.l === k.l && Math.abs(o.y - k.y) < 1 && o.x < k.x && k.x - o.x < 1.01);
      const right = this.cards.some(o => o.alive && o !== k && o.l === k.l && Math.abs(o.y - k.y) < 1 && o.x > k.x && o.x - k.x < 1.01);
      return !(left && right);
    }
    refreshFree() {
      this.cards.forEach(k => { const was = k.el.classList.contains("blocked"), now = !this.isFree(k); k.el.classList.toggle("blocked", now);
        if (was && !now && k.alive) { k.el.classList.add("freed"); setTimeout(() => k.el.classList.remove("freed"), 1100); } });   // току-що освободена – кратко светване
    }
    pick(el) {
      if (this.finished) return;
      const k = this.cards.find(c => c.el === el); if (!k || !k.alive || !this.isFree(k)) { el.classList.add("shake-s"); setTimeout(() => el.classList.remove("shake-s"), 400); return; }
      if (!this.sel) { this.sel = k; el.classList.add("sel"); this.prompt(k.c.kind === "img" ? "Намери същата" : k.c.text.replace("+", "плюс").replace("−", "минус")); return; }
      if (this.sel === k) { el.classList.remove("sel"); this.sel = null; return; }
      // двойка по смисъл: пример ↔ всяко число със същия отговор (4 + 0 и 4), картинка ↔ същата картинка
      const A = this.sel.c, B = k.c, ok = (A.kind === "img" && B.kind === "img") ? A.img === B.img : (A.kind !== B.kind && A.kind !== "img" && B.kind !== "img" && A.val === B.val);
      this.locked = false;
      if (!this.answer(ok, { text: `${this.sel.c.text || this.sel.c.img} ~ ${k.c.text || k.c.img}`, answer: this.sel.c.key, given: k.c.key })) return;
      this.locked = false;
      if (ok) { this.sel.alive = false; k.alive = false; this.sel.el.classList.add("gone"); k.el.classList.add("gone"); this.sel.el.classList.remove("sel"); this.sel = null; this.matched++; this.idx = this.matched; this.renderProgress(); this.refreshFree(); this.ensureMove(); this.say("Да!"); if (this.matched === this.total) { this.shell.flash("Всички двойки са събрани!", "good"); this.say("Браво!"); setTimeout(() => this.finish(false), 1200); } }
      else { const a = this.sel; a.el.classList.remove("sel"); a.el.classList.add("wrong"); k.el.classList.add("wrong"); setTimeout(() => { a.el.classList.remove("wrong"); k.el.classList.remove("wrong"); }, 600); this.sel = null; this.shell.flash("Не са двойка", "bad"); this.say("Не са двойка"); setTimeout(() => this.shell.hideFlash(), 1100); }
    }
    finish(early) {
      // звездите са по време, както при тях: 3 до 1:30, 2 до 2:00, 1 до 2:30
      const seconds = Math.round((Date.now() - this.startedAt) / 1000);
      super.finish(early);
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.secretCards = {
    id: "secretCards", name: "Тайни карти", skill: "Памет и смятане", top: "trees", cls: SecretCardsGame, tiers: [0, 1, 2],
    task: "Събери картите по двойки според тяхното значение. Можеш да събираш само крайни карти.",
    settings: [
      { key: "map", label: "Подредба", type: "choice", def: "1", options: [1, 2, 3].map(n => [String(n), thumb(n), LEVELS[n]]), help: "Колко сложна е подредбата: две групи (най-ясна), пирамида, купчина на пластове (най-сложна). Математиката се избира отделно – с диапазона и действието." },
      { key: "range", label: "Диапазон на смятане", type: "range", min: 5, max: 20, def: 5 },
      { key: "op", label: "Избор на действие", type: "cycle", options: [["add", "Събиране"], ["sub", "Изваждане"], ["mix", "Смесено"]], def: "add" }
    ],
    paramsLine: s => `${LEVELS[s.map] || LEVELS[1]} · до ${s.range} · ${({ add: "събиране", sub: "изваждане", mix: "смесено" })[s.op]}`
  };
})();
