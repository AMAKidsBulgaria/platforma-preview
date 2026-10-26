/* „Подреди по ред“ – Читарика 17, 19, 20: кратка история на 4–5 стъпки, детето ги подрежда (config/sequence-ch17-20.json).
   settings.view: sentences – чете и подрежда изреченията; накрая те се събират в един текст със заглавие (изречение ≠ текст)
                  pictures  – подрежда картинките (опора за преразказ), после „Разкажи на възрастен“ без оценка
   Докосване на стъпка → следващото празно място; докосване на заето място → стъпката се връща.
   Докато подрежда, няма знак кое е вярно (иначе се решава с проба–грешка). Когато местата са пълни – преглед и „Провери“.
   Оценява се само първото „Провери“; записват се positions_ok (верни места от първия път), attempt_count, hint_level
   (и с ясни имена: first_try_correct, correct_positions_first_try, attempts_to_complete, hint_used, self_review_before_check, story_kind)
   и самопроверката: review_changed (местил ли е след запълването, преди първото „Провери“) и review_delta (с колко места по-добре/по-зле).
   При грешка нищо не се оцветява; подсказки по ред: 1) общо „прочети още веднъж“ 2) по смисъл (hint_first на историята)
   3) оранжево очертание на ЕДНО грешно място 4) първата стъпка се слага и заключва 5) показва се верният ред.
   При картинките след верния ред: разказ пред родител (вкъщи) или треньор (office=1). Отметките са зад бутон „За родителя/треньора“ (задръж 1 s):
   retell_status told | not_told | unknown (детето е продължило само), retell_by parent | trainer, retell_checks {in_order, each_picture, sequence_words}.
   Пулове (банката): assessment – само в измерващите рундове (Ч17 Р4, Ч19 Р3), набори A (първо минаване, еднакъв за всички) → B → C;
   practice – упражнение, преговор, картинки (Ч19 Р2: групи позната / лесна / средна или трудна) и свободната игра: първо невидени, после най-отдавна видените.
   Памет за видяното (platforma.seq.exposure, по дете на устройството): child_id, lesson_id, round_id, story_id, mode, pool_type, assessment_set,
   first_seen_at, last_seen_at, times_seen, source (homework | free_play | lesson_retake). Записва се при първото действие по историята –
   отваряне и затваряне без действие не „изгаря“ набора. Паметта е обща за всички режими.
   Гласът казва само указанията – изреченията детето ги чете само; „Чуй текста“ има чак на финалния екран. */
