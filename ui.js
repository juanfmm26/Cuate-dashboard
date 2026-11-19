(function(){
'use strict';
const read=()=>{try{return localStorage.getItem('cuate_tema')||'auto'}catch(e){return 'auto'}};
const labels={auto:'Tema: automático',oscuro:'Tema: oscuro',claro:'Tema: claro'};
const next={auto:'oscuro',oscuro:'claro',claro:'auto'};
function apply(theme){document.documentElement.dataset.theme=theme==='auto'?'':theme;const b=document.getElementById('tema');if(b)b.textContent=labels[theme];try{localStorage.setItem('cuate_tema',theme)}catch(e){}}
function init(){const bar=document.querySelector('.topbar');if(!bar||document.getElementById('tema'))return;const b=document.createElement('button');b.type='button';b.id='tema';bar.querySelector('#salir').before(b);apply(read())}
document.addEventListener('click',e=>{if(e.target.closest('#tema'))apply(next[read()]||'auto')});
new MutationObserver(init).observe(document.querySelector('.topbar'),{childList:true});init();apply(read());
})();