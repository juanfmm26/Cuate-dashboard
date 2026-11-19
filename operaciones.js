(function(){
const groups={
"Diario · apertura":["Revisar limpieza de cocina y salón","Comprobar temperaturas de refrigeradores y congeladores","Revisar disponibilidad de agua, gas y electricidad","Verificar inventario crítico y fechas de vencimiento","Comprobar baños, lavamanos y jabón","Revisar caja, equipos de cobro y pedidos"],
"Diario · cierre":["Limpiar y desinfectar superficies y utensilios","Revisar almacenamiento y rotulado de alimentos","Apagar equipos según protocolo","Verificar cierre de gas, agua y accesos","Registrar desperdicios e incidencias"],
"Semanal":["Limpieza profunda de equipos y campana","Revisar drenajes y trampas de grasa","Revisar estado de refrigeración y empaques","Revisar control de plagas","Comprobar extintores y rutas de salida"],
"Mensual":["Revisar mantenimiento preventivo de equipos","Inspeccionar instalaciones eléctricas y fugas visibles","Revisar filtros, ventilación y aire acondicionado","Auditar inventario y mermas","Evaluar capacitación y protocolos del personal"]
};
const k='cuate_operaciones_v1';let state={};try{state=JSON.parse(localStorage.getItem(k)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(k,JSON.stringify(state))}catch(e){}};
function init(){
const target=document.getElementById('cuate-checklist');if(!target||target.dataset.ready)return;target.dataset.ready='1';
for(const [group,tasks] of Object.entries(groups)){
const box=document.createElement('section');const h=document.createElement('h4');h.textContent=group;box.append(h);
const dateKey=group.startsWith('Diario')?new Date().toLocaleDateString('en-CA'):group.startsWith('Semanal')?weekKey():new Date().toISOString().slice(0,7);
tasks.forEach((task,i)=>{const key=group+'|'+dateKey+'|'+i;const label=document.createElement('label');label.style.cssText='display:flex;gap:9px;align-items:flex-start;margin:9px 0;font-size:14px';const check=document.createElement('input');check.type='checkbox';check.checked=!!state[key];check.addEventListener('change',()=>{state[key]=check.checked;save()});label.append(check,document.createTextNode(task));box.append(label)});target.append(box)}
const issue=document.getElementById('cuate-incidencias');if(issue&&!issue.dataset.ready){issue.dataset.ready='1';const form=document.createElement('form');form.innerHTML='<input required placeholder="Incidencia" aria-label="Incidencia"> <input placeholder="Responsable" aria-label="Responsable"> <input type="date" aria-label="Fecha"> <button type="submit">Agregar</button>';const list=document.createElement('ul');issue.append(form,list);const render=()=>{list.replaceChildren();(state.issues||[]).forEach((v,i)=>{const li=document.createElement('li');li.textContent=v.join(' · ')+' ';const b=document.createElement('button');b.type='button';b.textContent='Resolver';b.addEventListener('click',()=>{state.issues.splice(i,1);save();render()});li.append(b);list.append(li)})};form.addEventListener('submit',e=>{e.preventDefault();const v=[...form.querySelectorAll('input')].map(x=>x.value.trim());if(!v[0])return;(state.issues??=[]).push(v);save();form.reset();render()});render()}
}
function weekKey(){const d=new Date(),first=new Date(d.getFullYear(),0,1);return d.getFullYear()+'-S'+Math.ceil(((d-first)/86400000+first.getDay()+1)/7)}
new MutationObserver(init).observe(document.body,{childList:true,subtree:true});init();
})();