(function () {
  const URL = "config/sequence-ch17-20.json?v=12";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()));
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  // глас ред по ред (записите на диктора, иначе синтезиран) – js/voice.js
  function speakSeq(lines, onLine) { return window.VOICE.speak(lines, { onLine, gap: 250 }); }

  const BACK = '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  const RETELL = [["in_order", "Разказа по ред", ""], ["each_picture", "Каза нещо за всяка картинка", ""], ["sequence_words", "Използва думи за последователност", "първо / после / след това / накрая"]];
  const EXP = "platforma.seq.exposure";
  const childId = () => (window.HW_CTX && (window.HW_CTX.child || window.HW_CTX.childId)) || kidKey();
  const readExp = () => { try { return JSON.parse(localStorage.getItem(EXP) || "[]").filter(e => e.child_id === childId()); } catch (e) { return []; } };
  function markExp(rec) {
    try {
      const all = JSON.parse(localStorage.getItem(EXP) || "[]"), now = new Date().toISOString();
      const same = all.find(e => e.child_id === rec.child_id && e.story_id === rec.story_id && e.lesson_id === rec.lesson_id && e.round_id === rec.round_id && e.mode === rec.mode);
      if (same) { same.last_seen_at = now; same.times_seen++; } else all.push(Object.assign({ first_seen_at: now, last_seen_at: now, times_seen: 1 }, rec));
      localStorage.setItem(EXP, JSON.stringify(all));
    } catch (e) {}
  }
  // първо невидените, после най-отдавна видените; rnd – стабилен разбъркващ ключ
  function freshFirst(ids, exp, rnd) {
    const last = {}; exp.forEach(e => { if (!last[e.story_id] || e.last_seen_at > last[e.story_id]) last[e.story_id] = e.last_seen_at; });
    return ids.slice().sort((a, b) => (last[a] || "") < (last[b] || "") ? -1 : (last[a] || "") > (last[b] || "") ? 1 : rnd(a) - rnd(b));
  }
  const kidKey = () => { try { let k = localStorage.getItem("platforma.kidKey"); if (!k) { k = Math.random().toString(36).slice(2); localStorage.setItem("platforma.kidKey", k); } return k; } catch (e) { return "anon"; } };
  const ASK = { sentences: "Подреди изреченията, както се случи.", pictures: "Подреди картинките, както се случи." };
  class SequenceGame extends CardGame {
    constructor(...a) { super(...a); this.view = this.s.view || "sentences"; this.stopVoice = () => {}; }
    get gameId() { return "sequence"; }
    get skillName() { return this.view === "pictures" ? "Последователност: картинки" : "Последователност: изречения"; }
    start() {
      load().then(d => {
        const slot = this.ctx.lesson && this.ctx.round != null ? `${this.ctx.lesson}.Р${this.ctx.round}` : null; let r = slot && d.rounds[slot];
        if (r) this.view = r.view;
        const by = Object.fromEntries(d.stories.map(s => [s.id, s])), exp = readExp();
        let h0 = 2166136261; for (const c of `${childId()}|${this.ctx.hw || ""}|${slot}|${exp.length}`) { h0 ^= c.charCodeAt(0); h0 = Math.imul(h0, 16777619); }
        const rnd = id => { let h = h0; for (const c of id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
        const pics = this.view === "pictures", fits = i => by[i] && (!pics || by[i].pictures);
        let ids = [];
        this.meta = { lesson_id: this.ctx.lesson || null, round_id: this.ctx.round != null ? Number(this.ctx.round) : null, pool_type: "practice", assessment_set: null, source: this.ctx.hw ? "homework" : "free_play" };
        if (r && r.sets) {
          // измерване: следващият неизползван набор за този рунд (A → B → C); набор с вече видяна история другаде се прескача
          const used = new Set(exp.filter(e => e.lesson_id === this.meta.lesson_id && e.round_id === this.meta.round_id && e.assessment_set).map(e => e.assessment_set));
          const seenIds = new Set(exp.map(e => e.story_id)), keys = Object.keys(r.sets);
          const k = keys.find(k => !used.has(k) && r.sets[k].every(i => !seenIds.has(i) || exp.some(e => e.story_id === i && e.assessment_set === k)))
            || keys.find(k => !used.has(k)) || keys.slice().sort((a, b) => { const t = k => Math.max(0, ...exp.filter(e => e.assessment_set === k && e.round_id === this.meta.round_id).map(e => Date.parse(e.last_seen_at))); return t(a) - t(b); })[0];
          ids = r.sets[k]; Object.assign(this.meta, { pool_type: "assessment", assessment_set: k, source: k === keys[0] ? this.meta.source : "lesson_retake" });
        } else {
          const pool = d.pools.practice.filter(fits).filter(i => !r || !r.steps || by[i].steps.length === r.steps);
          if (r && r.groups) {
            // Ч19 Р2: първата група – история, видяна в по-ранно занятие (позната); другите – първо невидени
            const earlier = new Set(exp.filter(e => e.lesson_id !== this.meta.lesson_id).map(e => e.story_id));
            r.groups.forEach((g, gi) => {
              const cand = g.filter(i => fits(i) && !ids.includes(i));
              const known = gi === 0 && r.known_first ? cand.filter(i => earlier.has(i)) : [];
              ids.push((known.length ? freshFirst(known, exp, rnd) : freshFirst(cand, exp, rnd))[0]);
            });
          } else {
            // първо невидени, и по възможност различен тип последователност (не поред само процедури)
            const order = freshFirst(pool, exp, rnd), want = r ? r.n : (Number(this.s.exampleQty) || 3), kinds = new Set();
            order.forEach(i => { if (ids.length < want && !kinds.has(by[i].kind)) { ids.push(i); kinds.add(by[i].kind); } });
            order.forEach(i => { if (ids.length < want && !ids.includes(i)) ids.push(i); });
          }
        }
        this.items = ids.filter(Boolean).map(i => by[i]);
        this.total = this.items.length || 1; super.start();
      }).catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Историите не се заредиха.</p>'; });
    }
    render() { this.scene("wt-st wt-sq", "scene-space-game"); this.shell.setLabel(this.view === "pictures" ? "Подреди картинките по ред" : "Подреди изреченията по ред"); }
    startRound() {
      this.stepWrong = 0; const st = this.items[this.idx]; if (!st) return;
      const n = st.steps.length, ids = st.steps.map((_, i) => i), pics = this.view === "pictures";
      let mix = shuffle(ids.slice()); while (mix.every((x, i) => x === i)) mix = shuffle(ids.slice());
      const slots = ids.map(() => null), keep = new Set(); let tries = 0, firstPos = null, hint = "", warn = null;
      const REVIEW = pics ? "Разгледай картинките отначало. Правилен ли е редът?" : "Прочети историята отначало. Правилен ли е редът?";
      const item = i => pics ? `<img src="${st.pictures[i]}" alt="" draggable="false">` : `<span>${esc(st.steps[i])}</span>`;
      // самопроверка: какво е било при първото запълване (преди първото „Провери“) и дали детето е местило после
      let atFull = null, changed = false, wiggled = false, acted = false;
      const posOk = () => slots.filter((v, i) => v === i).length;
      const draw = (back) => {
        const full = !slots.includes(null), any = slots.some((v, i) => v != null && !keep.has(i));
        this.box.innerHTML = `<div class="sq ${pics ? "pics" : "sents"}">
          <div class="sq-cols"><ol class="sq-slots">${slots.map((v, i) => `<li><span class="sq-n">${i + 1}</span><button type="button" class="sq-slot ${v != null ? "full" : ""} ${keep.has(i) ? "fixed" : ""} ${warn === i ? "warn" : ""}" data-s="${i}">${v != null ? item(v) + (keep.has(i) ? "" : `<i class="sq-back" aria-hidden="true">${BACK}</i>`) : ""}</button></li>`).join("")}</ol>
          <div class="sq-side">${full ? "" : `<div class="sq-pool">${mix.map(i => slots.includes(i) ? `<span class="sq-card gone">${item(i)}</span>` : `<button type="button" class="sq-card" data-c="${i}">${item(i)}</button>`).join("")}</div>`}
          ${full ? `<div class="sq-review"><p>${hint || REVIEW}</p><p class="sq-sub">Искаш да смениш реда? Докосни ${pics ? "картинка" : "изречение"}.</p><button type="button" class="st-btn" id="sq-check">Провери</button></div>` : (hint ? `<p class="sq-hint">${hint}</p>` : "")}
          ${any ? `<button type="button" class="sq-reset" id="sq-reset">${BACK}<span>Започни отначало</span></button>` : ""}</div></div></div>`;
        this.box.querySelectorAll(".sq-card[data-c]").forEach(b => b.addEventListener("pointerdown", e => {
          e.preventDefault(); if (this.locked) return; const f = slots.indexOf(null); if (f < 0) return; slots[f] = Number(b.dataset.c);
          if (!acted) { acted = true; markExp(Object.assign({ child_id: childId(), story_id: st.id, mode: this.view }, this.meta)); }
          if (atFull) changed = true; draw();
          if (!slots.includes(null)) { if (!tries && !atFull) atFull = slots.slice(); this.say(hint || REVIEW); if (!wiggled) { wiggled = true; this.wiggle(); } }
        }));
        this.box.querySelectorAll(".sq-slot.full:not(.fixed)").forEach(b => b.addEventListener("pointerdown", e => {
          e.preventDefault(); if (this.locked) return; const k = Number(b.dataset.s), v = slots[k], from = b.getBoundingClientRect();
          slots[k] = null; if (warn === k) warn = null; if (atFull) changed = true; draw({ v, from });
        }));
        const c = this.box.querySelector("#sq-check"); if (c) c.onclick = () => { if (!this.locked) check(); };
        const r = this.box.querySelector("#sq-reset"); if (r) r.onclick = () => { if (this.locked) return; slots.forEach((v, i) => { if (!keep.has(i)) slots[i] = null; }); warn = null; if (atFull) changed = true; draw(); };
        // „отлитане“ обратно: картата тръгва от мястото и се връща на старото си място вдясно
        if (back) { const to = this.box.querySelector(`.sq-card[data-c="${back.v}"]`); if (to) this.fly(to, back.from); }
      };
      // „Провери“: оценява се само първият път; при грешка – без да се казва кое е грешно, с нарастващи подсказки
      const check = () => {
        tries++; const good = slots.map((v, i) => v === i), all = good.every(Boolean);
        if (tries === 1) { firstPos = good.filter(Boolean).length; this.review = { review_changed: changed, review_delta: atFull ? firstPos - atFull.filter((v, i) => v === i).length : 0 }; }
        const extra = { ...this.review, ...this.meta, task_count: 1, scored_decision_count: n, correct_scored_decisions: firstPos, story_kind: st.kind, first_try_correct: tries === 1 && all, correct_positions_first_try: firstPos, attempts_to_complete: tries, hint_used: tries > 1, self_review_before_check: !!(this.review && this.review.review_changed), story_id: st.id, steps: n, positions_ok: firstPos, attempt_count: tries, hint_level: Math.min(tries - 1, 4), view: this.view, bank_item: st.id };
        if (all) return this.finishStory(st, tries === 1, extra);
        this.locked = true; this.shake(this.box.querySelector(".sq-slots"));
        warn = null;
        if (tries === 1) hint = "Почти! Нещо не е на правилното място. Прочети историята още веднъж.";
        else if (tries === 2) hint = st.hint_first || "Какво се случи първо?";
        else if (tries === 3) { warn = good.indexOf(false); hint = "Погледни оранжевото място. Това изречение ли е тук?"; }
        else if (tries === 4) {
          hint = "Първото е на място. Подреди останалите.";
          const at = slots.indexOf(0); if (at > 0) slots[at] = slots[0]; slots[0] = 0; keep.add(0);
        } else {
          this.shell.flash("Ето правилния ред", "bad");
          slots.splice(0, n, ...ids); keep.clear(); ids.forEach(i => keep.add(i)); hint = ""; draw();
          this.box.querySelectorAll(".sq-slot").forEach(s => s.classList.add("hint")); const r = this.box.querySelector(".sq-review"); if (r) r.remove();
          return this.later(() => { this.shell.hideFlash(); this.finishStory(st, false, extra, true); }, 2600);
        }
        this.say(hint); this.later(() => { this.locked = false; draw(); }, 500);
      };
      draw(); this.prompt(ASK[this.view]);
    }
    // първо запълване: едно поставено изречение леко помръдва и иконката за връщане светва – „това може да се натиска“
    wiggle() { const b = this.box.querySelector(".sq-slot.full:not(.fixed)"); if (b) { b.classList.add("wiggle"); this.later(() => b.classList.remove("wiggle"), 1600); } }
    fly(el, from) {
      const to = el.getBoundingClientRect(); if (!to.width) return;
      el.style.transition = "none"; el.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(.9)`; el.style.opacity = ".7";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = "transform .32s cubic-bezier(.3,.7,.4,1), opacity .32s"; el.style.transform = ""; el.style.opacity = ""; }));
    }
    // верен ред: изреченията стават текст – детето го чете отначало или го чува; при картинките – разказ пред възрастен
    finishStory(st, ok, extra, shown) {
      this.locked = true;
      const after = () => {
        this.stopVoice();
        if (this.view === "pictures") {
          // детето разказва; отметките са само за възрастния – зад бутон, който се задържа 1 s (детето не ги отваря случайно)
          // retell_status: told (възрастният натисна „Готово“, с или без отметки) | not_told („Не разказа“) | unknown (детето натисна „Нататък“)
          const office = document.documentElement.classList.contains("in-office") || /[?&]office=1/.test(location.search), who = office ? "треньора" : "родителя";
          const ask = office ? "Разкажи историята на треньора." : "Разкажи историята на мама, татко или друг възрастен.";
          this.box.innerHTML = `<div class="sq sq-tell"><h3>${ask}</h3><div class="sq-strip">${st.pictures.map((p, i) => `<figure><span class="sq-n">${i + 1}</span><img src="${p}" alt=""></figure>`).join("")}</div><p class="sq-note">Кажи какво става на всяка картинка – с твои думи.</p>
            <button type="button" class="st-btn" id="sq-next">Нататък</button>
            <button type="button" class="sq-gate" id="sq-gate"><i></i><span>За ${who}</span><small>задръж</small></button>
            <div class="sq-adult" id="sq-adult" hidden><p>За ${who}: отбележи какво чу.</p><div class="sq-checks">${RETELL.map(([k, t, ex], i) => `<button type="button" class="tx-chip" data-i="${i}">${t}${ex ? `<small>${ex}</small>` : ""}</button>`).join("")}</div>
            <div class="sq-adult-btns"><button type="button" class="st-btn ghost" id="sq-skip">Не разказа</button><button type="button" class="st-btn" id="sq-done">Готово</button></div></div></div>`;
          const on = new Set(), log = this.log[this.log.length - 1], q = sel => this.box.querySelector(sel);
          const save = status => { if (log) Object.assign(log, { retell_status: status, retell_by: status === "unknown" ? null : (office ? "trainer" : "parent"), retell_checks: status === "told" ? Object.fromEntries(RETELL.map(([k], i) => [k, on.has(i)])) : null }); this.stopVoice(); this.locked = false; this.nextRound(); };
          let hold = null; const gate = q("#sq-gate");
          const stopHold = () => { clearTimeout(hold); gate.classList.remove("holding"); };
          gate.addEventListener("pointerdown", e => { e.preventDefault(); gate.classList.add("holding"); hold = setTimeout(() => { stopHold(); gate.hidden = true; q("#sq-next").hidden = true; q("#sq-adult").hidden = false; this.stopVoice(); }, 1000); });
          ["pointerup", "pointerleave", "pointercancel"].forEach(ev => gate.addEventListener(ev, stopHold));
          this.box.querySelectorAll(".sq-checks .tx-chip").forEach(b => b.onclick = () => { const i = Number(b.dataset.i); if (on.has(i)) on.delete(i); else on.add(i); b.classList.toggle("on", on.has(i)); });
          q("#sq-next").onclick = () => save("unknown"); q("#sq-skip").onclick = () => save("not_told"); q("#sq-done").onclick = () => save("told");
          this.prompt(ask + " Кажи какво става на всяка картинка.");
          return;
        } else {
          this.box.innerHTML = `<div class="sq sq-text"><h3>Прочети историята отначало.</h3><div class="sq-para"><h4>${esc(st.title)}</h4><p>${st.steps.map((x, i) => `<span class="sq-s" data-s="${i}">${esc(x)}</span>`).join(" ")}</p>
            <button type="button" class="st-btn ghost sq-hear" id="sq-hear">${SPK}<span>Чуй текста</span></button></div>
            <p class="sq-note">Когато изреченията са в правилен ред, те могат да образуват текст.</p><button type="button" class="st-btn" id="sq-next">Нататък</button></div>`;
          const ss = [...this.box.querySelectorAll(".sq-s")];
          this.box.querySelector("#sq-hear").onclick = () => { this.audioUsed = true; this.stopVoice(); this.stopVoice = speakSeq([st.title].concat(st.steps), i => ss.forEach((p, j) => p.classList.toggle("now", j === i - 1))); };
          this.say("Прочети историята отначало.");
        }
        this.box.querySelector("#sq-next").onclick = () => { this.stopVoice(); this.locked = false; this.nextRound(); };
      };
      const rec = () => Object.assign(this.log[this.log.length - 1], extra);
      if (ok) { this.correct++; this.renderScore(); this.log.push(this.event(true, { text: st.id, answer: st.id, given: st.id, ms: Date.now() - this.roundStart, first_attempt_correct: true })); rec(); this.roundOk.push(true); this.idx++; this.renderProgress(); this.shell.flash("Точно така!", "good"); this.say("Точно така!"); this.later(() => { this.shell.hideFlash(); after(); }, 1100); return; }
      // грешен краен отговор: записът е измерване (не от първия опит), не „опит“ – иначе в измерването остават само верните
      this.miss(st.id, shown ? "shown" : "solved-later"); rec(); Object.assign(this.log[this.log.length - 1], { attempt: false, first_attempt_correct: false }); this.roundOk.push(false); this.idx++; this.renderProgress();
      if (!shown) { this.shell.flash("Вече е наред!", "good"); this.say("Вече е наред!"); return this.later(() => { this.shell.hideFlash(); after(); }, 1100); }
      after();
    }
    destroy() { this.stopVoice(); super.destroy(); }
  }
  window.GAMES = window.GAMES || {};
  window.GAMES.sequence = {
    id: "sequence", name: "Подреди по ред", module: "readica", skill: "Последователност", cls: SequenceGame,
    task: s => s.view === "pictures" ? "Подреди картинките на историята по ред и я разкажи." : "Прочети изреченията и ги подреди, както се случи.",
    tiers: () => [0, 1, 2],
    settings: [
      { key: "view", label: "Какво се подрежда", type: "choice", def: "sentences", options: [["sentences", "Изречения", "чета и подреждам"], ["pictures", "Картинки", "подреждам и разказвам"]] },
      { key: "exampleQty", label: "Брой истории", type: "range", min: 2, max: 6, def: 3 }
    ],
    paramsLine: s => `${s.exampleQty || 3} истории · ${s.view === "pictures" ? "картинки" : "изречения"}`
  };
})();
