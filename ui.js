// Vista previa: categorías y análisis desplegables, animaciones suaves y modo claro/oscuro
(function () {
  const root = () => document.getElementById('dash-root');
  const reducir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Envuelve el contenido en un contenedor que se anima por altura (grid 0fr → 1fr)
  function caja(cls, nodos) {
    const outer = document.createElement('div');
    outer.className = cls;
    const inner = document.createElement('div');
    inner.className = cls + '-in';
    nodos.forEach((n) => inner.appendChild(n));
    outer.appendChild(inner);
    return outer;
  }
  const hermanosDespues = (el, parar) => {
    const out = [];
    let n = el.nextSibling;
    while (n && n !== parar) { const nx = n.nextSibling; out.push(n); n = nx; }
    return out;
  };

  // 1) Cada análisis (tarjeta) → desplegable
  function enhanceCard(card) {
    if (card.dataset.enh) return;
    const h = card.querySelector('h3');
    if (!h) return;
    card.dataset.enh = '1';
    let top = h;
    while (top.parentElement && top.parentElement !== card) top = top.parentElement;
    const cuerpo = caja('cbody', hermanosDespues(top, null));
    card.appendChild(cuerpo);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tog';
    btn.setAttribute('aria-expanded', 'false');
    const tl = document.createElement('span');
    tl.className = 'tl';
    while (h.firstChild) tl.appendChild(h.firstChild);
    btn.appendChild(tl);
    h.appendChild(btn);
    card.classList.add('plegada');
  }

  // 2) Cada categoría (h2 con sus tarjetas) → desplegable
  function enhanceCategorias() {
    const cu = root() && root().querySelector('.cu');
    if (!cu) return;
    cu.querySelectorAll('h2').forEach((h2) => {
      if (h2.dataset.enh) return;
      h2.dataset.enh = '1';
      // solo hasta el siguiente h2
      const sig = [];
      let n = h2.nextSibling;
      while (n && !(n.nodeType === 1 && n.tagName === 'H2')) { const nx = n.nextSibling; sig.push(n); n = nx; }
      const cuerpo = caja('catbody', sig);
      h2.after(cuerpo);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ctog';
      btn.setAttribute('aria-expanded', 'true');
      const tl = document.createElement('span');
      tl.className = 'tl';
      while (h2.firstChild) tl.appendChild(h2.firstChild);
      btn.appendChild(tl);
      h2.appendChild(btn);
    });
  }

  function enhanceTopbar() {
    const top = document.querySelector('.topbar');
    if (!top || top.querySelector('#tema')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'tema';
    top.querySelector('#salir').before(b);
    aplicarTema(leerTema(), b);
  }

  const leerTema = () => { try { return localStorage.getItem('cuate_tema') || 'auto'; } catch (e) { return 'auto'; } };
  const etiquetas = { auto: 'Tema: automático', oscuro: 'Tema: oscuro', claro: 'Tema: claro' };
  const siguiente = { auto: 'oscuro', oscuro: 'claro', claro: 'auto' };
  function aplicarTema(t, b) {
    document.documentElement.dataset.theme = t === 'auto' ? '' : t;
    const btn = b || document.getElementById('tema');
    if (btn) btn.textContent = etiquetas[t];
    try { localStorage.setItem('cuate_tema', t); } catch (e) {}
  }

  function enhanceAll() {
    if (!root()) return;
    root().querySelectorAll('.card').forEach(enhanceCard);
    enhanceCategorias();
    enhanceTopbar();
    const cu = root().querySelector('.cu');
    if (cu && !root().querySelector('.bar') && cu.querySelector('h2')) {
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.innerHTML = '<button type="button" id="todo" aria-expanded="false">Desplegar todos los análisis</button>';
      cu.querySelector('h2').before(bar);
    }
  }

  const setCard = (card, abrir) => {
    card.classList.toggle('abierta', abrir);
    card.classList.toggle('plegada', !abrir);
    const t = card.querySelector('.tog'); if (t) t.setAttribute('aria-expanded', String(abrir));
  };

  document.addEventListener('click', (e) => {
    const tema = e.target.closest('#tema');
    if (tema) { aplicarTema(siguiente[leerTema()], tema); return; }

    const todo = e.target.closest('#todo');
    if (todo) {
      const abrir = todo.getAttribute('aria-expanded') !== 'true';
      root().querySelectorAll('.card').forEach((c) => setCard(c, abrir));
      todo.setAttribute('aria-expanded', String(abrir));
      todo.textContent = abrir ? 'Plegar todos los análisis' : 'Desplegar todos los análisis';
      return;
    }

    const cat = e.target.closest('.ctog');
    if (cat) {
      const abrir = cat.getAttribute('aria-expanded') !== 'true';
      cat.setAttribute('aria-expanded', String(abrir));
      const h2 = cat.closest('h2');
      const cuerpo = h2.nextElementSibling;
      if (cuerpo && cuerpo.classList.contains('catbody')) cuerpo.classList.toggle('cerrada', !abrir);
      h2.classList.toggle('cerrada', !abrir);
      return;
    }

    const b = e.target.closest('.tog');
    if (!b) return;
    const card = b.closest('.card');
    setCard(card, !card.classList.contains('abierta'));
  });

  new MutationObserver(enhanceAll).observe(document.body, { childList: true, subtree: true });
  enhanceAll();
  aplicarTema(leerTema());
  void reducir;
})();
