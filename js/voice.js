/* Глас: записите на диктора по текст, иначе синтезиран глас.
   config/audio-index.json (tools/audio_index.py) изброява само записите, които реално са качени в assets/audio/<папка>/.
   VOICE.speak(lines, {onLine, onEnd, rate}) чете ред по ред: за всеки ред търси запис по текста (точно, после без
   главни букви и препинателни знаци); ако няма – синтезира. Връща функция за спиране.
   VOICE.cancel() спира всичко; VOICE.source(text) казва "file" | "tts" (за данните: записан ли е образецът).
   Уважава изключения звук (localStorage platforma.sound = off). */
(function () {
  const URL = "config/audio-index.json?v=2";
  let index = { exact: {}, loose: {} };
  fetch(URL).then(r => r.ok ? r.json() : null).then(d => { if (d) index = d; }).catch(() => {});
  const loose = t => String(t).toLowerCase().replace(/[„“"«»'.,!?;:…—–\/-]/g, " ").replace(/\s+/g, " ").trim();
  // По текст; когато играта знае ролята (opt.role: phoneme, syllable, word, instruction, question, option, reason, feedback, text),
  // първо по роля + текст – „не“ (сричка) и „Не.“ (обратна връзка) са различни записи.
  const fileFor = (t, role) => { if (!t) return null; const s = String(t).trim(), R = role && index.byRole && index.byRole[role];
    return (R && (R[s] || R[loose(s)])) || index.exact[s] || index.loose[loose(s)] || null; };
  let current = null, cancelled = 0;
  const off = () => { try { return localStorage.getItem("platforma.sound") === "off"; } catch (e) { return false; } };
  function bgVoice() { return ("speechSynthesis" in window) ? speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("bg")) : null; }
  function cancel() {
    cancelled++;
    if (current) { try { current.pause(); } catch (e) {} current = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  // Проверка на покритието (адрес с qa=1): всяка реплика без запис се съобщава на локалния сървър (/__qa?d=voice-miss:…)
  const QA = /[?&#]qa=1\b/.test(location.search + "&" + location.hash), missed = new Set();
  function reportMiss(text) { if (!QA || missed.has(text)) return; missed.add(text); try { fetch("/__qa?d=" + encodeURIComponent("voice-miss:" + text)).catch(() => {}); } catch (e) {} }
  // Реплика без цял запис се сглобява от записаните части (редовете с бележка „части“) (най-дългото съвпадение отляво): „Не. 2 плюс 7 е 9“ = „Не.“ + „2“ + „плюс“ + …
  // Така числата и аритметичната обратна връзка се записват веднъж като части, а не по веднъж за всяка комбинация.
  // Сглобява се само ако ВСИЧКИ части са записани и са от един и същ диктор; иначе цялата реплика е синтезирана –
  // никога човешки глас и синтезиран в една реплика.
  function pieces(text) {
    const P = index.pieces || {}, SP = index.speaker || {}, w = loose(text).split(" ").filter(Boolean), out = [];
    for (let i = 0; i < w.length;) {
      let j = w.length; while (j > i && !P[w.slice(i, j).join(" ")]) j--;
      if (j === i) return null; out.push(P[w.slice(i, j).join(" ")]); i = j;
    }
    if (new Set(out.map(f => SP[f] || "")).size > 1) return null;
    return out.length > 1 ? out : null;
  }
  // Частите се зареждат всичките, преди да тръгне първата: ако някоя липсва или е повредена – цялата реплика синтезирана.
  function playFiles(files, text, rate, done) {
    const my = cancelled, auds = files.map(f => new Audio("assets/audio/" + f)); let ready = 0, failed = false;
    const fail = () => { if (failed) return; failed = true; if (my === cancelled) tts(text, rate, done); };
    const timer = setTimeout(fail, 4000);
    auds.forEach(a => { a.preload = "auto"; a.oncanplaythrough = () => { a.oncanplaythrough = null; if (++ready === auds.length && !failed) { clearTimeout(timer); play(0); } }; a.onerror = () => { clearTimeout(timer); fail(); }; a.load(); });
    function play(k) {
      if (my !== cancelled) return; if (k >= auds.length) { current = null; return done(); }
      const a = auds[k]; current = a; a.onended = () => play(k + 1); a.onerror = null; a.play().catch(() => play(k + 1));
    }
  }
  function playOne(text, rate, done, role) {
    const f = fileFor(text, role);
    if (!f) { const p = pieces(text); if (p) return playFiles(p, text, rate, done); }
    if (f) {
      const a = new Audio("assets/audio/" + f); current = a; let fin = false;
      const end = () => { if (fin) return; fin = true; if (current === a) current = null; done(); };
      a.onended = end; a.onerror = () => { fin = true; tts(text, rate, done); }; // липсващ или повреден файл → синтезиран глас
      a.play().catch(() => { if (!fin) { fin = true; tts(text, rate, done); } });
      return;
    }
    tts(text, rate, done);
  }
  // Синтетичният глас чете самотна буква като „главна буква а“. Затова (само за синтетичния глас – записите не се засягат):
  // гласна → самият звук („а,“); съгласна → кратко име с ъ („бъ“), както в азбуката; ь → „ер малък“, й → „и кратко“.
  const VOW = "аеиоуъюя";
  function ttsLetter(t) {
    const m = /^\s*([а-яА-Я])\s*[.!?]?\s*$/.exec(t); if (!m) return t;
    const l = m[1].toLowerCase();
    if (VOW.includes(l)) return l + ",";
    if (l === "ь") return "ер малък"; if (l === "й") return "и кратко";
    return l + "ъ";
  }
  function tts(text, rate, done) {
    if (!("speechSynthesis" in window)) return done();
    const u = new SpeechSynthesisUtterance(ttsLetter(String(text).replace(/^—\s*/, ""))); u.lang = "bg-BG"; u.rate = rate || 0.9;
    const v = bgVoice(); if (v) u.voice = v; u.onend = done; u.onerror = done; speechSynthesis.speak(u);
  }
  function speak(lines, opt) {
    opt = opt || {}; lines = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    if (QA) lines.forEach(t => { if (!fileFor(t, opt.role) && !pieces(t)) reportMiss(String(t).trim()); });   // и при изключен звук
    cancel(); const my = cancelled;
    if (off() || !lines.length) { opt.onEnd && opt.onEnd(); return () => {}; }
    let i = 0;
    const next = () => {
      if (my !== cancelled) return;
      if (i >= lines.length) { opt.onLine && opt.onLine(-1); opt.onEnd && opt.onEnd(); return; }
      opt.onLine && opt.onLine(i);
      playOne(lines[i], opt.rate, () => { i++; if (my === cancelled) setTimeout(next, opt.gap != null ? opt.gap : 200); }, opt.role);
    };
    next();
    return () => { if (my === cancelled) cancel(); };
  }
  window.VOICE = { speak, cancel, source: (t, role) => fileFor(t, role) ? "file" : "tts", has: (t, role) => !!fileFor(t, role) };
})();
