(function () {
  const loc = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['$', ''] });
  const F = {
    usd: loc.format('$,.0f'),
    usd2: loc.format('$,.2f'),
    int: loc.format(',.0f'),
    dec1: loc.format(',.1f'),
    pct: loc.format('.1%'),
    pct0: loc.format('.0%'),
    sgnpct: (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + loc.format('.1%')(Math.abs(v)),
    bs: loc.format(',.2f'),
  };
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  F.fecha = (s) => { const d = new Date(s + 'T12:00:00Z'); return DIA[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MES[d.getUTCMonth()]; };
  F.mesCorto = (s) => MES[Number(s.slice(5, 7)) - 1];
  const N = (v) => (v === '' || v == null ? null : Number(v));

  function tipBox(el) {
    const t = document.createElement('div');
    t.className = 'ch-tip';
    t.hidden = true;
    el.appendChild(t);
    return {
      show(cx, title, items) {
        t.replaceChildren();
        const h = document.createElement('div'); h.className = 'ch-tip-h'; h.textContent = title; t.appendChild(h);
        items.forEach((it) => {
          const row = document.createElement('div'); row.className = 'ch-tip-r';
          if (it.color) { const s = document.createElement('span'); s.className = 'ch-sw'; s.style.background = it.color; row.appendChild(s); }
          const n = document.createElement('span'); n.className = 'ch-tip-n'; n.textContent = it.name; row.appendChild(n);
          const v = document.createElement('b'); v.className = 'ch-tip-v'; v.textContent = it.value; row.appendChild(v);
          t.appendChild(row);
        });
        t.hidden = false;
        const w = t.offsetWidth, W = el.clientWidth;
        t.style.left = Math.max(0, Math.min(W - w, cx - w / 2)) + 'px';
      },
      hide() { t.hidden = true; },
    };
  }

  function legend(el, series) {
    const lg = document.createElement('div'); lg.className = 'ch-legend';
    series.forEach((s) => {
      const i = document.createElement('span'); i.className = 'ch-li';
      const sw = document.createElement('span'); sw.className = s.type === 'line' ? 'ch-sw ch-sw-line' : 'ch-sw'; sw.style.background = s.color;
      i.appendChild(sw); i.appendChild(document.createTextNode(s.name)); lg.appendChild(i);
    });
    el.appendChild(lg);
  }

  // cfg: rows, key, xLabel, xTick(r,i), series[{name,value,color,type,fmt}], stack, yFormat, height, tipTitle, ymax, legend, refLine{value,label}
  function chart(el, cfg) {
    el.replaceChildren();
    const rows = cfg.rows || [];
    if (!rows.length) { el.textContent = '—'; return; }
    if (cfg.legend) legend(el, cfg.series);
    const box = document.createElement('div'); box.className = 'ch-box'; el.appendChild(box);
    const W = Math.max(260, el.clientWidth), H = cfg.height || 260;
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('class', 'ch-svg');
    const bars = cfg.series.filter((s) => s.type !== 'line');
    const lines = cfg.series.filter((s) => s.type === 'line');
    const val = (s, r) => { const v = s.value(r); return v == null || isNaN(v) ? null : v; };
    let ymax = cfg.ymax;
    if (ymax == null) {
      const bmax = cfg.stack ? d3.max(rows, (r) => d3.sum(bars, (s) => val(s, r) || 0)) : d3.max(rows, (r) => d3.max(bars, (s) => val(s, r) || 0));
      const lmax = d3.max(rows, (r) => d3.max(lines, (s) => val(s, r) || 0));
      ymax = Math.max(bmax || 0, lmax || 0, cfg.refLine ? cfg.refLine.value : 0);
    }
    const fmt = cfg.yFormat || F.int;
    const bottom = 26, top = 10;
    const y = d3.scaleLinear([0, ymax || 1], [H - bottom, top]).nice(5);
    const ticks = y.ticks(5);
    const probe = svg.append('text').attr('class', 'ch-tick');
    let lw = 0; ticks.forEach((t) => { probe.text(fmt(t)); lw = Math.max(lw, probe.node().getComputedTextLength()); });
    const m = { l: lw + 10, r: 8 };
    const x = d3.scaleBand(rows.map(cfg.key), [m.l, W - m.r]).paddingInner(cfg.pad ?? 0.25).paddingOuter(0.08);
    // x tick labels, thinned so they never meet
    const labIdx = rows.map((r, i) => (cfg.xTick ? cfg.xTick(r, i) : true));
    let xw = 0; rows.forEach((r, i) => { if (labIdx[i]) { probe.text(cfg.xLabel(r)); xw = Math.max(xw, probe.node().getComputedTextLength()); } });
    probe.remove();
    const shown = rows.map((r, i) => i).filter((i) => labIdx[i]);
    const gapPx = shown.length > 1 ? (x(cfg.key(rows[shown[1]])) - x(cfg.key(rows[shown[0]]))) : W;
    const every = Math.max(1, Math.ceil((xw + 10) / Math.max(1, gapPx)));

    svg.append('g').selectAll('line').data(ticks).join('line').attr('class', 'ch-grid')
      .attr('x1', m.l).attr('x2', W - m.r).attr('y1', (d) => y(d)).attr('y2', (d) => y(d));
    svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'ch-tick')
      .attr('x', m.l - 6).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text((d) => fmt(d));
    svg.append('line').attr('class', 'ch-axis').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0));
    svg.append('g').selectAll('text').data(shown.filter((_, k) => k % every === 0)).join('text').attr('class', 'ch-tick')
      .attr('x', (i) => x(cfg.key(rows[i])) + (cfg.xTick ? 0 : x.bandwidth() / 2)).attr('y', H - 8)
      .attr('text-anchor', cfg.xTick ? 'start' : 'middle').text((i) => cfg.xLabel(rows[i]));

    const bw = x.bandwidth();
    const gBars = svg.append('g');
    if (cfg.stack) {
      rows.forEach((r) => {
        let acc = 0;
        bars.forEach((s) => {
          const v = val(s, r) || 0; if (!v) return;
          gBars.append('rect').attr('class', 'ch-bar').attr('data-k', cfg.key(r)).attr('x', x(cfg.key(r))).attr('width', bw)
            .attr('y', y(acc + v)).attr('height', Math.max(0, y(acc) - y(acc + v))).style('fill', s.color);
          const lab = cfg.segLabel ? cfg.segLabel(s, r, v) : null;
          if (lab && y(acc) - y(acc + v) >= 13 && bw >= 22) {
            gBars.append('text').attr('class', 'ch-seg').attr('x', x(cfg.key(r)) + bw / 2).attr('y', (y(acc) + y(acc + v)) / 2)
              .attr('dy', '0.35em').attr('text-anchor', 'middle').text(lab);
          }
          acc += v;
        });
      });
    } else if (bars.length) {
      const sub = d3.scaleBand(bars.map((s) => s.name), [0, bw]).padding(bars.length > 1 ? 0.08 : 0);
      const sbw = Math.min(32, sub.bandwidth());
      rows.forEach((r) => bars.forEach((s) => {
        const v = val(s, r); if (v == null) return;
        gBars.append('rect').attr('class', 'ch-bar').attr('data-k', cfg.key(r))
          .attr('x', x(cfg.key(r)) + sub(s.name) + (sub.bandwidth() - sbw) / 2).attr('width', sbw)
          .attr('y', y(Math.max(0, v))).attr('height', Math.abs(y(0) - y(v))).attr('rx', Math.min(3, sbw / 2)).style('fill', s.color);
      }));
    }
    if (cfg.refLine) {
      svg.append('line').attr('class', 'ch-ref').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(cfg.refLine.value)).attr('y2', y(cfg.refLine.value));
    }
    lines.forEach((s) => {
      const pts = rows.map((r) => [x(cfg.key(r)) + bw / 2, val(s, r)]).filter((p) => p[1] != null);
      svg.append('path').attr('class', 'ch-line').style('stroke', s.color).attr('d', d3.line().x((p) => p[0]).y((p) => y(p[1]))(pts));
      if (rows.length <= 40) svg.append('g').selectAll('circle').data(pts).join('circle').attr('r', 2.5).attr('cx', (p) => p[0]).attr('cy', (p) => y(p[1])).style('fill', s.color);
    });
    const hover = svg.append('line').attr('class', 'ch-hover').attr('y1', top).attr('y2', H - bottom).style('opacity', 0);
    const tip = tipBox(box);
    const keys = rows.map(cfg.key);
    svg.append('rect').attr('x', m.l).attr('y', 0).attr('width', W - m.l - m.r).attr('height', H).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev);
        const i = Math.max(0, Math.min(rows.length - 1, Math.floor((px - x(keys[0]) + x.step() * x.paddingInner() / 2) / x.step())));
        const r = rows[i]; const cx = x(keys[i]) + bw / 2;
        hover.attr('x1', cx).attr('x2', cx).style('opacity', 1);
        gBars.selectAll('rect').classed('ch-dim', function () { return this.getAttribute('data-k') !== keys[i]; });
        const items = cfg.series.map((s) => ({ name: s.name, color: cfg.series.length > 1 ? s.color : null, value: val(s, r) == null ? '—' : (s.fmt || fmt)(val(s, r)) + (cfg.tipShare ? ' · ' + F.pct0(val(s, r) / d3.sum(cfg.series, (q) => val(q, r) || 0)) : '') }));
        (cfg.extraTip || []).forEach((e) => items.push({ name: e.name, value: e.value(r) }));
        tip.show(cx * (box.clientWidth / W), cfg.tipTitle ? cfg.tipTitle(r) : cfg.xLabel(r), items);
      })
      .on('pointerleave', () => { hover.style('opacity', 0); gBars.selectAll('rect').classed('ch-dim', false); tip.hide(); });
  }

  window.CH = { F, N, chart, MES };
})();
