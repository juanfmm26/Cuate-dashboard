dash.calc('kpi', {
  title: 'Indicadores clave 2026',
  description: 'Totales ene–oct 2026 y cambios entre periodos, a partir del resumen mensual, diario, por día de semana, por canal, histórico y alertas.',
  inputs: ['mensual', 'diario', 'semana', 'historico', 'canales', 'alertas'],
  fn: (mensual, diario, semana, historico, canales, alertas) => {
    const n = (v) => Number(v) || 0;
    const sum = (rows, k) => rows.reduce((a, r) => a + n(r[k]), 0);
    const pick = (rows, from, to) => rows.filter((r) => r.mes >= from && r.mes <= to);
    const a = pick(mensual, '2026-01', '2026-05'), b = pick(mensual, '2026-08', '2026-10');
    const sep = mensual.find((r) => r.mes === '2026-09'), oct = mensual.find((r) => r.mes === '2026-10');
    const venta = sum(mensual, 'venta_real'), ped = sum(mensual, 'pedidos'), nom = sum(mensual, 'venta_nominal_bcv');
    const divisas = sum(mensual, 'efectivo_usd') + sum(mensual, 'zelle') + sum(mensual, 'binance');
    const cobrado = divisas + sum(mensual, 'pdv_usd') + sum(mensual, 'pago_movil_usd');
    const pdA = sum(a, 'pedidos') / sum(a, 'dias'), pdB = sum(b, 'pedidos') / sum(b, 'dias');
    const tnA = sum(a, 'venta_nominal_bcv') / sum(a, 'pedidos'), tnB = sum(b, 'venta_nominal_bcv') / sum(b, 'pedidos');
    const umbral = 150;
    const flojos = diario.filter((r) => r.fecha >= '2026-08-01' && r.fecha <= '2026-10-31' && n(r.venta_real) < umbral).length;
    const flojosA = diario.filter((r) => r.fecha < '2026-06-01' && n(r.venta_real) < umbral).length;
    const findesemana = semana.filter((r) => ['Viernes', 'Sábado', 'Domingo'].includes(r.dia_semana)).reduce((s, r) => s + n(r.pct_semana), 0);
    const sab = semana.find((r) => r.dia_semana === 'Sábado'), mar = semana.find((r) => r.dia_semana === 'Martes');
    const h = (y) => historico.filter((r) => r.anio === y && n(r.mes_num) >= 8 && n(r.mes_num) <= 10).reduce((s, r) => s + n(r.pedidos), 0);
    const salon = canales.find((r) => r.canal === 'Salón'), yum = canales.find((r) => r.canal === 'Yummy'), del = canales.find((r) => r.canal === 'Delivery propio');
    const ultimo = diario.filter((r) => r.creditos_saldo !== '').slice(-1)[0];
    return [{
      venta_real_ytd: venta, pedidos_ytd: ped, ticket_real_ytd: venta / ped,
      perdida_brecha_ytd: sum(mensual, 'perdida_brecha'), pct_brecha: sum(mensual, 'perdida_brecha') / nom,
      pct_divisas_ytd: divisas / cobrado,
      pedidos_dia_ene_may: pdA, pedidos_dia_ago_oct: pdB, cambio_pedidos_dia: pdB / pdA - 1,
      ticket_nom_ene_may: tnA, ticket_nom_ago_oct: tnB, cambio_ticket_nom: tnB / tnA - 1,
      vrd_oct: n(oct.venta_real_dia), cambio_vrd_oct: n(oct.venta_real_dia) / n(sep.venta_real_dia) - 1,
      pedidos_ago_oct_2025: h('2025'), pedidos_ago_oct_2026: h('2026'), cambio_yoy_ago_oct: h('2026') / h('2025') - 1,
      zelle_no_sumado: sum(mensual, 'zelle_no_sumado'), dias_zelle_no_sumado: alertas.length,
      dias_flojos_ago_oct: flojos, dias_flojos_ene_may: flojosA, umbral,
      pct_vie_dom: findesemana, sab_vs_mar: n(sab.venta_real) / n(mar.venta_real),
      salon_ene_mar: n(salon.pedidos_mes_ene_mar), salon_ago_oct: n(salon.pedidos_mes_ago_oct), cambio_salon: n(salon.pedidos_mes_ago_oct) / n(salon.pedidos_mes_ene_mar) - 1,
      yummy_ene_mar: n(yum.pedidos_mes_ene_mar), yummy_ago_oct: n(yum.pedidos_mes_ago_oct),
      ticket_yummy: n(yum.ticket_real), ticket_salon: n(salon.ticket_real), ticket_delivery: n(del.ticket_real), divisas_delivery: n(del.pct_divisas),
      creditos_ultimo: n(ultimo.creditos_saldo), creditos_dias_venta: n(ultimo.creditos_saldo) / (venta / diario.filter((r) => r.fecha <= '2026-10-31').length),
      mesas_propina_oct: n(oct.mesas_con_propina_pct), mesas_propina_jun: n(mensual.find((r) => r.mes === '2026-06').mesas_con_propina_pct),
    }];
  },
});

