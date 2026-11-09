(function () {
  const KEY = 'cuate_clave';
  const $ = (s) => document.querySelector(s);
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const guardar = (pw) => { try { localStorage.setItem(KEY, pw); } catch (e) {} };
  const leer = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const borrar = () => { try { localStorage.removeItem(KEY); } catch (e) {} };

  async function descifrar(pw) {
    const enc = await (await fetch('data.enc.json?v=' + Date.now(), { cache: 'no-store' })).json();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(enc.salt), iterations: enc.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv) }, key, b64(enc.ct));
    const txt = await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    return JSON.parse(txt);
  }
  const cargarScript = (src) => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = mal; document.body.appendChild(s); });

  async function abrir(pw, recordar) {
    const datos = await descifrar(pw);
    if (recordar) guardar(pw);
    const panel = await (await fetch('panel.html?v=' + Date.now(), { cache: 'no-store' })).text();
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#upd').textContent = datos.actualizado;
    $('#dash-root').innerHTML = panel;
    for (const f of ['charts.js', 'calcs.js', 'main.js']) await cargarScript(f + '?v=' + datos.version);
    window.__dashStart(datos);
  }

  $('#login form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    $('#err').textContent = '';
    $('#entrar').disabled = true;
    try { await abrir($('#pw').value, $('#recordar').checked); }
    catch (e) { console.error(e); $('#err').textContent = 'Contraseña incorrecta.'; }
    $('#entrar').disabled = false;
  });
  $('#salir').addEventListener('click', () => { borrar(); location.reload(); });

  const guardada = leer();
  if (guardada) abrir(guardada, false).catch(() => { borrar(); $('#login').hidden = false; $('#app').hidden = true; });
})();
