(function () {
  const { F, N, chart } = window.CH;
  const C = dash.colors;
  const kpiFmt = {
    k_venta: F.usd, k_ped: F.int, k_pd_a: F.dec1, k_pd_b: F.dec1, k_pd_c: F.sgnpct, k_yoy: F.sgnpct,
    k_vrd: F.usd, k_vrd_c: F.sgnpct, k_tk: F.usd2, k_brecha: F.usd, k_brecha_p: F.pct, k_div: F.pct,
    k_tn_a: F.usd2, k_tn_b: F.usd2, k_tn_c: F.sgnpct, k_vd: F.pct0, k_sm: F.dec1,
    k_sa: F.int, k_sb: F.int, k_ya: F.int, k_yb: F.int, k_ty: F.usd2, k_ts: F.usd2, k_td: F.usd2, k_dd: F.pct0,
    k_mp_j: F.pct0, k_mp_o: F.pct0, k_cr: F.usd, k_crd: F.dec1, k_zs: F.usd, k_umb: F.usd, k_fa: F.int, k_fb: F.int, k_zn: F.int,
  };
  const signed = { k_pd_c: 1, k_yoy: 1, k_vrd_c: 1, k_tn_c: 1 };
  Object.keys(kpiFmt).forEach((name) => dash.draw(name, (el) => {
    const d = dash.data('kpi');
    const row = d.status === 'ok' && d.data && d.data[0];
    const v = row ? row[el.getAttribute('data-field')] : null;
    el.textContent = v == null || isNaN(v) ? '—' : kpiFmt[name](v);
    if (signed[name]) { el.classList.toggle('up', !!row && v > 0); el.classList.toggle('down', !!row && v < 0); }
  }));

  const rowsOf = (id) => { const d = dash.data(id); return d.status === 'ok' ? d.data : null; };
  const draw = (name, id, cfg) => dash.draw(name, (el) => {
    const rows = rowsOf(id);
    if (!rows) { el.replaceChildren(); el.textContent = ''; if (dash.data(id).status === 'error') el.textContent = 'No cargó'; return; }
    chart(el, cfg(rows));
  });
  const mesKey = (r) => r.mes;
  const mesLab = (r) => F.mesCorto(r.mes);

  draw('c_mes', 'mensual', (rows) => ({
    rows, key: mesKey, xLabel: mesLab, yFormat: F.usd, legend: true,
    series: [
      { name: 'Venta real', value: (r) => N(r.venta_real), color: C[0] },
      { name: 'Venta a tasa BCV', value: (r) => N(r.venta_nominal_bcv), color: C[1], type: 'line' },
    ],
    extraTip: [{ name: 'Pedidos', value: (r) => F.int(N(r.pedidos)) }, { name: 'Venta real por día', value: (r) => F.usd(N(r.venta_real_dia)) }],
  }));

  draw('c_hist', 'pedidos_anio', (rows) => ({
    rows, key: (r) => String(r.mes_num), xLabel: (r) => r.nombre, yFormat: F.int, legend: true,
    series: [
      { name: '2024', value: (r) => r.a2024, color: 'var(--cds-chart-muted)', type: 'line' },
      { name: '2025', value: (r) => r.a2025, color: C[1], type: 'line' },
      { name: '2026', value: (r) => r.a2026, color: C[0], type: 'line' },
    ],
  }));

  // Rango de fechas y agrupación de la venta real
  const DESDE0 = '2026-01-01', HASTA0 = '2026-10-31';
  const maxFecha = (id) => { const r = rowsOf(id); return r && r.length ? r[r.length - 1].fecha : HASTA0; };
  const rango = (b, max) => {
    if (b.dataset.ult) { const t = new Date(max + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() - Number(b.dataset.ult) + 1); return { d: t.toISOString().slice(0, 10), h: max }; }
    return { d: b.dataset.d, h: b.dataset.h || max };
  };
  const P = () => { const p = dash.params(); return { d: p.desde || DESDE0, h: p.hasta || maxFecha('venta_periodo'), g: p.agrupar || 'dia' }; };
  const enRango = (rows, d, h) => rows.filter((r) => r.fecha >= d && r.fecha <= h);
  const agrupar = (rows, g) => {
    if (g === 'dia') return rows.map((r) => ({ ...r, key: r.fecha, n: 1, desde: r.fecha, hasta: r.fecha }));
    const col = g === 'semana' ? 'semana' : 'mes', m = new Map();
    rows.forEach((r) => {
      const o = m.get(r[col]) || { key: r[col], venta_real: 0, venta_nominal_bcv: 0, pedidos: 0, n: 0, desde: r.fecha, hasta: r.fecha };
      o.venta_real += r.venta_real; o.venta_nominal_bcv += r.venta_nominal_bcv; o.pedidos += r.pedidos; o.n += 1; o.hasta = r.fecha;
      m.set(r[col], o);
    });
    return [...m.values()];
  };
  const etiqueta = (g, o) => g === 'mes' ? F.mesCorto(o.key + '-01') : g === 'semana' ? Number(o.key.slice(8)) + ' ' + F.mesCorto(o.key) : F.fecha(o.key);
  const titulo = (g, o) => g === 'mes' ? F.mesCorto(o.key + '-01') + ' ' + o.key.slice(0, 4) + (o.n < 28 ? ' (' + o.n + ' días)' : '')
    : g === 'semana' ? 'Semana del ' + F.fecha(o.desde) + ' al ' + F.fecha(o.hasta) : F.fecha(o.key);

  dash.draw('c_rango_res', (el) => {
    el.replaceChildren();
    const all = rowsOf('venta_periodo'); if (!all) { el.textContent = '—'; return; }
    const { d, h } = P();
    const sel = enRango(all, d, h);
    if (!sel.length) { el.textContent = 'No hay días en ese rango.'; return; }
    const tot = (rs, k) => rs.reduce((s, r) => s + r[k], 0);
    const v = tot(sel, 'venta_real'), p = tot(sel, 'pedidos');
    const i0 = all.findIndex((r) => r.fecha === sel[0].fecha);
    const prev = i0 >= sel.length ? all.slice(i0 - sel.length, i0) : null;
    const cambio = prev ? v / tot(prev, 'venta_real') - 1 : null;
    const item = (lab, val, sub, cls) => {
      const b = document.createElement('div');
      const l = document.createElement('div'); l.className = 'r-lab'; l.textContent = lab; b.appendChild(l);
      const x = document.createElement('div'); x.className = 'r-val'; x.textContent = val; b.appendChild(x);
      if (sub) { const s = document.createElement('div'); s.className = 'r-sub ' + (cls || ''); s.textContent = sub; b.appendChild(s); }
      el.appendChild(b);
    };
    item('Venta real', F.usd(v), cambio == null ? null : F.sgnpct(cambio) + ' vs ' + sel.length + ' días anteriores', cambio == null ? '' : cambio >= 0 ? 'up' : 'down');
    item('Pedidos', F.int(p), F.dec1(p / sel.length) + ' por día');
    item('Ticket real', F.usd2(v / p));
    item('Venta real por día', F.usd(v / sel.length));
    item('Días', F.int(sel.length), F.fecha(sel[0].fecha) + ' – ' + F.fecha(sel[sel.length - 1].fecha));
  });

  dash.draw('c_dia', (el) => {
    const all = rowsOf('venta_periodo');
    if (!all) { el.replaceChildren(); if (dash.data('venta_periodo').status === 'error') el.textContent = 'No cargó'; return; }
    const { d, h, g } = P();
    const rows = agrupar(enRango(all, d, h), g);
    const pocos = g === 'dia' && rows.length <= 45;
    chart(el, {
      rows, key: (o) => o.key, height: 280, pad: g === 'dia' ? 0.15 : 0.25, yFormat: F.usd, legend: g === 'dia',
      xLabel: (o) => g === 'dia' ? (pocos ? Number(o.key.slice(8)) + ' ' + F.mesCorto(o.key) : F.mesCorto(o.key)) : etiqueta(g, o),
      xTick: g === 'dia' && !pocos ? (o) => o.key.slice(8) === '01' || o.key === rows[0].key : null,
      tipTitle: (o) => titulo(g, o),
      series: g === 'dia'
        ? [{ name: 'Venta real del día', value: (o) => o.venta_real, color: C[0] }, { name: 'Promedio 7 días', value: (o) => o.media7, color: C[3] || C[1], type: 'line' }]
        : [{ name: g === 'semana' ? 'Venta real de la semana' : 'Venta real del mes', value: (o) => o.venta_real, color: C[0] }],
      extraTip: [
        { name: 'Pedidos', value: (o) => F.int(o.pedidos) },
        { name: 'Ticket real', value: (o) => o.pedidos ? F.usd2(o.venta_real / o.pedidos) : '—' },
        ...(g === 'dia' ? [] : [{ name: 'Días', value: (o) => F.int(o.n) }, { name: 'Venta real por día', value: (o) => F.usd(o.venta_real / o.n) }]),
      ],
    });
  });

  const fDesde = [...document.querySelectorAll('.f-desde')], fHasta = [...document.querySelectorAll('.f-hasta')];
  const fAgr = [...document.querySelectorAll('.f-agrupar')], fAtajos = [...document.querySelectorAll('.f-atajo')];
  const mostrar = () => {
    const { d, h, g } = P();
    fDesde.forEach((i) => { if (i !== document.activeElement) i.value = d; });
    fHasta.forEach((i) => { if (i !== document.activeElement) i.value = h; });
    fAgr.forEach((s) => { s.value = g; });
    fAtajos.forEach((b) => { const r = rango(b, maxFecha('venta_periodo')); b.setAttribute('aria-pressed', String(r.d === d && r.h === h)); });
  };
  fDesde.forEach((i) => {
    i.addEventListener('change', () => {
      if (!i.value || !i.validity.valid) return;
      const { h } = P();
      dash.setParams(i.value > h ? { desde: i.value, hasta: i.value } : { desde: i.value });
    });
    i.addEventListener('blur', mostrar);
  });
  fHasta.forEach((i) => {
    i.addEventListener('change', () => {
      if (!i.value || !i.validity.valid) return;
      const { d } = P();
      dash.setParams(i.value < d ? { desde: i.value, hasta: i.value } : { hasta: i.value });
    });
    i.addEventListener('blur', mostrar);
  });
  fAgr.forEach((s) => s.addEventListener('change', () => dash.setParams({ agrupar: s.value })));
  fAtajos.forEach((b) => b.addEventListener('click', () => { const r = rango(b, maxFecha('venta_periodo')); dash.setParams({ desde: r.d, hasta: r.h }); }));
  dash.onData(mostrar);

  // Última semana registrada
  const semRow = (el) => { const d = dash.data('semana_ult'); if (d.status !== 'ok') return null; const k = (el.getAttribute('data-where') || '').split('=')[1]; return d.data.find((r) => r.metrica === k) || null; };
  const fmtMet = (r, v) => r.tipo === 'parte' ? F.pct(v) : r.metrica === 'pedidos' ? F.int(v) : r.metrica === 'ticket_real' ? F.usd2(v) : F.usd(v);
  const fmtCambio = (r, v) => r.tipo === 'parte' ? (v >= 0 ? '+' : '−') + F.dec1(Math.abs(v) * 100) + ' pts' : F.sgnpct(v);
  dash.draw('sem_fecha', (el) => { const d = dash.data('semana_ult'); el.textContent = d.status === 'ok' && d.data[0] ? F.fecha(d.data[0][el.getAttribute('data-field')]) : '—'; });
  dash.draw('s_val', (el) => { const r = semRow(el); el.textContent = r ? fmtMet(r, r.ultima) : '—'; });
  dash.draw('s_det', (el) => { const r = semRow(el); el.textContent = r ? F.usd2(r.ultima) : '—'; });
  ['s_ant', 's_prom'].forEach((name) => dash.draw(name, (el) => {
    const r = semRow(el); const v = r ? r[el.getAttribute('data-field')] : null;
    el.textContent = r ? fmtCambio(r, v) : '—';
    el.classList.toggle('up', !!r && v > 0.0005); el.classList.toggle('down', !!r && v < -0.0005);
  }));

  // Hallazgos del mes
  dash.draw('h_mes', (el) => { const d = dash.data('hallazgos'); el.textContent = d.status === 'ok' && d.data[0] ? d.data[0].mes : '—'; });
  dash.draw('h_lista', (ul) => {
    ul.replaceChildren();
    const rows = rowsOf('hallazgos'); if (!rows) return;
    rows.forEach((r) => { const li = document.createElement('li'); li.className = r.direccion; li.textContent = r.texto; ul.appendChild(li); });
  });

  // Entradas en divisas con su propio rango de fechas
  const MET_DIV = [['efectivo_usd', 'Efectivo USD'], ['zelle', 'Zelle'], ['binance', 'Binance'], ['paypal', 'PayPal'], ['otros_sin_identificar', 'Sin identificar']];
  const PD = () => { const p = dash.params(); return { d: p.div_desde || '2026-01-01', h: p.div_hasta || maxFecha('divisas_periodo'), g: p.div_agrupar || 'mes' }; };
  const agruparDiv = (rows, g) => {
    const col = g === 'dia' ? 'fecha' : g === 'semana' ? 'semana' : 'mes', m = new Map();
    rows.forEach((r) => {
      const o = m.get(r[col]) || { key: r[col], n: 0, desde: r.fecha, hasta: r.fecha, total_divisas: 0, cobrado_total: 0, ...Object.fromEntries(MET_DIV.map(([k]) => [k, 0])) };
      MET_DIV.forEach(([k]) => { o[k] += r[k]; }); o.total_divisas += r.total_divisas; o.cobrado_total += r.cobrado_total; o.n += 1; o.hasta = r.fecha;
      m.set(r[col], o);
    });
    return [...m.values()];
  };
  dash.draw('d_res', (el) => {
    el.replaceChildren();
    const all = rowsOf('divisas_periodo'); if (!all) { el.textContent = '—'; return; }
    const { d, h } = PD();
    const sel = all.filter((r) => r.fecha >= d && r.fecha <= h);
    if (!sel.length) { el.textContent = 'No hay días en ese rango.'; return; }
    const t = (k) => sel.reduce((s, r) => s + r[k], 0);
    const item = (lab, val, sub) => {
      const b = document.createElement('div');
      const l = document.createElement('div'); l.className = 'r-lab'; l.textContent = lab; b.appendChild(l);
      const x = document.createElement('div'); x.className = 'r-val'; x.textContent = val; b.appendChild(x);
      if (sub) { const s = document.createElement('div'); s.className = 'r-sub'; s.textContent = sub; b.appendChild(s); }
      el.appendChild(b);
    };
    item('Total en divisas', F.usd(t('total_divisas')), F.pct(t('total_divisas') / t('cobrado_total')) + ' de lo cobrado');
    MET_DIV.forEach(([k, lab]) => item(lab, F.usd(t(k)), t('total_divisas') ? F.pct(t(k) / t('total_divisas')) + ' de las divisas' : null));
  });
  dash.draw('d_chart', (el) => {
    const all = rowsOf('divisas_periodo');
    if (!all) { el.replaceChildren(); if (dash.data('divisas_periodo').status === 'error') el.textContent = 'No cargó'; return; }
    const { d, h, g } = PD();
    const rows = agruparDiv(all.filter((r) => r.fecha >= d && r.fecha <= h), g);
    const pocos = g === 'dia' && rows.length <= 45;
    chart(el, {
      rows, key: (o) => o.key, stack: true, legend: true, tipShare: true, yFormat: F.usd, pad: g === 'dia' ? 0.15 : 0.25,
      segLabel: g === 'dia' ? null : (s, r, v) => F.pct0(v / r.total_divisas),
      xLabel: (o) => g === 'dia' ? (pocos ? Number(o.key.slice(8)) + ' ' + F.mesCorto(o.key) : F.mesCorto(o.key)) : etiqueta(g, o),
      xTick: g === 'dia' && !pocos ? (o) => o.key.slice(8) === '01' || o.key === rows[0].key : null,
      tipTitle: (o) => titulo(g, o),
      series: MET_DIV.map(([k, lab], i) => ({ name: lab, value: (o) => o[k], color: i === 4 ? 'var(--cds-chart-muted)' : C[i] })),
      extraTip: [{ name: 'Total', value: (o) => F.usd(o.total_divisas) }, { name: '% de lo cobrado', value: (o) => F.pct(o.total_divisas / o.cobrado_total) }],
    });
  });
  const dDesde = [...document.querySelectorAll('.fd-desde')], dHasta = [...document.querySelectorAll('.fd-hasta')];
  const dAgr = [...document.querySelectorAll('.fd-agrupar')], dAtajos = [...document.querySelectorAll('.fd-atajo')];
  const mostrarDiv = () => {
    const { d, h, g } = PD();
    dDesde.forEach((i) => { if (i !== document.activeElement) i.value = d; });
    dHasta.forEach((i) => { if (i !== document.activeElement) i.value = h; });
    dAgr.forEach((s) => { s.value = g; });
    dAtajos.forEach((b) => { const r = rango(b, maxFecha('divisas_periodo')); b.setAttribute('aria-pressed', String(r.d === d && r.h === h)); });
  };
  dDesde.forEach((i) => {
    i.addEventListener('change', () => { if (!i.value || !i.validity.valid) return; const { h } = PD(); dash.setParams(i.value > h ? { div_desde: i.value, div_hasta: i.value } : { div_desde: i.value }); });
    i.addEventListener('blur', mostrarDiv);
  });
  dHasta.forEach((i) => {
    i.addEventListener('change', () => { if (!i.value || !i.validity.valid) return; const { d } = PD(); dash.setParams(i.value < d ? { div_desde: i.value, div_hasta: i.value } : { div_hasta: i.value }); });
    i.addEventListener('blur', mostrarDiv);
  });
  dAgr.forEach((s) => s.addEventListener('change', () => dash.setParams({ div_agrupar: s.value })));
  dAtajos.forEach((b) => b.addEventListener('click', () => { const r = rango(b, maxFecha('divisas_periodo')); dash.setParams({ div_desde: r.d, div_hasta: r.h }); }));
  dash.onData(mostrarDiv);

  draw('c_ticket', 'mensual', (rows) => ({
    rows, key: mesKey, xLabel: mesLab, yFormat: F.usd, legend: true,
    series: [
      { name: 'Ticket a tasa BCV', value: (r) => N(r.ticket_nominal_bcv), color: C[1], type: 'line', fmt: F.usd2 },
      { name: 'Ticket real', value: (r) => N(r.ticket_real), color: C[0], type: 'line', fmt: F.usd2 },
    ],
  }));

  draw('c_semana', 'semana', (rows) => ({
    rows, key: (r) => r.dia_semana, xLabel: (r) => r.dia_semana.slice(0, 3), tipTitle: (r) => r.dia_semana, yFormat: F.usd,
    series: [{ name: 'Venta real promedio', value: (r) => N(r.venta_real), color: C[0] }],
    extraTip: [{ name: 'Pedidos promedio', value: (r) => F.dec1(N(r.pedidos)) }, { name: 'Ticket real', value: (r) => F.usd2(N(r.ticket_real)) }, { name: '% de la semana', value: (r) => F.pct(N(r.pct_semana)) }],
  }));

  const canales = ['Salón', 'Delivery propio', 'Yummy', 'Para llevar', 'PedidosYa'];
  draw('c_canal', 'canales_pivot', (rows) => ({
    rows, key: mesKey, xLabel: mesLab, yFormat: F.int, stack: true, legend: true, tipShare: true,
    segLabel: (s, r, v) => F.pct0(v / canales.reduce((t, c) => t + (r[c] || 0), 0)),
    series: canales.map((c, i) => ({ name: c, value: (r) => r[c] || 0, color: C[i] })),
  }));

  draw('c_mix', 'mix_cobro', (rows) => ({
    rows, key: mesKey, xLabel: mesLab, yFormat: F.pct0, stack: true, legend: true, ymax: 1,
    segLabel: (s, r, v) => F.pct0(v),
    series: [
      { name: 'Pago móvil', value: (r) => r.pago_movil_usd, color: C[0], fmt: F.pct },
      { name: 'Punto de venta', value: (r) => r.pdv_usd, color: C[1], fmt: F.pct },
      { name: 'Zelle', value: (r) => r.zelle, color: C[2], fmt: F.pct },
      { name: 'Efectivo USD', value: (r) => r.efectivo_usd, color: C[3], fmt: F.pct },
      { name: 'Binance', value: (r) => r.binance, color: C[4], fmt: F.pct },
    ],
  }));

  draw('c_brecha', 'mensual', (rows) => ({
    rows, key: mesKey, xLabel: mesLab, yFormat: F.usd,
    series: [{ name: 'Perdido por la brecha', value: (r) => N(r.perdida_brecha), color: 'var(--cds-chart-status-critical)' }],
  }));

  draw('c_tasa', 'diario', (rows) => ({
    rows, key: (r) => r.fecha, xLabel: (r) => F.mesCorto(r.fecha), xTick: (r) => r.fecha.slice(8) === '01', tipTitle: (r) => F.fecha(r.fecha),
    yFormat: F.int, pad: 0, height: 220,
    series: [{ name: 'Bs por USD', value: (r) => N(r.tasa_bcv), color: C[1], type: 'line', fmt: F.bs }],
  }));

  draw('c_prop', 'mensual', (rows) => ({
    rows, key: mesKey, xLabel: mesLab, yFormat: F.pct0, legend: true,
    series: [
      { name: '% de mesas con propina', value: (r) => N(r.mesas_con_propina_pct), color: C[0], type: 'line', fmt: F.pct },
      { name: 'Propinas como % de la venta', value: (r) => N(r.propina_pct_venta), color: C[1], type: 'line', fmt: F.pct },
    ],
  }));

  draw('c_cred', 'diario', (rows) => ({
    rows: rows.filter((r) => r.creditos_saldo !== ''), key: (r) => r.fecha, xLabel: (r) => F.mesCorto(r.fecha), xTick: (r) => r.fecha.slice(8) === '01',
    tipTitle: (r) => F.fecha(r.fecha), yFormat: F.usd, pad: 0,
    series: [{ name: 'Saldo de créditos', value: (r) => N(r.creditos_saldo), color: C[2], type: 'line', fmt: F.usd2 }],
  }));

  const table = (name, id, cols) => dash.draw(name, (tb) => {
    tb.replaceChildren();
    const rows = rowsOf(id); if (!rows) return;
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      cols.forEach(([k, f]) => { const td = document.createElement('td'); td.textContent = f ? f(N(r[k])) : r[k]; tr.appendChild(td); });
      tb.appendChild(tr);
    });
  });
  table('t_canales', 'canales', [['canal'], ['pedidos', F.int], ['pct_pedidos', F.pct], ['venta_real', F.usd], ['pct_venta', F.pct], ['ticket_real', F.usd2], ['pct_divisas', F.pct], ['pedidos_mes_ene_mar', F.dec1], ['pedidos_mes_ago_oct', F.dec1]]);
  table('t_alertas', 'alertas', [['fecha'], ['zelle', F.usd2], ['zelle_en_total_hoja', F.usd2], ['diferencia', F.usd2]]);

  // Tablas por mes o semana, con flecha frente al período anterior
  const tablaPeriodo = (name, id, param, cols) => dash.draw(name, (tb) => {
    tb.replaceChildren();
    const all = rowsOf(id); if (!all) return;
    const tipo = dash.params()[param] || 'mes';
    const rows = all.filter((r) => r.tipo === tipo);
    rows.forEach((r, i) => {
      const tr = document.createElement('tr'); tr.dataset.key = r.id;
      cols.forEach(([k, f, flecha]) => {
        const td = document.createElement('td');
        td.textContent = f ? f(r[k]) : r[k];
        if (flecha && i > 0) { const a = rows[i - 1][k]; if (r[k] > a + 0.005) td.className = 'sube'; else if (r[k] < a - 0.005) td.className = 'baja'; }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
  });
  tablaPeriodo('t_canales_pct', 'canales_pct', 'per_canales', [['etiqueta'], ['dias', F.int], ['pedidos', F.int], ['pct_salon', F.pct, 1], ['pct_delivery', F.pct, 1], ['pct_yummy', F.pct, 1], ['pct_llevar', F.pct, 1], ['pct_pedidosya', F.pct, 1], ['venta_real', F.usd]]);
  tablaPeriodo('t_cobros_pct', 'cobros_pct', 'per_cobros', [['etiqueta'], ['dias', F.int], ['cobrado_bcv', F.usd], ['pct_pago_movil', F.pct, 1], ['pct_pdv', F.pct, 1], ['pct_zelle', F.pct, 1], ['pct_efectivo', F.pct, 1], ['pct_binance', F.pct, 1], ['pct_divisas', F.pct, 1], ['perdida_brecha', F.usd], ['pct_brecha', F.pct, 1]]);
  const fPer = [...document.querySelectorAll('.f-per')];
  fPer.forEach((s) => s.addEventListener('change', () => dash.setParams({ [s.dataset.param]: s.value })));
  dash.onData(() => fPer.forEach((s) => { s.value = dash.params()[s.dataset.param] || 'mes'; }));
})();