dash.calc('venta_periodo', {
  title: 'Venta real por día, semana y mes',
  description: 'Venta real, venta a tasa BCV y pedidos de cada día, con su semana (empieza el lunes), su mes y el promedio de los últimos 7 días.',
  inputs: ['diario'],
  fn: (diario) => diario.map((r, i) => {
    const d = new Date(r.fecha + 'T12:00:00Z');
    const lunes = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10);
    const w = diario.slice(Math.max(0, i - 6), i + 1);
    return {
      fecha: r.fecha, semana: lunes, mes: r.fecha.slice(0, 7),
      venta_real: Number(r.venta_real), venta_nominal_bcv: Number(r.venta_nominal_bcv), pedidos: Number(r.pedidos),
      media7: i < 6 ? null : w.reduce((s, x) => s + Number(x.venta_real), 0) / w.length,
    };
  }),
});

dash.calc('pedidos_anio', {
  title: 'Pedidos por mes y año',
  description: 'Pedidos de cada mes, una columna por año (2024, 2025, 2026).',
  inputs: ['historico'],
  fn: (historico) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
    const g = (y) => { const r = historico.find((x) => x.anio === y && Number(x.mes_num) === m); return r ? Number(r.pedidos) : null; };
    const r0 = historico.find((x) => Number(x.mes_num) === m);
    return { mes_num: m, nombre: r0 ? r0.nombre : String(m), a2024: g('2024'), a2025: g('2025'), a2026: g('2026') };
  }),
});

dash.calc('canales_pivot', {
  title: 'Pedidos por canal y mes',
  description: 'Pedidos de cada mes repartidos por canal (salón, delivery propio, Yummy, para llevar, PedidosYa).',
  inputs: ['canales_mes'],
  fn: (canales_mes) => {
    const meses = [...new Set(canales_mes.map((r) => r.mes))].sort();
    return meses.map((m) => {
      const o = { mes: m };
      canales_mes.filter((r) => r.mes === m).forEach((r) => { o[r.canal] = Number(r.pedidos); });
      return o;
    });
  },
});

dash.calc('mix_cobro', {
  title: 'Mezcla de métodos de cobro',
  description: 'Parte de lo cobrado cada mes por método: efectivo USD, Zelle, Binance, punto de venta y pago móvil (a tasa BCV).',
  inputs: ['mensual'],
  fn: (mensual) => mensual.map((r) => {
    const k = ['efectivo_usd', 'zelle', 'binance', 'pdv_usd', 'pago_movil_usd'];
    const t = k.reduce((s, c) => s + Number(r[c]), 0);
    const o = { mes: r.mes };
    k.forEach((c) => { o[c] = Number(r[c]) / t; });
    return o;
  }),
});

