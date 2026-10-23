/* Изпращане на резултатите от пилота към базата – само през Edge Function `ingest` (тех. спец. v1.0, експертен преглед 23.10).
   • Кое дете играе: кодът идва с линка (?pilot=КОД, общ таблет: ?pilotgroup=КОД.картинка,…); без код – нищо не се праща
     (свободна игра, демо). В базата няма имена – само кодът.
   • Кой праща: таблет в клас – токен на устройството (регистрира го учителят от teacher-device.html, 12 ч, подновява се сам,
     докато таблетът не е отнет); домашна – токен за домашната от линка (?hwt=…). Без токен събитията чакат в опашката.
   • Опашка (localStorage): събитие „завършен кръг“ с отговорите вътре. От опашката излиза САМО потвърдено от сървъра
     (processed / duplicate). conflict, forbidden, invalid_schema и многократно неуспешните остават „блокирани“ за преглед
     от учителя – не се трият. Мрежа, 5xx, 429, загубен отговор → опит пак по-късно (нарастваща пауза).
   • Повторното изпращане е безопасно: ключът на събитието е постоянен и сървърът го приема веднъж.
   • Потвърдените отключвания от сървъра се пазят отделно (за изравняване на света на детето). */
(function () {
  const QKEY = "platforma.outbox.v2", OLDQ = "platforma.outbox.v1", IKEY = "platforma.pilot.v1", WKEY = "platforma.world.confirmed.v1", SKEY = "platforma.sync.state.v1";
  const BATCH = 50, MAX_TRIES = 10, TIMEOUT = 20000;
  let CFG = null, busy = false, batch = BATCH;
  const memQ = {};   // събития, които не се побраха в localStorage (пълна памет) – живеят до затваряне на страницата
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  // пълна памет: второстепенното (локална история, дневници за показани задачи) може да се освободи за резултатите и самоличността
  const SPARE = ["platforma.sessions.v1", "platforma.inton.exposure", "platforma.seq.exposure"];
  const freeSpare = () => SPARE.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  // кое дете играе: ако не може да се запише (пълна памет) – важи за отворената страница; иначе резултатът би отишъл при предишното дете
  let identMem = null;
  const writeIdent = i => { if (write(IKEY, i)) { identMem = null; return; } freeSpare(); if (write(IKEY, i)) { identMem = null; return; } identMem = JSON.parse(JSON.stringify(i)); };
  const ident = () => { const i = identMem ? JSON.parse(JSON.stringify(identMem)) : (read(IKEY) || {}); if (!i.device) { i.device = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); writeIdent(i); } return i; };
  const state = () => read(SKEY) || {};
  const setState = p => write(SKEY, Object.assign(state(), p));
  // опашката: всяко събитие е под собствен ключ (QP + event_key). Така два отворени раздела не презаписват взаимно
  // добавените събития (няма общ масив „прочети–промени–запиши“); от опашката се маха само конкретното потвърдено събитие.
  const QP = QKEY + ":";
  const getQ = () => {
    const out = Object.values(memQ);
    try { for (let n = 0; n < localStorage.length; n++) { const k = localStorage.key(n); if (k && k.startsWith(QP) && !memQ[k.slice(QP.length)]) { const x = read(k); if (x && x.ev) out.push(x); } } } catch (e) {}
    return out.sort((a, b) => String(a.added).localeCompare(String(b.added)));
  };
  // пълна памет: първо се освобождава второстепенното (локалната история, дневниците за показани задачи), после пак опит;
  // ако и тогава не стане – събитието остава само в паметта на страницата (unsaved) до потвърждение от сървъра
  const notify = () => { try { window.dispatchEvent(new CustomEvent("pilot-sync", { detail: { unsaved: Object.keys(memQ).length } })); } catch (e) {} };
  const saveItem = x => {
    if (write(QP + x.ev.event_key, x)) { delete memQ[x.ev.event_key]; return true; }
    freeSpare();
    if (write(QP + x.ev.event_key, x)) { delete memQ[x.ev.event_key]; return true; }
    memQ[x.ev.event_key] = x; setState({ storage_full: true }); notify(); return false;
  };
  const dropItem = k => { const had = !!memQ[k]; delete memQ[k]; try { localStorage.removeItem(QP + k); } catch (e) {} if (!Object.keys(memQ).length && state().storage_full) setState({ storage_full: false }); if (had) notify(); };
  // старият общ масив v2 (преди разделянето по ключове) → по ключове, веднъж
  (function split() { const a = read(QKEY); if (!Array.isArray(a)) return; a.forEach(x => { if (x && x.ev && !read(QP + x.ev.event_key)) saveItem(x); }); try { localStorage.removeItem(QKEY); } catch (e) {} })();

  // кодът на детето от адреса (линкът от офиса): pilot=КОД (личен таблет); „pilot=-“ изчиства всичко.
  // Общ таблет: линк на групата pilotgroup=КОД.картинка,КОД.картинка,… – при всяко пускане на домашно таблетът пита „Кой играе?“
  // Домашна: hwt=ТОКЕН (важи само за детето от pilot=КОД)
  (function capture() {
    const all = location.search + "&" + location.hash;
    const m = all.match(/[?&#~]pilot[=_]([A-Za-z0-9_-]+)/), g = all.match(/[?&#~]pilotgroup[=_]([A-Za-z0-9.,_-]+)/), t = all.match(/[?&#~]hwt[=_]([A-Za-z0-9_-]{24,128})/);
    if (!m && !g) return;
    const i = ident();
    if (m) { if (m[1] === "-") { delete i.child; delete i.roster; delete i.hwt; } else { i.child = m[1].toUpperCase(); delete i.roster; } }
    if (g) { i.roster = g[1].split(",").map(x => x.split(".")).filter(x => x[0]).map(([c, p]) => ({ code: c.toUpperCase(), pic: (p || "").replace(/[^a-z_]/g, "") })); delete i.child; }
    if (t && i.child) { i.hwt = Object.assign(i.hwt || {}, { [i.child]: t[1] }); }
    writeIdent(i);
  })();
  // „Кой играе?“ – картинки вместо имена (децата не четат); избраното дете важи за тази домашна
  function needsPick() { const i = ident(); return !!(i.roster && i.roster.length > 1); }
  function pick(done) {
    const i = ident(); if (!needsPick()) { if (i.roster && i.roster.length === 1) { i.child = i.roster[0].code; writeIdent(i); } return done(); }
    const ov = document.createElement("div"); ov.className = "who-plays";
    ov.innerHTML = `<div class="who-box"><h2>Кой играе?</h2><p>Докосни своята картинка.</p><div class="who-grid">${i.roster.map(k =>
      `<button type="button" class="who-kid" data-c="${k.code}">${k.pic ? `<img src="assets/img/pics/${k.pic}.jpg" alt="" draggable="false">` : `<b>${k.code}</b>`}</button>`).join("")}</div></div>`;
    document.body.appendChild(ov);
    if (window.VOICE && window.VOICE.speak) try { window.VOICE.speak(["Кой играе? Докосни своята картинка."]); } catch (e) {}
    ov.querySelectorAll(".who-kid").forEach(b => b.addEventListener("pointerdown", e => {
      e.preventDefault(); const j = ident(); j.child = b.dataset.c; j.pickedAt = new Date().toISOString(); writeIdent(j); ov.remove(); done();
    }));
  }

  // настройки: config/pilot-db.json (облак); на локалната машина – config/pilot-db.local.json (локален Supabase), ако го има
  const local = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  // демо (тест на прототипа с деца): нищо не се изпраща към база, всичко остава на таблета
  const DEMO = /[?&#~]demo[=_]1/.test(location.search + location.hash);
  let RULES_V = (state().rules_version) || null;   // последната известна версия (ако config не се зареди навреме)
  const cfgOk = c => c && c.url && c.anon_key ? c : null;
  const ready = (local ? fetch("config/pilot-db.local.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null))
    .then(c => cfgOk(c) || fetch("config/pilot-db.json?v=2").then(r => r.ok ? r.json() : null).then(cfgOk).catch(() => null))
    .then(c => { CFG = DEMO ? null : c; });
  fetch("config/world-rules.json?v=1").then(r => r.ok ? r.json() : null).then(w => { if (w && w.version) { RULES_V = parseInt(w.version, 10) || null; if (RULES_V) setState({ rules_version: RULES_V }); } }).catch(() => {});

  // събитие „завършен кръг“ (договорът на ingest); отговорите са вътре – няма отделни събития за отговор
  function toEvent(r) {
    const i = ident(); const rec = Object.assign({}, r); delete rec.log; delete rec.events; delete rec.child;   // без име на детето
    rec.child_source = i.roster ? "group_pick" : "personal_link";
    const ev = {
      event_key: `${i.device}:${r.at}:${r.hw || ""}:${r.st != null ? r.st : ""}:${r.gameId || ""}`,
      child_code: i.child, type: "activity_completed", client_ts: r.at || new Date().toISOString(), policy_version: 1,
      payload: {
        lesson: r.lesson_id || r.lesson || null, round: r.round_id != null ? r.round_id : null, game_id: r.gameId || null, game_name: r.gameName || null,
        hw_id: r.hw || null, started_at: r.at || null, seconds: r.seconds != null ? r.seconds : null, total: r.total != null ? r.total : null,
        answered: r.answered != null ? r.answered : null, correct: r.correct != null ? r.correct : null, accuracy: r.accuracy != null ? r.accuracy : null,
        early: !!r.early, record: rec, items: (r.events || []).map(e => { const x = Object.assign({}, e); delete x.child; return x; })
      }
    };
    if (RULES_V) ev.rules_version = RULES_V;
    return ev;
  }
  // как се удостоверява събитието: таблет от класа или домашна на това дете; null – чака (не се губи)
  function authFor(child) {
    const i = ident();
    if (i.dev && i.dev.token && !i.dev.needs_teacher) return { kind: "device", key: "device", h: { "x-device-token": i.dev.token } };
    const t = i.hwt && i.hwt[child]; if (t && !(i.hwt_bad || {})[t]) return { kind: "hw", key: "hw:" + child, h: { "x-homework-token": t } };
    return null;
  }
  // ---- светът на детето (прототип „Квартал на буквите“) ----
  // дневник на завършените кръгове на това устройство: от него се показва „завършено, чака потвърждение“ още преди отговора на сървъра
  const RKEY = "platforma.rounds.v1", CHKEY = "platforma.world.choices.v1", MYCH = "platforma.world.mychoices.v1", PGKEY = "platforma.world.progress.v1";
  const roundsMem = {};
  function noteRound(child, lesson, round, early) {
    if (!child || !lesson || round == null || early) return;
    const all = read(RKEY) || roundsMem; const c = all[child] = all[child] || {}; const l = c[lesson] = c[lesson] || [];
    if (!l.includes(Number(round))) l.push(Number(round));
    if (!write(RKEY, all)) Object.assign(roundsMem, all);
  }
  // избор „1 от 3“: показва се веднага (локално), изпраща се като събитие; сървърът проверява, че е от предложените и еднократен
  function choose(ruleId, chosen) {
    const i = ident(); if (!i.child) return false;
    const mine = read(MYCH) || {}; (mine[i.child] = mine[i.child] || {})[ruleId] = chosen; write(MYCH, mine);
    const ev = { event_key: `${i.device}:choice:${i.child}:${ruleId}`, child_code: i.child, type: "world_choice", client_ts: new Date().toISOString(), policy_version: 1,
                 payload: { rule_id: ruleId, chosen } };
    if (!read(QP + ev.event_key) && !memQ[ev.event_key]) saveItem({ ev, tries: 0, state: "queued", added: new Date().toISOString() });
    flushLocked({ force: true }); return true;
  }
  // децата, играли на този таблет (за страницата на учителя)
  function childrenOnDevice() { const all = read(RKEY) || roundsMem; return Object.keys(all); }
  function worldState(child) {
    const c = child || ident().child; if (!c) return null;
    const conf = (read(WKEY) || {})[c] || {}, ch = (read(CHKEY) || {})[c] || {}, mine = (read(MYCH) || {})[c] || {}, rounds = ((read(RKEY) || roundsMem)[c]) || {};
    const pendingKeys = new Set(getQ().filter(x => x.ev.child_code === c && x.state === "queued").map(x => x.ev.type));
    return { child: c, confirmed: conf, choices: ch, myChoices: mine, rounds, progress: (read(PGKEY) || {})[c] || {}, reviews: (state().reviews || []).filter(r => r.child_code === c),
             queued: getQ().filter(x => x.ev.child_code === c && x.state === "queued").length, blocked: getQ().filter(x => x.ev.child_code === c && x.state === "blocked").length,
             blockedReasons: getQ().filter(x => x.ev.child_code === c && x.state === "blocked").map(x => x.reason),
             lastOk: state().last_ok || null, sending: pendingKeys.size > 0 };
  }

  function enqueue(r) {
    const i = ident(); if (!i.child || !r) return;               // не е пилотно дете
    noteRound(i.child, r.lesson_id || r.lesson, r.round_id, !!r.early);
    const ev = toEvent(r);
    let stored = true;
    if (!read(QP + ev.event_key) && !memQ[ev.event_key]) stored = saveItem({ ev, tries: 0, state: "queued", added: new Date().toISOString() });
    flushLocked({ force: !stored });   // само в паметта → опит за изпращане веднага
    return stored ? "stored" : "memory";
  }
  // старата опашка (директно в таблицата sessions) → в новия формат, веднъж; нищо не се губи
  (function migrate() {
    const old = read(OLDQ); if (!old || !old.length) return;
    let ok = true;
    old.forEach(p => {
      if (!p || !p.client_id || read(QP + p.client_id)) return;
      ok = saveItem({ ev: { event_key: p.client_id, child_code: p.child_code, type: "activity_completed", client_ts: p.started_at || new Date().toISOString(), policy_version: 1,
        payload: { lesson: p.lesson_id, round: p.round_id, game_id: p.game_id, game_name: p.game_name, hw_id: p.hw_id, started_at: p.started_at, seconds: p.seconds,
          total: p.total, answered: p.answered, correct: p.correct, accuracy: p.accuracy, early: !!p.early, record: p.record || {}, items: p.events || [] } },
        tries: 0, state: "queued", added: new Date().toISOString(), migrated: true }) && ok;
    });
    if (ok) { try { localStorage.removeItem(OLDQ); } catch (e) {} }
  })();

  async function post(path, body, headers) {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), TIMEOUT);
    try {
      const res = await fetch(`${CFG.url}/functions/v1/${path}`, { method: "POST", signal: ac.signal,
        headers: Object.assign({ apikey: CFG.anon_key, Authorization: `Bearer ${CFG.anon_key}`, "Content-Type": "application/json" }, headers || {}), body: JSON.stringify(body) });
      let data = null; try { data = await res.json(); } catch (e) {}
      return { status: res.status, data };
    } finally { clearTimeout(t); }
  }
  // токенът на таблета: подновяване, ако изтича до 30 мин (без учител, докато таблетът не е отнет)
  async function refreshDevice(force) {
    const i = ident(); if (!i.dev || !i.dev.token) return false;
    if (!force && i.dev.exp && i.dev.exp - Date.now() > 30 * 60000) return true;
    const r = await post("device-register", {}, { "x-device-token": i.dev.token });
    const j = ident();
    if (r.status === 200 && r.data && r.data.token) { j.dev = Object.assign(j.dev, { token: r.data.token, exp: Date.now() + r.data.expires_in * 1000, needs_teacher: false }); writeIdent(j); return true; }
    if (r.status === 401) { j.dev.needs_teacher = true; writeIdent(j); }
    return false;
  }
  // регистрация от учителя (teacher-device.html): вход в Supabase Auth → device-register → токен за групата
  async function registerDevice(email, password, group) {
    await ready; if (!CFG) throw new Error("няма настройка на базата");
    const lr = await fetch(`${CFG.url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: CFG.anon_key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const lj = await lr.json().catch(() => ({})); if (!lr.ok || !lj.access_token) throw new Error("грешен вход");
    const i = ident();
    const r = await post("device-register", { group_code: group, device_id: i.dev && i.dev.id, label: navigator.userAgent.slice(0, 60) }, { Authorization: `Bearer ${lj.access_token}` });
    if (r.status !== 200 || !r.data || !r.data.token) throw new Error(r.status === 403 ? "групата не е от вашия център" : "неуспешна регистрация");
    const j = ident(); j.dev = { id: r.data.device_id, group: group, token: r.data.token, exp: Date.now() + r.data.expires_in * 1000, needs_teacher: false }; writeIdent(j);
    q2queued(); flush(); return { device_id: r.data.device_id, group };
  }
  // след нов токен: чакащите заради удостоверяване/права отново се опитват
  function q2queued() { getQ().forEach(x => { if (x.state === "blocked" && /^(forbidden|no_auth|unauthorized)$/.test(x.reason || "")) { x.state = "queued"; delete x.reason; saveItem(x); } }); }

  function backoff() { const s = state(), n = Math.min((s.fails || 0) + 1, 8); setState({ fails: n, next_at: Date.now() + Math.min(5000 * 2 ** n, 10 * 60000) }); }
  async function flush(opts) {
    const force = opts && opts.force;
    if (busy) return; await ready; if (!CFG || !navigator.onLine) return;
    if (!force && (state().next_at || 0) > Date.now()) return;
    busy = true;
    try {
      if (ident().dev) await refreshDevice(false).catch(() => {});
      // групи по удостоверяване: таблетът – всичко наведнъж; домашните – по дете
      const tried = new Set();   // всяко събитие – най-много веднъж на изпращане (неуспешните чакат следващото)
      for (let guard = 0; guard < 40; guard++) {
        const q = getQ().filter(x => x.state === "queued" && !tried.has(x.ev.event_key)); if (!q.length) break;
        const groups = {}; q.forEach(x => { const a = authFor(x.ev.child_code); const k = a ? a.key : "none"; (groups[k] = groups[k] || { a, items: [] }).items.push(x); });
        let progressed = false;
        for (const [k, g] of Object.entries(groups)) {
          if (!g.a) { setState({ waiting_auth: g.items.length }); continue; }   // няма токен – чака регистрация/линк
          const part = g.items.slice(0, batch), keys = new Set(part.map(x => x.ev.event_key));
          part.forEach(x => tried.add(x.ev.event_key));
          const r = await post("ingest", { events: part.map(x => x.ev) }, g.a.h);   // мрежова грешка/таймаут → catch отвън, нищо не се маха
          if (r.status === 401) {
            if (g.a.kind === "device") { if (!(await refreshDevice(true))) continue; keys.forEach(k => tried.delete(k)); progressed = true; continue; }
            const j = ident(); j.hwt_bad = Object.assign(j.hwt_bad || {}, { [g.a.h["x-homework-token"]]: true }); writeIdent(j); continue;
          }
          if (r.status === 413 && batch > 1) { batch = Math.max(1, Math.floor(batch / 2)); keys.forEach(k => tried.delete(k)); progressed = true; continue; }
          if (r.status !== 200 || !r.data || !Array.isArray(r.data.results)) { backoff(); return; }   // 429 / 5xx – по-късно
          const byKey = {}; r.data.results.forEach(x => { if (x && x.event_key) byKey[x.event_key] = x; });
          const cur = getQ();
          let rejectedItems = state().items_rejected || 0, invalidRounds = state().rounds_invalid || 0;
          cur.forEach(x => {
            if (!keys.has(x.ev.event_key)) return;                                // чуждо за тази заявка – не се пипа
            const res = byKey[x.ev.event_key];
            if (!res) return;                                                     // без отговор за него – остава, както е
            if (res.status === "processed" || res.status === "duplicate") { rejectedItems += res.items_rejected || 0; if (res.round_valid === false) invalidRounds++; return dropItem(x.ev.event_key); }   // потвърдено → излиза
            if (res.status === "failed") { x.tries = (x.tries || 0) + 1; if (x.tries >= MAX_TRIES) { x.state = "blocked"; x.reason = "failed"; } return saveItem(x); }
            x.state = "blocked"; x.reason = res.status; x.blocked_at = new Date().toISOString(); saveItem(x);   // conflict / forbidden / invalid_schema – за преглед
          });
          setState({ fails: 0, next_at: 0, last_ok: new Date().toISOString(), items_rejected: rejectedItems, rounds_invalid: invalidRounds, reviews: Array.isArray(r.data.reviews) ? r.data.reviews : (state().reviews || []),
                                  server_skew_ms: r.data.server_time ? Date.parse(r.data.server_time) - Date.now() : null });
          if (Array.isArray(r.data.progress)) {   // получени и валидни кръгове по занятие (от сървъра)
            const p2 = read(PGKEY) || {};
            r.data.progress.forEach(x => { (p2[x.child_code] = p2[x.child_code] || {})[x.lesson] = { received: x.received || [], valid: x.valid || [] }; });
            write(PGKEY, p2);
          }
          if (Array.isArray(r.data.choices)) {
            const w2 = read(CHKEY) || {};
            r.data.choices.forEach(c2 => { (w2[c2.child_code] = w2[c2.child_code] || {})[c2.rule_id] = { offered: c2.offered, chosen: c2.chosen }; });
            write(CHKEY, w2);
          }
          try { window.dispatchEvent(new CustomEvent("pilot-world")); } catch (e) {}
          if (Array.isArray(r.data.unlocks)) {
            const w = read(WKEY) || {};
            r.data.unlocks.forEach(u => { (w[u.child_code] = w[u.child_code] || {})[u.object_id] = { state: u.state || "confirmed", rule_version: u.rule_version }; });
            write(WKEY, w);
          }
          progressed = true;
        }
        if (!progressed) break;
      }
    } catch (e) { backoff(); } finally { busy = false; }
  }
  // заключване между отворени раздели (ако браузърът го поддържа): само един раздел праща наведнъж
  const flushLocked = o => navigator.locks && navigator.locks.request ? navigator.locks.request("platforma-sync", () => flush(o)) : flush(o);
  window.addEventListener("online", () => flushLocked({ force: true }));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") flushLocked(); });
  setInterval(flushLocked, 60000); ready.then(() => flushLocked());

  // видове блокирани: временни (повтарят се), чакащи права (минават сами след нов вход/линк), постоянни (изискват преглед – повторение не помага)
  const KIND = { failed: "temporary", forbidden: "auth", unauthorized: "auth", no_auth: "auth", conflict: "review", invalid_schema: "review", invalid_choice: "review" };
  const kindOf = x => KIND[x.reason] || "review";
  // повторен опит – само за временните грешки
  function retryBlocked() { getQ().forEach(x => { if (x.state === "blocked" && kindOf(x) === "temporary") { x.state = "queued"; x.tries = 0; delete x.reason; saveItem(x); } }); return flushLocked({ force: true }); }
  // нов линк за домашна за дете → неговите чакащи права събития се опитват пак
  (function requeueOnLink() { const i = read(IKEY) || {}; if (!/[?&#~]hwt[=_]/.test(location.search + location.hash) || !i.child) return;
    getQ().forEach(x => { if (x.state === "blocked" && kindOf(x) === "auth" && x.ev.child_code === i.child) { x.state = "queued"; delete x.reason; saveItem(x); } }); })();
  function status() {
    const i = ident(), q = getQ(), s = state();
    const by = {}, kinds = { temporary: 0, auth: 0, review: 0 };
    q.forEach(x => { const k = x.state === "blocked" ? "blocked:" + (x.reason || "?") : x.state; by[k] = (by[k] || 0) + 1; if (x.state === "blocked") kinds[kindOf(x)]++; });
    return { child: i.child || null, configured: !!CFG, unsaved: Object.keys(memQ).length, device: i.dev ? { id: i.dev.id, group: i.dev.group, exp: i.dev.exp, needs_teacher: !!i.dev.needs_teacher } : null,
             queued: q.filter(x => x.state === "queued").length, blocked: q.filter(x => x.state === "blocked").length, by, kinds, storage_full: !!s.storage_full,
             rounds_invalid: s.rounds_invalid || 0, reviews: s.reviews || [],
             last_ok: s.last_ok || null, next_at: s.next_at || 0, items_rejected: s.items_rejected || 0, confirmed_unlocks: read(WKEY) || {} };
  }
  window.PILOT_SYNC = { enqueue, flush: () => flushLocked({ force: true }), needsPick, pick, status, registerDevice, retryBlocked, ready, choose, worldState, childrenOnDevice };
})();
