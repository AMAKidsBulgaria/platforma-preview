/* „Интонация и знак“ – Читарика 13 „Казвам, питам, възкликвам“ (config/intonation-ch13-21.json).
   Задача: картинка + ситуация + изречение без краен знак → детето избира какво прави героят: казва / пита / възкликва.
   Знакът се появява след избора като следствие (рамката: „не превръщай препинателните знаци в основната цел“).
   Една задача = една оценка: целта от първия избор. При грешка в упражнението – „прочети ситуацията още веднъж“ и втори опит;
   в измерването след грешка се показва вярното и се продължава.
   Тройки (почти същите думи в три ситуации; при „пита“ – книжовен въпрос с „ли“) – само в упражнението, една след друга; накрая трите изречения се показват заедно.
   Пулове: assessment – Ч13 Р3, набори A → B → C (повторно минаване); practice – Ч13 Р2 и свободната игра, първо невидените.
   Памет за видяното: platforma.inton.exposure (по дете на устройството), записва се при първия избор.
   Данни: една оценка на задача (целта от първия избор) + goal_category и statement_correct / question_correct / exclamation_correct.
   Обратна връзка след избора: „Да! Мая пита → ?“ (намерение → знак). Без две еднакви цели подред.
   Гласът казва само указанието; ситуацията и изречението детето ги чете само. */
/* Изглед „scene“ – Читарика 21 „Чета като герой“: сценка (картинка + ситуация) и реплики една по една; при 3 реплики:
   „Кой го казва?“ (опора, записва се who_correct) → „Как го казва?“ радостно / тъжно / уплашено / ядосано (оценява се само това, първият избор).
   Обратна връзка: „Да — Ани е уплашена. Прочети репликата като Ани.“ Накрая „Сега изиграй сценката!“ – детето избира кой герой играе (role_chosen), възрастният чете другия; родителят (вкъщи) или
   треньорът (office=1) отбелязва зад бутон със задържане: различи гласовете / показа чувството с гласа / прочете плавно и разбираемо.
   Набори A → B → C за Ч21 Р3; упражнение Ч21 Р2 – 2 сценки, първо невидените; там при грешка има втори опит с подсказка. */
