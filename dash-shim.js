// Reemplazo mínimo del motor del dashboard de Claude para que la misma página funcione en GitHub Pages.
(function () {
  const S = { data: {}, cols: {}, calcs: [], out: {}, draws: {}, onData: [], params: {}, defaults: {}, ready: false };
  const dash = {
    colors: ['#2f6fb0', '#e07b39', '#3a9a6b', '#c24d6a', '#8a63c7', '#b8a23a', '#4aa3c4', '#7d6b5d'],
    calc(id, cfg) { S.calcs.push([id, cfg]); },
    loader() {},
    data(id) {
      if (id in S.data) return { status: 'ok', data: S.data[id], columns: S.cols[id] || [], meta: [] };
      if (id in S.out) return { status: 'ok', data: S.out[id], meta: [] };
      return { status: S.ready ? 'missing' : 'loading', data: [], meta: [] };
    },
    draw(name, fn) { S.draws[name] = fn; if (S.ready) render(); },
    onData(fn) { S.onData.push(fn); if (S.ready) { try { fn(); } catch (e) { console.error(e); } } },
    params() { return { ...S.params }; },
    setParams(p) { Object.entries(p).forEach(([k, v]) => { if (v == null) delete S.params[k]; else S.params[k] = v; }); render(); },
    resetParams() { S.params = { ...S.defaults }; render(); },
    setLink() {},
    refresh() {},
  };
  function computeCalcs() {
    S.out = {};
    for (const [id, c] of S.calcs) {
      try { S.out[id] = c.fn(...c.inputs.map((i) => (i in S.data ? S.data[i] : S.out[i] || []))); }
      catch (e) { console.error('calc', id, e); S.out[id] = []; }
    }
  }
  function render() {
    if (!S.ready) return;
    S.onData.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
    Object.entries(S.draws).forEach(([n, fn]) => document.querySelectorAll('[data-draw="' + n + '"]').forEach((el) => {
      try { fn(el); } catch (e) { console.error('draw', n, e); }
    }));
  }
  window.dash = dash;
  window.__dashStart = (payload) => {
    S.data = payload.datasets; S.cols = payload.columns || {};
    S.defaults = { ...(payload.params || {}) }; S.params = { ...S.defaults };
    computeCalcs(); S.ready = true; render();
    let t, w = window.innerWidth;
    window.addEventListener('resize', () => { if (window.innerWidth === w) return; w = window.innerWidth; clearTimeout(t); t = setTimeout(render, 150); });
  };
})();