dash.calc('canales_pct', {
  title: 'Canales por mes y por semana',
  description: 'Pedidos y venta real de cada canal por mes y por semana (empieza el lunes), con la parte de cada canal sobre el total de pedidos.',
  inputs: ['canales_dia'],
  fn: (canales_dia) => {
    const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const lunes = (f) => { const d = new Date(f + 'T12:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10); };
    const slug = { 'Salón': 'salon', 'Delivery propio': 'delivery', 'Yummy': 'yummy', 'Para llevar': 'llevar', 'PedidosYa': 'pedidosya' };
    const out = new Map();
    canales_dia.forEach((r) => {
      [['mes', r.fecha.slice(0, 7)], ['semana', lunes(r.fecha)]].forEach(([tipo, per]) => {
        const id = tipo + ':' + per;
        const o = out.get(id) || { id, tipo, periodo: per, etiqueta: tipo === 'mes' ? MES[Number(per.slice(5, 7)) - 1] + ' ' + per.slice(0, 4) : 'Sem. ' + Number(per.slice(8)) + ' ' + MES[Number(per.slice(5, 7)) - 1], dias: new Set(), pedidos: 0, venta_real: 0, salon: 0, delivery: 0, yummy: 0, llevar: 0, pedidosya: 0 };
        o.dias.add(r.fecha); o.pedidos += Number(r.pedidos); o.venta_real += Number(r.venta_real); o[slug[r.canal]] += Number(r.pedidos);
        out.set(id, o);
      });
    });
    return [...out.values()].sort((a, b) => (a.tipo + a.periodo).localeCompare(b.tipo + b.periodo)).map((o) => ({
      id: o.id, tipo: o.tipo, periodo: o.periodo, etiqueta: o.etiqueta, dias: o.dias.size, pedidos: o.pedidos, venta_real: o.venta_real,
      salon: o.salon, delivery: o.delivery, yummy: o.yummy, llevar: o.llevar, pedidosya: o.pedidosya,
      pct_salon: o.salon / o.pedidos, pct_delivery: o.delivery / o.pedidos, pct_yummy: o.yummy / o.pedidos, pct_llevar: o.llevar / o.pedidos, pct_pedidosya: o.pedidosya / o.pedidos,
    }));
  },
});

dash.calc('cobros_pct', {
  title: 'Cobros y brecha por mes y por semana',
  description: 'Lo cobrado por cada método (a tasa BCV) como parte del total, la parte en divisas y lo perdido por la brecha, por mes y por semana (empieza el lunes).',
  inputs: ['diario'],
  fn: (diario) => {
    const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const lunes = (f) => { const d = new Date(f + 'T12:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10); };
    const k = ['pago_movil_usd', 'pdv_usd', 'zelle', 'efectivo_usd', 'binance'];
    const out = new Map();
    diario.forEach((r) => {
      [['mes', r.fecha.slice(0, 7)], ['semana', lunes(r.fecha)]].forEach(([tipo, per]) => {
        const id = tipo + ':' + per;
        const o = out.get(id) || { id, tipo, periodo: per, etiqueta: tipo === 'mes' ? MES[Number(per.slice(5, 7)) - 1] + ' ' + per.slice(0, 4) : 'Sem. ' + Number(per.slice(8)) + ' ' + MES[Number(per.slice(5, 7)) - 1], dias: 0, venta_nominal_bcv: 0, venta_real: 0, perdida_brecha: 0, pago_movil_usd: 0, pdv_usd: 0, zelle: 0, efectivo_usd: 0, binance: 0 };
        o.dias += 1; o.venta_nominal_bcv += Number(r.venta_nominal_bcv); o.venta_real += Number(r.venta_real); o.perdida_brecha += Number(r.perdida_brecha);
        k.forEach((c) => { o[c] += Number(r[c]); });
        out.set(id, o);
      });
    });
    return [...out.values()].sort((a, b) => (a.tipo + a.periodo).localeCompare(b.tipo + b.periodo)).map((o) => {
      const t = k.reduce((s, c) => s + o[c], 0);
      return {
        id: o.id, tipo: o.tipo, periodo: o.periodo, etiqueta: o.etiqueta, dias: o.dias, cobrado_bcv: t, venta_real: o.venta_real,
        pct_pago_movil: o.pago_movil_usd / t, pct_pdv: o.pdv_usd / t, pct_zelle: o.zelle / t, pct_efectivo: o.efectivo_usd / t, pct_binance: o.binance / t,
        pct_divisas: (o.zelle + o.efectivo_usd + o.binance) / t, perdida_brecha: o.perdida_brecha, pct_brecha: o.perdida_brecha / o.venta_nominal_bcv,
      };
    });
  },
});

dash.calc('semana_ult', {
  title: 'Última semana registrada',
  description: 'Los últimos 7 días del archivo comparados con los 7 días anteriores y con el promedio de las 8 semanas previas.',
  inputs: ['diario', 'canales_dia', 'divisas'],
  fn: (diario, canales_dia, divisas) => {
    const n = (v) => Number(v) || 0;
    const fechas = diario.map((r) => r.fecha).sort();
    const bloque = (k) => fechas.slice(fechas.length - 7 * (k + 1), fechas.length - 7 * k);
    const med = (fs) => {
      const set = new Set(fs);
      const d = diario.filter((r) => set.has(r.fecha)), c = canales_dia.filter((r) => set.has(r.fecha)), v = divisas.filter((r) => set.has(r.fecha));
      const venta = d.reduce((s, r) => s + n(r.venta_real), 0), ped = d.reduce((s, r) => s + n(r.pedidos), 0);
      const dom = c.filter((r) => ['Delivery propio', 'Yummy', 'PedidosYa'].includes(r.canal)).reduce((s, r) => s + n(r.pedidos), 0);
      const pc = c.reduce((s, r) => s + n(r.pedidos), 0);
      const div = v.reduce((s, r) => s + n(r.total_divisas), 0), cob = v.reduce((s, r) => s + n(r.cobrado_total), 0);
      const sv = (k) => v.reduce((s, r) => s + n(r[k]), 0);
      return { venta_real: venta, pedidos: ped, ticket_real: venta / ped, pct_divisas: div / cob, divisas: div, pct_domicilio: dom / pc, propinas: d.reduce((s, r) => s + n(r.propinas), 0),
        div_efectivo: sv('efectivo_usd'), div_zelle: sv('zelle'), div_binance: sv('binance'), div_paypal: sv('paypal'), div_otros: sv('otros_sin_identificar') };
    };
    const ult = med(bloque(0)), ant = med(bloque(1));
    const prev = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => med(bloque(k)));
    const defs = [['venta_real', 'Venta real', 'nivel'], ['pedidos', 'Pedidos', 'nivel'], ['ticket_real', 'Ticket real', 'nivel'], ['divisas', 'Entró en divisas', 'nivel'], ['pct_divisas', '% cobrado en divisas', 'parte'], ['pct_domicilio', '% pedidos a domicilio', 'parte'], ['propinas', 'Propinas', 'nivel'],
      ['div_efectivo', 'Divisas: efectivo USD', 'detalle'], ['div_zelle', 'Divisas: Zelle', 'detalle'], ['div_binance', 'Divisas: Binance', 'detalle'], ['div_paypal', 'Divisas: PayPal', 'detalle'], ['div_otros', 'Divisas: sin identificar', 'detalle']];
    const u = bloque(0);
    return defs.map(([k, nombre, tipo]) => {
      const p8 = prev.reduce((s, m) => s + m[k], 0) / prev.length;
      return {
        metrica: k, nombre, tipo, desde: u[0], hasta: u[u.length - 1], ultima: ult[k], anterior: ant[k], prom8: p8,
        cambio_ant: tipo === 'parte' ? ult[k] - ant[k] : ult[k] / ant[k] - 1,
        cambio_prom: tipo === 'parte' ? ult[k] - p8 : ult[k] / p8 - 1,
      };
    });
  },
});

dash.calc('hallazgos', {
  title: 'Hallazgos del último mes',
  description: 'Compara el último mes completo con el anterior en ventas, pedidos, ticket, métodos de cobro, canales y propinas, y deja los cambios más grandes.',
  inputs: ['mensual', 'canales_mes', 'diario', 'divisas'],
  fn: (mensual, canales_mes, diario, divisas) => {
    const n = (v) => Number(v) || 0;
    const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const nf = (d) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: d, maximumFractionDigits: d });
    const usd = (v) => '$' + nf(0).format(v), usd2 = (v) => '$' + nf(2).format(v), pct = (v) => nf(1).format(v * 100) + '%', num = (v) => nf(1).format(v);
    const meses = mensual.map((r) => r.mes).sort();
    const M = meses[meses.length - 1], P = meses[meses.length - 2], antes = meses.slice(0, -1);
    const nm = (m) => MES[Number(m.slice(5, 7)) - 1];
    const mm = (m) => mensual.find((r) => r.mes === m);
    const cob = (r) => n(r.efectivo_usd) + n(r.zelle) + n(r.binance) + n(r.pdv_usd) + n(r.pago_movil_usd);
    const canal = (m, c) => { const t = canales_mes.filter((r) => r.mes === m).reduce((s, r) => s + n(r.pedidos), 0); const x = canales_mes.find((r) => r.mes === m && r.canal === c); return x ? n(x.pedidos) / t : 0; };
    const dias = (m) => diario.filter((r) => r.mes === m);
    const finde = (m) => { const d = dias(m); const t = d.reduce((s, r) => s + n(r.venta_real), 0); return d.filter((r) => ['Viernes', 'Sábado', 'Domingo'].includes(r.dia_semana)).reduce((s, r) => s + n(r.venta_real), 0) / t; };
    const met = [
      ['Venta real por día', 'nivel', usd, (m) => n(mm(m).venta_real_dia)],
      ['Pedidos por día', 'nivel', num, (m) => n(mm(m).pedidos_dia)],
      ['Ticket real', 'nivel', usd2, (m) => n(mm(m).ticket_real)],
      ['Ticket a tasa BCV', 'nivel', usd2, (m) => n(mm(m).ticket_nominal_bcv)],
      ['% cobrado en divisas', 'parte', pct, (m) => n(mm(m).pct_divisas)],
      ['% cobrado en efectivo USD', 'parte', pct, (m) => n(mm(m).efectivo_usd) / cob(mm(m))],
      ['% cobrado por Zelle', 'parte', pct, (m) => n(mm(m).zelle) / cob(mm(m))],
      ['% cobrado por pago móvil', 'parte', pct, (m) => n(mm(m).pago_movil_usd) / cob(mm(m))],
      ['% cobrado por punto de venta', 'parte', pct, (m) => n(mm(m).pdv_usd) / cob(mm(m))],
      ['% de pedidos en salón', 'parte', pct, (m) => canal(m, 'Salón')],
      ['% de pedidos por delivery propio', 'parte', pct, (m) => canal(m, 'Delivery propio')],
      ['% de pedidos por Yummy', 'parte', pct, (m) => canal(m, 'Yummy')],
      ['% de pedidos por PedidosYa', 'parte', pct, (m) => canal(m, 'PedidosYa')],
      ['% de pedidos para llevar', 'parte', pct, (m) => canal(m, 'Para llevar')],
      ['% de mesas que dejan propina', 'parte', pct, (m) => n(mm(m).mesas_con_propina_pct)],
      ['% de la venta de viernes a domingo', 'parte', pct, finde],
    ];
    const filas = met.map(([nombre, tipo, f, g]) => {
      const vm = g(M), vp = g(P), va = antes.reduce((s, m) => s + g(m), 0) / antes.length;
      const delta = tipo === 'parte' ? vm - vp : vm / vp - 1;
      const score = tipo === 'parte' ? Math.abs(delta) / 0.015 : Math.abs(delta) / 0.05;
      const dtxt = tipo === 'parte' ? (delta >= 0 ? '+' : '−') + nf(1).format(Math.abs(delta) * 100) + ' pts' : (delta >= 0 ? '+' : '−') + nf(1).format(Math.abs(delta) * 100) + '%';
      const verbo = delta >= 0 ? 'subió' : 'bajó';
      return { tema: nombre, direccion: delta >= 0 ? 'sube' : 'baja', score, cambio: delta,
        texto: nombre + ': ' + verbo + ' de ' + f(vp) + ' en ' + nm(P) + ' a ' + f(vm) + ' en ' + nm(M) + ' (' + dtxt + '). Promedio de los meses anteriores: ' + f(va) + '.' };
    }).filter((r) => r.score >= 1).sort((a, b) => b.score - a.score).slice(0, 7);
    const d = dias(M).slice().sort((a, b) => n(b.venta_real) - n(a.venta_real));
    const mejor = d[0], peor = d[d.length - 1];
    const fd = (s) => Number(s.slice(8)) + ' de ' + nm(s);
    const v = divisas.filter((r) => r.fecha.slice(0, 7) === M), vb = divisas.filter((r) => r.fecha.slice(0, 7) === P);
    const sum = (rs, k) => rs.reduce((s, r) => s + n(r[k]), 0);
    filas.push({ tema: 'Divisas', direccion: sum(v, 'total_divisas') >= sum(vb, 'total_divisas') ? 'sube' : 'baja', score: 0, cambio: sum(v, 'total_divisas') / sum(vb, 'total_divisas') - 1,
      texto: 'Entraron ' + usd(sum(v, 'total_divisas')) + ' en divisas en ' + nm(M) + ' (' + usd(sum(vb, 'total_divisas')) + ' en ' + nm(P) + '): efectivo USD ' + usd(sum(v, 'efectivo_usd')) + ', Zelle ' + usd(sum(v, 'zelle')) + ', Binance ' + usd(sum(v, 'binance')) + ', PayPal ' + usd(sum(v, 'paypal')) + '.' });
    filas.push({ tema: 'Mejor y peor día', direccion: 'dato', score: 0, cambio: null,
      texto: 'Mejor día: ' + mejor.dia_semana.toLowerCase() + ' ' + fd(mejor.fecha) + ' con ' + usd(n(mejor.venta_real)) + ' y ' + n(mejor.pedidos) + ' pedidos. Peor día: ' + peor.dia_semana.toLowerCase() + ' ' + fd(peor.fecha) + ' con ' + usd(n(peor.venta_real)) + ' y ' + n(peor.pedidos) + ' pedidos.' });
    return filas.map((r, i) => ({ orden: i + 1, mes: nm(M), ...r }));
  },
});

dash.calc('divisas_periodo', {
  title: 'Entradas en divisas por día',
  description: 'Efectivo USD, Zelle, Binance, PayPal y otros sin identificar de cada día, con su semana (empieza el lunes) y su mes.',
  inputs: ['divisas'],
  fn: (divisas) => divisas.map((r) => {
    const d = new Date(r.fecha + 'T12:00:00Z');
    const lunes = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10);
    const o = { fecha: r.fecha, semana: lunes, mes: r.fecha.slice(0, 7) };
    ['efectivo_usd', 'zelle', 'binance', 'paypal', 'otros_sin_identificar', 'total_divisas', 'cobrado_total'].forEach((k) => { o[k] = Number(r[k]) || 0; });
    return o;
  }),
});