(function () {
  const URL = "config/intonation-ch13-21.json?v=6";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()));
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const EXP = "platforma.inton.exposure";
  const kidKey = () => { try { let k = localStorage.getItem("platforma.kidKey"); if (!k) { k = Math.random().toString(36).slice(2); localStorage.setItem("platforma.kidKey", k); } return k; } catch (e) { return "anon"; } };
  const childId = () => (window.HW_CTX && (window.HW_CTX.child || window.HW_CTX.childId)) || kidKey();
  const readExp = () => { try { return JSON.parse(localStorage.getItem(EXP) || "[]").filter(e => e.child_id === childId()); } catch (e) { return []; } };
  function markExp(rec) {
    try {
      const all = JSON.parse(localStorage.getItem(EXP) || "[]"), now = new Date().toISOString();
      const same = all.find(e => e.child_id === rec.child_id && e.item_id === rec.item_id && e.lesson_id === rec.lesson_id && e.round_id === rec.round_id);
      if (same) { same.last_seen_at = now; same.times_seen++; } else all.push(Object.assign({ first_seen_at: now, last_seen_at: now, times_seen: 1 }, rec));
      localStorage.setItem(EXP, JSON.stringify(all));
    } catch (e) {}
  }
  // иконки: балонче с точка / въпрос / удивителна
  const BUBBLE = m => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10h32a4 4 0 014 4v16a4 4 0 01-4 4H22l-9 7v-7H8a4 4 0 01-4-4V14a4 4 0 014-4z" fill="currentColor" opacity=".18"/><path d="M8 10h32a4 4 0 014 4v16a4 4 0 01-4 4H22l-9 7v-7H8a4 4 0 01-4-4V14a4 4 0 014-4z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><text x="24" y="29" text-anchor="middle" font-size="20" font-weight="800" fill="currentColor" font-family="system-ui">${m}</text></svg>`;
  const ASK = "Какво прави героят – казва, пита или възкликва?";
  const CHAR = { "Иво": ["ivo", "55% 22%"], "Мая": ["maya", "50% 21%"], "Ани": ["ani", "50% 21%"], "Мама": ["mom", "62% 16%"], "Татко": ["dad", "45% 9%"], "Баба": ["granny", "45% 18%"], "Дядо": ["grandpa", "40% 13%"] };
  const AVA = n => { const c = CHAR[n] || ["ivo", "50% 20%"]; return `<span class="sc-ava" style="background-image:url(assets/img/art/chars/${c[0]}.jpg);background-position:${c[1]}"></span>`; };
  const FACE = { радостно: '<path d="M15 29q9 8 18 0" />', тъжно: '<path d="M15 33q9-7 18 0" />', уплашено: '<ellipse cx="24" cy="31" rx="4" ry="5"/>', ядосано: '<path d="M15 32h18" /><path d="M13 15l8 4M35 15l-8 4" />' };
  const FACEICON = f => `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="currentColor" opacity=".14"/><circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="2.6"/><circle cx="17" cy="21" r="2.4" fill="currentColor"/><circle cx="31" cy="21" r="2.4" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">${FACE[f]}</g></svg>`;
  // разбъркване без две еднакви цели подред (иначе редът подсказва)
  function spread(list) { for (let t = 0; t < 200; t++) { const x = shuffle(list.slice()); if (x.every((v, i) => !i || v.goal !== x[i - 1].goal)) return x; } return shuffle(list.slice()); }
  class IntonationGame extends CardGame {
    constructor(...a) { super(...a); this.view = this.s.view || "purpose"; }
    get gameId() { return "intonation"; }
    get skillName() { return "Цел на изречението: казвам, питам, възкликвам"; }
    start() {
      load().then(d => {
        this.d = d;
        const slot = this.ctx.lesson && this.ctx.round != null ? `${this.ctx.lesson}.Р${this.ctx.round}` : null, r = slot && d.rounds[slot];
        const by = Object.fromEntries(d.items.map(x => [x.id, x])), exp = readExp();
        if ((r && r.view === "scene") || (!r && this.s.view === "scene")) return this.startScenes(d, r, slot);
        this.meta = { lesson_id: this.ctx.lesson || null, round_id: this.ctx.round != null ? Number(this.ctx.round) : null, pool_type: "practice", assessment_set: null, source: this.ctx.hw ? "homework" : "free_play" };
        let ids = [];
        if (r && r.sets) {
          const used = new Set(exp.filter(e => e.lesson_id === this.meta.lesson_id && e.round_id === this.meta.round_id && e.assessment_set).map(e => e.assessment_set));
          const keys = Object.keys(r.sets), k = keys.find(k => !used.has(k)) || keys[keys.length - 1];
          ids = spread(r.sets[k].map(i => by[i])).map(x => x.id); Object.assign(this.meta, { pool_type: "assessment", assessment_set: k, source: k === keys[0] ? this.meta.source : "lesson_retake" });
        } else {
          // упражнение: една тройка (най-малко видяна) + единични, първо невидените
          const last = {}; exp.forEach(e => { if (!last[e.item_id] || e.last_seen_at > last[e.item_id]) last[e.item_id] = e.last_seen_at; });
          const age = i => last[i] || "", prac = d.items.filter(x => x.pool === "practice");
          const triples = [...new Set(prac.filter(x => x.triple).map(x => x.triple))].sort((a, b) => { const t = id => prac.filter(x => x.triple === id).map(x => age(x.id)).sort().pop() || ""; return t(a) < t(b) ? -1 : t(a) > t(b) ? 1 : Math.random() - .5; });
          const want = r ? r.n : (Number(this.s.exampleQty) || 6), nt = r ? (r.triples_first || 0) : 1;
          triples.slice(0, nt).forEach(t => ids.push(...spread(prac.filter(x => x.triple === t)).map(x => x.id)));
          const singles = prac.filter(x => !x.triple).sort((a, b) => age(a.id) < age(b.id) ? -1 : age(a.id) > age(b.id) ? 1 : Math.random() - .5);
          const pick = []; singles.forEach(x => { if (ids.length + pick.length < want) pick.push(x); });
          let prevGoal = ids.length ? by[ids[ids.length - 1]].goal : null;
          for (let t = 0; t < 200; t++) { const x = spread(pick); if (!x.length || x[0].goal !== prevGoal) { ids.push(...x.map(y => y.id)); break; } if (t === 199) ids.push(...x.map(y => y.id)); }
        }
        this.items = ids.map(i => by[i]); this.total = this.items.length || 1; super.start();
      }).catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Задачите не се заредиха.</p>'; });
    }
    render() { this.scene("wt-st wt-in", "scene-space-game"); this.shell.setLabel(this.view === "scene" ? "Чета като герой" : "Какво прави героят?"); }
    startScenes(d, r, slot) {
      this.view = "scene"; const by = Object.fromEntries(d.scenes.map(x => [x.id, x])), exp = readExp();
      this.meta = { lesson_id: this.ctx.lesson || null, round_id: this.ctx.round != null ? Number(this.ctx.round) : null, pool_type: "practice", assessment_set: null, source: this.ctx.hw ? "homework" : "free_play" };
      let ids;
      if (r && r.sets) {
        const used = new Set(exp.filter(e => e.lesson_id === this.meta.lesson_id && e.round_id === this.meta.round_id && e.assessment_set).map(e => e.assessment_set));
        const keys = Object.keys(r.sets), k = keys.find(k => !used.has(k)) || keys[keys.length - 1];
        ids = r.sets[k]; Object.assign(this.meta, { pool_type: "assessment", assessment_set: k, source: k === keys[0] ? this.meta.source : "lesson_retake" });
      } else {
        const last = {}; exp.forEach(e => { if (!last[e.item_id] || e.last_seen_at > last[e.item_id]) last[e.item_id] = e.last_seen_at; });
        ids = d.scenes.filter(x => x.pool === "practice").map(x => x.id).sort((a, b) => (last[a] || "") < (last[b] || "") ? -1 : (last[a] || "") > (last[b] || "") ? 1 : Math.random() - .5).slice(0, r ? r.n_scenes : (Number(this.s.scenes) || 2));
      }
      // задачите = репликите-задачи, по ред в сценките
      this.items = ids.flatMap(i => by[i].lines.filter(l => l.task).map(l => ({ sc: by[i], line: l })));
      this.total = this.items.length || 1; super.start();
    }
    renderProgress() { super.renderProgress(); if (this.view !== "scene" || !this.items) return; [...this.shell.progress.children].forEach((li, i) => { if (i && this.items[i] && this.items[i - 1] && this.items[i].sc.id !== this.items[i - 1].sc.id) li.classList.add("sc-gap"); }); }
    dialogHtml(sc, upto, hideWho) {
      return sc.lines.filter(l => l.n <= upto).map(l => {
        const cur = l.n === upto, who = cur && hideWho ? '<span class="sc-ava q">?</span>' : AVA(l.who);
        return `<div class="sc-line ${cur ? "cur" : ""}">${who}<p><b>${cur && hideWho ? "" : esc(l.who) + ":"}</b> — ${esc(l.text)}</p></div>`;
      }).join("");
    }
    sceneRound(it) {
      const sc = it.sc, l = it.line, F = this.d.feelings, assess = this.meta.pool_type === "assessment";
      let whoTries = 0, howTries = 0, whoOk = null;
      const draw = (stage, msg) => {
        this.box.innerHTML = `<div class="in sc">
          <div class="sc-top"><div class="in-pic sc-pic"><img src="${sc.picture}" alt="" onerror="this.parentNode.classList.add('none')"></div>
            <div class="sc-dlg"><p class="in-sit">${esc(sc.situation)}</p>${this.dialogHtml(sc, l.n, stage === "who")}</div></div>
          <div class="sc-ask"><h3>${stage === "who" ? "Кой го казва?" : stage === "how" ? `Как го казва ${esc(l.who)}?` : ""}</h3>
            <div class="sc-opts">${stage === "who" ? sc.speakers.map(w => `<button type="button" class="sc-who" data-w="${esc(w)}">${AVA(w)}<span>${esc(w)}</span></button>`).join("")
              : stage === "how" ? F.map(f => `<button type="button" class="in-goal sc-how" data-f="${f}">${FACEICON(f)}<span>${f}</span></button>`).join("") : ""}</div>
            <p class="in-hint" id="sc-msg">${msg || ""}</p></div></div>`;
        this.box.querySelectorAll(".sc-who").forEach(b => b.addEventListener("pointerdown", e => {
          e.preventDefault(); if (this.locked) return; whoTries++; const ok = b.dataset.w === l.who;
          if (whoTries === 1) { whoOk = ok; markExp(Object.assign({ child_id: childId(), item_id: sc.id, line: l.n }, this.meta)); }
          if (ok) return draw("how");
          b.classList.add("bad"); b.disabled = true; this.shake(b);
          const m = this.box.querySelector("#sc-msg"); m.textContent = "Прочети репликата още веднъж. Кой говори?"; this.say(m.textContent);
        }));
        this.box.querySelectorAll(".sc-how").forEach(b => b.addEventListener("pointerdown", e => {
          e.preventDefault(); if (this.locked || b.disabled) return; howTries++; const f = b.dataset.f, ok = f === l.feeling;
          const extra = Object.assign({ item_id: `${sc.id}:${l.n}`, scene_id: sc.id, line_n: l.n, feeling: l.feeling, given: f, who_correct: whoOk, feeling_correct_first_try: howTries === 1 && ok, attempts_to_complete: howTries }, this.meta);
          const msgEl = this.box.querySelector("#sc-msg");
          if (ok) {
            b.classList.add("good"); this.box.querySelectorAll(".sc-how").forEach(x => x.disabled = true);
            msgEl.textContent = `${howTries === 1 ? "Да — " : ""}${l.feedback} Прочети репликата като ${l.who}.`; this.say(msgEl.textContent);
            if (howTries === 1) { this.done(l.feeling, 2600); Object.assign(this.log[this.log.length - 1], extra); this.shell.hideFlash(); }
            else this.finishMiss({ goal: l.feeling, triple: null }, f, extra, 2600);
            return;
          }
          b.classList.add("bad"); b.disabled = true; this.shake(b);
          if (!assess && howTries === 1) { msgEl.textContent = "Прочети пак какво се случва. Как би се чувствал ти?"; this.say(msgEl.textContent); this.stepWrong++; return; }
          const right = this.box.querySelector(`.sc-how[data-f="${l.feeling}"]`); right.classList.add("hint"); this.box.querySelectorAll(".sc-how").forEach(x => x.disabled = true);
          msgEl.textContent = `${l.feedback} Прочети репликата като ${l.who}.`;
          this.finishMiss({ goal: l.feeling, triple: null }, f, extra, 3000);
        }));
      };
      draw("who"); this.say("Прочети. Кой го казва?");
    }
    // след последната задача от сценката: цялата сценка за четене на глас + отметки за възрастния
    readAloud(sc) {
      this.readShown = sc.id;
      const office = document.documentElement.classList.contains("in-office") || /[?&]office=1/.test(location.search), who = office ? "треньора" : "родителя";
      const CH = [["voices", "Различи гласовете на героите"], ["feeling", "Показа чувството с гласа си"], ["fluent", "Прочете плавно и разбираемо"]];
      this.box.innerHTML = `<div class="in sc sc-read"><h3>Сега изиграй сценката!</h3>
        <div class="sc-role"><span>Кой си ти?</span>${sc.speakers.map(w => `<button type="button" class="sc-who sm-role" data-w="${esc(w)}">${AVA(w)}<span>${esc(w)}</span></button>`).join("")}<small>Другия герой го чете възрастен.</small></div>
        <div class="sc-dlg full">${this.dialogHtml(sc, 99, false)}</div>
        <div class="sc-foot"><button type="button" class="st-btn" id="sc-next">Нататък</button>
        <button type="button" class="sq-gate" id="sc-gate"><i></i><span>За ${who}</span><small>задръж</small></button></div>
        <div class="sq-adult" id="sc-adult" hidden><p>За ${who}: отбележи какво чу.</p><div class="sq-checks">${CH.map(([k, t], i) => `<button type="button" class="tx-chip" data-i="${i}">${t}</button>`).join("")}</div>
        <div class="sq-adult-btns"><button type="button" class="st-btn ghost" id="sc-skip">Не прочете</button><button type="button" class="st-btn" id="sc-done">Готово</button></div></div></div>`;
      const on = new Set(), q = x => this.box.querySelector(x), log = this.log[this.log.length - 1]; let role = null;
      this.box.querySelectorAll(".sm-role").forEach(b => b.onclick = () => {
        role = b.dataset.w; this.box.querySelectorAll(".sm-role").forEach(x => x.classList.toggle("on", x === b));
        this.box.querySelectorAll(".sc-read .sc-line").forEach((ln, i) => ln.classList.toggle("mine", sc.lines[i].who === role));
      });
      const save = status => { if (log) Object.assign(log, { read_aloud_status: status, read_aloud_by: status === "unknown" ? null : (office ? "trainer" : "parent"), read_aloud_checks: status === "told" ? Object.fromEntries(CH.map(([k], i) => [k, on.has(i)])) : null, role_chosen: role }); this.nextRound(); };
      let hold = null; const gate = q("#sc-gate"), stop = () => { clearTimeout(hold); gate.classList.remove("holding"); };
      gate.addEventListener("pointerdown", e => { e.preventDefault(); gate.classList.add("holding"); hold = setTimeout(() => { stop(); gate.hidden = true; q("#sc-next").hidden = true; q("#sc-adult").hidden = false; }, 1000); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => gate.addEventListener(ev, stop));
      this.box.querySelectorAll(".sq-checks .tx-chip").forEach(b => b.onclick = () => { const i = Number(b.dataset.i); on.has(i) ? on.delete(i) : on.add(i); b.classList.toggle("on", on.has(i)); });
      q("#sc-next").onclick = () => save("unknown"); q("#sc-skip").onclick = () => save("not_told"); q("#sc-done").onclick = () => save("told");
      this.say("Сега изиграй сценката! Избери кой герой си ти. Другия ще прочете възрастен.");
    }
    startRound() {
      this.stepWrong = 0; const it = this.items[this.idx]; if (!it) return;
      if (this.view === "scene") return this.sceneRound(it);
      const goals = this.d.goals, M = this.d.marks, assess = this.meta.pool_type === "assessment";
      let tries = 0;
      this.box.innerHTML = `<div class="in">
        <div class="in-scene"><div class="in-pic"><img src="${it.picture}" alt="" onerror="this.parentNode.classList.add('none')"></div>
          <div class="in-text"><p class="in-sit">${esc(it.situation)}</p><p class="in-sent"><span>${esc(it.words)}</span><b class="in-mark" id="in-mark"></b></p></div></div>
        <div class="in-goals">${goals.map(g => `<button type="button" class="in-goal" data-g="${g}">${BUBBLE(M[g])}<span>${g}</span></button>`).join("")}</div>
        <p class="in-hint" id="in-hint"></p></div>`;
      const mark = this.box.querySelector("#in-mark"), hint = this.box.querySelector("#in-hint");
      this.box.querySelectorAll(".in-goal").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked || b.disabled) return; const g = b.dataset.g, ok = g === it.goal; tries++;
        if (tries === 1) markExp(Object.assign({ child_id: childId(), item_id: it.id, triple: it.triple || null }, this.meta));
        const cat = { казва: "statement", пита: "question", възкликва: "exclamation" }[it.goal];
        const extra = Object.assign({ item_id: it.id, goal: it.goal, goal_category: cat, [`${cat}_correct`]: tries === 1 && ok, given: g, first_try_correct: tries === 1 && ok, attempts_to_complete: tries, triple: it.triple || null }, this.meta);
        if (ok) {
          b.classList.add("good"); mark.textContent = M[it.goal]; mark.classList.add("on");
          hint.innerHTML = `${tries === 1 ? "Да! " : ""}${esc(it.feedback)} <span class="in-arrow">→</span> <b>${M[it.goal]}</b>`;
          this.box.querySelectorAll(".in-goal").forEach(x => x.disabled = true);
          if (tries === 1) { this.done(it.goal, 1600); Object.assign(this.log[this.log.length - 1], extra); this.shell.hideFlash(); }
          else this.finishMiss(it, g, extra, 1600);
          return;
        }
        b.classList.add("bad"); b.disabled = true; this.shake(b);
        if (!assess && tries === 1) { hint.textContent = "Прочети ситуацията още веднъж. Какво иска героят?"; this.say(hint.textContent); this.stepWrong++; return; }
        // измерване, или втора грешка: показва се вярното
        const right = this.box.querySelector(`.in-goal[data-g="${it.goal}"]`); right.classList.add("hint");
        mark.textContent = M[it.goal]; mark.classList.add("on");
        this.box.querySelectorAll(".in-goal").forEach(x => x.disabled = true);
        hint.innerHTML = `${esc(it.feedback)} <span class="in-arrow">→</span> <b>${M[it.goal]}</b>`;
        this.finishMiss(it, g, extra, 2600);
      }));
      this.say("Прочети. " + ASK);
    }
    finishMiss(it, g, extra, ms) {
      this.locked = true; this.miss(it.goal, g); Object.assign(this.log[this.log.length - 1], extra);
      this.roundOk.push(false); this.idx++; this.renderProgress();
      this.later(() => this.afterItem(it), ms);
    }
    // след последната от тройка: трите изречения заедно („едни и същи думи – различна цел“)
    nextRound() {
      if (this.view === "scene") { const prev = this.items[this.idx - 1], cur = this.items[this.idx]; if (prev && this.readShown !== prev.sc.id && (!cur || cur.sc.id !== prev.sc.id)) return this.readAloud(prev.sc); return super.nextRound(); }
      const prev = this.items[this.idx - 1]; if (prev && prev.triple && !this.tripleShown && (!this.items[this.idx] || this.items[this.idx].triple !== prev.triple)) return this.showTriple(prev.triple); this.tripleShown = false; super.nextRound(); }
    afterItem() { this.locked = false; this.nextRound(); }
    showTriple(t) {
      this.tripleShown = true; this.shell.hideFlash();
      const its = this.d.items.filter(x => x.triple === t), M = this.d.marks;
      this.box.innerHTML = `<div class="in in-trip"><h3>Почти същите думи – различна цел</h3>
        <div class="in-trip-rows">${its.map(x => `<div class="in-trip-r"><div class="in-pic xs"><img src="${x.picture}" alt="" onerror="this.parentNode.classList.add('none')"></div><p class="in-sit in-sm">${esc(x.situation)}</p><p class="in-sent in-sm"><span>${esc(x.words)}</span><b class="in-mark on">${M[x.goal]}</b></p><span class="in-goal-tag">${x.goal}</span></div>`).join("")}</div>
        <div class="in-foot"><p class="in-note">Първо разбираме какво иска героят – да каже, да попита или да възкликне. Знакът накрая ни помага да го покажем в текста. В някои въпроси използваме думата „ли“.</p><button type="button" class="st-btn" id="in-next">Нататък</button></div></div>`;
      this.box.querySelector("#in-next").onclick = () => this.nextRound();
    }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.intonation = {
    id: "intonation", name: "Интонация и знак", module: "readica", skill: "Цел на изречението", cls: IntonationGame,
    task: () => "Прочети ситуацията и изречението. Какво прави героят – казва, пита или възкликва?",
    tiers: () => [0, 1, 2],
    settings: [{ key: "view", label: "Режим", type: "choice", def: "purpose", options: [["purpose", "Казвам, питам, възкликвам", "Читарика 13"], ["scene", "Чета като герой", "Читарика 21, сценки"]] },
      { key: "exampleQty", label: "Брой задачи", type: "range", min: 3, max: 12, def: 6 }],
    paramsLine: s => `${s.exampleQty || 6} задачи`
  };
})();
