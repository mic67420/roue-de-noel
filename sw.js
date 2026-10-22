// Service worker de « La Roue de Noël » : l'application fonctionne entièrement hors ligne.
// À chaque nouvelle version du jeu, changer le numéro ci-dessous (ex. v3.1) : les téléphones se mettent à jour tout seuls.
const CACHE='roue-noel-cache-v3.1';
const FICHIERS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FICHIERS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('roue-noel-cache-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// Réponse immédiate depuis la mémoire du téléphone ; mise à jour en arrière-plan quand il y a du réseau.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(cached=>{
    const reseau=fetch(e.request).then(rep=>{
      if(rep&&rep.status===200){const copie=rep.clone();caches.open(CACHE).then(c=>c.put(e.request,copie))}
      return rep;
    }).catch(()=>cached||caches.match('./index.html'));
    return cached||reseau;
  }));
});
