(function(){
'use strict';
const enc=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const bytes=n=>crypto.getRandomValues(new Uint8Array(n));
async function exportEncrypted(){
 const rows=window.CUATE_FC_ROWS;
 if(!rows?.length){alert('No se encontraron los costos del menú.');return}
 const pass=window.prompt('Introduce tu contraseña de Cuate para cifrar este archivo. No la compartas en el chat.');
 if(!pass)return;
 const salt=bytes(16),iv=bytes(12);
 const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt']);
 const payload=enc.encode(JSON.stringify({schema:'cuate-foodcost-v1',rows,exportedAt:new Date().toISOString()}));
 const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,payload));
 const output={schema:'cuate-foodcost-encrypted-v1',kdf:'PBKDF2-SHA256',iterations:310000,cipher:'AES-256-GCM',salt:b64(salt),iv:b64(iv),ct:b64(ct)};
 const blob=new Blob([JSON.stringify(output)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cuate-foodcost-cifrado.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function init(){const root=document.getElementById('cuate-foodcost-analytics');if(!root||root.querySelector('.fc-security-action'))return;const p=document.createElement('div');p.className='fc-security-action';const b=document.createElement('button');b.type='button';b.textContent='🔐 Exportar costos cifrados para migración';b.addEventListener('click',exportEncrypted);const n=document.createElement('p');n.className='note';n.textContent='Migración de seguridad pendiente: descarga este archivo cifrado con tu contraseña habitual y compártelo para sustituir los costos públicos. No compartas tu contraseña. El archivo contiene datos protegidos con AES-256-GCM.';p.append(b,n);root.prepend(p)}
new MutationObserver(init).observe(document.getElementById('dash-root'),{childList:true,subtree:true});init();
})();