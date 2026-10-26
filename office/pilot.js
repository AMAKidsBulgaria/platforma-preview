/* Офис – раздел „Пилот“: справки от реалните резултати на децата (js/sync.js → Supabase, tools/pilot_db/schema.sql).
   Източник на данни: ако config/pilot-db.json има url и anon_key – вход на учителя с линк по имейл (Supabase Auth) и четене
   на децата/групите/сесиите на неговия център (правата са в базата, RLS); иначе „демо“ от office/pilot-demo.json
   (tools/pilot_db/sample_sessions.py). В базата няма имена – офисът пази локално код → име (по център, на това устройство).
   Определенията на показателите са в tools/pilot_db/README.md. Всяка таблица се сваля като CSV. */
(function () {
  const AUTH_KEY = "platforma.pilot.auth.v1", NAMES_KEY = "platforma.pilot.names.v1", HWDEMO_KEY = "platforma.pilot.hw.demo.v1";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rd = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  // връщане от линка за вход: #access_token=…&refresh_token=… → пазим и отиваме на #pilot (преди рутера на офиса)
  (function captureAuth() {
    const h = location.hash || ""; if (!/access_token=/.test(h)) return;
    const p = new URLSearchParams(h.slice(1)); wr(AUTH_KEY, { access: p.get("access_token"), refresh: p.get("refresh_token"), exp: Date.now() + (Number(p.get("expires_in")) || 3600) * 1000 });
    history.replaceState(null, "", location.pathname + location.search + "#pilot");
  })();

  const S = { status: "idle", mode: null, err: null, cfg: null, hw: null, wt: null, mb: null, data: null, filter: { group: "", module: "" } };
  const pct = (k, n) => n ? Math.round(100 * k / n) : null;
  const P = v => v == null ? "—" : v + " %";
  const pill = v => v == null ? '<span class="pill m">—</span>' : `<span class="pill ${v >= 80 ? "g" : v >= 60 ? "w" : "b"}">${v} %</span>`;
  const modOf = lid => ({ BK: "Букварика", CH: "Читарика", MW: "Математика и околен свят" })[String(lid || "").slice(0, 2)] || "—";
  const ROLE_BG = { PRIMARY_MEASUREMENT: "основно измерване", SECONDARY_MEASUREMENT: "второ измерване", RETRIEVAL: "припомняне", TRANSFER: "пренос", PRACTICE: "упражнение", BASELINE: "начално" };

  // ---------- данни ----------
  async function getJSON(u) { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); }
  async function sb(path, opt = {}) {
    let a = rd(AUTH_KEY, null); if (!a) throw Object.assign(new Error("login"), { login: true });
    if (a.exp < Date.now() + 60000 && a.refresh) {
      const r = await fetch(`${S.cfg.url}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: S.cfg.anon_key, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: a.refresh }) });
      if (!r.ok) { localStorage.removeItem(AUTH_KEY); throw Object.assign(new Error("login"), { login: true }); }
      const j = await r.json(); a = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + j.expires_in * 1000 }; wr(AUTH_KEY, a);
    }
    const r = await fetch(`${S.cfg.url}/rest/v1/${path}`, Object.assign({ headers: Object.assign({ apikey: S.cfg.anon_key, Authorization: `Bearer ${a.access}` }, opt.headers || {}) }, opt));
    if (r.status === 401) { localStorage.removeItem(AUTH_KEY); throw Object.assign(new Error("login"), { login: true }); }
    if (!r.ok) throw new Error(`${path}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    return r;
  }
  async function sbAll(table, select, order) {   // странициране по 1000
    let out = [], from = 0;
    while (true) {
      const r = await sb(`${table}?select=${select}${order ? "&order=" + order : ""}`, { headers: { Range: `${from}-${from + 999}`, "Range-Unit": "items" } });
      const j = await r.json(); out = out.concat(j); if (j.length < 1000) break; from += 1000;
    }
    return out;
  }
  async function load() {
    if (S.status === "loading") return; S.status = "loading"; S.err = null;
    try {
      const [cfg, hw, wt, mb] = await Promise.all([getJSON("../config/pilot-db.json?v=" + Date.now()).catch(() => ({})), getJSON("../config/homework-map.json"), getJSON("../config/world-tasks.json"), getJSON("../config/math-banks.json")]);
      S.hw = hw; S.wt = wt; S.mb = mb.slots || {}; S.cfg = cfg && cfg.url && cfg.anon_key ? cfg : null;
      S.HW = {}; hw.lessons.forEach(l => l.rounds.forEach(r => r.assignments.forEach(a => { (S.HW[`${l.id}.${r.round}.${a.game}`] = S.HW[`${l.id}.${r.round}.${a.game}`] || []).push(Object.assign({ lesson: l.id, round: r.round }, a)); })));
      S.ITEM = {}; wt.items.forEach(x => S.ITEM[x.id] = x);
      if (S.cfg) {
        S.mode = "db";
        const [centers, groups, children, sessions] = await Promise.all([sbAll("centers", "code,name"), sbAll("groups_", "code,center_code,name"), sbAll("children", "code,group_code,active"),
          sbAll("sessions", "id,client_id,received_at,child_code,device_id,hw_id,lesson_id,round_id,game_id,game_name,started_at,seconds,total,answered,correct,accuracy,record,events", "started_at.asc")]);
        const homeworks = await sbAll("homework_assignments", "hw_id,child_code,lesson_id,assigned_at,revoked_at", "assigned_at.desc").catch(() => []);
        S.data = { centers, groups, children, sessions, homeworks, names: {} };
      } else { S.mode = "demo"; S.data = await getJSON("pilot-demo.json"); S.data.homeworks = rd(HWDEMO_KEY, []); }
      prepare(); S.status = "ready";
    } catch (e) { S.status = e.login ? "login" : "error"; S.err = e.login ? null : String(e.message || e); }
    if ((location.hash || "").startsWith("#pilot") && window.OFFICE_RENDER) window.OFFICE_RENDER();
  }
  // имена: локално, по код (демото носи примерни)
  const names = () => Object.assign({}, S.mode === "demo" ? S.data.names || {} : {}, rd(NAMES_KEY, {}));
  const nm = code => names()[code] ? `${esc(names()[code])} <span class="muted">${esc(code)}</span>` : esc(code);
  const nmPlain = code => names()[code] ? `${names()[code]} (${code})` : code;

  // всяка сесия → заданието от картата (роля, умение, обхват, правила за статус)
  function asg(s) {
    const list = S.HW[`${s.lesson_id}.${s.round_id}.${s.game_id}`] || []; if (list.length <= 1) return list[0] || null;
    const bank = (s.record || {}).content_bank_id; return list.find(a => a.content_bank_id === bank) || list[0];
  }
  function prepare() {
    const D = S.data; D.groupOf = {}; D.children.forEach(c => D.groupOf[c.code] = c.group_code);
    D.sessions.forEach(s => { s.a = asg(s); s.role = s.a ? s.a.coverage_role : null; s.module = String(s.lesson_id || "").slice(0, 2); (s.events || []).forEach(e => e._s = s); });
  }
  const sessionsF = () => S.data.sessions.filter(s => (!S.filter.group || S.data.groupOf[s.child_code] === S.filter.group) && (!S.filter.module || s.module === S.filter.module));
  const childrenF = () => S.data.children.filter(c => !S.filter.group || c.group_code === S.filter.group);
  const eventsF = () => sessionsF().flatMap(s => s.events || []);

  // ---------- таблици + CSV ----------
  let TABLES = [];
  function table(title, head, rows, opt = {}) {
    const i = TABLES.push({ title, head, rows: rows.map(r => r.map(c => (c && typeof c === "object" && "csv" in c) ? c.csv : String(c == null ? "" : c).replace(/<[^>]+>/g, ""))) }) - 1;
    const cell = c => (c && typeof c === "object" && "html" in c) ? c.html : c == null ? "" : c;
    return `<div class="panel"><div class="pilot-th"><h2>${esc(title)}</h2><button class="btn small ghost" data-csv="${i}">CSV</button></div>${opt.note ? `<p class="muted pilot-note">${opt.note}</p>` : ""}
      <div class="tbl"><table class="pilot-t"><tr>${head.map(h => `<th>${esc(h)}</th>`).join("")}</tr>${rows.map((r, k) => `<tr${opt.rowClass ? ` class="${opt.rowClass(k) || ""}"` : ""}>${r.map(c => `<td>${cell(c)}</td>`).join("")}</tr>`).join("") || `<tr><td class="muted" colspan="${head.length}">Няма данни</td></tr>`}</table></div></div>`;
  }
  function csv(i) {
    const t = TABLES[i]; if (!t) return; const q = v => /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const body = "﻿" + [t.head, ...t.rows].map(r => r.map(c => q(String(c))).join(",")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    a.download = `пилот – ${t.title}.csv`.replace(/[\\/:*?"<>|]/g, "-"); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const H = (num, den) => ({ html: den ? `${pill(pct(num, den))} <span class="muted">${num}/${den}</span>` : '<span class="muted">—</span>', csv: den ? `${pct(num, den)}% (${num}/${den})` : "" });

  // ---------- изгледи ----------
  const TABS = [["", "Преглед"], ["deca", "Деца"], ["izpalnenie", "Изпълнение"], ["umenia", "Умения"], ["svetat", "Светът около мен"], ["matematika", "Математика"], ["ab", "A/B наборите"], ["domashni", "Домашни"]];
  function head(tab) {
    const D = S.data, src = S.mode === "db" ? `<span class="pill g">база на пилота</span>` : `<span class="pill w">демо данни</span>`;
    return `<div class="head"><div><h1>Пилот</h1><p>${src} ${D.sessions.length} сесии от ${D.children.length} деца · справките са по първия опит; определенията са в tools/pilot_db/README.md</p></div>
      <div class="pilot-f"><label>Група <select id="pf-group"><option value="">всички</option>${D.groups.map(g => `<option value="${esc(g.code)}" ${S.filter.group === g.code ? "selected" : ""}>${esc(g.name)} · ${esc(g.code)}</option>`).join("")}</select></label>
      <label>Модул <select id="pf-mod"><option value="">всички</option>${[["BK", "Букварика"], ["CH", "Читарика"], ["MW", "Математика"]].map(([k, v]) => `<option value="${k}" ${S.filter.module === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      ${S.mode === "db" ? '<button class="btn small ghost" id="pf-reload">Обнови</button> <button class="btn small link" id="pf-logout">Изход</button>' : ""}</div></div>
      <div class="tabs pilot-tabs">${TABS.map(([k, v]) => `<button data-ptab="${k}" class="${k === tab ? "on" : ""}">${v}</button>`).join("")}</div>`;
  }
  function vLogin() {
    return `<div class="head"><div><h1>Пилот</h1><p>Вход за учители и офис: ще получиш линк по имейл.</p></div></div>
      <div class="panel" style="max-width:520px"><div class="form"><label>Имейл<input id="pl-mail" type="email" autocomplete="email" placeholder="учител@център.bg"></label>
      <button class="btn" id="pl-send">Изпрати линк за вход</button><p class="muted" id="pl-msg">Влизат само служители, добавени от централния офис (таблица staff).</p></div></div>`;
  }
  function vOverview() {
    const ss = sessionsF(), ev = ss.flatMap(s => s.events || []); const meas = ev.filter(e => e._s.role && e._s.role !== "PRACTICE");
    const by = {}; ss.forEach(s => { const b = by[s.child_code] = by[s.child_code] || { n: 0, last: "", dev: new Set(), lessons: new Set() }; b.n++; b.dev.add(s.device_id); b.lessons.add(s.lesson_id); if ((s.received_at || "") > b.last) b.last = s.received_at || ""; });
    const devs = {}; ss.forEach(s => { const d = devs[s.device_id] = devs[s.device_id] || { n: 0, kids: new Set(), last: "" }; d.n++; d.kids.add(s.child_code); if ((s.received_at || "") > d.last) d.last = s.received_at; });
    const local = { q: (rd("platforma.outbox.v1", []) || []).length, rej: rd("platforma.outbox.rejected.v1", []) || [] };
    const unmapped = ss.filter(s => !s.a).length;
    const f = d => d ? new Date(d).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
    return `<div class="cards"><div class="kpi"><div class="l">Сесии</div><div class="v">${ss.length}</div><div class="s">${ev.length} задачи</div></div>
      <div class="kpi"><div class="l">Измервателни задачи</div><div class="v">${meas.length}</div><div class="s">първи опит верен: ${P(pct(meas.filter(e => e.first_attempt_correct).length, meas.length))}</div></div>
      <div class="kpi ${unmapped ? "warn" : "good"}"><div class="l">Без задание в картата</div><div class="v">${unmapped}</div><div class="s">сесии от свободна игра или стара карта</div></div>
      <div class="kpi ${local.rej.length ? "bad" : ""}"><div class="l">На това устройство</div><div class="v">${local.q} / ${local.rej.length}</div><div class="s">в опашка / отказани от базата</div></div></div>
      ${table("Последно получено по дете", ["Дете", "Група", "Сесии", "Уроци", "Устройства", "Последно получено"], childrenF().map(c => { const b = by[c.code]; return [{ html: nm(c.code), csv: nmPlain(c.code) }, c.group_code, b ? b.n : 0, b ? b.lessons.size : 0, b ? [...b.dev].join(", ") : "—", { html: b ? f(b.last) : '<span class="pill b">няма данни</span>', csv: b ? b.last : "" }]; }),
        { note: "Дете без данни повече от 3 дни – провери таблета (връзка, код) или дали домашната е дадена." })}
      ${table("Устройства", ["Устройство", "Сесии", "Деца на устройството", "Последно получено"], Object.entries(devs).map(([d, v]) => [d, v.n, { html: [...v.kids].map(nm).join(", ") + (v.kids.size > 1 ? ' <span class="pill w">общ таблет</span>' : ""), csv: [...v.kids].join(" ") }, f(v.last)]),
        { note: "Общ таблет: отваря се линкът на групата (раздел „Деца“) – таблетът пита „Кой играе?“ преди всяко домашно." })}
      ${local.rej.length ? table("Отказани от базата (на това устройство)", ["Кога", "Код", "Урок", "Причина"], local.rej.map(r => [r.at, r.p && r.p.child_code, r.p && r.p.lesson_id, `${r.status} ${r.msg}`])) : ""}`;
  }
  // картинка на детето за „Кой играе?“ на общ таблет (децата не четат имена); пази се локално, по подразбиране – различна в групата
  const PICS_KEY = "platforma.pilot.pics.v1";
  const KID_PICS = ["lisitsa", "zaek", "mechka", "patitsa", "kotka", "kon", "krava", "ovtsa", "prase", "koza", "magare", "lav", "kuche", "balon", "hvarchilo", "topka",
                    "kolichka", "kukla", "konstruktor", "chasha", "shapka", "ranitsa", "plyusheno_meche", "telefon"];
  const PIC_BG = { lisitsa: "лисица", zaek: "заек", mechka: "мечка", patitsa: "патица", kotka: "котка", kon: "кон", krava: "крава", ovtsa: "овца", prase: "прасе",
                  koza: "коза", magare: "магаре", lav: "лъв", kuche: "куче", balon: "балон", hvarchilo: "хвърчило", topka: "топка", kolichka: "количка", kukla: "кукла",
                  konstruktor: "кубчета", chasha: "чаша", shapka: "шапка", ranitsa: "раница", plyusheno_meche: "мече", telefon: "телефон" };
  function kidPics() {
    const saved = rd(PICS_KEY, {}), out = {};
    const byGroup = {}; childrenF().forEach(c => (byGroup[c.group_code] = byGroup[c.group_code] || []).push(c));
    Object.values(byGroup).forEach(list => { const used = new Set(list.map(c => saved[c.code]).filter(Boolean)); let k = 0;
      list.forEach(c => { if (saved[c.code]) { out[c.code] = saved[c.code]; return; } while (used.has(KID_PICS[k % KID_PICS.length])) k++; out[c.code] = KID_PICS[k % KID_PICS.length]; used.add(out[c.code]); }); });
    return out;
  }
  function vChildren() {
    const base = new URL("../index.html", location.href).href, N = names(), P = kidPics();
    const groups = {}; childrenF().forEach(c => (groups[c.group_code] = groups[c.group_code] || []).push(c));
    const glink = list => base + "?pilotgroup=" + list.map(c => `${c.code}.${P[c.code]}`).join(",");
    const dup = Object.values(groups).some(list => new Set(list.map(c => P[c.code])).size !== list.length);
    const groupPanel = `<div class="panel"><h2>Общ таблет – линк на групата</h2><p class="muted pilot-note">Отваря се веднъж на таблета на групата. После при всяко домашно таблетът пита „Кой играе?“ и детето докосва своята картинка. Кажете на всяко дете коя е неговата картинка.${dup ? ' <span class="pill b">Две деца в група имат еднаква картинка – сменете едната.</span>' : ""}</p>
      <div class="tbl"><table class="pilot-t"><tr><th>Група</th><th>Деца</th><th>Линк за общия таблет</th></tr>${Object.entries(groups).map(([g, list]) => `<tr><td><b>${esc(g)}</b></td><td>${list.length}</td><td><input class="pilot-link" readonly value="${esc(glink(list))}"> <button class="btn small ghost" data-copy="${esc(glink(list))}">Копирай</button></td></tr>`).join("")}</table></div></div>`;
    return `<div class="panel"><h2>Кодове и имена</h2><p class="muted pilot-note">Имената се пазят само в този браузър (на устройството на центъра) – в базата има само кодове. Собствен таблет: личният линк се отваря веднъж, таблетът запомня кода. Общ таблет: линкът на групата (долу) – детето избира своята картинка при всяко домашно.</p>
      <div class="tbl"><table class="pilot-t"><tr><th>Код</th><th>Група</th><th>Име (локално)</th><th>Картинка за „Кой играе?“</th><th>Личен линк (собствен таблет)</th></tr>${childrenF().map(c => `<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.group_code)}</td><td><input class="pilot-name" data-code="${esc(c.code)}" value="${esc(N[c.code] || "")}" placeholder="име"></td><td class="pilot-kidpic"><img src="../assets/img/pics/${P[c.code]}.jpg" alt=""> <select class="pilot-pic" data-code="${esc(c.code)}">${KID_PICS.map(p => `<option value="${p}"${p === P[c.code] ? " selected" : ""}>${PIC_BG[p] || p}</option>`).join("")}</select></td><td><input class="pilot-link" readonly value="${esc(base + "?pilot=" + c.code)}"> <button class="btn small ghost" data-copy="${esc(base + "?pilot=" + c.code)}">Копирай</button></td></tr>`).join("")}</table></div>
      <p class="muted pilot-note">Изчистване на кода от таблет: <code>${esc(base)}?pilot=-</code>. Нови кодове и групи се добавят в базата (tools/pilot_db/README.md).</p></div>${groupPanel}`;
  }
  // a) изпълнение
  function vDone() {
    const ss = sessionsF(), kids = childrenF(); const lessons = [...new Set(S.hw.lessons.map(l => l.id))].filter(l => ss.some(s => s.lesson_id === l));
    const cellOf = (c, l) => { const xs = ss.filter(s => s.child_code === c && s.lesson_id === l); const L = S.hw.lessons.find(x => x.id === l); const need = L.rounds.length; const done = new Set(xs.map(s => s.round_id)).size;
      const ev = xs.filter(s => s.role && s.role !== "PRACTICE").flatMap(s => s.events || []); const p = pct(ev.filter(e => e.first_attempt_correct).length, ev.length);
      return { html: xs.length ? `<span class="${done >= need ? "" : "warn"}">${done}/${need}</span> ${pill(p)}` : '<span class="muted">—</span>', csv: xs.length ? `${done}/${need} ${p == null ? "" : p + "%"}` : "" }; };
    const detail = [];
    kids.forEach(c => ss.filter(s => s.child_code === c.code).forEach(s => { const ev = s.events || []; detail.push([{ html: nm(c.code), csv: nmPlain(c.code) }, s.lesson_id, "Р" + s.round_id, s.a ? (s.a.title || s.game_id) : s.game_id, ROLE_BG[s.role] || "без задание", (s.a && s.a.scope) || "основа", ev.length, H(ev.filter(e => e.first_attempt_correct).length, ev.length), (s.started_at || "").slice(0, 16).replace("T", " ")]); }));
    return table("Изпълнение по урок", ["Дете", ...lessons], kids.map(c => [{ html: nm(c.code), csv: nmPlain(c.code) }, ...lessons.map(l => cellOf(c.code, l))]),
        { note: "Клетка: изиграни рундове / рундове в урока и верен първи опит в измервателните рундове (без упражнението, Р2)." })
      + table("Всички рундове", ["Дете", "Урок", "Рунд", "Игра", "Роля", "Обхват", "Задачи", "Верен първи опит", "Кога"], detail);
  }
  // b) умения
  function vSkills() {
    const ss = sessionsF(), kids = childrenF(); const rows = [], prof = [];
    kids.forEach(c => {
      const by = {};
      ss.filter(s => s.child_code === c.code && s.a).forEach(s => {
        const a = s.a, ev = s.events || [];
        if (a.profile_only) { ev.forEach(e => prof.push([{ html: nm(c.code), csv: nmPlain(c.code) }, e.theme || "", e.bank_item || "", e.primary_correct ? "да" : "не", e.reason_correct ? "да" : "не"])); return; }
        if (s.lesson_id === "MW31" || a.coverage_role === "PRACTICE") return;   // Ч31 – репетиция без статус; упражнението не се брои
        const sk = a.item_primary_skill || "—", k = by[sk] = by[sk] || { prim: [0, 0], sup: [0, 0], acc: [0, 0], ext: [0, 0], obs: false, lessons: new Set() };
        const dec = ev.reduce((t, e) => [t[0] + (e.correct_scored_decisions != null ? e.correct_scored_decisions : e.first_attempt_correct ? 1 : 0), t[1] + (e.scored_decision_count || 1)], [0, 0]);
        const add = (b) => { b[0] += dec[0]; b[1] += dec[1]; };
        if (a.scope === "extension") add(k.ext);
        else if (a.status_rule === "accumulate_only") add(k.acc);
        else if (a.coverage_role === "PRIMARY_MEASUREMENT" || (a.is_diagnostic && a.coverage_role !== "SECONDARY_MEASUREMENT")) add(k.prim);
        else add(k.sup);
        if (a.status_source === "combined") k.obs = true; k.lessons.add(s.lesson_id);
      });
      Object.entries(by).sort().forEach(([sk, k]) => rows.push([{ html: nm(c.code), csv: nmPlain(c.code) }, sk, [...k.lessons].join(" "), H(...k.prim), H(...k.sup), H(...k.acc), H(...k.ext), k.obs ? { html: '<span class="pill w">нужно OBS</span>', csv: "нужно OBS" } : ""]));
    });
    return table("Умения по дете", ["Дете", "Умение", "Уроци", "Основно измерване", "Поддържащо (припомняне, пренос)", "Само натрупване (Ч12)", "Надграждане (отделно)", "Наблюдение"], rows,
        { note: "Решения с верен първи опит / всички решения. Упражнението и Ч31 не се броят; надграждането (11–20, субитизация, знаците, текстови задачи) е отделно и не понижава основата; Ч12 М3/М4 само натрупват. <b>Праговете за статус („овладяно / в процес“) още не са заключени</b> – справката показва суровите стойности; статусът се решава от методиста." })
      + table("Ч32 – профил „Светът около мен“ (без статус по S1–S6)", ["Дете", "Карта", "Задача", "Избор верен", "Обяснение вярно"], prof);
  }
  // c) Светът около мен
  function vWorld() {
    const ev = eventsF().filter(e => e.game_template_id === "sorting" || e.primary_correct != null); const meas = ev.filter(e => e._s.role !== "PRACTICE");
    const kids = childrenF().map(c => { const x = meas.filter(e => e._s.child_code === c.code); const wrongR = x.filter(e => !e.reason_correct);
      return [{ html: nm(c.code), csv: nmPlain(c.code) }, x.length, H(x.filter(e => e.primary_correct).length, x.length), H(x.filter(e => e.reason_correct).length, x.length), H(x.filter(e => e.primary_correct && e.reason_correct).length, x.length), x.filter(e => e.accepted_alt).length, wrongR.filter(e => ["misconception", "reversed", "criterion_switch", "partial"].includes(e.reason_distractor_type)).length + " / " + wrongR.length]; });
    const dt = {}; meas.filter(e => !e.reason_correct && e.reason_distractor_type).forEach(e => dt[e.reason_distractor_type] = (dt[e.reason_distractor_type] || 0) + 1);
    const grp = key => { const g = {}; meas.forEach(e => { const k = e[key] || "—"; const b = g[k] = g[k] || [0, 0, 0]; b[0]++; b[1] += e.primary_correct ? 1 : 0; b[2] += e.reason_correct ? 1 : 0; }); return Object.entries(g).map(([k, b]) => [k, b[0], H(b[1], b[0]), H(b[2], b[0])]); };
    const it = {}; ev.forEach(e => { if (!e.bank_item) return; const b = it[e.bank_item] = it[e.bank_item] || { n: 0, p1: 0, p2: 0, alt: 0, dt: {} }; b.n++; b.p1 += e.primary_correct ? 1 : 0; b.p2 += e.reason_correct ? 1 : 0; b.alt += e.accepted_alt ? 1 : 0; if (!e.reason_correct && e.reason_distractor_type) b.dt[e.reason_distractor_type] = (b.dt[e.reason_distractor_type] || 0) + 1; });
    const items = Object.entries(it).map(([id, b]) => { const x = S.ITEM[id] || {}; return { id, x, b, fl: (x.pilot_flags || []).join(", ") }; }).sort((a, b) => (!!b.fl - !!a.fl) || (a.b.p1 + a.b.p2) / a.b.n - (b.b.p1 + b.b.p2) / b.b.n);
    return table("По дете (измерване, без упражнението)", ["Дете", "Задачи", "Стъпка 1 – избор", "Стъпка 2 – обяснение", "И двете", "Приет друг отговор", "Правдоподобни грешки / грешни обяснения"], kids,
        { note: "Двете решения се броят поотделно. „Приет друг отговор“ (accepted_alt) се брои за верен, но се показва. Правдоподобна грешка = непълна, обърната, заблуда, друг признак." })
      + table("Видове грешни обяснения", ["Вид (reason_distractor_type)", "Брой"], Object.entries(dt).sort((a, b) => b[1] - a[1]))
      + table("По вид втора стъпка (step2_type)", ["Вид", "Задачи", "Стъпка 1", "Стъпка 2"], grp("step2_type"))
      + table("По зависимост от картинката (image_dependency)", ["Вид", "Задачи", "Стъпка 1", "Стъпка 2"], grp("image_dependency"))
      + table("Трудност по задача (за методиста)", ["Задача", "Урок", "Набор", "Текст", "Опити", "Стъпка 1", "Стъпка 2", "Приет друг", "Грешни обяснения по вид", "Флагове"],
        items.map(({ id, x, b, fl }) => [id, x.lesson || "", x.set || "", esc(x.label || ""), b.n, H(b.p1, b.n), H(b.p2, b.n), b.alt, Object.entries(b.dt).map(([k, v]) => `${k} ${v}`).join(", "), fl ? { html: `<span class="pill w">${esc(fl)}</span>`, csv: fl } : ""]),
        { note: "Отгоре са задачите с флаг за пилота (pilot_watch, възможно двусмислие, нов механизъм, нова дума, чувствителна картинка), подредени от най-трудната.", rowClass: k => items[k].fl ? "pilot-flag" : "" });
  }
  // d) математика – новите полета
  function vMath() {
    const ev = eventsF().filter(e => String(e.lesson_id || "").startsWith("MW") && e._s.role !== "PRACTICE");
    const kidsRow = f => childrenF().map(c => [{ html: nm(c.code), csv: nmPlain(c.code) }, ...f(ev.filter(e => e._s.child_code === c.code))]);
    const gd = ev.filter(e => e.command_results);
    const cmd = x => { const r = x.flatMap(e => e.command_results); return [x.length, H(r.filter(q => q.first_attempt_correct).length, r.length), H(x.filter(e => e.drawing_completed_without_help).length, x.length)]; };
    const dist = (xs, key) => { const d = {}; xs.forEach(v => { const k = key(v); if (k) d[k] = (d[k] || 0) + 1; }); return Object.entries(d).sort((a, b) => b[1] - a[1]); };
    const errT = dist(gd.flatMap(e => e.command_results).filter(q => !q.first_attempt_correct), q => q.error_type);
    const bs = ev.filter(e => e.task_mode === "compare_diff"), sc = ev.filter(e => e.size_weight_conflict != null), ln = ev.filter(e => e.game_template_id === "lines" || e.game_template_id === "shapes");
    // повторен факт: от събитието или от банката (слот/игра → набор → позиция)
    const isRep = e => e.repeat_fact != null ? !!e.repeat_fact : (() => { const d = S.mb[`${e.bank_slot}/${e.game_template_id}`]; const u = d && d.sets && d.sets[e.item_set] && d.sets[e.item_set][e.item_id]; return !!(u && u.repeat_fact); })();
    const rf = ev.filter(e => e.bank_slot && ["brainCrush", "numberComposition", "numberLine", "cobweb", "intellectScales", "order"].includes(e.game_template_id));
    const two = (lab, a, b) => [[lab[0], a.length, H(a.filter(e => e.first_attempt_correct).length, a.length)], [lab[1], b.length, H(b.filter(e => e.first_attempt_correct).length, b.length)]];
    return table("Графична диктовка – по дете", ["Дете", "Рисунки", "Команди с верен първи опит (command_accuracy)", "Рисунки без помощ (допълнителен показател)"], kidsRow(x => cmd(x.filter(e => e.command_results))),
        { note: "Статусът се смята по командите (първи опит); рисунката без помощ не участва в статуса." })
      + table("Графична диктовка – видове грешки (първи опит)", ["Вид (error_type)", "Брой"], errT)
      + table("„С колко?“ (Ч17 Р3) – видове грешки", ["Вид", "Брой"], [["задачи", bs.length], ["верни", bs.filter(e => e.first_attempt_correct).length], ...dist(bs.filter(e => !e.first_attempt_correct), e => e.error_type)],
        { note: "chooses_larger_quantity_instead_of_difference – детето дава броя на по-дългата редица вместо разликата." })
      + table("Везни „лек/тежък“ – конфликтни двойки", ["Двойки", "Задачи", "Верен първи опит"], two(["конфликтни (по-голямото е по-лекото)", "останалите"], sc.filter(e => e.size_weight_conflict), sc.filter(e => !e.size_weight_conflict)),
        { note: "Ако конфликтните са много по-ниско – заблудата „по-голямо = по-тежко“." })
      + table("Линии, мерене и фигури – видове грешки", ["Режим", "Вид (error_type)", "Брой"], dist(ln.filter(e => !e.first_attempt_correct), e => `${e.mode_id || e.game_template_id}|${e.error_type || "—"}`).map(([k, v]) => [...k.split("|"), v]))
      + table("Повторени факти (repeat_fact) срещу нови", ["Задачи", "Брой", "Верен първи опит"], two(["повторен факт с нов стимул", "нов факт"], rf.filter(isRep), rf.filter(e => !isRep(e))));
  }
  // e) A/B
  function vAB() {
    const g = {}; eventsF().forEach(e => { if (!e.bank_slot || !["A", "B"].includes(e.item_set)) return; const k = `${e.bank_slot} · ${e.game_template_id}`; const b = g[k] = g[k] || { A: [0, 0], B: [0, 0], kA: new Set(), kB: new Set() }; b[e.item_set][1]++; if (e.first_attempt_correct) b[e.item_set][0]++; b["k" + e.item_set].add(e._s.child_code); });
    const rows = Object.entries(g).sort().map(([k, b]) => { const a = pct(...b.A), bb = pct(...b.B), d = a != null && bb != null ? a - bb : null; const flag = d != null && Math.abs(d) >= 15 && b.A[1] >= 10 && b.B[1] >= 10;
      return [k, b.kA.size + " / " + b.kB.size, H(...b.A), H(...b.B), { html: d == null ? "—" : `<span class="${flag ? "warn" : ""}">${d > 0 ? "+" : ""}${d}</span>`, csv: d == null ? "" : d }, flag ? { html: '<span class="pill w">провери</span>', csv: "провери" } : ""]; });
    return table("A/B по слот (първи опит)", ["Слот · игра", "Деца A / B", "Набор A", "Набор B", "Разлика A−B (точки)", ""], rows,
      { note: "Всяко дете получава един от наборите, затова разликата смесва трудността на набора с това кои деца са го получили. „Провери“: разлика поне 15 точки при поне 10 задачи във всеки набор – гледа се заедно с общата успеваемост на децата в A и в B; при малко деца разликите са шум." });
  }

  // f) домашни: учителят възлага занятие на децата от групата; таблетът го получава от сървъра („Моят свят“ → „Продължи“)
  //    правило на таблета (26.10.2026): първо най-новото възложено незавършено – детето остава с групата; по-старите – „Доиграй“, по желание; оттеглено домашно изчезва от таблета при следващата връзка
  const MODN = { BK: "Букварика", CH: "Читарика", MW: "Математика и околен свят" };
  function vHomework() {
    const kids = childrenF(), groups = [...new Set(kids.map(c => c.group_code))].sort(), g = S.hwGroup && groups.includes(S.hwGroup) ? S.hwGroup : groups[0];
    const inG = kids.filter(c => c.group_code === g), ss = S.data.sessions || [], hws = (S.data.homeworks || []).filter(h => kids.some(c => c.code === h.child_code));
    const need = l => { const L = S.hw.lessons.find(x => x.id === l); return L ? L.rounds.length : 4; };
    const doneR = (c, l) => new Set(ss.filter(x => x.child_code === c && x.lesson_id === l).map(x => x.round_id)).size;
    const opts = Object.entries(MODN).map(([k, v]) => `<optgroup label="${v}">${S.hw.lessons.filter(l => l.id.startsWith(k)).map(l => `<option value="${l.id}" ${S.hwLesson === l.id ? "selected" : ""}>${l.id} · ${esc(l.title)}</option>`).join("")}</optgroup>`).join("");
    const open = hws.filter(h => !h.revoked_at);
    const form = `<div class="panel"><h2>Възложи домашно</h2><p class="muted pilot-note">Домашното е едно занятие (всичките му кръгове). Таблетът на детето показва „Продължи“ към следващия незавършен кръг; при няколко незавършени – първо най-новото (детето остава с групата); по-старите остават отворени по желание. ${S.mode === "db" ? "" : '<span class="pill w">демо – записва се само в този браузър</span>'}</p>
      <div class="form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end"><label>Група <select id="hw-g">${groups.map(x => `<option ${x === g ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>
      <label>Занятие <select id="hw-l">${opts}</select></label><button class="btn" id="hw-assign">Възложи</button></div>
      <div class="pilot-kids" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">${inG.map(c => `<label class="pill" style="cursor:pointer"><input type="checkbox" data-hwkid="${esc(c.code)}" checked> ${nm(c.code)}</label>`).join("")}</div><p class="muted" id="hw-msg"></p></div>`;
    return form + table("Възложени домашни", ["Дете", "Занятие", "Възложено", "Изпълнени кръгове", ""], hws.map(h => { const d = doneR(h.child_code, h.lesson_id), n = need(h.lesson_id);
      return [{ html: nm(h.child_code), csv: nmPlain(h.child_code) }, h.lesson_id, new Date(h.assigned_at).toLocaleDateString("bg-BG"), { html: h.revoked_at ? '<span class="muted">оттеглено</span>' : `<span class="${d >= n ? "" : "warn"}">${d}/${n}</span>`, csv: `${d}/${n}` },
        { html: h.revoked_at ? "" : `<button class="btn small ghost" data-hwrevoke="${esc(h.hw_id)}">Оттегли</button>`, csv: "" }]; }),
      { note: `Отворени: ${open.length}. „Оттегли“ не трие нищо – домашното спира да се показва на таблета; изиграните кръгове остават.` });
  }
  async function hwAssign(lesson, codes) {
    const at = new Date().toISOString(), rows = codes.map(c => ({ hw_id: `hw-${lesson}-${c}-${Date.now().toString(36)}`, child_code: c, lesson_id: lesson }));
    if (S.mode === "db") await sb("homework_assignments", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(rows) });
    else wr(HWDEMO_KEY, rows.map(r => Object.assign({ assigned_at: at, revoked_at: null }, r)).concat(rd(HWDEMO_KEY, [])));
    rows.forEach(r => S.data.homeworks.unshift(Object.assign({ assigned_at: at, revoked_at: null }, r)));
  }
  async function hwRevoke(id) {
    const at = new Date().toISOString();
    if (S.mode === "db") await sb(`homework_assignments?hw_id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: at }) });
    else wr(HWDEMO_KEY, rd(HWDEMO_KEY, []).map(h => h.hw_id === id ? Object.assign(h, { revoked_at: at }) : h));
    S.data.homeworks.forEach(h => { if (h.hw_id === id) h.revoked_at = at; });
  }
  function view(tab) {
    TABLES = [];
    if (S.status === "idle" || S.status === "loading") { if (S.status === "idle") setTimeout(load, 0); return `<div class="head"><div><h1>Пилот</h1><p>Зареждане…</p></div></div>`; }
    if (S.status === "login") return vLogin();
    if (S.status === "error") return `<div class="head"><div><h1>Пилот</h1></div></div><div class="panel"><p class="warn">Данните не се заредиха: ${esc(S.err)}</p><button class="btn small" id="pf-retry">Опитай пак</button></div>`;
    tab = tab || "";
    const body = { "": vOverview, deca: vChildren, izpalnenie: vDone, umenia: vSkills, svetat: vWorld, matematika: vMath, ab: vAB, domashni: vHomework }[tab] || vOverview;
    return head(tab) + body();
  }
  function wire() {
    const $ = s => document.querySelector(s);
    document.querySelectorAll("[data-ptab]").forEach(b => b.addEventListener("click", () => location.hash = "#pilot" + (b.dataset.ptab ? "/" + b.dataset.ptab : "")));
    document.querySelectorAll("[data-csv]").forEach(b => b.addEventListener("click", () => csv(Number(b.dataset.csv))));
    const fg = $("#pf-group"); if (fg) fg.addEventListener("change", () => { S.filter.group = fg.value; window.OFFICE_RENDER(); });
    const fm = $("#pf-mod"); if (fm) fm.addEventListener("change", () => { S.filter.module = fm.value; window.OFFICE_RENDER(); });
    const rl = $("#pf-reload"); if (rl) rl.addEventListener("click", () => { S.status = "idle"; window.OFFICE_RENDER(); });
    const hg = $("#hw-g"); if (hg) hg.addEventListener("change", () => { S.hwGroup = hg.value; window.OFFICE_RENDER(); });
    const hl = $("#hw-l"); if (hl) hl.addEventListener("change", () => { S.hwLesson = hl.value; });
    const ha = $("#hw-assign"); if (ha) ha.addEventListener("click", async () => {
      const l = $("#hw-l").value, codes = [...document.querySelectorAll("[data-hwkid]")].filter(i => i.checked).map(i => i.dataset.hwkid), msg = $("#hw-msg");
      if (!codes.length) { msg.textContent = "Избери поне едно дете."; return; }
      const dup = codes.filter(c => (S.data.homeworks || []).some(h => h.child_code === c && h.lesson_id === l && !h.revoked_at));
      if (dup.length && !ha.dataset.sure) { ha.dataset.sure = "1"; msg.textContent = `${dup.length} деца вече имат ${l}. Натисни „Възложи“ още веднъж, за да го възложиш пак.`; return; }
      ha.disabled = true; try { await hwAssign(l, codes); S.hwLesson = l; window.OFFICE_RENDER(); } catch (e) { ha.disabled = false; msg.textContent = "Не се записа: " + e.message; }
    });
    document.querySelectorAll("[data-hwrevoke]").forEach(b => b.addEventListener("click", async () => { b.disabled = true; try { await hwRevoke(b.dataset.hwrevoke); window.OFFICE_RENDER(); } catch (e) { b.disabled = false; b.textContent = "Грешка"; } }));
    const rt = $("#pf-retry"); if (rt) rt.addEventListener("click", () => { S.status = "idle"; window.OFFICE_RENDER(); });
    const lo = $("#pf-logout"); if (lo) lo.addEventListener("click", () => { localStorage.removeItem(AUTH_KEY); S.status = "login"; window.OFFICE_RENDER(); });
    document.querySelectorAll(".pilot-pic").forEach(i => i.addEventListener("change", () => { const p = rd(PICS_KEY, {}); p[i.dataset.code] = i.value; wr(PICS_KEY, p); window.OFFICE_RENDER(); }));
    document.querySelectorAll(".pilot-name").forEach(i => i.addEventListener("change", () => { const n = rd(NAMES_KEY, {}); if (i.value.trim()) n[i.dataset.code] = i.value.trim(); else delete n[i.dataset.code]; wr(NAMES_KEY, n); }));
    document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", () => { const t = b.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { b.textContent = "Копирано"; }).catch(() => { const i = b.previousElementSibling; i.select(); }); }));
    const send = $("#pl-send"); if (send) send.addEventListener("click", async () => {
      const mail = $("#pl-mail").value.trim(), msg = $("#pl-msg"); if (!/@/.test(mail)) { msg.textContent = "Въведи имейл."; return; }
      const r = await fetch(`${S.cfg.url}/auth/v1/otp?redirect_to=${encodeURIComponent(location.href.split("#")[0])}`, { method: "POST", headers: { apikey: S.cfg.anon_key, "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, create_user: false }) }).catch(() => null);
      msg.textContent = r && r.ok ? "Изпратен е линк за вход – отвори имейла на това устройство." : "Не се изпрати. Провери имейла или дали си добавен като служител.";
    });
  }
  window.PILOT_OFFICE = { view, wire, reload: () => { S.status = "idle"; } };
})();
