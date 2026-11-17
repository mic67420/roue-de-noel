#!/usr/bin/env node
/**
 * (Facultatif) Prend des captures d'écran du jeu dans un vrai navigateur, pour vérifier l'aspect après un changement.
 * Installation unique :  npm install --save-dev playwright   puis   npx playwright install chromium
 * Usage :  node tools/capture.js            -> captures/attente.png (jeu au repos) et captures/lancer.png (pendant un lancer)
 */
const path = require('path'), fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { console.log('Playwright n’est pas installé (voir l’en-tête de ce fichier).'); process.exit(2); }
(async () => {
  const out = path.join(__dirname, '..', 'captures'); fs.mkdirSync(out, { recursive: true });
  const b = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: { width: 844, height: 390 } });
  const erreurs = []; pg.on('pageerror', e => erreurs.push(String(e)));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const clic = async ms => { await pg.mouse.click(420, 200); await pg.waitForTimeout(ms); };
  await pg.waitForTimeout(800); await clic(1200); await clic(600); await clic(600);
  await pg.click('#sGo'); await pg.waitForTimeout(3500);
  await pg.screenshot({ path: path.join(out, 'attente.png') });
  await clic(12500);                         // désigne le joueur
  await pg.mouse.click(420, 200);            // lance la grande roue
  await pg.waitForTimeout(4500);
  await pg.screenshot({ path: path.join(out, 'lancer.png') });
  console.log('Captures dans', out, '| erreurs JavaScript :', erreurs.length ? erreurs : 'aucune');
  await b.close();
  process.exit(erreurs.length ? 1 : 0);
})();
