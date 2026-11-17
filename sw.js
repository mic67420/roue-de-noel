// Service worker de « La Roue de Noël » : l'application fonctionne entièrement hors ligne.
// À chaque nouvelle version du jeu, changer le numéro ci-dessous (ex. v3.1) : les téléphones se mettent à jour tout seuls.
const CACHE='roue-noel-cache-v3.15';
const FICHIERS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  // cache:'reload' = on va chercher la vraie version sur internet, pas une copie gardée par le navigateur
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FICHIERS.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('roue-noel-cache-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// Priorité au réseau : avec internet, on charge TOUJOURS la dernière version publiée (dès le lancement suivant).
// Sans internet (ou si le réseau met plus de 8 s), on ouvre la copie gardée en mémoire. Le téléchargement continue en arrière-plan et met la copie à jour.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const reseau=fetch(e.request,{cache:'no-cache'}).then(rep=>{
      if(rep&&rep.status===200)cache.put(e.request,rep.clone());
      return rep;
    });
    try{
      return await Promise.race([reseau,new Promise((_,non)=>setTimeout(non,8000))]);
    }catch(err){
      const copie=await cache.match(e.request,{ignoreSearch:true})||await cache.match('./index.html');
      if(copie)return copie;
      return reseau;
    }
  })());
});
