// Receives data either from URL hash (#geostring=<base64 or json>) or localStorage.
(function () {
  function parseHash() {
    try {
      var h = (location.hash || '').replace(/^#/, '');
      if (!h) return null;
      var params = new URLSearchParams(h);
      var raw = params.get('geostring');
      if (!raw) return null;
      var decoded;
      try { decoded = decodeURIComponent(raw); } catch (_) { decoded = raw; }
      try { return JSON.parse(decoded); } catch (_) {}
      try { return JSON.parse(atob(decoded)); } catch (_) {}
      return null;
    } catch (e) { return null; }
  }
  var payload = parseHash();
  if (payload && typeof payload === 'object') {
    try {
      Object.keys(payload).forEach(function (k) {
        var v = payload[k];
        if (v === null || v === undefined) return;
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      });
    } catch (_) {}
  }
})();
const pinsdata = localStorage.getItem("pinsdata");
const data = localStorage.getItem("data");
const SIZE = localStorage.getItem("SIZE");
const framecolor = localStorage.getItem("framecolor");
const pincovercolor = localStorage.getItem("pincovercolor");
