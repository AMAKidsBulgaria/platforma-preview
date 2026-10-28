/* Английски език – „Реката на Ото“ (Ниво 0, 5–6 г.). Прототип на зона 1.
   Един източник: config/english-l0.json (занятие → думи → фрази → кръгове); гласовете: config/english-audio.json.
   Напредък (решения 26.10.2026):
     • живият пристан (27.10.2026): всеки кръг дорисува в самата картина нещо по темата на занятието (config/english-pier.json);
     • 5-ият кръг на занятието е голямото събитие (Поли пристига, Bubbles, рожден ден…); всичко ново говори при докосване;
     • след 6-те занятия – печат на приятеля, страница в „Албумът на Ото“ и лодката тръгва към следващия пристан.
   Без сърца, таймери, точки и сравнение с други деца. Грешката показва верния отговор и детето опитва още веднъж.
   Похвалата казва само това, което е проверено: докосване → „That's the boat!“; говоренето не се оценява (записът остава на таблета). */
(function () {
  "use strict";
  // връзка с платформата (офиса): пилотното дете идва от js/sync.js (?pilot=… или „Кой играе?“ на общ таблет);
  // напредъкът е отделен за всяко дете на устройството; без пилотно дете – демо ключът
  const PS = window.PILOT_SYNC || null, CHILD = PS && PS.status().child;
  const KEY = CHILD ? "platforma.en.v1." + CHILD : "platforma.en.v1", IMG = "assets/img/english/", AUD = "assets/audio/english/";
  const app = document.getElementById("en-app");
  const Q = new URLSearchParams(location.search);
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } };
  const wr = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  if (Q.get("reset") === "1") { try { localStorage.removeItem(KEY); } catch (e) {} }
  if (Q.get("class")) { const p = rd(); p.classAt = +Q.get("class"); wr(p); }
  // общ таблет без сървър (проба): „занятието е проведено“ важи за всички деца на таблета – ?enclass=N от страницата за пробата
  const GKEY = "platforma.en.group.v1";
  if (Q.get("enclass")) try { localStorage.setItem(GKEY, String(Math.max(1, +Q.get("enclass") || 1))); } catch (e) {}
  const ROSTER = !!(PS && PS.needsPick());
  // демо сценарии (за преглед): ?scenario=missed – проведени 3 занятия, домашното на занятие 1 е готово, на 2 – наполовина, на 3 – незапочнато
  const SCEN = { missed: { classAt: 3, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1] }, stickers: { 1: 7 }, learned: { hello: ["2026-10-20", "2026-10-22"], river: ["2026-10-22"] } },
    fresh: { classAt: 1, done: {}, stickers: {}, learned: {} },
    z2: { classAt: 8, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1] }, stickers: { 1: 30, 2: 7 }, learned: {}, album: { 1: "2026-10-27" } },
    z2start: { classAt: 7, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4] }, stickers: { 1: 30 }, learned: {}, album: { 1: "2026-10-27" } },
    z3: { classAt: 13, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30 }, learned: {}, album: { 1: "2026-10-27", 2: "2026-10-27" } },
    z4: { classAt: 19, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30 }, learned: {}, album: { 1: "2026-10-27", 2: "2026-10-27", 3: "2026-10-27" } },
    z5: { classAt: 25, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4], EN0401: [0, 1, 2, 3, 4], EN0402: [0, 1, 2, 3, 4], EN0403: [0, 1, 2, 3, 4], EN0404: [0, 1, 2, 3, 4], EN0405: [0, 1, 2, 3, 4], EN0406: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30, 4: 30 }, learned: {}, album: { 1: "2026-10-27", 2: "2026-10-27", 3: "2026-10-27", 4: "2026-10-27" } },
    z6: { classAt: 31, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4], EN0401: [0, 1, 2, 3, 4], EN0402: [0, 1, 2, 3, 4], EN0403: [0, 1, 2, 3, 4], EN0404: [0, 1, 2, 3, 4], EN0405: [0, 1, 2, 3, 4], EN0406: [0, 1, 2, 3, 4], EN0501: [0, 1, 2, 3, 4], EN0502: [0, 1, 2, 3, 4], EN0503: [0, 1, 2, 3, 4], EN0504: [0, 1, 2, 3, 4], EN0505: [0, 1, 2, 3, 4], EN0506: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30 }, learned: {}, album: { 1: "2026-10-27", 2: "2026-10-27", 3: "2026-10-27", 4: "2026-10-27", 5: "2026-10-27" } },
    z7: { classAt: 37, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4], EN0401: [0, 1, 2, 3, 4], EN0402: [0, 1, 2, 3, 4], EN0403: [0, 1, 2, 3, 4], EN0404: [0, 1, 2, 3, 4], EN0405: [0, 1, 2, 3, 4], EN0406: [0, 1, 2, 3, 4], EN0501: [0, 1, 2, 3, 4], EN0502: [0, 1, 2, 3, 4], EN0503: [0, 1, 2, 3, 4], EN0504: [0, 1, 2, 3, 4], EN0505: [0, 1, 2, 3, 4], EN0506: [0, 1, 2, 3, 4], EN0601: [0, 1, 2, 3, 4], EN0602: [0, 1, 2, 3, 4], EN0603: [0, 1, 2, 3, 4], EN0604: [0, 1, 2, 3, 4], EN0605: [0, 1, 2, 3, 4], EN0606: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30 }, learned: {}, album: { 1: "2026-10-27", 2: "2026-10-27", 3: "2026-10-27", 4: "2026-10-27", 5: "2026-10-27", 6: "2026-10-27" } },
    z8: { classAt: 43, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4], EN0401: [0, 1, 2, 3, 4], EN0402: [0, 1, 2, 3, 4], EN0403: [0, 1, 2, 3, 4], EN0404: [0, 1, 2, 3, 4], EN0405: [0, 1, 2, 3, 4], EN0406: [0, 1, 2, 3, 4], EN0501: [0, 1, 2, 3, 4], EN0502: [0, 1, 2, 3, 4], EN0503: [0, 1, 2, 3, 4], EN0504: [0, 1, 2, 3, 4], EN0505: [0, 1, 2, 3, 4], EN0506: [0, 1, 2, 3, 4], EN0601: [0, 1, 2, 3, 4], EN0602: [0, 1, 2, 3, 4], EN0603: [0, 1, 2, 3, 4], EN0604: [0, 1, 2, 3, 4], EN0605: [0, 1, 2, 3, 4], EN0606: [0, 1, 2, 3, 4], EN0701: [0, 1, 2, 3, 4], EN0702: [0, 1, 2, 3, 4], EN0703: [0, 1, 2, 3, 4], EN0704: [0, 1, 2, 3, 4], EN0705: [0, 1, 2, 3, 4], EN0706: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30, 7: 30 }, learned: {}, album: { 1: "2026-10-28", 2: "2026-10-28", 3: "2026-10-28", 4: "2026-10-28", 5: "2026-10-28", 6: "2026-10-28", 7: "2026-10-28" } },
    z9: { classAt: 49, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4], EN0401: [0, 1, 2, 3, 4], EN0402: [0, 1, 2, 3, 4], EN0403: [0, 1, 2, 3, 4], EN0404: [0, 1, 2, 3, 4], EN0405: [0, 1, 2, 3, 4], EN0406: [0, 1, 2, 3, 4], EN0501: [0, 1, 2, 3, 4], EN0502: [0, 1, 2, 3, 4], EN0503: [0, 1, 2, 3, 4], EN0504: [0, 1, 2, 3, 4], EN0505: [0, 1, 2, 3, 4], EN0506: [0, 1, 2, 3, 4], EN0601: [0, 1, 2, 3, 4], EN0602: [0, 1, 2, 3, 4], EN0603: [0, 1, 2, 3, 4], EN0604: [0, 1, 2, 3, 4], EN0605: [0, 1, 2, 3, 4], EN0606: [0, 1, 2, 3, 4], EN0701: [0, 1, 2, 3, 4], EN0702: [0, 1, 2, 3, 4], EN0703: [0, 1, 2, 3, 4], EN0704: [0, 1, 2, 3, 4], EN0705: [0, 1, 2, 3, 4], EN0706: [0, 1, 2, 3, 4], EN0801: [0, 1, 2, 3, 4], EN0802: [0, 1, 2, 3, 4], EN0803: [0, 1, 2, 3, 4], EN0804: [0, 1, 2, 3, 4], EN0805: [0, 1, 2, 3, 4], EN0806: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30, 7: 30, 8: 30 }, learned: {}, album: { 1: "2026-10-28", 2: "2026-10-28", 3: "2026-10-28", 4: "2026-10-28", 5: "2026-10-28", 6: "2026-10-28", 7: "2026-10-28", 8: "2026-10-28" } },
    z10: { classAt: 55, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4], EN0201: [0, 1, 2, 3, 4], EN0202: [0, 1, 2, 3, 4], EN0203: [0, 1, 2, 3, 4], EN0204: [0, 1, 2, 3, 4], EN0205: [0, 1, 2, 3, 4], EN0206: [0, 1, 2, 3, 4], EN0301: [0, 1, 2, 3, 4], EN0302: [0, 1, 2, 3, 4], EN0303: [0, 1, 2, 3, 4], EN0304: [0, 1, 2, 3, 4], EN0305: [0, 1, 2, 3, 4], EN0306: [0, 1, 2, 3, 4], EN0401: [0, 1, 2, 3, 4], EN0402: [0, 1, 2, 3, 4], EN0403: [0, 1, 2, 3, 4], EN0404: [0, 1, 2, 3, 4], EN0405: [0, 1, 2, 3, 4], EN0406: [0, 1, 2, 3, 4], EN0501: [0, 1, 2, 3, 4], EN0502: [0, 1, 2, 3, 4], EN0503: [0, 1, 2, 3, 4], EN0504: [0, 1, 2, 3, 4], EN0505: [0, 1, 2, 3, 4], EN0506: [0, 1, 2, 3, 4], EN0601: [0, 1, 2, 3, 4], EN0602: [0, 1, 2, 3, 4], EN0603: [0, 1, 2, 3, 4], EN0604: [0, 1, 2, 3, 4], EN0605: [0, 1, 2, 3, 4], EN0606: [0, 1, 2, 3, 4], EN0701: [0, 1, 2, 3, 4], EN0702: [0, 1, 2, 3, 4], EN0703: [0, 1, 2, 3, 4], EN0704: [0, 1, 2, 3, 4], EN0705: [0, 1, 2, 3, 4], EN0706: [0, 1, 2, 3, 4], EN0801: [0, 1, 2, 3, 4], EN0802: [0, 1, 2, 3, 4], EN0803: [0, 1, 2, 3, 4], EN0804: [0, 1, 2, 3, 4], EN0805: [0, 1, 2, 3, 4], EN0806: [0, 1, 2, 3, 4], EN0901: [0, 1, 2, 3, 4], EN0902: [0, 1, 2, 3, 4], EN0903: [0, 1, 2, 3, 4], EN0904: [0, 1, 2, 3, 4], EN0905: [0, 1, 2, 3, 4], EN0906: [0, 1, 2, 3, 4] }, stickers: { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30, 7: 30, 8: 30, 9: 30 }, learned: {}, album: { 1: "2026-10-28", 2: "2026-10-28", 3: "2026-10-28", 4: "2026-10-28", 5: "2026-10-28", 6: "2026-10-28", 7: "2026-10-28", 8: "2026-10-28", 9: "2026-10-28" } },
    alldone: { classAt: 6, done: { EN0101: [0, 1, 2, 3, 4], EN0102: [0, 1, 2, 3, 4], EN0103: [0, 1, 2, 3, 4], EN0104: [0, 1, 2, 3, 4], EN0105: [0, 1, 2, 3, 4], EN0106: [0, 1, 2, 3, 4] }, stickers: { 1: 30 }, learned: {} } };
  if (SCEN[Q.get("scenario")]) { wr(JSON.parse(JSON.stringify(SCEN[Q.get("scenario")]))); try { sessionStorage.removeItem("platforma.en.hi"); } catch (e) {} }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const FAST = Q.get("fast") === "1";   // тестове: без звук и почти без паузи
  const wait = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 40) : ms));
  const img = (id, cls, alt) => `<img class="${cls || ""}" src="${IMG}${id}.webp?v=37" alt="${esc(alt || "")}" draggable="false">`;

  let D = null, A = {}, Z = null;
  const WHO = { oto: ["Ото", "oto_hello"], polly: ["Polly", "polly"], bubbles: ["Bubbles", "bubbles"], bella: ["Bella", "c_bella"], bobby: ["Bobby", "c_bobby"], dina: ["Dina", "c_dina"], momo: ["Momo", "w_monkey"], bird: ["Птицата", "w_bird"], bee: ["Пчеличката", "c_bizzy"], animals: ["Животните", "w_lion"], penguin: ["Pippo", "c_pippo"], sammy: ["Sammy", "c_sammy"], duckling: ["Патенцето", "w_duckling"], mum: ["Мама", "w_mum"], dad: ["Татко", "w_dad"], brother: ["Брат", "w_brother"], sister: ["Сестра", "w_sister"], baby: ["Бебето", "w_baby"], grandma: ["Баба", "w_grandma"], grandpa: ["Дядо", "w_grandpa"] };
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- глас ----------
  let cur = null, token = 0;
  function stop() { token++; if (cur) { try { cur.pause(); } catch (e) {} cur = null; } }
  function play1(voice, text) {
    const f = A[voice + "|" + text];
    if (FAST) { window.EN_SAID = (window.EN_SAID || []).concat([voice + "|" + text]); return wait(20); }
    if (!f) { console.warn("no audio", voice, text); return wait(400); }
    return new Promise(res => {
      const a = new Audio(AUD + f); cur = a;
      const done = () => { if (cur === a) cur = null; res(); };
      a.onended = done; a.onerror = done; a.play().catch(done);
    });
  }
  async function say(lines) {   // [[voice, text], …] – поред; ново say() спира старото
    stop(); const t = token;
    for (const [v, s] of lines) { if (t !== token) return false; await play1(v, s); if (t !== token) return false; await wait(150); }
    return true;
  }
  const bg = k => [["bg", D.instructions[k]]];

  // ---------- напредък ----------
  function prog() { const p = rd(); p.done = p.done || {}; p.first = p.first || {}; p.learned = p.learned || {}; p.stickers = p.stickers || {}; return p; }
  function lessonState(L) { const p = prog(), d = p.done[L.id] || []; return { done: d, complete: d.length >= L.rounds.length, next: L.rounds.findIndex((_, i) => !d.includes(i)) }; }
  // възложени = проведените от учителя занятия (демо: p.classAt, ?class=N или екранът „За учителя“)
  // правило (26.10.2026): детето остава с групата – „Продължи“ води към НАЙ-НОВОТО възложено незавършено домашно;
  // по-старите незавършени са „Доиграй“, по желание; нищо не наказва
  const ALL = () => D.zones.flatMap(z => z.lessons);
  const zoneOf = L => D.zones.find(z => z.lessons.includes(L)) || D.zones[0];
  const zoneNow = () => { const at = Math.max(1, prog().classAt || 1); return D.zones.find(z => z.id === Math.ceil(at / 6)) || D.zones[D.zones.length - 1]; };
  const classInZone = () => Math.max(1, Math.min(6, (prog().classAt || 1) - (Z.id - 1) * 6));
  const assigned = () => ALL().slice(0, Math.max(1, Math.min(ALL().length, prog().classAt || 1)));
  function current() { return assigned().slice().reverse().find(L => !lessonState(L).complete) || null; }
  const olderOpen = () => { const c = current(); return assigned().filter(L => L !== c && !lessonState(L).complete && lessonState(L).done.length < L.rounds.length); };
  const lessonsDone = () => Z.lessons.filter(L => lessonState(L).complete).length;
  // първата среща с дума: Ото казва само думата два пъти, после пита с постоянната фраза („Boat! Boat! … Where's the boat?“)
  // зрителни игри („Какво липсва?“, мемори): похвала без „listening“ – думата + „Yes!“
  const seen = w => [["oto", pick(["Yes!", "Well done!"])], ["oto", D.words[w].say]];
  function firstHear(w) {
    const W = D.words[w], p = prog(); p.heard = p.heard || {};
    if (p.heard[w] || !W.say || W.say === W.prompt) return [["oto", W.prompt]];
    p.heard[w] = 1; wr(p); return [["oto", W.say], ["oto", W.say], ["oto", W.prompt]];
  }
  function firstTry(word, ok) {   // първият опит за деня (за думата) – от него се смятат състоянията и повторението
    const p = prog(), k = word + "@" + today();
    RLOG.push({ k: word, ok: ok ? 1 : 0 });
    if (p.first[k] == null) { p.first[k] = ok ? 1 : 0; if (ok) { const l = p.learned[word] = p.learned[word] || []; if (!l.includes(today())) l.push(today()); } track(p, word, ok); wr(p); }
  }
  // ---------- думите (решение 28.10.2026): упражнява → разпознава → запомнил след време; повторение във времето ----------
  // „разпознава“ = вярно от първия опит в поне 2 различни дни и в 2 различни игри (или веднъж в повторението);
  // „запомнил“ = разпознава и пак вярно поне 7 дни по-късно. Графикът е ориентировъчен и се брои по влизания: думата е „за повторение“
  // при първото влизане, след като са минали поне GAPS[кутия] дни (детето, което влиза веднъж седмично, не „изостава“).
  const GAPS = [1, 3, 7, 14, 30], dnum = d => Math.round(Date.parse(d) / 864e5);
  let REV = new Set();   // думите, които в момента идват от повторението
  const wordOf = key => key.replace(/^alt:/, "").replace(/^[a-z]+:/, "").replace(/^the_/, "");
  const ctxOf = (key, w) => REV.has(w) ? "rev" : (/^([a-z]+):/.exec(key) || [0, "listen"])[1];
  function track(p, key, ok) {
    const w = wordOf(key); if (!D.words[w] || D.words[w].sound_only) return;
    p.w = p.w || {}; const s = p.w[w] = p.w[w] || { r: [], box: 0 }, t = today();
    s.r.push([t, ctxOf(key, w), ok ? 1 : 0]); if (s.r.length > 16) s.r.shift();
    if (ok) { if (!s.ok || dnum(t) - dnum(s.ok) >= GAPS[s.box]) s.box = Math.min(GAPS.length - 1, s.box + (s.ok ? 1 : 0)); s.ok = t; }
    else { s.box = 0; s.miss = t; }
    const st = wstate(w, s); if (st >= 2 && !s.rec) s.rec = t; if (st >= 2 && s.rec && dnum(t) - dnum(s.rec) >= 7 && ok) s.mem = t;
  }
  function wstate(w, s) {   // 0 – още не е срещана, 1 – упражнява, 2 – разпознава, 3 – запомнил след време
    s = s || ((prog().w || {})[w]); const heard = (prog().heard || {})[w];
    if (!s) return heard ? 1 : 0;
    if (s.mem) return 3;
    const ok = s.r.filter(x => x[2]), days = new Set(ok.map(x => x[0])), ctx = new Set(ok.map(x => x[1]));
    return days.size >= 2 && (ctx.size >= 2 || ctx.has("rev")) ? 2 : 1;
  }
  const isDue = (s, t) => !s.ok || dnum(t) - dnum(s.ok) >= GAPS[s.box] || (s.miss && s.miss >= s.ok);
  // нов контекст (решение 28.10.2026): позната от предишен ден дума понякога идва с друга картинка (img2); гласът е винаги на Ото;
  // такъв верен отговор се брои за „различна игра“ – истинска проверка, че детето разпознава думата, а не точно тази картинка
  function altFor(w) {
    const s = (prog().w || {})[w], W = D.words[w]; if (!W || !s || !s.r.some(x => x[0] !== today())) return {};
    return { img: W.img2 && Math.random() < .6 ? W.img2 : null, voice: null };   // гласът остава един и същ във всички игри (решение 28.10.2026)
  }
  function dueWords(L, n, skip) {   // думи за повторение: от вече срещаните, най-„изостаналите“ първо; само от стигнатите спирки
    const p = prog(), t = today(), z = zoneOf(L).id;
    return Object.entries(p.w || {}).filter(([w, s]) => D.words[w] && D.words[w].img && !D.words[w].sound_only && !skip.has(w) && (D.words[w].zone || 1) <= z && isDue(s, t))
      .map(([w, s]) => [w, (s.miss && s.miss >= (s.ok || "")) ? 99 : (s.ok ? (dnum(t) - dnum(s.ok)) / GAPS[s.box] : 50)])
      .sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]);
  }
  // кръг 3 (повторение) – хибрид: първите 2 думи остават от програмата, останалите са „дължимите“ на това дете
  function reviewMix(L, R) {
    const keep = 2, skip = new Set(((L.learn || {}).words || []).concat((R.items || R.pool || []).slice(0, keep)).filter(x => typeof x === "string"));
    if (R.type === "listen") { const due = dueWords(L, Math.min(3, R.items.length - keep), skip); if (!due.length) return R;
      const items = R.items.slice(0, keep).concat(due, R.items.slice(keep)).slice(0, R.items.length); return Object.assign({}, R, { items, pool: [...new Set(items.concat(R.pool || R.options || []))], options: null, rev: due }); }
    if (R.type === "say" && !R.numbers && R.items.every(x => typeof x === "string" && D.words[x])) { const due = dueWords(L, Math.min(3, R.items.length - keep), skip); if (!due.length) return R;
      return Object.assign({}, R, { items: R.items.slice(0, keep).concat(due, R.items.slice(keep)).slice(0, R.items.length), rev: due }); }
    if (R.type === "missing") { const due = dueWords(L, 2, skip); if (!due.length) return R;
      return Object.assign({}, R, { pool: R.pool.slice(0, 4 - due.length).concat(due), rev: due }); }
    return R;
  }

  // ---------- екран: живият пристан (решение 27.10.2026) ----------
  // основата е спокоен, празен пристан; всеки кръг дорисува в същата картина нещо, свързано с темата на занятието
  // (слоеве, нарисувани в самата сцена – със светлина, сянка и отражение, не стикери); 5-ият кръг на занятието = голямото събитие.
  // Детето докосва искрицата и новото се появява; всичко ново говори при докосване (жив речник); 2 тайни на пристан.
  const FRIENDS = { 1: ["bubbles", "рибката Bubbles"], 2: ["c_bella", "пеперудата Bella"], 3: ["w_family", "семейството на Ото"], 4: ["c_bobby", "прилепчето Bobby"], 5: ["c_dina", "патето Dina"],
    6: ["w_monkey", "маймунката Momo"], 7: ["c_bizzy", "пчеличката Bizzy"], 8: ["c_pippo", "пингвинчето Pippo"], 9: ["c_sammy", "катеричката Sammy"], 10: ["w_party", "всички приятели на празника"] };
  let PIER = null;   // config/english-pier.json → зоната
  const PZ = () => PIER && PIER.zones[String(Z.id)];
  const layerOf = (L, i) => (L.n - 1) * 5 + i;   // кръг i на занятие n → слой
  function shown() {   // слоевете на завършените кръгове (по реда на рисуване)
    const p = prog(), s = new Set();
    Z.lessons.forEach(L => (p.done[L.id] || []).forEach(i => s.add(layerOf(L, i))));
    return s;
  }
  // ---------- ясен край и лимит за деня (решение 28.10.2026): родителят избира колко занятия на ден (по подразбиране 2) ----------
  const dayMax = () => { const m = prog().dayMax; return m == null ? 2 : m; };
  const doneToday = () => { const d = prog().daily || {}; return d.d === today() ? d.n : 0; };
  const resting = () => !FAST && !REVIEW && dayMax() > 0 && doneToday() >= dayMax();
  function lessonFinished() { const p = prog(); if (!p.daily || p.daily.d !== today()) p.daily = { d: today(), n: 0 }; p.daily.n++; p.lastL = LES && LES.id; wr(p); }
  // за родителя: целта на занятието, думите със звук и задача за вкъщи (по желание) + колко занятия на ден
  function parentBox(L) {
    L = L || ALL().find(x => x.id === prog().lastL) || current() || ALL()[0];
    const Lr = L.learn || {}, ws = (Lr.words || []).filter(k => D.words[k]), m = dayMax();
    const ov = document.createElement("div"); ov.className = "en-adult-ov";
    const p0 = prog(), ws0 = Object.keys(p0.w || {}).filter(w => D.words[w]), st = w => wstate(w);
    const nRec = ws0.filter(w => st(w) >= 2).length, nMem = ws0.filter(w => st(w) === 3).length, nPr = ws0.filter(w => st(w) === 1).length;
    const weak = ws0.filter(w => p0.w[w].miss && p0.w[w].miss >= (p0.w[w].ok || "")).slice(0, 6);
    const nLes = ALL().filter(x => lessonState(x).complete).length;
    ov.innerHTML = `<div class="en-adult-box en-pbox"><h2>За родителя</h2>
      <div class="en-ptabs"><button class="en-btn" data-t="last" type="button">Последното занятие</button><button class="en-btn ghost" data-t="all" type="button">Целият път</button></div>
      <div class="en-ptab" data-p="all" hidden>
        <p>Завършени занятия: <b>${nLes}</b> от ${ALL().length} · пристан ${zoneNow().id} от 10</p>
        <p>Думи: разпознава <b>${nRec}</b>${nMem ? ` (от тях помни и след седмица – <b>${nMem}</b>)` : ""} · упражнява още <b>${nPr}</b></p>
        ${weak.length ? `<h3>Думи за упражняване <small>(сбъркани последно)</small></h3><div class="en-pwords">${weak.map(k => `<button class="en-btn ghost" data-w="${k}" type="button">🔊 ${esc(D.words[k].text)}</button>`).join("")}</div>` : ""}
        <p class="en-small">„Разпознава“ = вярно от първия опит в 2 различни дни и в 2 различни игри; „помни“ = пак вярно поне седмица по-късно. Подробно по думи – в „Речник“. Приложението не оценява произношението.</p>
      </div>
      <div class="en-ptab" data-p="last"><p class="en-small">${esc(G.zoneNames[zoneOf(L).id])} · занятие ${L.n}: ${esc(L.title)}</p>
      <h3>Целта</h3><p>${esc(Lr.goal || Lr.bg || "")}</p>
      ${ws.length ? `<h3>Думите</h3><div class="en-pwords">${ws.map(k => `<button class="en-btn ghost" data-w="${k}" type="button">🔊 ${esc(D.words[k].text)}</button>`).join("")}</div>` : ""}
      ${(Lr.phrases || []).length ? `<p><i>${Lr.phrases.map(esc).join(" · ")}</i></p>` : ""}
      <h3>Задача за вкъщи <small>(по желание, една минута)</small></h3><p class="en-ptask">${esc(Lr.home || "")}</p>
      <p class="en-small">Не е нужно да знаете английски – докоснете 🔊 и чуйте Ото. Напредъкът на детето не зависи от тази задача.</p>
      </div>
      <h3>Занятия на ден</h3><div class="en-row en-pmax">${[1, 2, 3, 0].map(v => `<button class="en-btn${v === m ? "" : " ghost"}" data-m="${v}" type="button">${v || "без ограничение"}</button>`).join("")}</div>
      <p class="en-small">След толкова занятия лодката „почива“ до утре. Следващото занятие никога не започва само.</p>
      <div class="en-row"><button class="en-btn" id="en-px" type="button">Затвори</button></div></div>`;
    app.appendChild(ov);
    ov.querySelectorAll("[data-w]").forEach(b => b.onclick = () => say([["oto", D.words[b.dataset.w].say]]));
    ov.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { ov.querySelectorAll("[data-t]").forEach(x => x.classList.toggle("ghost", x !== b)); ov.querySelectorAll(".en-ptab").forEach(x => x.hidden = x.dataset.p !== b.dataset.t); });
    ov.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { const p = prog(); p.dayMax = +b.dataset.m; wr(p); ov.querySelectorAll("[data-m]").forEach(x => x.classList.toggle("ghost", x !== b)); });
    document.getElementById("en-px").onclick = () => { ov.remove(); if (app.querySelector(".en-home")) home(); };
  }
  // от сървъра: учителят възлага занятията от офиса (Пилот → Домашни) – най-новото възложено определя докъде е групата;
  // завършените кръгове идват и от други таблети (дневникът platforma.rounds.v1, кръговете са 1–5 там, 0–4 тук)
  function fromServer() {
    const rj = k => { try { return JSON.parse(localStorage.getItem(k) || "null") || {}; } catch (e) { return {}; } };
    const ids = ALL().map(L => L.id), p = prog(), grp = Math.min(ids.length, +rj(GKEY) || 0);
    if (grp > (p.classAt || 1)) { p.classAt = grp; wr(p); }
    if (!CHILD) return;
    const hw = (rj("platforma.hw.server.v1")[CHILD] || []).filter(h => /^EN\d{4}$/.test(h.lesson || ""));
    if (hw.length) { const at = Math.max(...hw.map(h => ids.indexOf(h.lesson) + 1)); if (at > 0) { p.classAt = at; p.hw = {}; hw.forEach(h => { p.hw[h.lesson] = h.hw; }); } }
    const led = rj("platforma.rounds.v1")[CHILD] || {};
    Object.keys(led).filter(k => /^EN\d{4}$/.test(k)).forEach(k => { const d = p.done[k] = p.done[k] || []; led[k].forEach(n => { const i = Number(n) - 1; if (i >= 0 && i < 5 && !d.includes(i)) d.push(i); }); });
    wr(p);
  }
  // към сървъра: всеки завършен кръг като „activity_completed“ (същият договор като „Подготовка за училище“); отговорите – само за преглед, без оценяване на говоренето
  let RLOG = [], RT0 = Date.now();
  function sendRound(L, i) {
    const R = L.rounds[i], ans = RLOG.slice(), ok = ans.filter(a => a.ok).length, sec = Math.round((Date.now() - RT0) / 1000);
    // дневник на таблета (отчетът за пробата): време и първи опити по кръг
    const p = prog(); (p.rt = p.rt || []).push({ l: L.id, r: i + 1, t: R.type, at: new Date(RT0).toISOString(), s: sec, n: ans.length, ok, miss: ans.filter(a => !a.ok).map(a => a.k) }); if (p.rt.length > 400) p.rt.shift(); wr(p);
    if (!PS || !CHILD) return;
    try { PS.enqueue({ at: new Date(RT0).toISOString(), lesson_id: L.id, round_id: i + 1, gameId: "en_" + R.type, gameName: "Английски: " + R.type, hw: (prog().hw || {})[L.id] || null, st: i,
      total: ans.length || null, answered: ans.length || null, correct: ans.length ? ok : null, accuracy: ans.length ? Math.round(ok * 100 / ans.length) : null,
      seconds: sec, early: false, program: "english", answers: ans, events: [] }); } catch (e) { console.warn(e); }
  }
  function markRound(L, i) {
    const p = prog(), d = p.done[L.id] = p.done[L.id] || [];
    if (!d.includes(i)) d.push(i);
    p.stickers[Z.id] = (p.stickers[Z.id] || 0) + 1; wr(p);
  }
  function miniRiver() {   // мини-картата: реката с 10-те пристана и лодката
    const pos = (Z.id - 1) + Math.min(lessonsDone(), 6) / 6;
    return `<div class="en-mini" aria-label="Реката: пристан ${Z.id} от 10"><span class="en-mline"></span>${[...Array(10).keys()].map(k => `<i class="${k + 1 < Z.id || (k + 1 === Z.id && lessonsDone() >= 6) ? "ok" : k + 1 === Z.id ? "now" : ""}" style="left:${k * 100 / 9}%"></i>`).join("")}
      <span class="en-mboat" style="left:${Math.min(pos, 9) * 100 / 9}%">${img("boat")}</span></div>`;
  }
  const box = r => `left:${r[0]}%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%`;
  // сцената: точно съотношение 3:2, покрива екрана; слоевете – в % от нея, затова стоят на мястото си на всеки екран
  function stageHtml(o) {
    o = o || {}; const P = PZ(), on = o.all ? new Set(P.layers.map((_, k) => k)) : shown();
    const tp = ((prog().tapped || {})[Z.id] || []), found = ((prog().secrets || {})[Z.id] || []);
    // един слой може да доведе няколко героя наведнъж („with“ – напр. мама и татко); всеки се докосва поотделно
    const btn = (l, k, m) => `<button class="en-ly a-${l.sprite ? l.anim || "none" : "none"}${k === o.fresh ? " fresh" : ""}${l.big ? " big" : ""}${l.sprite ? " sprite" : ""}${o.still || tp.includes(l.id) ? "" : " unseen"}" style="${l.z ? "z-index:" + l.z + ";" : ""}--d:${(k * 0.73 + (m || 0) * 1.3) % 4}s;--sx:${(l.star || [90])[0]}%;--sy:${(l.star || [0, 8])[1]}%;${box(l.pos)}" data-k="${k}"${m ? ` data-m="${m}"` : ""} type="button" aria-label="${esc(l.say[1])}"${o.still ? " tabindex=\"-1\"" : ""}>${img(l.sprite || l.id)}</button>`;
    const ly = P.layers.map((l, k) => l.pos && (on.has(k) || k === o.fresh) ? btn(l, k) + (l.with || []).map((w, j) => btn(Object.assign({ big: l.big, z: l.z }, w, { id: w.id || l.id + "_" + (j + 1) }), k, j + 1)).join("") : "").join("");
    const next = o.still || o.fresh != null ? -1 : nextLayer();
    // цялата картина винаги се вижда (contain); празните ивици – размазано продължение на същата картина
    return `${o.still ? "" : img(P.base, "en-bgblur")}<div class="en-stage2${o.still ? " still" : " fit"}">${img(P.base, "en-base", "Пристанчето на Ото")}${ly}
      ${o.still ? "" : P.secrets.map((s, k) => !s.pos ? "" : `<button class="en-sec${found.includes(s.id) ? "" : " hint"}" data-s="${k}" type="button" style="--d:${k * 5}s;${box(s.tap)}" aria-label="?"></button><span class="en-secly" id="en-sec${k}" style="${box(s.pos)}">${img(s.id)}</span>`).join("")}
      ${next >= 0 ? `<span class="en-glint next" id="en-next" role="button" aria-label="Тук ще се появи нещо ново" style="left:${P.layers[next].pos[0] + P.layers[next].pos[2] / 2}%;top:${P.layers[next].pos[1] + P.layers[next].pos[3] / 2}%"></span>` : ""}
      <span class="en-oto${o.still ? " still" : ""}" id="en-oto" style="left:${P.oto.x}%;top:${P.oto.y}%;height:${P.oto.h}%">${img("oto_hello", "en-otoimg")}<i class="en-otohit"></i></span></div>`;
  }
  function nextLayer() {   // къде ще се появи следващото: първият незавършен кръг на текущото домашно
    const L = current(); if (!L) return -1; const i = lessonState(L).next; const k = i < 0 ? -1 : layerOf(L, i); return k >= 0 && PZ().layers[k].pos ? k : -1;
  }
  function otoPose(pose, ms) {
    const o = app.querySelector("#en-oto img"); if (!o) return;
    o.src = IMG + pose + ".webp?v=20"; clearTimeout(otoPose.t); if (ms) otoPose.t = setTimeout(() => { o.src = IMG + "oto_hello.webp?v=18"; }, ms);
  }
  function sparkle(x, y) {
    const st = app.querySelector(".en-stage2"); if (!st) return;
    st.insertAdjacentHTML("beforeend", `<span class="en-burst small" style="left:${x}%;top:${y}%">${"<i></i>".repeat(8)}</span>`);
    const b = st.lastElementChild; setTimeout(() => b.remove(), 1500);
  }
  const pierLine = l => [l.say].concat(l.reply ? [l.reply] : []);
  function home(opts) {
    opts = opts || {}; stop(); BACK = () => home();
    const L = current(), p = prog();
    const dots = L ? L.rounds.map((_, i) => `<i class="${lessonState(L).done.includes(i) ? "on" : i === lessonState(L).next ? "now" : ""}"></i>`).join("") : "";
    const learned = Object.values(p.learned).filter(d => d.length >= 2).length;
    app.innerHTML = `<section class="en-home${opts.enter ? " enter" : ""}">
      <div class="en-scene" id="en-scene">${stageHtml({ fresh: opts.fresh })}</div>
      <header class="en-top"><span class="en-zone"><b>${esc(Z.name)}</b><small>Пристан ${Z.id} от 10 · занятие ${classInZone()} от 6</small></span>
        ${miniRiver()}
        <span class="en-row"><button class="en-btn ghost" id="en-album" type="button" aria-label="Албумът на Ото">📖</button><button class="en-btn ghost" id="en-river" type="button">Целият път</button><button class="en-btn ghost" id="en-home" type="button" aria-label="Начало">⌂</button></span></header>
      ${olderOpen().length && !resting() ? `<div class="en-older">${olderOpen().map(O => `<button class="en-btn ghost" data-older="${O.id}" type="button">Доиграй: ${zoneOf(O) !== Z ? esc(G.zoneNames[zoneOf(O).id]) + ", " : ""}занятие ${O.n}</button>`).join("")}</div>` : ""}
      ${opts.hold ? "" : L && resting() ? `<div class="en-card done rest"><div class="en-what"><span>Браво!</span><b>Лодката почива 🌙</b><small>Утре продължаваме с Ото.</small></div><button class="en-btn ghost en-pbtn" id="en-par" type="button" title="Задръжте">👪 За родителя<i>задръжте</i></button></div>` : !L && lessonsDone() < Z.lessons.length ? `<div class="en-card done"><div class="en-what"><span>Браво!</span><b>Домашното е готово.</b><small>Следващото – след занятието с учителя.</small></div><button class="en-btn ghost en-pbtn" id="en-par" type="button" title="Задръжте">👪 За родителя<i>задръжте</i></button></div>` :
      L ? `<div class="en-card"><div class="en-what"><span>Домашно</span><b>${esc(L.title)}</b><div class="en-dots">${dots}</div></div>
        <button class="en-go" id="en-go" type="button"><svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="#fff"/></svg>${opts.nextRound ? "Следващ кръг" : "Продължи"}</button></div>`
        : `<div class="en-card done"><div class="en-what"><span>Браво!</span><b>${Z.id === 1 ? "Пристанчето е готово." : "Спирката е готова."}</b></div><button class="en-go" id="en-go" type="button">Към реката</button></div>`}
      <button class="en-teacher" id="en-teacher" type="button" aria-label="За учителя (задръж)">👩‍🏫</button>
    </section>`;
    const go = document.getElementById("en-go");
    if (go) go.onclick = () => L ? startLesson(L) : river(true);
    if (go && opts.fresh != null) { go.disabled = true; go.closest(".en-card").classList.add("wait"); }   // бутонът – чак след като новото се появи
    app.querySelectorAll("[data-older]").forEach(b => b.onclick = () => startLesson(ALL().find(x => x.id === b.dataset.older)));
    holdOpen(document.getElementById("en-teacher"), teacher);
    holdOpen(document.getElementById("en-par"), () => parentBox(), true);
    document.getElementById("en-river").onclick = () => river(false);
    document.getElementById("en-home").onclick = () => start();
    document.getElementById("en-album").onclick = () => album();
    wirePier(opts);
    const q = prog();
    if (opts.fresh == null && !q.pierHint && shown().size) { q.pierHint = 1; wr(q); const st = app.querySelector(".en-stage2"); st.classList.add("showall"); setTimeout(() => st.classList.remove("showall"), 2200); say((opts.voice || []).concat([["bg", PIER.voice.hint]])); }
    else if (opts.fresh != null) reveal(opts.fresh, opts.after); else if (opts.voice) say(opts.voice);
  }
  let WHERE = null;   // „Where's the boat?“ – игра в завършения пристан (без точки)
  function wirePier() {
    const P = PZ();
    app.querySelectorAll(".en-ly").forEach(b => b.onclick = e => {
      e.stopPropagation(); const l0 = P.layers[+b.dataset.k], l = b.dataset.m ? Object.assign({ id: l0.id + "_" + b.dataset.m, where: null }, l0.with[b.dataset.m - 1]) : l0;
      b.classList.remove("unseen"); sparkle(l.pos[0] + l.pos[2] * (l.star || [50])[0] / 100, l.pos[1] + l.pos[3] * (l.star || [0, 30])[1] / 100);
      const p = prog(); p.tapped = p.tapped || {}; const t = p.tapped[Z.id] = p.tapped[Z.id] || []; if (!t.includes(l.id)) { t.push(l.id); wr(p); }
      if (WHERE) { if (WHERE === l0) { WHERE = null; otoPose("oto_clap", 1500); return say([["oto", "Yes!"], l.say]); } return say([["oto", WHERE.where]]); }
      say(pierLine(l));
    });
    app.querySelectorAll(".en-sec").forEach(b => b.onclick = e => {
      e.stopPropagation(); const k = +b.dataset.s, s = P.secrets[k], el = document.getElementById("en-sec" + k);
      el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
      sparkle(s.tap[0] + s.tap[2] / 2, s.tap[1] + s.tap[3] / 3);
      const p = prog(); p.secrets = p.secrets || {}; const f = p.secrets[Z.id] = p.secrets[Z.id] || []; if (!f.includes(s.id)) { f.push(s.id); wr(p); }
      b.classList.remove("hint");
      say([s.say]);
    });
    const oto = app.querySelector("#en-oto .en-otohit");
    oto.onclick = e => {
      e.stopPropagation(); otoPose("oto_clap", 1200);
      const on = [...shown()].map(k => P.layers[k]).filter(l => l.where);
      if (lessonsDone() >= Z.lessons.length && on.length) { WHERE = pick(on); return say([["oto", WHERE.where]]); }
      say([["oto", pick(["Hello!", "Yes!", "Well done!"])]]);
    };
    // докосване на празно място: всичко, което може да се докосва, светва за миг (детето вижда какво е „живо“)
    const st = app.querySelector("#en-scene .en-stage2");
    st.addEventListener("click", e => { if (e.target.closest(".en-ly,.en-sec,.en-otohit,.en-glint")) return; st.classList.remove("showall"); void st.offsetWidth; st.classList.add("showall"); clearTimeout(wirePier.t); wirePier.t = setTimeout(() => st.classList.remove("showall"), 1600); });
    // искрицата на следващото място: „Тук ще се появи нещо ново!“ и бутонът „Продължи“ подскача
    const nx = document.getElementById("en-next");
    if (nx) nx.onclick = e => { e.stopPropagation(); sparkle(parseFloat(nx.style.left), parseFloat(nx.style.top)); say([["bg", PIER.voice.next]]);
      const go = document.getElementById("en-go"); if (go) { go.classList.remove("nudge"); void go.offsetWidth; go.classList.add("nudge"); } };
    WHERE = null;
  }
  // моментът след кръга: камерата отива към искрицата, детето я докосва (или след малко само) – новото се „дорисува“, героят го казва
  async function reveal(k, after) {   // 27.10: без приближаване – картината остава цяла; около новото леко се затъмнява („прожектор“)
    const P = PZ(), l = P.layers[k], sc = document.getElementById("en-scene"), el = app.querySelector(`.en-ly[data-k="${k}"]`);
    const unhold = () => { const go = document.getElementById("en-go"); if (go) { go.disabled = false; go.closest(".en-card").classList.remove("wait"); } };
    if (!sc || !el) { unhold(); if (after) after(); return; }
    const st = sc.querySelector(".en-stage2"), bx = [l.pos].concat((l.with || []).map(m => m.pos));
    const x0 = Math.min(...bx.map(b => b[0])), y0 = Math.min(...bx.map(b => b[1])), x1 = Math.max(...bx.map(b => b[0] + b[2])), y1 = Math.max(...bx.map(b => b[1] + b[3]));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    st.insertAdjacentHTML("beforeend", `<span class="en-spot" id="en-spot" style="--x:${cx}%;--y:${cy}%;--rw:${Math.max(9, (x1 - x0) * .85)}%;--rh:${Math.max(13, (y1 - y0) * .85)}%"></span>`
      + `<button class="en-glint big" id="en-gl" type="button" aria-label="Докосни" style="left:${cx}%;top:${cy}%"></button>`);
    const spot = document.getElementById("en-spot"), gl = document.getElementById("en-gl");
    requestAnimationFrame(() => spot.classList.add("on"));
    await wait(700);
    say([["bg", PIER.voice.tap]]);
    await new Promise(res => { gl.onclick = e => { e.stopPropagation(); res(); }; setTimeout(res, FAST ? 30 : 6000); });
    gl.remove(); stop();
    const all = app.querySelectorAll(`.en-ly[data-k="${k}"]`); all.forEach(x => x.classList.add("show")); otoPose(l.big ? "oto_clap" : "oto_look", l.big ? 2600 : 1600);
    bx.forEach(b => st.insertAdjacentHTML("beforeend", `<span class="en-burst${l.big ? "" : " small"}" style="left:${b[0] + b[2] / 2}%;top:${b[1] + b[3] / 2}%">${"<i></i>".repeat(l.big ? 10 : 8)}</span>`));
    await wait(900);
    await say(pierLine(l).concat(...(l.with || []).map(pierLine)));
    await wait(300); spot.classList.remove("on"); setTimeout(() => spot.remove(), 700); all.forEach(x => x.classList.remove("fresh"));
    const go = document.getElementById("en-go"); if (go && sc.isConnected) { go.disabled = false; go.closest(".en-card").classList.remove("wait"); }
    if (after && sc.isConnected) after();
  }

  // завършен пристан: печатът на приятеля, страница в албума, после – към реката
  function finishPier() {
    const p = prog(); p.album = p.album || {}; if (!p.album[Z.id]) { p.album[Z.id] = today(); wr(p); }
    const F = FRIENDS[Z.id];
    app.insertAdjacentHTML("beforeend", `<div class="en-adult-ov en-fin"><div class="en-adult-box en-center">
      <div class="en-finpic">${stageHtml({ still: true })}<span class="en-stamp">${img(F[0])}<b>${esc(G.zoneNames[Z.id])}</b></span></div>
      <h2>${Z.id === 1 ? "Пристанчето е готово!" : "Спирката е готова!"}</h2><p>${esc(F[1].charAt(0).toUpperCase() + F[1].slice(1))} ти дава своя печат.</p>
      <div class="en-row"><button class="en-btn ghost" id="en-fal" type="button">📖 Албумът на Ото</button><button class="en-go" id="en-friv" type="button">Към реката</button></div></div></div>`);
    say([["oto", "Well done! You did it!"], ["bg", PIER.voice["done" + (Z.id > 1 ? Z.id : "")] || PIER.voice.done]]);
    document.getElementById("en-fal").onclick = () => album();
    document.getElementById("en-friv").onclick = () => river(true);
  }
  function cropPic(P, l) {   // малка „снимка“ от пристана: основата + самото нещо, приближени около него
    const [x, y, w, h] = l.pos, rx = x * 1.5, rw = w * 1.5, a = 1.25;
    let cw = rw * 1.35, ch = h * 1.35; if (cw / ch > a) ch = cw / a; else cw = ch * a;
    cw = Math.min(cw, 150); ch = Math.min(ch, 100);
    const cx = Math.min(Math.max(rx + rw / 2 - cw / 2, 0), 150 - cw), cy = Math.min(Math.max(y + h / 2 - ch / 2, 0), 100 - ch);
    return `<span class="en-acrop"><span class="en-acin" style="width:${15000 / cw}%;height:${10000 / ch}%;left:${-cx / cw * 100}%;top:${-cy / ch * 100}%">${img(P.base, "en-abase")}<span class="en-aly" style="${box(l.pos)}">${img(l.sprite || l.id)}</span></span></span>`;
  }
  // „Албумът на Ото“: страница за всеки пристан – картината, откритите неща (докосване – думата), тайните, печатът
  function album(zone) {
    stop(); BACK = () => home();
    const z = zone || Z.id, P = PIER.zones[String(z)], p = prog(), on = z === Z.id ? [...shown()].sort((a, b) => a - b) : [];
    const sec = ((p.secrets || {})[z] || []), fin = (p.album || {})[z], F = FRIENDS[z];
    app.innerHTML = `<section class="en-games en-album"><header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Към пристана">✕</button><b class="en-gtitle">Албумът на Ото</b><span></span></header>
      <nav class="en-ztabs">${[...Array(10).keys()].map(i => i + 1).map(n => `<button class="en-ztab${n === z ? " on" : ""}${PIER.zones[String(n)] ? "" : " locked"}" data-z="${n}" type="button" aria-label="${esc(G.zoneNames[n])}">${img(G.zoneIcons[n], "fit")}${PIER.zones[String(n)] ? "" : "<i>🔒</i>"}</button>`).join("")}</nav>
      ${P ? `<div class="en-agrid"><div class="en-apic">${stageHtml({ still: true })}${fin ? `<span class="en-stamp">${img(F[0])}<b>${esc(G.zoneNames[z])}</b></span>` : ""}</div>
        <div class="en-aside"><h3 class="en-dz">${esc(G.zoneNames[z])}</h3>
          <p class="en-anote">${on.length} от ${P.layers.length} неща${fin ? " · завършен " + fin.split("-").reverse().join(".") : ""}</p>
          <div class="en-afound">${on.map(k => { const l = P.layers[k]; return `<button class="en-acard" data-k="${k}" type="button">${cropPic(P, l)}<b>${esc(l.say[1])}</b></button>`; }).join("")}</div>
          <p class="en-anote">Тайни: ${P.secrets.map(s => sec.includes(s.id) ? `<button class="en-asec" data-s="${s.id}" type="button">${cropPic(P, s)}</button>` : `<span class="en-asec q">?</span>`).join("")}</p>
          <p class="en-adult-note">За родителя: всичко на картината се е появило след кръг от домашното.${(() => { const ws = Object.keys(prog().w || {}), n = ws.filter(w => wstate(w) >= 2).length, m = ws.filter(w => wstate(w) === 3).length; return n ? ` Детето разпознава ${n} ${n === 1 ? "дума" : "думи"}${m ? `, от тях ${m} помни и след седмица` : ""} (подробно – в „Речник“).` : ""; })()} Докоснете нещо – Ото казва думата. Помолете детето да ви „покаже“ пристана.</p></div></div>`
      : `<p class="en-empty">Този пристан чака лодката на Ото.</p>`}</section>`;
    document.getElementById("en-x").onclick = () => home();
    app.querySelectorAll(".en-ztab").forEach(b => b.onclick = () => { const n = +b.dataset.z; if (!PIER.zones[String(n)]) return say([["bg", G.instructions.locked_stop]]); album(n); });
    app.querySelectorAll(".en-acard").forEach(b => b.onclick = () => { app.querySelectorAll(".en-acard").forEach(x => x.classList.toggle("lit", x === b)); say(pierLine(P.layers[+b.dataset.k])); });
    app.querySelectorAll(".en-asec").forEach(b => b.onclick = () => { const s = P.secrets.find(x => x.id === b.dataset.s); if (s) say([s.say]); });
    if (!zone) say([["bg", PIER.voice.album]]);
  }

  // ---------- екран: целият път (27.10.2026) – реката е пътят: без пунктир и без кръгове; завършените спирки са „живи“ ----------
  // RIVER – средата на реката (в % от картата), от пристанчето до морето; BOAT – мястото на лодката при всяка спирка (индекс в RIVER);
  // SPOT – мястото на сушата (приятелят, мъглата, докосването)
  // картата (27.10.2026, по образеца на потребителя): цялата река наведнъж, всички спирки с еднакъв размер; 1–4 горе, водопадът на завоя, 6–7 в средата, 8–10 долу
  const RIVER = [[21, 30], [26, 34], [31, 38], [42, 43], [52, 40], [57, 33], [66, 32], [77, 30], [80, 42], [82, 63], [74, 64], [62, 62], [60, 64], [45, 65], [30, 64], [20, 67], [9, 72], [10, 85], [25, 94], [44, 90], [49, 80], [52, 95], [70, 93], [73, 83]];
  const BOAT = [0, 2, 5, 7, 9, 11, 14, 16, 20, 23];
  const SPOT = [[25, 36, 10], [45, 30, 12], [69, 27, 14], [91, 27, 10], [88, 60, 9], [53, 52, 15], [17, 48, 15], [26, 80, 14], [58, 78, 13], [88, 83, 12]];
  const depth = () => 1;
  const FLAG = [[19, 27], [53, 34], [57, 29], [82, 34], [70, 47], [43, 53], [7, 56], [18, 73], [63, 72], [75, 82]];   // знаменцето на Ото: „тук вече бях“
  const STOPS = BOAT.map(k => RIVER[k]);   // (за съвместимост)
  function along(a, b, t) {   // точка по реката между индексите a и b, t ∈ [0,1]
    const seg = []; let L = 0; for (let k = a; k < b; k++) { const d = Math.hypot(RIVER[k + 1][0] - RIVER[k][0], (RIVER[k + 1][1] - RIVER[k][1]) * 2 / 3); seg.push(d); L += d; }
    let x = t * L; for (let k = a; k < b; k++) { if (x <= seg[k - a] || k === b - 1) { const u = Math.min(1, x / seg[k - a]); return [RIVER[k][0] + (RIVER[k + 1][0] - RIVER[k][0]) * u, RIVER[k][1] + (RIVER[k + 1][1] - RIVER[k][1]) * u]; } x -= seg[k - a]; }
    return RIVER[b];
  }
  function river(leaving) {
    stop(); BACK = () => home();
    const n = lessonsDone(), zdone = n >= 6, cur = zdone ? Math.min(Z.id + 1, 10) : Z.id, L = current();
    const state = z => z < Z.id || (z === Z.id && zdone) ? "ok" : z === cur ? "now" : z === cur + 1 ? "next" : "far";
    const bp = RIVER[BOAT[(leaving ? Z.id : cur) - 1]], label = zdone ? `${esc(G.zoneNames[cur])} · ново!` : `${esc(G.zoneNames[Z.id])} · занятие ${Math.min(n + 1, 6)} от 6`;
    app.innerHTML = `<section class="en-river">
      <div class="en-map"><div class="en-mapbox">${img("map", "en-mapimg", "Реката от пристанчето до морето")}
        ${SPOT.map(([x, y, sw], k) => { const z = k + 1, st = state(z), F = FRIENDS[z];
          return (st === "next" || st === "far" ? `<span class="en-fog ${st}" style="left:${x}%;top:${y}%;width:${sw * 1.5}%"></span>` : "")
            + `<button class="en-spot2 ${st}" data-z="${z}" type="button" style="left:${x}%;top:${y}%;width:${sw}%" aria-label="${esc(G.zoneNames[z])}">`
            + (st === "ok" ? `${z === 3 ? "" : img(F[0], "en-friend")}<i class="en-chk">✓</i>` : "") + `</button>`; }).join("")}
        ${SPOT.map((_, k) => state(k + 1) === "ok" ? ((PIER.mapcast || {})[k + 1] || []).map(([n, x, y, h], j) => `<span class="en-cast" style="left:${x}%;top:${y}%;height:${h}%;--d:${(j * .45) % 3}s">${img(n)}</span>`).join("") : "").join("")}
        ${FLAG.map(([x, y], k) => state(k + 1) === "ok" ? `<span class="en-flag" style="left:${x}%;top:${y}%;--d:${k * .3}s" aria-hidden="true"><i></i><b>★</b></span>` : "").join("")}
        <span class="en-boat2" id="en-boat2" style="left:${bp[0]}%;top:${bp[1]}%;--s:${depth(bp[1])}">${img("boat", "", "Лодката на Ото")}<span class="en-blabel">${label}${L ? `<button class="en-bgo" id="en-bgo" type="button">▶ Продължи</button>` : ""}</span></span>
      </div></div>
      <header class="en-top"><span class="en-zone"><b>Реката на Ото</b><small>${zdone ? "Следващ пристан: " + esc(G.zoneNames[cur]) : "Сега: " + esc(G.zoneNames[Z.id])}</small></span>
        <button class="en-btn ghost" id="en-back" type="button">Към пристана</button></header>
      <div class="en-peek" id="en-peek" hidden></div>
    </section>`;
    document.getElementById("en-back").onclick = () => home({ enter: true });
    const bgo = document.getElementById("en-bgo"), cont = e => { e.stopPropagation(); if (!L) return home({ enter: true }); say([["bg", G.voice.cont]]); startLesson(L); };
    if (bgo) bgo.onclick = cont; document.getElementById("en-boat2").onclick = cont;
    app.querySelectorAll(".en-spot2").forEach(b => b.onclick = () => {
      const z = +b.dataset.z, st = b.classList[1], F = FRIENDS[z], pk = document.getElementById("en-peek");
      if (st === "ok") { b.classList.add("hop"); setTimeout(() => b.classList.remove("hop"), 900);   // приятелят подскача и казва думата си, после – „преди и след“
        return say((PIER.mapsay || {})[z] || []).then(ok => { if (ok && b.isConnected) beforeAfter(z); }); }
      if (st === "now") { if (z === Z.id) return home({ enter: true }); }
      pk.innerHTML = `<div class="en-adult-box en-center">${img(F[0], "en-sil")}<b>${esc(G.zoneNames[z])}</b><small>${st === "now" ? "Тук отиваме сега!" : "Тук ще срещнем " + esc(F[1]) + "!"}</small></div>`;
      pk.hidden = false; pk.onclick = () => { pk.hidden = true; };
      say([["bg", (G.peek || {})[z] || G.instructions.locked_stop]]);
    });
    if (leaving) {   // лодката плава по реката до следващата спирка
      const b = document.getElementById("en-boat2"), a = BOAT[Z.id - 1], e = BOAT[Math.min(Z.id, 9)], t0 = performance.now(), dur = FAST ? 50 : 4200;
      const step = now => { if (!b.isConnected) return; const t = Math.min(1, (now - t0) / dur), u = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, p = along(a, e, u);
        b.style.left = p[0] + "%"; b.style.top = p[1] + "%"; b.style.setProperty("--s", depth(p[1])); if (t < 1) requestAnimationFrame(step); else b.classList.add("sail"); };
      b.classList.add("moving"); requestAnimationFrame(step); say([["bg", D.instructions["zone_done" + (Z.id > 1 ? Z.id : "")] || D.instructions.zone_done]]);
    }
  }
  // „Преди и след“: празната картина на спирката, после всичко, което детето е дорисувало, едно по едно
  function beforeAfter(z) {
    const P = PIER.zones[String(z)], ZZ = D.zones.find(x => x.id === z); if (!P) return;
    const pr = prog(), on = new Set(); (ZZ ? ZZ.lessons : []).forEach(L => (pr.done[L.id] || []).forEach(i => on.add(layerOf(L, i))));
    const ly = P.layers.filter((l, k) => on.has(k)).flatMap(l => [l].concat(l.with || [])).filter(l => l.pos);
    const ov = document.createElement("div"); ov.className = "en-adult-ov en-ba";
    ov.innerHTML = `<div class="en-adult-box en-center"><div class="en-bastage">${img(P.base, "en-base")}${ly.map((l, k) => `<span class="en-baly" style="${box(l.pos)};animation-delay:${1.2 + k * 0.09}s">${img(l.sprite || l.id)}</span>`).join("")}<span class="en-bacap" id="en-bacap">Преди</span></div>
      <b>${esc(G.zoneNames[z])}</b><small>Ето какво нарисува ти!</small>
      <div class="en-row">${ZZ ? `<button class="en-btn" id="en-bago" type="button">Към пристана</button>` : ""}<button class="en-btn ghost" id="en-bax" type="button">Затвори</button></div></div>`;
    app.appendChild(ov);
    setTimeout(() => { const c = document.getElementById("en-bacap"); if (c) c.textContent = "Сега"; }, 1200);
    say([["bg", PIER.voice.ba]]);
    document.getElementById("en-bax").onclick = () => ov.remove();
    const go = document.getElementById("en-bago"); if (go) go.onclick = () => { ov.remove(); Z = ZZ; home({ enter: true }); };
  }

  // ---------- „За учителя“ (демо): кое занятие е проведено, кои домашни не са завършени ----------
  function holdOpen(el, fn, hint) { if (!el) return; let t = null, fired = false;
    const s = () => { fired = false; el.classList.add("holding"); t = setTimeout(() => { fired = true; el.classList.remove("holding"); fn(); }, 1200); }, c = () => { clearTimeout(t); el.classList.remove("holding"); };
    el.addEventListener("pointerdown", s); ["pointerup", "pointerleave", "pointercancel"].forEach(e => el.addEventListener(e, c));
    el.addEventListener("click", () => { if (FAST) return fn(); if (!fired && hint) { el.classList.remove("hinted"); void el.offsetWidth; el.classList.add("hinted"); } }); }
  function teacher() {
    stop(); Z = zoneNow(); const p = prog(), atAll = p.classAt || 1, at = classInZone(), max = ALL().length;
    const rows = Z.lessons.map(L => { const st = lessonState(L), d = st.done.length, n = L.rounds.length;
      const s = L.n > at ? "не е проведено" : st.complete ? "домашното е готово" : d ? `незавършено: ${d} от ${n} кръга` : "домашното не е започнато";
      return `<tr class="${L.n > at ? "fut" : st.complete ? "ok" : "open"}"><td>Занятие ${L.n}</td><td>${esc(L.title)}</td><td>${s}</td></tr>`; }).join("");
    app.insertAdjacentHTML("beforeend", `<div class="en-adult-ov" role="dialog"><div class="en-adult-box"><h2>За учителя</h2><p>${esc(G.zoneNames[Z.id])} (пристан ${Z.id}) · проведени занятия: ${at} от 6 · общо ${atAll} от ${max}</p>
      <table class="en-tbl">${rows}</table><p class="en-small">Незавършените домашни остават отворени по желание; „Продължи“ води към последното проведено занятие.</p>
      ${(() => {   // думите за повторение в клас: сбъркани последно или още „упражнява“ от вече проведените занятия (за групата – когато има сървър)
        const pw = p.w || {}, seen = Object.keys(pw).filter(w => D.words[w] && !D.words[w].sound_only);
        const miss = seen.filter(w => pw[w].miss && pw[w].miss >= (pw[w].ok || "")), weak = seen.filter(w => !miss.includes(w) && wstate(w) === 1);
        const rec = seen.filter(w => wstate(w) >= 2).length;
        const chip = w => `<button class="en-btn ghost en-tw" data-w="${w}" type="button">🔊 ${esc(D.words[w].text)}</button>`;
        return `<h3>Думи за повторение в клас</h3>${seen.length ? `<p class="en-small">Разпознава ${rec} от ${seen.length} срещани думи.</p>
          ${miss.length ? `<p><b>Сбъркани последно:</b></p><div class="en-pwords">${miss.slice(0, 12).map(chip).join("")}</div>` : ""}
          ${weak.length ? `<p><b>Още ги упражнява:</b></p><div class="en-pwords">${weak.slice(0, 12).map(chip).join("")}</div>` : ""}
          ${!miss.length && !weak.length ? `<p class="en-small">Няма думи за повторение – всички срещани думи се разпознават.</p>` : ""}` : `<p class="en-small">Още няма данни от домашните.</p>`}
          <p class="en-small">В демото – за едно дете; в истинската платформа – обобщено за групата (думите, които най-много деца още не разпознават).</p>`; })()}
      <div class="en-row"><button class="en-btn" id="en-t-next" type="button" ${atAll >= max ? "disabled" : ""}>Проведи занятие ${atAll >= max ? at : at >= 6 ? "1 на " + esc(G.zoneNames[Z.id + 1]) : at + 1}</button><button class="en-btn" id="en-t-reset" type="button">Започни отначало</button><button class="en-btn" id="en-t-x" type="button">Затвори</button></div></div></div>`);
    document.getElementById("en-t-next").onclick = () => { const q = prog(); q.classAt = Math.min(max, (q.classAt || 1) + 1); wr(q); Z = zoneNow(); home(); };
    document.getElementById("en-t-reset").onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} Z = zoneNow(); home(); };
    document.getElementById("en-t-x").onclick = () => home();
    app.querySelectorAll(".en-tw").forEach(b => b.onclick = () => say([["oto", D.words[b.dataset.w].say]]));
  }

  // ---------- плейър на домашното ----------
  let LES = null, BACK = () => home();
  function frame(L, i, body) {
    const st = lessonState(L);
    app.innerHTML = `<section class="en-play" data-type="${L.rounds[i].type}">
      <header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Към пристана">✕</button>
        <div class="en-dots">${L.rounds.map((_, k) => `<i class="${st.done.includes(k) ? "on" : k === i ? "now" : ""}"></i>`).join("")}</div>
        <button class="en-spk" id="en-spk" type="button" aria-label="Чуй пак">🔊</button></header>
      <div class="en-stage">${body}</div></section>`;
    document.getElementById("en-x").onclick = () => BACK();
  }
  function startLesson(L) { LES = L; Z = zoneOf(L); BACK = () => home(); const i = lessonState(L).next; runRound(L, i < 0 ? 0 : i); }
  async function runRound(L, i) {
    let R = L.rounds[i]; const fn = ROUND[R.type];
    if (R.review && L.id !== "GAME") R = reviewMix(L, R); REV = new Set(R.rev || []); RLOG = []; RT0 = Date.now();
    try { await fn(L, i, R); } catch (e) { console.error(e); window.EN_ERR = String(e && e.stack || e); throw e; }
    REV = new Set(); markRound(L, i); if (L.id !== "GAME") sendRound(L, i);
    const st = lessonState(L), k = layerOf(L, i);
    if (st.complete) {   // завършено занятие: голямото събитие на пристана (5-ият слой); след 6-те – печат и албум, после реката
      const n = lessonsDone(); lessonFinished();
      home({ fresh: k, hold: true, after: () => { if (n >= Z.lessons.length) finishPier(); else home({ voice: [["oto", "Well done! You did it!"], ["bg", resting() ? D.instructions.rest : D.instructions.lesson_done]] }); } });
    } else {
      // моментът след кръга: искрицата → детето я докосва → новото се дорисува в картината; после „Следващ кръг“
      home({ fresh: k, nextRound: true, after: () => say(bg("round_done")) });
    }
  }
  const tapOnce = (sel) => new Promise(res => { app.querySelectorAll(sel).forEach(el => el.addEventListener("click", () => res(el), { once: true })); });
  function choice(cards) { return new Promise(res => { cards.forEach(c => c.onclick = () => res(c)); }); }
  async function speakerLoop(fn) { const s = document.getElementById("en-spk"); if (s) s.onclick = fn; }

  // проверка с повторение: верният – похвала; грешният – показва верния, казва го и детето опитва още веднъж
  async function ask(promptLines, cardsSel, isOk, onOk, onShow, key, retry) {
    let tries = 0;
    for (;;) {
      if (tries === 0) app.querySelectorAll(cardsSel).forEach(c => c.classList.remove("ok", "no", "hint"));
      window.EN_OK = isOk; if (promptLines.length) { speakerLoop(() => say(promptLines)); say(promptLines); }
      const el = await choice([...app.querySelectorAll(cardsSel)]);
      stop(); const ok = isOk(el);
      if (key && tries === 0) firstTry(key, ok);
      if (ok) { el.classList.add("ok"); await say(tries ? [["oto", "You tried again!"]].concat(onOk.slice(0, 1)) : onOk); await wait(250); return true; }
      tries++; el.classList.add("no"); const good = [...app.querySelectorAll(cardsSel)].find(isOk); good && good.classList.add("hint");
      await say(onShow); el.classList.remove("no");
      if (tries >= 2) { good && good.classList.add("ok"); await wait(600); return false; }
      await say([["oto", retry || D.try_again]]); good && good.classList.remove("hint");
    }
  }

  // ---------- мелодия (WebAudio): нежен звук като ксилофон; спира с stop() ----------
  let AC = null;
  const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5 };
  const ac = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); } catch (e) { AC = null; } return AC; };
  const sleepMs = ms => wait(ms);
  let voices = [];
  function melody(notes, bpm, vol) {   // връща продължителността в ms; при FAST – без звук
    const beat = 60 / bpm, total = notes.reduce((a, n) => a + n[1], 0) * beat * 1000;
    if (FAST) return 40;
    const a = ac(); if (!a) return total;
    let t = a.currentTime + .05;
    notes.forEach(([n, b], k) => {
      const f = NOTE[n] || 523.25, d = b * beat;
      [[f, "triangle", vol], [f * 2, "sine", vol * .18], k % 4 === 0 ? [f / 2, "sine", vol * .5] : null].filter(Boolean).forEach(([fr, ty, v]) => {
        const o = a.createOscillator(), g = a.createGain(); o.type = ty; o.frequency.value = fr; o.connect(g).connect(a.destination);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + Math.max(.3, d * .95));
        o.start(t); o.stop(t + d + .05); voices.push(o);
      });
      t += d;
    });
    return total;
  }
  const _stop0 = stop;
  stop = function () { _stop0(); voices.forEach(o => { try { o.stop(); } catch (e) {} }); voices = []; };

  const ROUND = {
    async listen(L, i, R) {
      frame(L, i, `<div class="en-oto">${img("oto_listen")}</div><div class="en-cards n${R.pool ? 3 : R.options.length}"></div>`);
      await say(bg("listen"));
      for (const w of R.items) {
        const opts = R.pool ? shuffle([w].concat(shuffle(R.pool.filter(x => x !== w)).slice(0, 2))) : shuffle(R.options.includes(w) ? R.options : [w].concat(R.options.slice(0, 2)));
        const al = altFor(w);
        app.querySelector(".en-cards").innerHTML = opts.map(o => `<button class="en-cardpic" data-w="${o}" type="button">${img(o === w && al.img ? al.img : D.words[o].img, "", o)}</button>`).join("");
        const W = D.words[w];
        await ask(al.voice ? [["t2", W.prompt]] : firstHear(w), ".en-cardpic", el => el.dataset.w === w, [["oto", W.yes]], [["oto", W.model]], (al.img || al.voice ? "alt:" : "") + w);
      }
    },
    async polly(L, i, R) {
      frame(L, i, `<div class="en-polly">${img("polly")}</div><div class="en-cmd"></div><button class="en-done" id="en-done" type="button">✓ Готово</button>`);
      await say(bg(R.items.some(c => c.w) ? "polly_point" : "polly"));
      for (const c of R.items) {
        if (c.w) {   // „Point to Mum!“ / „Touch green!“ – 3 картинки, детето докосва вярната
          const box = app.querySelector(".en-cmd"), opts = shuffle([c.w].concat(shuffle((R.pool || []).filter(x => x !== c.w)).slice(0, 2)));
          box.innerHTML = `<div class="en-cards n3">${opts.map(o => `<button class="en-cardpic" data-w="${o}" type="button">${img(D.words[o].img, "", o)}</button>`).join("")}</div>`;
          const dn = document.getElementById("en-done"); dn.hidden = dn.disabled = true;
          await ask([["polly", c.c]], ".en-cmd .en-cardpic", el => el.dataset.w === c.w, [["oto", pick(["Great!", "Yes!", "Well done!"].filter(x => A["oto|" + x]))]], [["oto", D.words[c.w].model || D.words[c.w].say]], "cmd:" + c.w);
          dn.hidden = dn.disabled = false; continue;
        }
        const C = D.commands[c]; app.querySelector(".en-cmd").innerHTML = img(C.img, "pop", c);
        speakerLoop(() => say([["polly", C.say]])); await say([["polly", C.say]]);
        await tapOnce("#en-done"); await say([["oto", pick(["Great!", "Yes!", "Well done!"].filter(x => A["oto|" + x]))]]);
      }
    },
    async say(L, i, R) {
      // жест само там, където има естествено движение (действия и команди) – „Кажи го и го покажи като Ото!“
      const GEST = { swim: "oto_swim", fly: "oto_fly" };   // jump, run, hello, goodbye – картинката вече е Ото в движение
      const gestOf = it => GEST[it.w] || (/^Put on/.test(it.say) ? "oto_puton" : /^Take off/.test(it.say) ? "oto_takeoff" : /Can I have/.test(it.say) ? "oto_give" : /^Here you are/.test(it.say) ? "oto_give" : /^Thank you/.test(it.say) ? "oto_thanks" : /^Come (in|here)/.test(it.say) ? "oto_come" : (/I can (jump|swim|fly|run)/.exec(it.say) || [])[1] ? "oto_" + /I can (jump|swim|fly|run)/.exec(it.say)[1] : null);
      let toldDo = false;
      const items = R.items.map(w => typeof w === "object" ? { img: D.words[w.w].img, say: w.say, ask: w.ask } : /^#\d+$/.test(w) ? { img: null, n: +w.slice(1), ob: "w_flower", say: D.numbers[+w.slice(1) - 1].replace(/^./, c => c.toUpperCase()) + "!" } : R.numbers ? { img: null, n: D.numbers.indexOf(w) + 1, say: w.charAt(0).toUpperCase() + w.slice(1) + "!" } : { w, img: D.words[w].img, say: R.reply ? R.reply.replace("{}", D.words[w].text) : D.words[w].say, ask: R.ask && R.ask.replace("{}", D.words[w].text) });
      (R.extra || []).forEach(e => items.push({ img: "oto_hello", say: e.model, ask: e.ask }));
      frame(L, i, `<div class="en-oto small">${img("oto_ask")}</div><div class="en-say"></div><div class="en-mic"></div>`);
      await say(bg(MIC ? "say" : "say_nomic"));
      for (const it of items) {
        app.querySelector(".en-say").innerHTML = it.img ? img(it.img, "pop") : `<div class="en-fishrow pop${it.n > 5 ? " many" : ""}${it.n > 8 ? " lots" : ""}">${img(it.ob || "w_fish").repeat(it.n)}</div>`;
        const g0 = it.img && gestOf(it), g = g0 && !/^(oto_|w_jump$|w_run$)/.test(it.img) || (g0 && /^Put|^Take|Can I|^Here|^Thank|^Come/.test(it.say)) ? g0 : null; if (g) app.querySelector(".en-say").insertAdjacentHTML("beforeend", `<span class="en-gest">${img(g)}</span>`);
        if (g && !toldDo) { toldDo = true; await say(bg("say_do")); }
        const q = [["oto", it.ask || (it.n ? "How many?" : "What's this?")]]; speakerLoop(() => say(q)); await say(q);
        await recordOrSay(); if (it.w) { const p = prog(); p.said = p.said || {}; p.said[it.w] = (p.said[it.w] || 0) + 1; wr(p); }
        await say([["oto", it.say]]); await wait(300);
      }
    },
    async ask(L, i, R) {   // „Ото пита“: един въпрос (зона 1) или няколко (R.items – напр. „Can I have the car, please?“ → „Here you are.“ / „Thank you.“)
      const pic = Object.assign({ "I'm Oto.": "oto_hello", "Goodbye!": "oto_bye", "I'm five.": "five", "Hello!": "oto_hello", "Here you are.": "oto_give", "Thank you.": "oto_thanks", "Thank you!": "oto_thanks", "Yes!": "w_yes", "No!": "w_no" }, R.pics || {});
      frame(L, i, `<div class="en-oto">${img("oto_ask")}</div><div class="en-say small"></div><div class="en-mic"></div><div class="en-cards n2 en-bubbles"></div>`);
      await say(bg(R.items ? (R.items.some(q => q.answers[0] === "Yes!") ? "ask_yn" : R.items.some(q => q.answers[0] === "I like it!") ? "ask_like" : "ask_many") : "ask"));
      for (const Q of (R.items || [R])) {
        const sh = app.querySelector(".en-say"); sh.innerHTML = Q.img ? img(Q.img, "pop") : ""; app.querySelector(".en-bubbles").innerHTML = "";
        if (!R.items) { await say([["oto", Q.childQ || Q.q]]); await recordOrSay(); }   // при няколко въпроса – въпросът се чува веднъж, заедно с отговорите   // говоренето не се оценява; изборът по-долу е проверената част
        if (Q.childQ) await say([["oto", Q.q]]);
        const opts = shuffle(Q.answers.map((a, k) => ({ a, k })));
        app.querySelector(".en-bubbles").innerHTML = opts.map((o, n) => R.hear ? `<button class="en-cardpic en-bub en-hear" data-k="${o.k}" type="button"><span class="en-play-ic">🔊</span><b>${n + 1}</b></button>` : `<button class="en-cardpic en-bub" data-k="${o.k}" type="button">${pic[o.a] === "five" ? `<span class="en-five">${"🕯️".repeat(5)}</span>` : img(pic[o.a] || "oto_hello")}<span class="en-play-ic">🔊</span></button>`).join("");
        const hl = async () => { stop(); const t = token; await play1("oto", Q.q); for (const o of opts) { if (t !== token) return; const b = app.querySelector(`.en-bub[data-k="${o.k}"]`); b && b.classList.add("lit"); await play1("oto", o.a); b && b.classList.remove("lit"); await wait(200); } };
        speakerLoop(hl); await hl();
        // Q.correct < 0: няма верен отговор („Can you swim?“ – истината за самото дете)
        window.EN_OK = el => Q.correct < 0 || +el.dataset.k === Q.correct;
        const el = await choice([...app.querySelectorAll(".en-bub")]); stop();
        if (Q.correct < 0) { el.classList.add("ok"); await say([["oto", Q.answers[+el.dataset.k]], ["oto", pick(["Great!", "Well done!"].filter(x => A["oto|" + x]))]]); await wait(300); continue; }
        const ok = +el.dataset.k === Q.correct; firstTry("ask:" + Q.q, ok);
        if (ok) { el.classList.add("ok"); await say([[Q.yesVoice || R.yesVoice || "oto", Q.yes]]); }
        else { el.classList.add("no"); const g = app.querySelector(`.en-bub[data-k="${Q.correct}"]`); g.classList.add("ok"); await say([["oto", Q.answers[Q.correct]]]); }
        await wait(300);
      }
    },
    async count(L, i, R) {
      frame(L, i, `<div class="en-oto small">${img("oto_listen")}</div><div class="en-cards n3 en-groups"></div>`);
      await say(bg("count"));
      for (const n of R.items) {
        const others = shuffle([...Array(Math.max(R.max, 3)).keys()].map(k => k + 1).filter(k => k !== n)).slice(0, 2), opts = shuffle([n].concat(others));
        const ob = R.obj || "fish", pl = k => ob === "fish" || k === 1 ? ob : (D.words[ob].plural || ob + "s");
        app.querySelector(".en-groups").innerHTML = opts.map(k => `<button class="en-cardpic en-grp" data-n="${k}" type="button"><span class="en-fishrow${k > 5 ? " many" : ""}${k > 8 ? " lots" : ""}">${img(D.words[ob].img).repeat(k)}</span></button>`).join("");
        const w = D.numbers[n - 1], W = w.charAt(0).toUpperCase() + w.slice(1);
        await ask([["oto", `Show me ${w} ${pl(n)}!`]], ".en-grp", el => +el.dataset.n === n, [["oto", `${W} ${pl(n)}! You got it!`]], [["oto", "Look: " + D.numbers.slice(0, n).join(", ") + "."]], "num:" + w);
      }
    },
    async sound(L, i, R) {
      frame(L, i, `<div class="en-say"></div><div class="en-yn"><button class="en-cardpic en-y" data-v="1" type="button">👍<small>да</small></button><button class="en-cardpic en-n" data-v="0" type="button">👎<small>не</small></button></div>`);
      await say(bg(R.ref === "this" ? "sound_th" : R.ref === "toy" ? "sound_oy" : R.ref === "three" ? "sound_th3" : R.ref === "walk" ? "sound_w" : R.ref === "apple" ? "sound_ae" : R.ref === "shoes" ? "sound_z" : R.ref === "sheep" ? "sound_ii" : "sound"));
      for (const [w, h] of R.items) {
        app.querySelector(".en-say").innerHTML = img(D.words[w].img, "pop", w);
        await ask([["oto", D.words[w].say], ["oto", R.q || `Does it start like ${R.ref || "hello"}?`]], ".en-yn .en-cardpic", el => +el.dataset.v === h,
          [["oto", h ? "Yes, it does!" : "No, it doesn't."]], [["oto", D.words[w].say], ["oto", h ? "Yes, it does!" : "No, it doesn't."]], "h:" + w);
      }
    },
    async missing(L, i, R) {
      frame(L, i, `<div class="en-oto small">${img("oto_look")}</div><div class="en-cards n4 en-mem"></div><div class="en-cards n2 en-memq"></div>`);
      await say(bg("missing"));
      for (let t = 0; t < R.trials; t++) {
        const set = shuffle(R.pool), gone = set[t % set.length];
        const mem = app.querySelector(".en-mem"), q = app.querySelector(".en-memq"); q.innerHTML = "";
        mem.innerHTML = set.map(w => `<span class="en-cardpic flat" data-w="${w}">${img(D.words[w].img)}</span>`).join("");
        await say([["oto", "Look!"]]); await wait(2600);
        mem.classList.add("covered"); await wait(900);
        mem.querySelector(`[data-w="${gone}"]`).classList.add("gone"); mem.classList.remove("covered");
        const zw = Object.keys(D.words).filter(k => D.words[k].zone === zoneOf(L).id && !set.includes(k) && D.words[k].img && !D.words[k].sound_only);
        const other = shuffle(zw.length ? zw : ["hello", "goodbye"].filter(k => !set.includes(k)))[0] || "hello";
        q.innerHTML = shuffle([gone, other]).map(w => `<button class="en-cardpic" data-w="${w}" type="button">${img(D.words[w].img)}</button>`).join("");
        await ask([["oto", "What's missing?"]], ".en-memq .en-cardpic", el => el.dataset.w === gone, seen(gone), [["oto", D.words[gone].say]], "miss:" + gone, "Look again!");
        mem.classList.remove("covered");
      }
    },
    // историята в три гледания (решение 28.10.2026): (3) „Помниш ли?“ – предвиждане от предишната история; (1) новата история + въпрос за основното;
    // (2) „Чуй думата“ – Ото пуска репликите с новите думи и детето посочва думата. Всяко гледане има своя цел.
    async story(L, i, R) {
      const S = D.stories[String(R.ep)], p0 = prog(); p0.sv = p0.sv || {};
      frame(L, i, `<div class="en-story">${img(S.img, "en-epimg")}<div class="en-who" id="en-who"></div></div><div class="en-cards n2 en-sq"></div>`);
      const tag = v => { const w = document.getElementById("en-who"); if (w) w.innerHTML = v ? `<span class="en-tag ${v}">${img((WHO[v] || [])[1] || v)}${(WHO[v] || [v])[0]}</span>` : ""; };
      const playLines = async (lines, t) => { for (const [v, s, pause] of lines) { if (t !== token) return; tag(v); await play1(v, s); await wait(pause ? 600 : 250); } tag(""); };
      // (3) предвиждане: предишна история, видяна до 2 пъти
      const prev = Object.keys(p0.sv).map(Number).filter(e => e !== R.ep && p0.sv[e] < 3 && D.stories[String(e)]).sort((a, b) => b - a)[0];
      const PS = prev && D.stories[String(prev)], k = PS ? PS.lines.findIndex((x, j) => /Can you help/.test(x[1]) && PS.lines[j + 1] && !/Can you help/.test(PS.lines[j + 1][1])) : -1;
      if (PS && k >= 0) {
        app.querySelector(".en-epimg").src = IMG + PS.img + ".webp?v=2"; await say(bg("story_predict"));
        const good = PS.lines[k + 1], others = Object.values(D.stories).filter(x => x !== PS && x !== S).flatMap(x => x.lines).filter(x => x[0] !== "bg" && x[1] !== good[1] && !/Can you help/.test(x[1]));
        const bad = pick(others), opts = shuffle([good, bad]), box = app.querySelector(".en-sq");
        box.innerHTML = opts.map((o, n) => `<button class="en-cardpic en-bub en-hear" data-k="${o === good ? 1 : 0}" type="button"><span class="en-play-ic">🔊</span><b>${n + 1}</b></button>`).join("");
        const hl = async () => { stop(); const t = token; await playLines(PS.lines.slice(Math.max(0, k - 1), k + 1), t); for (const o of opts) { if (t !== token) return; const b = box.querySelector(`[data-k="${o === good ? 1 : 0}"]`); b.classList.add("lit"); tag(o[0]); await play1(o[0], o[1]); b.classList.remove("lit"); await wait(250); } tag(""); };
        speakerLoop(hl); await hl();
        await ask([], ".en-sq .en-bub", el => el.dataset.k === "1", [[good[0], good[1]], ["oto", "Yes! You remember!"]], [[good[0], good[1]]], "pred:" + prev);
        p0.sv = prog().sv || p0.sv; p0.sv[prev] = 3; const q = prog(); q.sv = p0.sv; wr(q);
        box.innerHTML = ""; app.querySelector(".en-epimg").src = IMG + S.img + ".webp?v=2";
      }
      // (1) новата история: гледаме и отговаряме за основното
      await say(bg("story"));
      const tell = async () => { stop(); const t = token; await playLines(S.lines, t); };
      speakerLoop(tell); await tell();
      for (const qq of R.questions) {
        const box = app.querySelector(".en-sq");
        if (qq.count) box.innerHTML = shuffle(qq.count).map(k => `<button class="en-cardpic" data-a="${k}" type="button"><span class="en-fishrow">${img(qq.obj || "w_fish").repeat(k)}</span></button>`).join("");
        else box.innerHTML = shuffle(qq.options).map(o => `<button class="en-cardpic" data-a="${o}" type="button">${img(o)}</button>`).join("");
        await ask([["oto", qq.q]], ".en-sq .en-cardpic", el => el.dataset.a === String(qq.answer), [["oto", qq.yes]], [["oto", qq.yes]], "story:" + R.ep);
      }
      // (2) „Чуй думата“: до 2 реплики с новите думи на занятието
      const ws = ((L.learn || {}).words || []).filter(w => D.words[w] && D.words[w].img && !D.words[w].sound_only);
      const hits = [];
      for (const w of ws) { const re = new RegExp("\\b" + D.words[w].text.replace(/[-]/g, ".") + "s?\\b", "i"), ln = S.lines.find(x => re.test(x[1]) && !hits.some(h => h[1] === x)); if (ln) hits.push([w, ln]); if (hits.length >= 2) break; }
      if (hits.length) {
        await say(bg("story_words"));
        for (const [w, ln] of hits) {
          const other = shuffle(ws.filter(x => x !== w).concat(Object.keys(D.words).filter(x => D.words[x].zone === zoneOf(L).id && D.words[x].img && !D.words[x].sound_only && x !== w)))[0];
          if (!other) continue;
          const box = app.querySelector(".en-sq");
          box.innerHTML = shuffle([w, other]).map(o => `<button class="en-cardpic" data-w="${o}" type="button">${img(D.words[o].img)}</button>`).join("");
          const once = async () => { stop(); const t = token; await playLines([ln], t); };
          speakerLoop(once); await once();
          await ask([], ".en-sq .en-cardpic", el => el.dataset.w === w, [["oto", D.words[w].yes || D.words[w].say]], [["oto", D.words[w].say]], "st:" + w);
        }
      }
      { const q = prog(); q.sv = q.sv || {}; q.sv[R.ep] = Math.max(q.sv[R.ep] || 0, hits.length ? 2 : 1); wr(q); }
      if (!R.questions.length && !hits.length) { app.querySelector(".en-sq").innerHTML = `<button class="en-done" id="en-done" type="button">✓ Готово</button>`; await tapOnce("#en-done"); }
    },
    async song(L, i, R) {   // песен-ехо: мелодията (народна) + Polly казва реда в ритъм → детето повтаря върху същата мелодия; картинки вместо текст
      const S = D.songs[R.song], kids = "🧒";
      frame(L, i, `<div class="en-karaoke"><div class="en-kline" id="en-kline"></div><div class="en-kturn" id="en-kturn"></div>
        <div class="en-kchars">${img("polly", "bob")}${img("oto_hello", "bob2")}</div><p class="en-ktext" id="en-ktext"></p></div>
        <button class="en-done" id="en-done" type="button" disabled>✓ Готово</button>`);
      await say(bg("song"));
      const pic = x => /^n\d+$/.test(x) ? `<span class="en-kpic num">${img("w_fish").repeat(+x.slice(1) > 5 ? 1 : +x.slice(1))}${+x.slice(1) > 5 ? `<b>${x.slice(1)}</b>` : ""}</span>` : `<span class="en-kpic">${img(x)}</span>`;
      const run = async () => {
        stop(); const t = token;
        await sleepMs(melody(S.lines[0].notes, S.bpm, .18));   // въведение – само мелодията
        for (const ln of S.lines) {
          if (t !== token) return;
          const box = document.getElementById("en-kline"), turn = document.getElementById("en-kturn"), tx = document.getElementById("en-ktext"); if (!box) return;
          box.innerHTML = ln.pics.map(pic).join(""); tx.textContent = ln.t;
          for (const who of ["polly", "child"]) {
            if (t !== token) return;
            turn.className = "en-kturn " + who; turn.innerHTML = who === "polly" ? `${img("polly")}<b>Polly</b>` : `<span>${kids}</span><b>Сега ти!</b>`;
            const ms = melody(ln.notes, S.bpm, who === "polly" ? .14 : .22), ps = [...box.querySelectorAll(".en-kpic")];
            ps.forEach((p, k) => setTimeout(() => { if (t === token) { ps.forEach(q => q.classList.remove("on")); p.classList.add("on"); } }, k * ms / ps.length));
            await Promise.all([sleepMs(ms), who === "polly" ? play1("chant", ln.t) : Promise.resolve()]);
            ps.forEach(q => q.classList.remove("on")); await wait(350);
          }
        }
        const tu = document.getElementById("en-kturn"); if (tu) { tu.className = "en-kturn"; tu.innerHTML = ""; }
      };
      speakerLoop(run);
      const done = document.getElementById("en-done"); setTimeout(() => { done.disabled = false; }, FAST ? 10 : 6000);
      run(); await tapOnce("#en-done"); stop();
    },
    async colourq(L, i, R) {   // Ото показва цвят и пита „What colour is it?“; два чути отговора (без картинки) – детето избира този, който пасва
      frame(L, i, `<div class="en-oto small">${img("oto_ask")}</div><div class="en-say"></div><div class="en-cards n2 en-bubbles"></div>`);
      await say(bg(R.q ? "whoq" : "colourq"));
      const Q = R.q || "What colour is it?", fill = (t, x) => t.replace("{}", D.words[x].text);
      for (const [c, o] of R.items) {
        app.querySelector(".en-say").innerHTML = img(D.words[c].img, "pop", c);
        const opts = shuffle([c, o]), ans = x => fill(R.ans || "It's {}.", x);
        app.querySelector(".en-bubbles").innerHTML = opts.map((x, k) => `<button class="en-cardpic en-bub en-hear" data-c="${x}" type="button"><span class="en-play-ic">🔊</span><b>${k + 1}</b></button>`).join("");
        const hl = async () => { stop(); const t = token; await play1("oto", Q); for (const x of opts) { if (t !== token) return; const b = app.querySelector(`.en-bub[data-c="${x}"]`); b && b.classList.add("lit"); await play1("oto", ans(x)); b && b.classList.remove("lit"); await wait(250); } };
        speakerLoop(hl); await hl();
        await ask([], ".en-bub", el => el.dataset.c === c, [["oto", fill(R.yes || "Yes! It's {}!", c)]], [["oto", ans(c)]], (R.q ? "who:" : "col:") + c);
      }
    },
    async size(L, i, R) {   // „Show me the big teddy!“ – една и съща играчка, голяма и малка
      frame(L, i, `<div class="en-oto small">${img("oto_look")}</div><div class="en-cards n2 en-size"></div>`);
      await say(bg("size"));
      for (const [w, sz] of R.items) {
        const t = D.words[w].text, box = app.querySelector(".en-size");
        box.innerHTML = shuffle(["big", "small"]).map(z => `<button class="en-cardpic en-sz ${z}" data-z="${z}" type="button">${img(D.words[w].img)}</button>`).join("");
        await ask([["oto", `Show me the ${sz} ${t}!`]], ".en-size .en-cardpic", el => el.dataset.z === sz, [["oto", `Yes! The ${sz} ${t}!`]], [["oto", `Look! The ${sz} ${t}.`]], sz, "Look again!");
      }
    },
    async like(L, i, R) {   // „I like…“ – няма верен отговор: детето избира, Ото казва изречението, детето го повтаря
      frame(L, i, `<div class="en-oto small">${img("oto_ask")}</div><div class="en-cards n3 en-like"></div><div class="en-mic"></div>`);
      await say(bg("like"));
      for (let t = 0; t < R.trials; t++) {
        const opts = shuffle(R.pool).slice(0, 3), box = app.querySelector(".en-like");
        box.innerHTML = opts.map(c => `<button class="en-cardpic" data-c="${c}" type="button">${img(D.words[c].img)}</button>`).join("");
        const q = [["oto", "What colour do you like?"]]; speakerLoop(() => say(q)); await say(q);
        window.EN_OK = () => true;
        const el = await choice([...box.querySelectorAll(".en-cardpic")]); window.EN_OK = null; el.classList.add("ok");
        await say([["oto", `I like ${D.words[el.dataset.c].text}!`]]);
        await recordOrSay(); await say([["oto", pick(["Yes!", "Well done!"])]]); await wait(300);
      }
    },
    async teach(L, i, R) {
      frame(L, i, `<p class="en-adult">За родителя: детето казва думата на английски. Отбележете ✓, ако я каза само. Докосване на картинката пуска думата.</p><div class="en-cards n5 en-teach">${R.items.map(w => `<div class="en-tcard"><button class="en-cardpic" data-w="${w}" type="button">${img(D.words[w].img)}</button><button class="en-chk" data-w="${w}" type="button" aria-pressed="false">✓</button></div>`).join("")}</div><button class="en-done" id="en-done" type="button">Готово</button>`);
      await say(bg("teach"));
      app.querySelectorAll(".en-teach .en-cardpic").forEach(b => b.onclick = () => say([["oto", D.words[b.dataset.w].say]]));
      app.querySelectorAll(".en-chk").forEach(b => b.onclick = () => { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", on); });
      await tapOnce("#en-done");
      const p = prog(); p.teach = p.teach || {}; app.querySelectorAll(".en-chk").forEach(b => { p.teach[b.dataset.w] = b.getAttribute("aria-pressed") === "true"; }); wr(p);
    }
  };

  // ---------- „Кажи го“: запис само на таблета (не се качва никъде), после детето чува себе си и модела ----------
  let MIC = !!(navigator.mediaDevices && window.MediaRecorder);
  async function recordOrSay() {
    const box = app.querySelector(".en-mic"); if (!box) return;
    if (!MIC) { box.innerHTML = `<button class="en-micbtn" type="button">🗣️ Казах го</button>`; await tapOnce(".en-micbtn"); box.innerHTML = ""; return; }
    box.innerHTML = `<button class="en-micbtn" type="button">🎤 Кажи го</button>`;
    await tapOnce(".en-micbtn"); stop();
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { MIC = false; box.innerHTML = `<button class="en-micbtn" type="button">🗣️ Казах го</button>`; await tapOnce(".en-micbtn"); box.innerHTML = ""; return; }
    const rec = new MediaRecorder(stream), chunks = []; rec.ondataavailable = e => chunks.push(e.data);
    box.innerHTML = `<span class="en-rec">● слушам…</span>`; rec.start(); await wait(2500); rec.stop();
    await new Promise(r => rec.onstop = r); stream.getTracks().forEach(t => t.stop());
    const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })); box.innerHTML = `<span class="en-rec me">🔁 ти</span>`;
    await new Promise(r => { const a = new Audio(url); a.onended = r; a.onerror = r; a.play().catch(r); });
    URL.revokeObjectURL(url); box.innerHTML = "";
  }

  // ---------- начален екран: 4 карти (решение 26.10.2026) ----------
  let G = null;   // config/english-games.json
  // режим „преглед“ за възрастни: всички пристани, игри и епизоди отключени; помни се за сесията (като в „Подготовка за училище“); ?review=0 го изключва
  try { if (Q.get("review") === "1") sessionStorage.setItem("platforma.review", "1"); if (Q.get("review") === "0") sessionStorage.removeItem("platforma.review"); } catch (e) {}
  const REVIEW = (() => { try { return sessionStorage.getItem("platforma.review") === "1"; } catch (e) { return Q.get("review") === "1"; } })();
  if (REVIEW) document.documentElement.classList.add("review-mode");
  const reached = () => REVIEW ? 10 : Z.id + (lessonsDone() >= 6 ? 1 : 0);   // докъде е стигнала лодката
  function start() {
    stop(); Z = zoneNow(); BACK = () => start();
    const T = G.start, L = current(), n = lessonsDone(), dots = Z.lessons.map(x => `<i class="${lessonState(x).complete ? "on" : x === L ? "now" : ""}"></i>`).join("");
    const card = (id, art, t, sub) => `<button class="en-scard" id="${id}" type="button">${img(art, "en-sart")}<span class="en-stxt"><b>${esc(t)}</b><small>${esc(sub)}</small></span><i class="en-sgo" aria-hidden="true">›</i></button>`;
    app.innerHTML = `<section class="en-start">
      <header class="en-shead">${ROSTER ? `<button class="en-btn ghost en-tohome" id="en-kid" type="button" aria-label="Кой играе?">👥</button>` : CHILD ? `<a class="en-btn ghost en-tohome" href="index.html" aria-label="Към Моят свят">⌂</a>` : ""}${img("oto_hello", "en-shero")}<b>English</b></header>
      <div class="en-sgrid">
        <div class="en-sjourney" id="t-journey" role="button" tabindex="0"><span class="en-sstage">${stageHtml({ still: true })}</span>
          <span class="en-stxt big"><b>${esc(T.journey.title)}</b><small>${esc(T.journey.sub)}</small></span>
          <span class="en-sbadge"><b>Пристан ${Z.id}</b><small>${esc(G.zoneNames[Z.id])}</small><span class="en-dots">${dots}</span></span>
          <button class="en-scont" id="t-cont" type="button"><svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg><span><b>${L ? "Продължи" : "Към реката"}</b><small>${L ? `${esc(G.zoneNames[Z.id])} · занятие ${L.n}` : "Домашното е готово"}</small></span></button>
        </div>
        ${card("t-games", "s_games", T.games.title, T.games.sub)}
        ${card("t-book", "s_book", T.book.title, T.book.sub)}
        ${card("t-dict", "s_dict", T.dict.title, T.dict.sub)}
      </div></section>`;
    // гласова навигация: кратко приветствие веднъж за сесията; при докосване героят казва името на картата
    const V = G.voice, go = (fn, line) => () => { fn(); say([["bg", line]]); };
    document.getElementById("t-cont").onclick = e => { e.stopPropagation(); if (L && resting()) { home(); say([["bg", D.instructions.rest]]); } else if (L) { say([["bg", V.cont]]); startLesson(L); } else go(() => home(), V.journey)(); };
    document.getElementById("t-journey").onclick = go(() => home(), V.journey);
    const who = document.getElementById("en-kid"); if (who) who.onclick = () => { stop(); location.replace("english.html?who=1"); };
    document.getElementById("t-games").onclick = go(() => games(), V.games);
    document.getElementById("t-book").onclick = go(() => book(), V.book);
    document.getElementById("t-dict").onclick = go(() => dict(), V.dict);
    let greeted = false; try { greeted = sessionStorage.getItem("platforma.en.hi") === "1"; sessionStorage.setItem("platforma.en.hi", "1"); } catch (e) {}
    if (!greeted) say([["oto", "Hello!"], ["bg", L ? V.hi : V.hi_done]]);
  }
  function soon(k) { say([["bg", G.instructions[k]]]); }

  // ---------- игрите ----------
  // екран „Игри“: „Днес с Ото“ (3 препоръчани игри с думите от последното занятие и повторението) + всички игри;
  // цветен фон по вида игра, заключените „чакат“ на своя пристан (не са сиви), „Ново!“ при току-що отключена игра; при докосване – името на глас
  function todayGames(r) {
    const open = G.games.filter(g => g.zone <= r), day = Math.floor(Date.now() / 864e5), pick2 = (a, k) => a[k % a.length];
    const L = current() || Z.lessons[Math.max(0, Math.min((prog().classAt || 1), 6) - 1)], n = (L.learn || {}).numbers || [];
    const rec = [open.find(g => g.id === "listen")];
    rec.push(pick2(open.filter(g => ["pairs", "missing"].includes(g.id)), day));
    rec.push(n.length ? open.find(g => g.id === "count") : pick2(open.filter(g => ["songs", "polly", "colour", "dress", "where"].includes(g.id)), day));
    return rec.filter(Boolean);
  }
  function games() {
    stop(); BACK = () => start();
    const r = reached(), p = prog(), seen = p.seenGames || [], rec = todayGames(r), rest = G.games.filter(g => !rec.includes(g));
    const isNew = g => g.zone <= r && g.zone > 1 && !seen.includes(g.id);
    const tile = (g, big) => { const lock = g.zone > r;
      return `<button class="en-gt ${g.color}${big ? " big" : ""}${lock ? " wait" : ""}" data-g="${g.id}" type="button">${img(g.art, "en-gtart")}
        ${lock ? `<span class="en-mistc"></span><span class="en-gwait">${img(G.zoneIcons[g.zone])}Чака на ${esc(G.zoneNames[g.zone])}</span>` : ""}
        ${isNew(g) ? `<span class="en-gnew">Ново!</span>` : ""}<b>${esc(g.title)}</b></button>`; };
    app.innerHTML = `<section class="en-games en-ghub"><header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Начало">⌂</button><b class="en-gtitle">Игри</b><span></span></header>
      <div class="en-today"><h3>${img("oto_hello")}Днес с Ото</h3><div class="en-trow">${rec.map(g => tile(g, true)).join("")}</div></div>
      <h3 class="en-dz">Всички игри</h3><div class="en-gall">${rest.map(g => tile(g, false)).join("")}</div></section>`;
    document.getElementById("en-x").onclick = () => start();
    app.querySelectorAll(".en-gt").forEach(b => b.onclick = () => {
      const g = G.games.find(x => x.id === b.dataset.g);
      if (g.zone > r) return say([["bg", G.instructions.locked]]);
      const fromToday = !!b.closest(".en-today");
      if (g.topic && !fromToday) topic(g); else play(g, g.topic ? [Math.min(r, 10)] : null);   // от „Днес“ – направо с думите на текущия пристан
      say([["bg", g.say]]);
    });
    p.seenGames = G.games.filter(g => g.zone <= r).map(g => g.id); wr(p);
  }
  function topic(g) {   // избор на пристан – по картинка, не по текст
    stop(); const r = Math.min(reached(), 10), zs = [];
    for (let z = 1; z <= r; z++) zs.push(z);
    app.innerHTML = `<section class="en-games"><header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Игри">✕</button><b class="en-gtitle">${esc(g.title)}</b><span></span></header>
      <div class="en-gtiles">${zs.map(z => `<button class="en-gtile" data-z="${z}" type="button">${img(G.zoneIcons[z], "fit")}<b>${esc(G.zoneNames[z])}</b></button>`).join("")}
      ${zs.length > 1 ? `<button class="en-gtile" data-z="all" type="button">${img("boat", "fit")}<b>Всички пристани</b></button>` : ""}</div></section>`;
    document.getElementById("en-x").onclick = () => games();
    app.querySelectorAll("[data-z]").forEach(b => b.onclick = () => play(g, b.dataset.z === "all" ? zs : [+b.dataset.z]));
    say([["bg", G.instructions.topic]]);
  }
  const wordsOf = zs => Object.keys(D.words).filter(k => { const w = D.words[k]; return zs.includes(w.zone) && !w.sound_only && w.prompt && (w.kind || "noun") !== "prep"; });
  async function play(g, zs) {
    stop(); BACK = () => g.topic ? topic(g) : games();   // от игра с избор на пристан – обратно към избора на пристан
    const r = reached(), pool = shuffle(wordsOf(zs || [1]));
    const L = { id: "GAME", title: g.title, rounds: [{ type: g.id }] };
    let R;
    if (g.id === "listen") R = { type: "listen", items: pool.slice(0, 6).concat(shuffle(pool).slice(0, 2)), options: null, pool };
    else if (g.id === "missing") R = { type: "missing", pool: pool.slice(0, 4), trials: 3 };
    else if (g.id === "count") { const max = G.numberZone.filter(z => z <= r).length; R = { type: "count", items: shuffle([...Array(max).keys()].map(i => i + 1)).slice(0, 6), max }; }
    else if (g.id === "sound") R = { type: "sound", items: shuffle([["hello", 1], ["sun", 0], ["hat", 1], ["boat", 0], ["hand", 1], ["fish", 0]]) };
    else R = { type: g.id, pool, zs };
    try { await (GAME[g.id] || ROUND[g.id])(L, 0, R); } catch (e) { console.warn(e); }
    gameDone(g, zs);
  }
  function gameDone(g, zs) {
    app.insertAdjacentHTML("beforeend", `<div class="en-adult-ov"><div class="en-adult-box en-center">${img("oto_clap", "en-donehero")}<h2>Браво!</h2>
      <div class="en-row"><button class="en-btn" id="g-again" type="button">Още веднъж</button>${g.topic ? `<button class="en-btn" id="g-pier" type="button">Друг пристан</button>` : ""}<button class="en-btn" id="g-other" type="button">Друга игра</button></div></div></div>`);
    document.getElementById("g-again").onclick = () => play(g, zs);
    document.getElementById("g-other").onclick = () => games();
    const gp = document.getElementById("g-pier"); if (gp) gp.onclick = () => topic(g);
    say([["oto", "Well done! You did it!"], ["bg", G.instructions.game_done]]);
  }

  const GAME = {
    async listen(L, i, R) {   // свободна игра: всеки път 3 картинки от темата
      frame(L, i, `<div class="en-oto">${img("oto_listen")}</div><div class="en-cards n3"></div>`);
      await say(bg("listen"));
      for (const w of R.items) {
        const opts = shuffle([w].concat(shuffle(R.pool.filter(x => x !== w)).slice(0, 2)));
        app.querySelector(".en-cards").innerHTML = opts.map(o => `<button class="en-cardpic" data-w="${o}" type="button">${img(D.words[o].img, "", o)}</button>`).join("");
        const W = D.words[w], al = altFor(w);
        if (al.img) { const c = app.querySelector(`.en-cardpic[data-w="${w}"] img`); if (c) c.src = IMG + al.img + ".webp?v=1"; }
        await ask(al.voice ? [["t2", W.prompt]] : firstHear(w), ".en-cardpic", el => el.dataset.w === w, [["oto", W.yes]].concat(Math.random() < .3 ? [["oto", pick(D.praise_tap)]] : []), [["oto", W.model]], w);
      }
    },
    async polly(L, i, R) {   // „Polly says“: изпълнявай само ако Поли каже „Polly says“
      const cmds = shuffle(G.pollyCommands.filter(c => c.zone <= reached()));
      frame(L, i, `<div class="en-polly">${img("polly")}</div><div class="en-cmd"></div>
        <div class="en-yn"><button class="en-cardpic en-y" data-v="1" type="button">✅<small>направих го</small></button><button class="en-cardpic en-n" data-v="0" type="button">✋<small>Поли не каза!</small></button></div>`);
      await say([["bg", G.instructions.polly]]);
      const seq = cmds.slice(0, 8).map((c, k) => ({ c, said: k % 3 !== 2 }));
      for (const { c, said } of shuffle(seq)) {
        const S = c.c.charAt(0).toUpperCase() + c.c.slice(1) + "!";
        app.querySelector(".en-cmd").innerHTML = img(c.img, "pop", c.c);
        const line = said ? [["polly", "Polly says: " + c.c + "!"]] : [["polly", S]];
        await ask(line, ".en-yn .en-cardpic", el => +el.dataset.v === (said ? 1 : 0),
          [["oto", said ? "Yes!" : G.lines.polly_didnt]], [["oto", said ? G.lines.polly_did : G.lines.polly_didnt]], "polly:" + c.c + ":" + (said ? 1 : 0));
      }
    },
    async pairs(L, i, R) {   // мемори: две еднакви картинки; при обръщане се чува думата
      const ws = R.pool.slice(0, 4), cards = shuffle(ws.concat(ws));
      frame(L, i, `<div class="en-cards n4 en-pairs">${cards.map((w, k) => `<button class="en-cardpic en-pc" data-w="${w}" data-k="${k}" type="button"><span class="en-back">?</span>${img(D.words[w].img)}</button>`).join("")}</div>`);
      await say([["bg", G.instructions.pairs]]);
      let open = [], found = 0;
      await new Promise(res => {
        app.querySelectorAll(".en-pc").forEach(b => b.onclick = async () => {
          if (b.classList.contains("up") || open.length >= 2) return;
          b.classList.add("up"); open.push(b); say([["oto", D.words[b.dataset.w].say]]);
          if (open.length === 2) {
            await wait(900);
            const [a, c] = open;
            if (a.dataset.w === c.dataset.w) { a.classList.add("ok"); c.classList.add("ok"); found++; await say(seen(a.dataset.w)); }
            else { a.classList.remove("up"); c.classList.remove("up"); }
            open = [];
            if (found === ws.length) { await say([["oto", G.lines.pairs_done]]); res(); }
          }
        });
      });
    },
    async colour(L, i, R) {   // „Colour the fish red!“ – избира цвета, после докосва картинката
      const cols = ["red", "yellow", "blue", "green", "orange", "pink", "purple"];
      const SVG = {
        fish: '<path d="M20 60 Q60 20 110 60 Q60 100 20 60 Z M110 60 L140 35 L140 85 Z"/><circle cx="45" cy="55" r="5" fill="#222"/>',
        ball: '<circle cx="75" cy="60" r="48"/><path d="M27 60 Q75 40 123 60" fill="none" stroke="#fff" stroke-width="5"/>',
        flower: '<circle cx="75" cy="30" r="20"/><circle cx="45" cy="55" r="20"/><circle cx="105" cy="55" r="20"/><circle cx="58" cy="88" r="20"/><circle cx="92" cy="88" r="20"/><circle cx="75" cy="62" r="14" fill="#ffd34d"/>',
        balloon: '<ellipse cx="75" cy="50" rx="38" ry="46"/><path d="M75 96 Q70 110 80 118" fill="none" stroke="#666" stroke-width="3"/>'
      };
      frame(L, i, `<div class="en-palette">${cols.map(c => `<button class="en-paint" data-c="${c}" style="--c:${({ red: "#e53935", yellow: "#fdd835", blue: "#1e88e5", green: "#43a047", orange: "#fb8c00", pink: "#f06292", purple: "#8e24aa" })[c]}" type="button" aria-label="${c}"></button>`).join("")}</div>
        <div class="en-cards n4">${G.colourObjects.map(o => `<button class="en-cardpic en-col" data-o="${o}" type="button"><svg viewBox="0 0 150 125" class="en-svg" fill="#eee" stroke="#555" stroke-width="3">${SVG[o]}</svg></button>`).join("")}</div>`);
      await say([["bg", G.instructions.colour]]);
      let brush = null;
      app.querySelectorAll(".en-paint").forEach(b => b.onclick = () => { brush = b.dataset.c; app.querySelectorAll(".en-paint").forEach(x => x.classList.toggle("on", x === b)); say([["oto", D.words[brush].say]]); });
      const tasks = shuffle(G.colourObjects).map(o => ({ o, c: pick(cols) }));
      for (const t of tasks) {
        window.EN_COL = t;   // за тестовете
        const line = [["oto", `Colour the ${t.o} ${t.c}!`]]; speakerLoop(() => say(line)); await say(line);
        let first = true;
        for (;;) {
          const el = await choice([...app.querySelectorAll(".en-col")]);
          const ok = el.dataset.o === t.o && brush === t.c;
          if (first) firstTry("colour:" + t.c, ok); first = false;
          if (ok) { el.querySelector("svg").setAttribute("fill", app.querySelector(`.en-paint[data-c="${t.c}"]`).style.getPropertyValue("--c")); el.classList.add("ok"); await say([["oto", D.words[t.c].yes]]); el.classList.remove("ok"); break; }
          el.classList.add("no"); await say(line); el.classList.remove("no");
        }
      }
    },
    async dress(L, i, R) {   // Облечи Пипо: „Put on your hat, Pippo!“
      frame(L, i, `<div class="en-pippo">${img("w_pippo", "", "Pippo")}</div><div class="en-cards n3"></div>`);
      await say([["bg", G.instructions.dress], ["oto", G.lines.pippo_cold]]);
      for (const w of shuffle(G.dress)) {
        const opts = shuffle([w].concat(shuffle(G.dress.filter(x => x !== w)).slice(0, 2)));
        app.querySelector(".en-cards").innerHTML = opts.map(o => `<button class="en-cardpic" data-w="${o}" type="button">${img(D.words[o].img)}</button>`).join("");
        const line = [["oto", `Put on your ${D.words[w].text || w}, Pippo!`]];
        const ok = await ask(line, ".en-cardpic", el => el.dataset.w === w, [["oto", D.words[w].yes]], [["oto", D.words[w].model]], "dress:" + w);
        app.querySelector(".en-pippo").innerHTML = img("w_pippo_" + w.replace("-", ""), "pop", "Pippo"); void ok; await wait(700);   // Пипо се усмихва с всяка дреха
      }
      app.querySelector(".en-pippo").innerHTML = img("w_pippo_happy", "pop", "Pippo");   // накрая – облечен и щастлив
      await say([["oto", G.lines.pippo_warm]]);
    },
    async where(L, i, R) {   // Къде е? – Ото казва къде е играчката; детето избира картинката (in / on / under – еднакъв предмет на трите)
      frame(L, i, `<div class="en-oto">${img("oto_ask")}</div><div class="en-cards n3"></div>`);
      await say([["bg", G.instructions.where]]);
      const tasks = shuffle(G.whereSets.flatMap(set => set.items.map(it => ({ set, it })))).slice(0, 6);
      for (const { set, it } of tasks) {
        app.querySelector(".en-cards").innerHTML = shuffle(set.items).map(o => `<button class="en-cardpic" data-p="${o.p}" type="button">${img(o.img, "", o.p)}</button>`).join("");
        await ask([["oto", it.say]], ".en-cardpic", el => el.dataset.p === it.p, [["oto", it.yes]], [["oto", it.model]], "where:" + it.p);
      }
    },
    async songs(L, i, R) {
      const S = Object.keys(D.songs);
      frame(L, i, `<div class="en-cards n2">${S.map(k => `<button class="en-cardpic en-songbtn" data-s="${k}" type="button">${img(k === "fish" ? "w_fish" : "polly")}<small>${esc(D.songs[k].title)}</small></button>`).join("")}</div>`);
      await say([["bg", G.instructions.songs]]);
      const el = await choice([...app.querySelectorAll(".en-songbtn")]);
      await ROUND.song(L, i, { type: "song", song: el.dataset.s });
    }
  };

  // ---------- Речник: „Теми“ (пристаните – за детето) и „Всички думи“ (по азбучен ред – най-вече за родителя) ----------
  // напредък на думата в 3 стъпки: нова → разпознава веднъж → разпознава устойчиво (вярно от първия опит в 2 различни дни)
  const lvl = k => wstate(k);
  const LV = ["нова", "упражнява", "разпознава", "запомнил"];
  const said = k => ((prog().said || {})[k] || 0);
  const bars = k => `<span class="en-bars s${lvl(k)}" aria-label="${LV[lvl(k)]}"><i></i><i></i><i></i></span>${said(k) ? `<span class="en-said" title="опитвал се е да я каже">🗣️</span>` : ""}`;
  const zoneTabs = (z, r, fn) => `<nav class="en-ztabs">${[...Array(10).keys()].map(i => i + 1).map(n => `<button class="en-ztab${n === z ? " on" : ""}${n > r ? " locked" : ""}" data-z="${n}" type="button" aria-label="${esc(G.zoneNames[n])}">${img(G.zoneIcons[n], "fit")}${n > r ? "<i>🔒</i>" : ""}</button>`).join("")}</nav>`;
  function dict(zone, tab) {
    stop(); BACK = () => start();
    const r = reached(), z = zone || Math.min(r, 10), t = tab || "topics", p = prog();
    const head = `<header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Начало">⌂</button><b class="en-gtitle">Речник</b><button class="en-spk" id="en-all" type="button" aria-label="Чуй всички">🔊</button></header>
      <div class="en-tabs"><button class="en-tab${t === "topics" ? " on" : ""}" data-t="topics" type="button">Теми</button><button class="en-tab${t === "all" ? " on" : ""}" data-t="all" type="button">Всички думи</button></div>`;
    let body = "", keys = [];
    if (t === "topics") {
      keys = Object.keys(D.words).filter(k => D.words[k].zone === z && !D.words[k].sound_only);
      const nk = keys.filter(k => lvl(k) >= 2).length, nm = keys.filter(k => lvl(k) === 3).length;
      body = `${zoneTabs(z, r)}<h3 class="en-dz">${esc(G.zoneNames[z])}</h3>
        <div class="en-dgrid">${keys.map(k => `<button class="en-dcard" data-w="${k}" type="button">${img(D.words[k].img, "fit")}<b>${esc(D.words[k].text)}</b>${bars(k)}</button>`).join("")}</div>
        <p class="en-adult-note">За родителя: стълбчетата показват дали детето разпознава думата на слух – упражнява (срещало я е) → разпознава (вярно от първия опит в 2 различни дни и в 2 различни игри) → запомнил (пак вярно поне седмица по-късно). Разпознава ${nk} от ${keys.length} думи${nm ? `, запомнило ${nm}` : ""}. 🗣️ – опитвало се е да я каже (не се оценява от приложението).</p>`;
    } else {
      keys = Object.keys(D.words).filter(k => D.words[k].zone <= r && !D.words[k].sound_only).sort((a, b) => D.words[a].text.localeCompare(D.words[b].text, "en"));
      let L0 = "";
      body = `<div class="en-dlist">${keys.map(k => { const W = D.words[k], L = W.text[0].toUpperCase(), h = L !== L0 ? `<h4 class="en-letter">${L}</h4>` : ""; L0 = L;
        return `${h}<button class="en-drow" data-w="${k}" type="button">${img(W.img, "fit")}<span class="en-dw"><b>${esc(W.text)}</b><small>${esc(W.bg || "")}</small></span><span class="en-dplay">🔊</span>${bars(k)}<small class="en-dlv">${LV[lvl(k)]}</small></button>`; }).join("")}</div>
        <p class="en-adult-note">Думите от пристаните, до които е стигнало детето (${keys.length}), по азбучен ред. Преводът е за родителя.</p>`;
    }
    app.innerHTML = `<section class="en-games en-dict">${head}${body}</section>`;
    document.getElementById("en-x").onclick = () => start();
    app.querySelectorAll(".en-tab").forEach(b => b.onclick = () => dict(z, b.dataset.t));
    app.querySelectorAll(".en-ztab").forEach(b => b.onclick = () => { const n = +b.dataset.z; if (n > r) return say([["bg", G.instructions.locked_stop]]); dict(n, "topics"); });
    app.querySelectorAll("[data-w]").forEach(b => b.onclick = () => { app.querySelectorAll("[data-w]").forEach(x => x.classList.toggle("lit", x === b)); say([["oto", D.words[b.dataset.w].say]]); });
    document.getElementById("en-all").onclick = async () => { stop(); const tk = token;
      for (const b of app.querySelectorAll("[data-w]")) { if (tk !== token) return; b.classList.add("lit"); b.scrollIntoView({ block: "nearest" }); await play1("oto", D.words[b.dataset.w].say); b.classList.remove("lit"); await wait(250); } };
    if (!zone && !tab) say([["bg", G.instructions.dict]]);
  }

  // ---------- Уеб учебник (за 5–6 г.): по пристани и занятия, като сегашния учебник (Unit → Lesson); слуша се, не се чете ----------
  const lessonOpen = (z, n) => REVIEW || (z - 1) * 6 + n <= (prog().classAt || 1);
  const zLessons = z => (D.zones.find(x => x.id === z) || { lessons: [] }).lessons;
  function book(zone) {
    stop(); BACK = () => start();
    const r = reached(), z = zone || Math.min(r, 10), Ls = zLessons(z);
    app.innerHTML = `<section class="en-games en-book"><header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Начало">⌂</button><b class="en-gtitle">Уеб учебник</b><span></span></header>
      ${zoneTabs(z, r)}<h3 class="en-dz">Пристан ${z}: ${esc(G.zoneNames[z])}</h3>
      ${Ls.length ? `<div class="en-lessons">${Ls.map(L => { const o = lessonOpen(z, L.n), S = D.stories[String(L.ep || L.n)];
        return `<button class="en-lrow${o ? "" : " locked"}" data-n="${L.n}" type="button">${S ? img(S.img, "cover") : ""}<span><b>Занятие ${L.n}</b><small>${esc(L.title)}</small></span>${o ? "<i>›</i>" : "<i>🔒</i>"}</button>`; }).join("")}</div>`
        : `<p class="en-empty">Занятията на този пристан идват скоро.</p>`}</section>`;
    document.getElementById("en-x").onclick = () => start();
    app.querySelectorAll(".en-ztab").forEach(b => b.onclick = () => { const n = +b.dataset.z; if (n > r) return say([["bg", G.instructions.locked_stop]]); book(n); });
    app.querySelectorAll(".en-lrow").forEach(b => b.onclick = () => { const n = +b.dataset.n; if (!lessonOpen(z, n)) return say([["bg", G.instructions.book_locked]]); lessonPage(z, n); });
    if (!zone) say([["bg", G.instructions.book]]);
  }
  function lessonPage(z, n) {   // страницата на занятието: историята, песента, думите; „Днес учихме“ за родителя
    stop(); BACK = () => book(z);
    const L = zLessons(z).find(x => x.n === n), Lr = L.learn || {}, S = D.stories[String(L.ep || L.n)];
    const ws = (Lr.words || []).filter(k => D.words[k]), nums = Lr.numbers || [], prev = n > 1 && lessonOpen(z, n - 1), next = n < 6 && lessonOpen(z, n + 1);
    app.innerHTML = `<section class="en-games en-book en-lpage"><header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Към учебника">✕</button><b class="en-gtitle">Занятие ${n}: ${esc(L.title)}</b><span></span></header>
      <div class="en-lgrid">
        ${S ? `<button class="en-lstory" id="en-lstory" type="button">${img(S.img, "cover")}<span>▶ Историята</span></button>` : ""}
        <div class="en-lside">
          ${(Lr.songs || []).map(k => `<button class="en-btn en-lsong" data-s="${k}" type="button">♪ ${esc(D.songs[k].title)}</button>`).join("")}
          <div class="en-lwords">${ws.map(k => `<button class="en-dcard" data-w="${k}" type="button">${img(D.words[k].img, "fit")}<b>${esc(D.words[k].text)}</b></button>`).join("")}
          ${nums.length ? `<button class="en-dcard" data-num="${nums.join(",")}" type="button"><span class="en-fishrow">${img("w_fish").repeat(Math.min(nums.length + (nums[0] === "four" ? 3 : 0), 5))}</span><b>${esc(nums.join(", "))}</b></button>` : ""}</div>
        </div></div>
      <div class="en-parent"><b>Целта</b><p>${esc(Lr.goal || "")}</p><b>Днес учихме</b><p>${esc(Lr.bg || "")}</p>${(Lr.phrases || []).length ? `<p><i>${Lr.phrases.map(esc).join(" · ")}</i></p>` : ""}
        ${Lr.home ? `<b>Задача за вкъщи <small>(по желание)</small></b><p>${esc(Lr.home)}</p>` : ""}</div>
      <div class="en-row en-pnav"><button class="en-btn" id="en-prev" type="button" ${prev ? "" : "disabled"}>◀ Занятие ${n - 1}</button><button class="en-btn" id="en-next" type="button" ${next ? "" : "disabled"}>Занятие ${n + 1} ▶</button></div></section>`;
    document.getElementById("en-x").onclick = () => book(z);
    if (S) document.getElementById("en-lstory").onclick = () => { page(z, L.ep || n); BACK = () => lessonPage(z, n); };
    app.querySelectorAll(".en-lsong").forEach(b => b.onclick = async () => { BACK = () => lessonPage(z, n); await ROUND.song({ id: "BOOK", rounds: [{ type: "song" }] }, 0, { type: "song", song: b.dataset.s }); lessonPage(z, n); });
    app.querySelectorAll("[data-w]").forEach(b => b.onclick = () => say([["oto", D.words[b.dataset.w].say]]));
    app.querySelectorAll("[data-num]").forEach(b => b.onclick = () => say(b.dataset.num.split(",").map(x => ["oto", x.charAt(0).toUpperCase() + x.slice(1) + "!"])));
    if (prev) document.getElementById("en-prev").onclick = () => lessonPage(z, n - 1);
    if (next) document.getElementById("en-next").onclick = () => lessonPage(z, n + 1);
  }
  function page(z, e) {   // една страница: голямата картина, репликите с героите; стрелки за предишен и следващ епизод
    stop(); BACK = () => book(z);
    const S = D.stories[e], all = Object.keys(D.stories).map(Number).sort((a, b) => a - b);
    const at = prog().classAt || 1, can = x => REVIEW || x <= at;
    const prev = all.filter(x => x < e && can(x)).pop(), next = all.find(x => x > e && can(x));
    app.innerHTML = `<section class="en-play en-page"><header class="en-ptop"><button class="en-x" id="en-x" type="button" aria-label="Към книжката">✕</button><b class="en-gtitle">Епизод ${e}</b><button class="en-spk" id="en-spk" type="button" aria-label="Чуй пак">🔊</button></header>
      <div class="en-stage"><div class="en-story">${img(S.img, "en-epimg")}<div class="en-who" id="en-who"></div></div>
      <div class="en-row en-pnav"><button class="en-btn" id="en-prev" type="button" ${prev ? "" : "disabled"}>◀</button><button class="en-btn" id="en-next" type="button" ${next ? "" : "disabled"}>▶</button></div></div></section>`;
    document.getElementById("en-x").onclick = () => BACK();
    const tell = async () => { stop(); const t = token;
      for (const [v, s] of S.lines) { if (t !== token) return; const w = document.getElementById("en-who"); if (w) w.innerHTML = `<span class="en-tag ${v}">${img((WHO[v] || [])[1] || v)}${(WHO[v] || [v])[0]}</span>`; await play1(v, s); await wait(450); }
      const w = document.getElementById("en-who"); if (w) w.innerHTML = ""; };
    document.getElementById("en-spk").onclick = tell;
    if (prev) document.getElementById("en-prev").onclick = () => page(z, prev);
    if (next) document.getElementById("en-next").onclick = () => page(z, next);
    tell();
  }

  // ---------- отчет за пробата (общ таблет, без сървър): всички деца на таблета; „Копирай“ дава текст за анализа ----------
  function report() {
    const kids = []; try { for (let n = 0; n < localStorage.length; n++) { const k = localStorage.key(n); if (/^platforma\.en\.v1\./.test(k)) kids.push(k.slice(16)); } } catch (e) {}
    kids.sort(); const lessons = ALL(), WS = ["", "упражнява", "разпознава", "запомнил"];
    const st = s => s.mem ? 3 : (() => { const ok = s.r.filter(x => x[2]), d = new Set(ok.map(x => x[0])), c = new Set(ok.map(x => x[1])); return d.size >= 2 && (c.size >= 2 || c.has("rev")) ? 2 : 1; })();
    const data = kids.map(c => { let p = {}; try { p = JSON.parse(localStorage.getItem("platforma.en.v1." + c) || "{}") || {}; } catch (e) {}
      const rt = p.rt || [], ls = [...new Set(rt.map(x => x.l))].sort().map(l => { const rs = rt.filter(x => x.l === l), n = rs.reduce((a, x) => a + x.n, 0), ok = rs.reduce((a, x) => a + x.ok, 0);
        const days = [...new Set(rs.map(x => x.at.slice(0, 10)))];
        return { l, rounds: [...new Set(rs.map(x => x.r))].length, sec: rs.reduce((a, x) => a + x.s, 0), acc: n ? Math.round(100 * ok / n) : null, days,
          per: rs.map(x => `${x.r}.${x.t} ${x.s}с${x.n ? " " + x.ok + "/" + x.n : ""}${x.miss.length ? " ✗" + x.miss.join(",") : ""}`) }; });
      const ws = Object.entries(p.w || {}).map(([w, s]) => [w, st(s)]), cnt = [1, 2, 3].map(k => ws.filter(x => x[1] === k).length);
      return { c, classAt: p.classAt || 1, ls, cnt, rec: ws.filter(x => x[1] >= 2).map(x => x[0]), teach: Object.entries(p.teach || {}).filter(x => x[1]).map(x => x[0]), secrets: Object.values(p.secrets || {}).flat().length }; });
    const txt = data.map(d => `${d.c} (занятие до ${d.classAt}): думи – упражнява ${d.cnt[0]}, разпознава ${d.cnt[1]}, запомнил ${d.cnt[2]}${d.rec.length ? " [" + d.rec.join(", ") + "]" : ""}; тайни ${d.secrets}; родителят ✓ ${d.teach.join(", ") || "—"}\n` +
      d.ls.map(l => `  ${l.l}: ${l.rounds}/5 кръга, ${Math.round(l.sec / 60 * 10) / 10} мин, първи опит ${l.acc == null ? "—" : l.acc + "%"} (${l.days.join(", ")})\n    ${l.per.join(" · ")}`).join("\n")).join("\n\n") || "(няма данни на този таблет)";
    app.innerHTML = `<section class="en-report"><h2>Отчет за пробата · ${kids.length} деца на този таблет</h2>
      <p>Времето е от началото до края на кръга. „Първи опит“ – само кръговете с проверка (говоренето и движението не се оценяват).</p>
      <table><tr><th>Дете</th><th>Занятие</th><th>Кръгове</th><th>Минути</th><th>Първи опит</th><th>Думи: упр. / разп. / запомнил</th></tr>
      ${data.map(d => d.ls.length ? d.ls.map((l, j) => `<tr><td>${j ? "" : esc(d.c)}</td><td>${l.l}</td><td>${l.rounds}/5</td><td>${Math.round(l.sec / 6) / 10}</td><td>${l.acc == null ? "—" : l.acc + " %"}</td><td>${j ? "" : d.cnt.join(" / ")}</td></tr>`).join("") : `<tr><td>${esc(d.c)}</td><td colspan="5">още не е играло</td></tr>`).join("")}</table>
      <div class="en-row"><button class="en-btn" id="en-rcopy" type="button">Копирай отчета</button><a class="en-btn ghost" href="english.html">Към модула</a></div><pre id="en-rtxt">${esc(txt)}</pre></section>`;
    document.getElementById("en-rcopy").onclick = e => { const b = e.currentTarget; navigator.clipboard.writeText(txt).then(() => { b.textContent = "Копирано"; }).catch(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById("en-rtxt")); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); b.textContent = "Избрано – копирайте"; }); };
  }

  // ---------- старт ----------
  Promise.all(["config/english-l0.json?v=18", "config/english-audio.json?v=27", "config/english-words.json?v=11", "config/english-games.json?v=7", "config/english-pier.json?v=41"].map(u => fetch(u).then(r => r.json()))).then(([d, au, wb, gm, pr]) => {
    D = d; au.forEach(x => { A[x.v + "|" + x.t] = x.f; }); G = gm; PIER = pr; D.words = wb.words; D.numbers = gm.numbers;
    fromServer();
    Z = zoneNow();
    window.EN = { D, report, get Z() { return Z; }, PIER, album, finishPier, shown, prog, current, olderOpen, assigned, lessonsDone, home, river, teacher, start, games, dict, book, lessonPage, play: (id, zs) => play(G.games.find(g => g.id === id), zs) };
    if (Q.get("report") === "1") report();
    else if (ROSTER && (!CHILD || Q.get("who") === "1")) PS.pick(() => location.replace("english.html"));   // „Кой играе?“: след линка на групата или 👥; без pilotgroup в адреса – иначе изборът се нулира
    else if (Q.get("go") === "journey") home(); else start();
  }).catch(e => { app.innerHTML = `<p class="en-err">Модулът не се зареди: ${esc(e.message)}</p>`; });
})();
