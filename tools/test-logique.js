#!/usr/bin/env node
/** Teste les règles : composition de la roue, 200 parties complètes simulées (aucun cadeau perdu ni dupliqué, la partie se termine). */
const { charger } = require('./_faux-navigateur');
const fs = require('fs');
// les choix de l'utilisateur sont simulés : on remplace l'interface par des réponses automatiques
let html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const mains = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let code = mains[mains.length - 1][1];
code = code
  .replace("function ov(html,cls=''){", "function ov(html,cls=''){globalThis.__html=html;")
  .replace(/function waitTap\(el,delay=800\)\{[^\n]*\n/, "function waitTap(el,delay=800){return Promise.resolve()}\n")
  .replace(/function pick\(el,sel=[^\n]*\n/, "function pick(el,sel){const h=globalThis.__html||'';let m=[...h.matchAll(/<button class=\"tag([^\"]*)\" data-g=\"(\\w+)\" data-p=\"(\\w*)\" (disabled)?/g)].filter(x=>!x[4]);if(m.length){const c=m[Math.floor(Math.random()*m.length)];return Promise.resolve({dataset:{g:c[2],p:c[3]}})}m=[...h.matchAll(/<button class=\"who\"[^>]*data-p=\"(\\d)\"/g)];const c=m[Math.floor(Math.random()*m.length)];return Promise.resolve({dataset:{p:c[1]}})}\n")
  .replace("const sleep=ms=>new Promise(r=>setTimeout(r,ms));", "const sleep=ms=>Promise.resolve();");
const tmp = require('path').join(__dirname, '_tmp-index.html');
const parts = html.split(mains[mains.length - 1][1]);
fs.writeFileSync(tmp, parts[0] + code + parts[1]);
const T = charger(tmp, 'newState,pickSeg,resolveSeg,gameOver,buildLayout,setS:v=>{S=v},getS:()=>S,PLAYERS');
fs.unlinkSync(tmp);
let erreurs = 0;
const SPEC = ['vol', 'echange', 'double', 'bouclier', 'autre', 'pas'];
const ordres = new Set();
for (let i = 0; i < 500; i++) {
  const L = T.buildLayout(), c = {}; L.forEach(x => c[x.k] = (c[x.k] || 0) + 1);
  const ds = L.filter(x => x.k === 'gift').map(x => x.d);
  let cotea = 0; for (let j = 0; j < L.length; j++) { const a = L[j].k, b = L[(j + 1) % L.length].k; if (!SPEC.includes(a) && !SPEC.includes(b)) cotea++; }
  const ids = new Set(L.map(x => x.id));
  if (L.length !== 10 || c.mystery || c.choix || c.gift !== 4 || SPEC.some(k => c[k] !== 1) || cotea || ids.size !== 10) {
    erreurs++; console.log('ERREUR roue', JSON.stringify(c), 'cadeaux côte à côte :', cotea);
  }
  ordres.add(L.map(x => x.k).join(','));
}
if (ordres.size < 200) { erreurs++; console.log('ERREUR : l’ordre des cases n’est pas assez mélangé', ordres.size); }
console.log('Roue : 10 cases (6 spéciales + 4 cadeaux), jamais deux cadeaux côte à côte, ordre mélangé (' + ordres.size + ' ordres sur 500 roues) :', erreurs ? 'ECHEC' : 'OK');
(async () => {
  const stats = {};
  for (const total of [6, 12, 25, 40]) {
    for (let g = 0; g < 50; g++) {
      const S = T.newState({ total, thr: 3, boost: 2 }); T.setS(S);
      let n = 0, guard = 0;
      while (!T.gameOver() && guard < 5000) { guard++; S.current = Math.floor(Math.random() * 5); const r = await T.resolveSeg(S.layout[T.pickSeg()]); if (r !== 'relaunch') n++; }
      const all = S.players.flatMap(p => p.gifts), set = new Set(all);
      if (guard >= 5000 || all.length !== total || set.size !== total || S.layout.length !== 10) { erreurs++; console.log('ERREUR partie', total); }
      (stats[total] = stats[total] || []).push(guard);
    }
  }
  for (const t in stats) console.log(`  ${t} cadeaux : ${(stats[t].reduce((a, b) => a + b, 0) / stats[t].length).toFixed(0)} lancers en moyenne`);
  console.log('200 parties simulées :', erreurs ? 'ECHEC' : 'OK, aucune anomalie');
  process.exit(erreurs ? 1 : 0);
})();
