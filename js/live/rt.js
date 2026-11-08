/* Минимален клиент за Supabase Realtime (канали за излъчване и присъствие) – без външни библиотеки.
   LIVE_RT.join(room, { id, meta }, { onMsg(event, payload), onPresence(list), onStatus(s) }) → { send(event, payload), leave() }
   Конфигурация: config/live.json { url, anon_key } (само публичният ключ).
   Прототип: каналите са публични за всеки, който знае името на стаята – за реални занятия ще минем на частни канали с вход (Realtime Authorization). */
(function () {
  let CFG = null;
  const cfg = () => CFG ? Promise.resolve(CFG) : fetch("config/live.json?v=1").then(r => r.json()).then(c => (CFG = c));
  function join(room, me, h) {
    let ws = null, ref = 0, hb = null, closed = false, joined = false, queue = [], presence = {};
    const topic = "realtime:" + room, R = () => String(++ref);
    const raw = (o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); else queue.push(o); };
    const status = (s) => { try { h.onStatus && h.onStatus(s); } catch (e) {} };
    function emitPresence() { const list = []; Object.keys(presence).forEach(k => (presence[k].metas || []).forEach(m => list.push(Object.assign({ key: k }, m)))); try { h.onPresence && h.onPresence(list); } catch (e) {} }
    function connect() {
      cfg().then(c => {
        const url = c.url.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(c.anon_key) + "&vsn=1.0.0";
        ws = new WebSocket(url); status("connecting");
        ws.onopen = () => {
          raw({ topic, event: "phx_join", ref: R(), payload: { config: { broadcast: { self: false, ack: false }, presence: { key: me.id } }, access_token: c.anon_key } });
          clearInterval(hb); hb = setInterval(() => raw({ topic: "phoenix", event: "heartbeat", payload: {}, ref: R() }), 25000);
          const q = queue; queue = []; q.forEach(raw);
        };
        ws.onmessage = (ev) => {
          let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
          if (m.topic !== topic) return;
          if (m.event === "phx_reply" && m.payload && m.payload.status === "ok" && !joined) {
            joined = true; status("live");
            raw({ topic, event: "presence", ref: R(), payload: { type: "presence", event: "track", payload: me.meta || {} } });
          }
          if (m.event === "broadcast" && m.payload) { try { h.onMsg && h.onMsg(m.payload.event, m.payload.payload || {}); } catch (e) {} }
          if (m.event === "presence_state") { presence = m.payload || {}; emitPresence(); }
          if (m.event === "presence_diff") {
            const d = m.payload || {}; Object.keys(d.joins || {}).forEach(k => { presence[k] = d.joins[k]; });
            Object.keys(d.leaves || {}).forEach(k => { delete presence[k]; }); emitPresence();
          }
        };
        ws.onclose = () => { joined = false; clearInterval(hb); status("offline"); if (!closed) setTimeout(connect, 1500); };
        ws.onerror = () => { try { ws.close(); } catch (e) {} };
      }).catch(() => { status("noconfig"); if (!closed) setTimeout(connect, 3000); });
    }
    connect();
    return {
      send: (event, payload) => raw({ topic, event: "broadcast", ref: R(), payload: { type: "broadcast", event, payload } }),
      leave: () => { closed = true; clearInterval(hb); try { raw({ topic, event: "phx_leave", ref: R(), payload: {} }); ws && ws.close(); } catch (e) {} }
    };
  }
  window.LIVE_RT = { join };
})();
