(function(){
const map={'gestion-gastos':'gastos','gestion-foodcost':'foodcost','gestion-rentabilidad':'rentabilidad','gestion-operaciones':'operaciones','gestion-auditoria':'auditoria'};
let current='ventas';
function init(){
const cu=document.querySelector('#dash-root .cu');if(!cu)return;
const headings=[...cu.querySelectorAll('h2')];if(!headings.some(h=>h.id==='gestion-auditoria'))return;
const start=headings.find(h=>h.id==='gestion-gastos');if(!start)return;
const nodes=[...cu.children];const firstExtra=nodes.findIndex(n=>n===start);if(firstExtra<0)return;
for(let i=0;i<nodes.length;i++){const n=nodes[i];let area='ventas';if(i>=firstExtra){for(let j=i;j>=firstExtra;j--){if(nodes[j].tagName==='H2'&&map[nodes[j].id]){area=map[nodes[j].id];break}}}n.dataset.areaSection=area}
render();
}
function render(){
const cu=document.querySelector('#dash-root .cu');if(!cu)return;
cu.querySelectorAll(':scope > [data-area-section]').forEach(n=>n.classList.toggle('area-hidden',n.dataset.areaSection!==current));
document.querySelectorAll('#area-nav button').forEach(b=>{const active=b.dataset.area===current;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});
}
document.addEventListener('click',e=>{const b=e.target.closest('#area-nav button');if(!b)return;current=b.dataset.area;render();window.scrollTo({top:0,behavior:'instant'})});
new MutationObserver(init).observe(document.getElementById('dash-root'),{childList:true,subtree:false});init();
})();