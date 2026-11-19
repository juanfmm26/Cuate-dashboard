(function(){
'use strict';
const sections={'gestion-gastos':'gastos','gestion-foodcost':'foodcost','gestion-rentabilidad':'rentabilidad','gestion-operaciones':'operaciones','gestion-auditoria':'auditoria'};
let current='ventas',previous=null;
function organize(){
 const cu=document.querySelector('#dash-root .cu');if(!cu)return;
 const children=Array.from(cu.children);
 let area='ventas';
 for(const node of children){
   if(node.tagName==='H2'&&sections[node.id])area=sections[node.id];
   node.dataset.areaSection=area;
 }
 previous=cu;
 show();
}
function show(){
 const cu=document.querySelector('#dash-root .cu');if(!cu)return;
 for(const node of cu.children){
  if(!node.dataset.areaSection)continue;
  node.hidden=node.dataset.areaSection!==current;
  node.classList.toggle('area-hidden',node.dataset.areaSection!==current);
 }
 document.querySelectorAll('#area-nav button').forEach(b=>{const active=b.dataset.area===current;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});
 window.dispatchEvent(new Event('cuate:area-visible'));
}
document.addEventListener('click',e=>{const b=e.target.closest('#area-nav button');if(!b)return;current=b.dataset.area;show();window.scrollTo({top:0,behavior:'auto'})});
new MutationObserver(()=>{const cu=document.querySelector('#dash-root .cu');if(cu&&cu!==previous)organize()}).observe(document.getElementById('dash-root'),{childList:true,subtree:false});
organize();
})();