/* „Текст“ – Читарика 10, 16–21: кратък текст и задачи по него (config/texts-ch10-21.json).
   Банката е content_bank_id от домашната (или settings.bank); в домашната се взимат задачите, отбелязани за този рунд (use).
   settings.task (не „mode“ – то е learn/play в контекста на домашната):
     question_evidence – въпрос с 3 отговора, после „Покажи в текста“: детето докосва изречението-доказателство
     find_evidence     – въпрос без отговори: детето докосва изречението, в което е отговорът
     title             – кое заглавие подхожда най-много (текстът е без заглавие)
     title_question    – заглавие, после въпроси с доказателство
     keywords          – кои 2–3 думи са най-важни в текста
   Текстът стои пред детето през цялото време; гласът го чете само при „Чуй текста“ (тук се мери четенето с разбиране).
   Оценява се първият опит; доказателството се записва отделно (evidence_ok).
   Ротация в пилота: ако рундът има текстове с variant A и B, детето получава само единия (50/50, стабилно за детето и рунда);
   settings.variant = A|B го задава ръчно. Записват се text_variant и text_id. */
(function () {
  const URL = "config/texts-ch10-21.json?v=3";
  let data = null; const load = () => data || (data = fetch(URL).then(r => r.json()));
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function speakSeq(lines, onLine) {
    if (!("speechSynthesis" in window) || localStorage.getItem("platforma.sound") === "off") return () => {};
    speechSynthesis.cancel(); let i = 0, stop = false; const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("bg"));
    const next = () => { if (stop) return; if (i >= lines.length) { onLine && onLine(-1); return; } onLine && onLine(i); const u = new SpeechSynthesisUtterance(lines[i]); u.lang = "bg-BG"; u.rate = 0.9; if (v) u.voice = v; u.onend = () => { i++; setTimeout(next, 200); }; speechSynthesis.speak(u); };
    next(); return () => { stop = true; speechSynthesis.cancel(); };
  }

  const WH = q => (q.match(/^(Къде|Защо|Кога|Кой|Кого|Какво|Каква|Какъв|Какви|Колко|Как|Чий|От какво|С какво)/) || ["Какво"])[0].toLowerCase();
  const HINT = q => /^Кое изречение/.test(q) ? "Прочети въпроса още веднъж. Потърси изречението, което показва това." : `Прочети въпроса още веднъж. Потърси изречението, в което пише ${WH(q)}.`;
  const EV = q => q.evidence_sentence_1 != null ? q.evidence_sentence_1 : q.evidence;
  // стабилен ключ за детето на това устройство (за ротацията A/B)
  const kidKey = () => { try { let k = localStorage.getItem("platforma.kidKey"); if (!k) { k = Math.random().toString(36).slice(2); localStorage.setItem("platforma.kidKey", k); } return k; } catch (e) { return "anon"; } };
  const hashAB = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2 ? "B" : "A"; };
  class TextGame extends CardGame {
    constructor(...a) { super(...a); this.view = this.s.task || "question_evidence"; this.stopVoice = () => {}; }
    get gameId() { return "text"; }
    get skillName() { return ({ question_evidence: "Отговор и доказателство в текста", find_evidence: "Намирам отговора в текста", title: "Основна мисъл: заглавие", title_question: "Заглавие и въпроси", keywords: "Ключови думи" })[this.view] || "Разбирам текста"; }
    destroy() { this.stopVoice(); super.destroy(); }
    start() {
      load().then(d => {
        const bankId = this.ctx.bank || this.s.bank, bank = d.banks[bankId] || Object.values(d.banks)[0];
        const slot = this.ctx.lesson && this.ctx.round != null ? `${this.ctx.lesson}.Р${this.ctx.round}` : null;
        this.items = this.build(bank, slot);
        const cap = Number(this.s.examples) || 0; if (cap && this.items.length > cap && !slot) this.items = this.items.slice(0, cap);
        this.total = this.items.length || 1; super.start();
      }).catch(() => { this.shell.arena.innerHTML = '<p class="bk-err">Текстът не се зареди.</p>'; });
    }
    // задачите на рунда: въпросите с use за този рунд; без домашна – всички
    build(bank, slot) {
      const v = this.view, out = [], mine = q => !slot || (q.use || []).includes(slot);
      bank.texts.forEach(t => {
        if ((v === "title" || v === "title_question") && t.titles && mine(t.titles) && (!slot || (t.titles.use || []).length)) out.push({ type: "title", t });
        const kt = t.key_terms || t.keywords; if (v === "keywords") { if (kt && mine(kt) && (!slot || (kt.use || []).length)) out.push({ type: "keywords", t }); return; }
        if (v === "title") return;
        (t.questions || []).filter(mine).forEach(q => out.push({ type: v === "find_evidence" ? "find" : "mcq", t, q }));
      });
      // ротация: ако рундът има и A, и B – само единият вариант
      const vs = new Set(out.map(x => x.t.variant).filter(Boolean));
      if (slot && vs.has("A") && vs.has("B")) {
        const pick = /^[AB]$/.test(this.s.variant || "") ? this.s.variant : hashAB(`${this.ctx.hw || kidKey()}|${slot}`);
        this.variant = pick; return out.filter(x => !x.t.variant || x.t.variant === pick);
      }
      // при „use“ в домашната рундът взима само своите; иначе първите
      return slot ? out : out.slice(0, 8);
    }
    render() { this.scene("wt-st wt-tx", "scene-space-game"); this.shell.setLabel(({ question_evidence: "Прочети и отговори", find_evidence: "Намери в текста", title: "Кое заглавие подхожда?", title_question: "Заглавие и въпроси", keywords: "Кои думи са най-важни?" })[this.view] || "Текст"); }

    textHtml(t, showTitle) {
      return `<div class="tx-text">${showTitle ? `<h4>${esc(t.title)}</h4>` : ""}${t.sentences.map((s, i) => `<span class="tx-s" data-s="${i}">${esc(s)}</span> `).join("")}
        <button type="button" class="st-btn ghost tx-hear" id="tx-hear">${SPK}<span>Чуй текста</span></button></div>`;
    }
    wireText(t) {
      const ss = [...this.box.querySelectorAll(".tx-s")];
      this.audioUsed = false; this.box.querySelector("#tx-hear").onclick = () => { this.audioUsed = true; this.stopVoice(); this.stopVoice = speakSeq(t.sentences, i => ss.forEach((p, j) => p.classList.toggle("now", j === i))); };
      return ss;
    }
    startRound() {
      this.stepWrong = 0; this.stopVoice(); const it = this.items[this.idx];
      if (!it) { this.box.innerHTML = '<p class="bk-err">За тези текстове няма такава задача. Избери друга в „Настройки“.</p>'; return; }
      ({ mcq: () => this.mcq(it), find: () => this.find(it), title: () => this.title(it), keywords: () => this.keywords(it) })[it.type]();
    }
    record(ok, answer, given, extra) {
      const it = this.items[this.idx] || {};
      this.locked = true; extra = Object.assign({ audio_used: !!this.audioUsed, text_id: it.t && it.t.id, text_variant: it.t && it.t.variant || null }, extra || {});
      if (ok) { this.done(answer, 1200); if (extra) Object.assign(this.log[this.log.length - 1], extra); return; }
      this.miss(answer, given); this.shell.flash("Вярното е отбелязано", "bad"); this.roundOk.push(false); this.idx++; this.renderProgress();
      this.log.push(this.event(false, Object.assign({ text: answer, answer, given, ok: false, ms: 0, adapt: 0, attempt: true }, extra || {})));
      this.later(() => { this.shell.hideFlash(); this.nextRound(); }, 2200);
    }
    layout(t, right, showTitle) { this.box.innerHTML = `<div class="tx-wrap">${this.textHtml(t, showTitle)}<div class="tx-task">${right}</div></div>`; return this.wireText(t); }

    // въпрос с 3 отговора → после доказателство в текста (записва се, не променя оценката)
    mcq(it) {
      const q = it.q, opts = shuffle([q.a].concat(q.wrong));
      const ss = this.layout(it.t, `<div class="st-qline"><button type="button" class="bk-replay" id="tx-say">${SPK}</button><h3>${esc(q.q)}</h3></div><div class="st-opts">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div><p class="tx-step" id="tx-step"></p>`, this.view === "title_question");
      this.box.querySelector("#tx-say").onclick = () => this.say(q.q);
      let first = null;
      this.box.querySelectorAll(".st-opt").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked || first !== null) return; const given = opts[Number(b.dataset.i)]; first = given === q.a;
        this.box.querySelectorAll(".st-opt").forEach(x => { x.disabled = true; if (x.textContent === q.a) x.classList.add(first ? "good" : "hint"); });
        if (!first) b.classList.add("bad");
        if (EV(q) == null) return this.record(first, q.a, given);
        const step = this.box.querySelector("#tx-step"); step.textContent = first ? "Точно така! Сега покажи в текста къде пише това." : "Ето верния отговор. Покажи в текста къде пише това."; this.say(step.textContent);
        this.evidence(ss, q, (evOk, evGiven) => this.record(first, q.a, given, { evidence_ok: evOk, evidence_given: evGiven, question_kind: q.kind, bank_item: q.id }), step);
      }));
      this.say(q.q);
    }
    // въпрос → изречението с отговора
    find(it) {
      const q = it.q;
      const ss = this.layout(it.t, `<div class="st-qline"><button type="button" class="bk-replay" id="tx-say">${SPK}</button><h3>${esc(q.q)}</h3></div><p class="tx-step">Докосни изречението, в което е отговорът.</p>`);
      this.box.querySelector("#tx-say").onclick = () => this.say(q.q);
      this.evidence(ss, q, (ok, g) => this.record(ok, String(EV(q)), String(g), { question_kind: q.kind, bank_item: q.id }), this.box.querySelector(".tx-step"));
      this.say(q.q);
    }
    // докосване на изречение: първият опит е измерването; при грешка – подсказка и втори опит (учене), после се маркира вярното
    evidence(ss, q, done, stepEl) {
      let tries = 0, firstOk = null, firstGiven = null;
      ss.forEach(s => s.classList.add("pick"));
      ss.forEach(s => s.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked || s.classList.contains("bad")) return; const ok = Number(s.dataset.s) === EV(q); tries++;
        if (tries === 1) { firstOk = ok; firstGiven = Number(s.dataset.s); }
        if (ok) { s.classList.add("good"); this.locked = true; return this.later(() => { this.locked = false; done(firstOk, firstGiven); }, tries === 1 ? 0 : 700); }
        s.classList.add("bad"); this.shake(s);
        if (tries === 1) { const h = HINT(q.q); if (stepEl) stepEl.textContent = h; this.say(h); return; }
        ss[EV(q)].classList.add("hint"); this.locked = true; this.later(() => { this.locked = false; done(firstOk, firstGiven); }, 1400);
      }));
    }
    title(it) {
      const T = it.t.titles, opts = shuffle([T.a].concat(T.wrong));
      this.layout(it.t, `<h3>Кое заглавие подхожда най-много?</h3>${this.view === "title_question" ? '<p class="tx-step">После ще отговориш на въпроси за същия текст.</p>' : ""}<div class="st-opts">${opts.map((o, i) => `<button type="button" class="wtile st-opt" data-i="${i}">${esc(o)}</button>`).join("")}</div>`, false);
      this.box.querySelectorAll(".st-opt").forEach(b => b.addEventListener("pointerdown", e => {
        e.preventDefault(); if (this.locked) return; const given = opts[Number(b.dataset.i)], ok = given === T.a;
        b.classList.add(ok ? "good" : "bad"); if (!ok) this.box.querySelectorAll(".st-opt").forEach(x => { if (x.textContent === T.a) x.classList.add("hint"); });
        this.record(ok, T.a, given, { bank_item: it.t.id + ":title" });
      }));
      this.say("Кое заглавие подхожда най-много?");
    }
    keywords(it) {
      const K = it.t.key_terms || it.t.keywords, words = shuffle(K.a.concat(K.wrong)), need = K.a.length, sel = new Set();
      this.layout(it.t, `<h3>Избери ${need} думи, които казват за какво е текстът.</h3><div class="tx-chips">${words.map((w, i) => `<button type="button" class="tx-chip" data-i="${i}">${esc(w)}</button>`).join("")}</div><button type="button" class="st-btn" id="tx-ok" disabled>Готово</button>`, false);
      const ok = this.box.querySelector("#tx-ok");
      this.box.querySelectorAll(".tx-chip").forEach(b => b.onclick = () => { if (this.locked) return; const w = words[Number(b.dataset.i)]; if (sel.has(w)) sel.delete(w); else if (sel.size < need) sel.add(w); b.classList.toggle("on", sel.has(w)); ok.disabled = sel.size !== need; });
      ok.onclick = () => {
        if (this.locked) return; const right = [...sel].every(w => K.a.includes(w));
        this.box.querySelectorAll(".tx-chip").forEach(b => { const w = words[Number(b.dataset.i)]; if (K.a.includes(w)) b.classList.add(sel.has(w) ? "good" : "hint"); else if (sel.has(w)) b.classList.add("bad"); });
        this.record(right, K.a.join(", "), [...sel].join(", "), { bank_item: it.t.id + ":keywords" });
      };
      this.say(`Избери ${need} думи, които казват за какво е текстът.`);
    }
  }
  window.GAMES.text = {
    id: "text", name: "Текст", module: "readica", skill: "Разбиране на текст", cls: TextGame,
    task: s => ({ question_evidence: "Прочети текста, отговори и покажи къде пише.", find_evidence: "Намери в текста изречението с отговора.", title: "Избери заглавие на текста.", title_question: "Избери заглавие и отговори на въпросите.", keywords: "Избери най-важните думи в текста." })[s.task] || "Прочети текста.",
    tiers: () => [0, 1, 2],
    settings: [
      { key: "bank", label: "Текстове", type: "choice", def: "CH_10_text_v1", options: [
        ["CH_10_text_v1", "Урок 10", "Ани и котето"], ["CH_16_text_v1", "Урок 16", "Таралежът, лястовицата"], ["CH_17_text_v1", "Уроци 17–18", "Семето, кексът, хлябът"],
        ["CH_18_main_idea_v1", "Уроци 18–19", "14 кратки текста"], ["CH_19_text_v1", "Урок 19", "Подаръкът за баба"], ["CH_20_text_v1", "Уроци 20–21", "Щъркелите, пазарът"], ["CH_20_text_v2", "Урок 20", "Пчелите"]] },
      // кратките текстове (18–19) имат само заглавие и ключови думи; другите – въпроси и заглавие
      { key: "task", label: "Задача", type: "choice", def: "question_evidence",
        optionOff: (v, s) => s.bank === "CH_18_main_idea_v1" ? !["title", "keywords"].includes(v) : v === "keywords",
        options: [["question_evidence", "Въпрос и доказателство", "отговор + къде пише"], ["find_evidence", "Намери в текста", "докосни изречението"], ["title", "Заглавие", "няколко текста, само заглавие"], ["title_question", "Заглавие и въпроси", "един текст: заглавие, после въпроси"], ["keywords", "Ключови думи", "2–3 най-важни думи"]] }
    ]
  };
})();
