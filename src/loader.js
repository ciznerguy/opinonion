/*! OpinOnion loader — embed: <script src="https://YOUR-SITE.netlify.app/loader.js" async data-site="Client Site"></script>
 *  Loads NOTHING else until Ctrl/Cmd+Shift+O is pressed, ?opinonion=true is in the URL,
 *  or a previous session on this tab already unlocked the widget. */
(function () {
  var d = document, s = d.currentScript || d.querySelector('script[src$="/loader.js"][data-site]'), w = window, loaded = 0, KEY = "opinonion:on";
  if (!s || !s.src) return;
  var host = new URL(s.src).origin;

  function load() {
    if (loaded) return w.dispatchEvent(new Event("opinonion:toggle"));
    loaded = 1;
    w.__OPINONION__ = { host: host, site: s.getAttribute("data-site") || "", siteKey: s.getAttribute("data-key") || "" };
    var e = d.createElement("script");
    e.type = "module";
    e.src = host + "/widget.js";
    e.onerror = function () { loaded = 0; };
    d.head.appendChild(e);
  }

  d.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.code === "KeyO") {
      e.preventDefault();
      load();
    }
  });

  var on = 0;
  try { on = /[?&]opinonion=(true|1)\b/.test(location.search) || sessionStorage.getItem(KEY); } catch (_) {}
  if (on) load();
})();
