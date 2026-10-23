/* „История“ – Читарика 22–24 („Фенерчето на Мая“, config/story-maya.json; спецификация config/ch22-24.md).
   Един шаблон, режимът идва от settings.view:
     read_order4   – историята на 4 екрана (текст + глас, подчертава се текущото изречение), после подреждане на 4-те сцени с подписи
     quiz          – въпроси по смисъл (settings.q = id-та; по подразбиране 4-те), бутон за звук; накрая устно мнение без оценка
     order4_pics   – подреждане на 4-те сцени само по картинки, после устно мнение пред възрастен (без оценка)
     order5        – подреждане на 5-те сцени (settings.retell=1 → преразказ пред възрастен с 3 бележки)
     lines         – реплика → герой (оценява се), после „Кажи я като героя“ (не се оценява)
     structure     – герой, проблем, решение, край в историята на Мая
     create        – избор на герой, място, проблем; детето разказва на възрастен; възрастният пише заглавие и 3 бележки → книжка
     book          – книжките в „Кулата на историите“ и представяне (без оценка)
   Без аудиозаписи на деца (v1). Мнението и устните продукти не се оценяват: бележките на възрастния се пазят като наблюдение. */
(function () {
  const URL = "config/story-maya.json?v=2";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()));
  const BOOKS = "platforma.books.v1";
  const books = () => { try { return JSON.parse(localStorage.getItem(BOOKS) || "[]"); } catch (e) { return []; } };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  // глас: изречение по изречение, с onLine за подчертаване; уважава изключения звук
  function speakSeq(lines, onLine, onEnd) { return window.VOICE.speak(lines, { onLine, onEnd, gap: 250 }); }


  class StoryGame extends CardGame {
    constructor(...a) { super(...a); this.view = this.s.view || "quiz"; this.stopVoice = () => {}; }
    get gameId() { return "story"; }
    get skillName() { return ({ read_order4: "Разбирам история", quiz: "Разбирам история", order4_pics: "Последователност в сюжета", order5: "Последователност в сюжета", lines: "Герои и реплики", structure: "Части на историята", create: "Създавам своя история", book: "Кулата на историите" })[this.view] || "История"; }
    destroy() { this.stopVoice(); super.destroy(); }
    start() { load().then(d => { this.d = d; this.prepare(); { const mi = this.modeInfo(), t = document.getElementById("game-title"); if (mi && t && !document.documentElement.classList.contains("look2")) t.textContent = mi[0]; } /* заглавието и докато историята се чете */ if (this.view === "read_order4") this.readStory(() => super.start()); else super.start(); }).catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Историята не се зареди.</p>'; }); }
    img(id) { return `${this.d.img}${id}.jpg?v=2`; } // v=2: картина 1 без възрастните (канон, 17.10.2026)
    prepare() {
      const d = this.d, m = this.view;
      if (m === "quiz") { const ids = this.s.q ? String(this.s.q).split(",") : d.questions.map(q => q.id); this.items = ids.map(id => d.questions.find(q => q.id === id)).filter(Boolean).map(q => ({ type: "mcq", q })); this.after = this.s.q ? null : "opinion"; }
      else if (m === "structure") this.items = d.structure.map(q => ({ type: "mcq", q }));
      else if (m === "read_order4") this.items = [{ type: "order", ids: d.order4, captions: true }];
      else if (m === "order4_pics") { this.items = [{ type: "order", ids: d.order4 }]; this.after = "opinion"; }
      else if (m === "order5") { this.items = [{ type: "order", ids: d.order5 }]; this.after = this.s.retell ? "retell" : null; }
      else if (m === "lines") this.items = shuffle(d.lines.slice()).map(l => ({ type: "line", l }));
      else if (m === "create") this.items = [{ type: "create" }];
      else this.items = [{ type: "book" }];
      this.total = this.items.length;
    }
    render() { this.scene("wt-st", "scene-space-game"); this.shell.setLabel(this.d.title); }

    // историята на 4 екрана; гласът чете, текущото изречение е подчертано; „Напред“ е винаги достъпно
    readStory(done) {
      this.scene("wt-st", "scene-space-game"); this.shell.setLabel(this.d.title); let k = 0;
      const show = () => {
        this.stopVoice(); const sc = this.d.screens[k];
        this.box.innerHTML = `<div class="st-read"><img class="st-pic" src="${this.img(sc.img)}" alt=""><div class="st-text">${sc.lines.map((l, i) => `<p data-l="${i}">${esc(l)}</p>`).join("")}</div>
          <div class="st-nav"><button type="button" class="st-btn ghost" id="st-again">${SPK}<span>Чуй пак</span></button><span class="st-dots">${this.d.screens.map((_, i) => `<i class="${i === k ? "on" : ""}"></i>`).join("")}</span><button type="button" class="st-btn" id="st-next">${k < this.d.screens.length - 1 ? "Напред" : "Към задачата"}</button></div></div>`;
        const ps = [...this.box.querySelectorAll("[data-l]")];
        const play = () => { this.stopVoice = speakSeq(sc.lines, i => ps.forEach((p, j) => p.classList.toggle("now", j === i))); };
        this.box.querySelector("#st-again").onclick = play;
        this.box.querySelector("#st-next").onclick = () => { this.stopVoice(); k++; if (k < this.d.screens.length) show(); else done(); };
        play();
      };
      show();
    }

    startRound() {
      this.stepWrong = 0; this.cur = this.items[this.idx]; const it = this.cur;
      if (it.type === "mcq") this.mcq(it.q); else if (it.type === "order") this.order(it); else if (it.type === "line") this.line(it.l); else if (it.type === "create") this.create(); else this.book();
    }
    nextRound() { if (!this.finished && this.idx >= this.total && this.after) { const a = this.after; this.after = null; return this.adult(a); } super.nextRound(); }

    mcq(q) {
      const opts = shuffle([q.a].concat(q.wrong));
      this.box.innerHTML = `<div class="st-q"><div class="st-qline"><button type="button" class="bk-replay" id="st-say" aria-label="Чуй въпроса">${SPK}</button><h3>${esc(q.q)}</h3></div>
        <div class="st-opts">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>
        ${this.view === "quiz" ? `<button type="button" class="st-btn ghost st-re" id="st-re">${SPK}<span>Чуй историята</span></button>` : ""}</div>`;
      this.box.querySelector("#st-say").onclick = () => this.say(q.q);
      const re = this.box.querySelector("#st-re"); if (re) re.onclick = () => { this.stopVoice = speakSeq(this.d.screens.flatMap(s => s.lines)); };
      this.box.querySelectorAll(".st-opt").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); this.pick(b, opts[Number(b.dataset.i)] === q.a, q.a, opts[Number(b.dataset.i)]); }));
    }
    // един опит се измерва; при грешка се показва верният отговор и се продължава
    pick(b, ok, answer, given) {
      if (this.finished || this.locked) return; this.locked = true; this.stopVoice();
      if (ok) { b.classList.add("good"); this.done(answer, 1100); return; }
      this.miss(answer, given); b.classList.add("bad"); this.shake(b);
      this.box.querySelectorAll(".st-opt").forEach(x => { if (x.textContent === answer) x.classList.add("hint"); });
      // крайният запис – ПРЕДИ да мине на следващата задача (иначе uid-ът е на следващия въпрос)
      this.log.push(this.event(false, { text: answer, answer, given, ok: false, ms: Date.now() - this.roundStart, adapt: 0, first_attempt_correct: false })); // краен запис, не „опит“
      this.shell.flash("Вярното е отбелязано", "bad"); this.roundOk.push(false); this.idx++; this.renderProgress();
      this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 1800);
    }

    // подреждане: докосване на картинка → следващото празно място; докосване на място → картинката се връща
    order(it) {
      const ids = it.ids, mix = shuffle(ids.slice()); while (mix.length > 1 && mix.every((x, i) => x === ids[i])) mix.reverse();
      const slots = ids.map(() => null), cap = id => it.captions ? `<b>${esc(this.d.scenes[id])}</b>` : "";
      const draw = () => {
        this.box.innerHTML = `<div class="st-order"><h3>Подреди картинките, както се случи в историята.</h3>
          <div class="st-slots">${slots.map((id, i) => `<button type="button" class="st-slot ${id ? "full" : ""}" data-s="${i}"><span class="st-n">${i + 1}</span>${id ? `<img src="${this.img(id)}" alt="">${cap(id)}` : ""}</button>`).join("")}</div>
          <div class="st-pool">${mix.map(id => slots.includes(id) ? `<span class="st-card gone"></span>` : `<button type="button" class="st-card" data-c="${id}"><img src="${this.img(id)}" alt="">${cap(id)}</button>`).join("")}</div></div>`;
        this.box.querySelectorAll(".st-card[data-c]").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); if (this.locked) return; const f = slots.indexOf(null); if (f < 0) return; slots[f] = b.dataset.c; draw(); if (!slots.includes(null)) check(); }));
        this.box.querySelectorAll(".st-slot.full").forEach(b => b.addEventListener("pointerdown", e => { e.preventDefault(); if (this.locked) return; slots[Number(b.dataset.s)] = null; draw(); }));
      };
      const check = () => {
        const ok = slots.every((id, i) => id === ids[i]);
        this.decisions = { task_count: 1, scored_decision_count: ids.length, correct_scored_decisions: slots.filter((id, i) => id === ids[i]).length };
        if (ok) { this.box.querySelectorAll(".st-slot").forEach(s => s.classList.add("good")); this.done(ids.join(","), 1400); return; }
        this.locked = true; this.miss(ids.join(","), slots.join(","));
        this.box.querySelectorAll(".st-slot").forEach((s, i) => s.classList.add(slots[i] === ids[i] ? "good" : "bad"));
        this.shell.flash("Ето правилния ред", "bad");
        this.later(() => { slots.splice(0, slots.length, ...ids); draw(); this.box.querySelectorAll(".st-slot").forEach(s => s.classList.add("hint")); }, 1300);
        // крайният запис – ПРЕДИ преминаването (иначе uid-ът е на следващата задача)
        this.log.push(this.event(false, { text: ids.join(","), answer: ids.join(","), given: slots.join(","), ok: false, ms: Date.now() - this.roundStart, adapt: 0, first_attempt_correct: false })); // краен запис, не „опит“
        this.roundOk.push(false); this.idx++; this.renderProgress();
        this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 3400);
      };
      draw();
    }

    // реплика → герой; после „Кажи я като героя“ (не се оценява)
    line(l) {
      const sp = this.d.speakers, keys = Object.keys(sp);
      this.box.innerHTML = `<div class="st-q"><div class="st-qline"><button type="button" class="bk-replay" id="st-say" aria-label="Чуй репликата">${SPK}</button><h3>Кой казва: <q>${esc(l.t.replace(/^—\s*/, ""))}</q></h3></div>
        <div class="st-who">${keys.map(k => `<button type="button" class="st-face" data-k="${k}"><img src="${this.img(sp[k].img)}" alt=""><b>${esc(sp[k].name)}</b></button>`).join("")}</div></div>`;
      this.box.querySelector("#st-say").onclick = () => this.say(l.t.replace(/^—\s*/, ""));
      this.box.querySelectorAll(".st-face").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked) return; const ok = b.dataset.k === l.who;
        if (!ok) { this.pick(b, false, sp[l.who].name, sp[b.dataset.k].name); this.box.querySelectorAll(".st-face").forEach(x => { if (x.dataset.k === l.who) x.classList.add("hint"); }); return; }
        this.locked = true; b.classList.add("good"); this.correct++; this.renderScore();
        this.log.push(this.event(true, { text: l.t, answer: l.who, given: l.who, ms: Date.now() - this.roundStart, first_attempt_correct: true, attempt_count: 1 }));
        this.roundOk.push(true); this.idx++; this.renderProgress();
        this.later(() => { this.box.innerHTML = `<div class="st-q st-say"><img class="st-face-big" src="${this.img(sp[l.who].img)}" alt=""><h3>Кажи го като ${esc(sp[l.who].name)}:</h3><p class="st-line">${esc(l.t)}</p><button type="button" class="st-btn" id="st-ok">Казах го</button></div>`; this.box.querySelector("#st-ok").onclick = () => this.nextRound(); }, 700);
      }));
    }

    // бележки на възрастния: мнение (без отметки) или преразказ (3 отметки); пазят се като наблюдение, не като оценка
    adult(kind) {
      this.stopVoice(); const checks = kind === "retell" ? this.d.retell_checks : [];
      const ask = kind === "retell" ? "Разкажи историята на Мая на мама, татко или друг възрастен: начало, проблем, какво направи тя и как свърши." : this.d.opinion;
      this.box.innerHTML = `<div class="st-adult"><h3>${esc(ask)}</h3>
        <div class="st-for"><b>За родителя</b>${checks.length ? `<p>Отбележете какво чухте. Няма грешен отговор; бележките отиват при преподавателя. Ако детето прави задачата в час, отметките ги прави преподавателят.</p>${checks.map((c, i) => `<label><input type="checkbox" data-c="${i}"> ${esc(c)}</label>`).join("")}` : "<p>Изслушайте детето. Мнението не се оценява. Ако детето прави задачата в час, слуша преподавателят.</p>"}</div>
        <div class="st-nav"><button type="button" class="st-btn ghost" id="st-skip">Няма родител до мен сега</button><button type="button" class="st-btn" id="st-done">Готово</button></div></div>`;
      const fin = heard => { const got = [...this.box.querySelectorAll("[data-c]")].map(i => i.checked); this.log.push(Object.assign(this.event(true, { text: kind, answer: kind, given: heard ? "heard" : "skipped", ms: 0 }), { obs: kind, obs_heard: heard, obs_checks: got, obs_labels: checks, obs_by: "parent", is_measurement_item: false, attempt: true })); this.finish(false); };
      this.box.querySelector("#st-done").onclick = () => fin(true); this.box.querySelector("#st-skip").onclick = () => fin(false);
      this.prompt(ask);
    }

    // CH24: три карти → разказ пред възрастен → заглавие и 3 бележки → книжка
    create() {
      const C = this.d.cards, pick = { hero: null, place: null, problem: null }, LBL = { hero: "Герой", place: "Място", problem: "Проблем" };
      const draw = () => {
        this.box.innerHTML = `<div class="st-create"><h3>Избери герой, място и проблем. Решението и края ги измисляш ти.</h3>
          ${Object.keys(C).map(k => `<div class="st-row"><span class="st-lbl">${LBL[k]}</span>${C[k].map(c => `<button type="button" class="st-cc ${pick[k] === c.id ? "on" : ""}" data-k="${k}" data-id="${c.id}"><img src="${this.img(c.id)}" alt=""><b>${esc(c.name)}</b></button>`).join("")}</div>`).join("")}
          <div class="st-nav"><span></span><button type="button" class="st-btn" id="st-go" ${Object.values(pick).every(Boolean) ? "" : "disabled"}>Готов съм да разкажа</button></div></div>`;
        this.box.querySelectorAll(".st-cc").forEach(b => b.onclick = () => { pick[b.dataset.k] = b.dataset.id; draw(); });
        this.box.querySelector("#st-go").onclick = () => tell();
      };
      const name = (k, id) => C[k].find(c => c.id === id).name;
      const tell = () => {
        this.box.innerHTML = `<div class="st-adult"><div class="st-trio">${Object.keys(pick).map(k => `<img src="${this.img(pick[k])}" alt="">`).join("")}</div>
          <h3>Разкажи твоята история на мама, татко или друг възрастен: кой, къде, какво се случи, какво направи героят и как свърши.</h3>
          <div class="st-for"><b>За родителя</b><p>Изслушайте историята (3–5 изречения са минимумът, повече е чудесно). Запишете заглавието, което детето каза, и отбележете какво чухте. Ако детето прави задачата в час, отметките ги прави преподавателят.</p>
            <label class="st-title">Заглавие <input type="text" id="st-t" maxlength="60" placeholder="Например: Хвърчилото на Иво"></label>
            ${this.d.create_checks.map((c, i) => `<label><input type="checkbox" data-c="${i}"> ${esc(c)}</label>`).join("")}</div>
          <div class="st-nav"><button type="button" class="st-btn ghost" id="st-back">Други карти</button><button type="button" class="st-btn" id="st-save">Сложи книжката в Кулата</button></div></div>`;
        this.say("Разкажи на възрастен твоята история.");
        this.box.querySelector("#st-back").onclick = draw;
        this.box.querySelector("#st-save").onclick = () => {
          const title = (this.box.querySelector("#st-t").value || "").trim() || `${name("hero", pick.hero)} и ${name("problem", pick.problem)}`;
          const checks = [...this.box.querySelectorAll("[data-c]")].map(i => i.checked);
          const b = { id: "b" + Date.now(), title, hero: pick.hero, place: pick.place, problem: pick.problem, checks, confirmed: "adult", lesson: this.ctx.lesson || null, at: new Date().toISOString() };
          try { localStorage.setItem(BOOKS, JSON.stringify(books().concat([b]))); } catch (e) {}
          this.log.push(Object.assign(this.event(true, { text: "create", answer: "story", given: title, ms: Date.now() - this.roundStart }), { obs: "create", obs_heard: true, obs_checks: checks, obs_labels: this.d.create_checks, obs_by: "parent", book: Object.assign({}, b, { names: { hero: name("hero", pick.hero), place: name("place", pick.place), problem: name("problem", pick.problem) } }) }));
          this.correct++; this.roundOk.push(true); this.idx++; this.renderProgress(); this.showBook(b, true);
        };
      };
      draw();
    }
    showBook(b, fresh) {
      const C = this.d.cards, nm = (k, id) => (C[k].find(c => c.id === id) || {}).name || "";
      this.box.innerHTML = `<div class="st-book"><div class="st-cover"><img src="${this.img(this.d.cover)}" alt=""><span>${esc(b.title)}</span></div>
        <div><h3>${fresh ? "Твоята история влезе в Кулата на историите!" : esc(b.title)}</h3><p>${esc(nm("hero", b.hero))} · ${esc(nm("place", b.place))} · ${esc(nm("problem", b.problem))}</p>
        <div class="st-trio small">${["hero", "place", "problem"].map(k => `<img src="${this.img(b[k])}" alt="">`).join("")}</div>
        <button type="button" class="st-btn" id="st-end">Готово</button></div></div>`;
      this.say(fresh ? "Твоята история влезе в Кулата на историите!" : b.title);
      this.box.querySelector("#st-end").onclick = () => this.nextRound();
    }
    // книжките на детето; представянето е в часа (без оценка)
    book() {
      const bs = books();
      if (!bs.length) { this.box.innerHTML = `<div class="st-adult"><h3>Кулата на историите още чака твоята първа книжка.</h3><div class="st-nav"><span></span><button type="button" class="st-btn" id="st-end">Готово</button></div></div>`; this.box.querySelector("#st-end").onclick = () => { this.idx++; this.nextRound(); }; return; }
      const b = bs[bs.length - 1]; this.showBook(b, false);
      this.box.querySelector("#st-end").onclick = () => { this.log.push(Object.assign(this.event(true, { text: "book", answer: "book", given: b.id, ms: 0 }), { obs: "present", is_measurement_item: false })); this.correct++; this.roundOk.push(true); this.idx++; this.nextRound(); };
    }
  }
  window.GAMES.story = {
    id: "story", name: "История", module: "readica", skill: "Разбиране и създаване на история", cls: StoryGame,
    task: s => ({ read_order4: "Прочети и чуй историята, после подреди картинките.", quiz: "Отговори на въпросите по историята.", order4_pics: "Подреди картинките по ред.", order5: "Подреди картинките по ред.", lines: "Кой какво каза?", structure: "Какво имаше историята?", create: "Създай своя история.", book: "Кулата на историите" })[s.view] || "История",
    tiers: () => [0, 1, 2],
    settings: [{ key: "view", label: "Режим", type: "choice", options: [["read_order4", "Чета и подреждам", "4 екрана с текст"], ["quiz", "Въпроси", "4 въпроса"], ["order4_pics", "Подреждам по картинки", "4 картини"], ["order5", "Подреждам 5 сцени", "цялата история"], ["lines", "Реплики", "кой какво казва"], ["structure", "Части на историята", "герой, проблем, край"], ["create", "Създавам история", "3 карти и разказ"], ["book", "Кулата на историите", "моите истории"]], def: "quiz" }]
  };
})();
