#!/usr/bin/env node
/**
 * Test de régression du détourage du Père Noël : on simule un téléphone dont les premières images de la vidéo ne sont
 * pas encore prêtes (image vide). Le fond vert doit malgré tout être entièrement transparent.
 * Nécessite Playwright (voir tools/capture.js).  Usage : node tools/test-detourage.js
 */
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { console.log('Playwright n’est pas installé : test ignoré.'); process.exit(0); }
const fichier = process.argv[2] || path.join(__dirname, '..', 'index.html');
(async () => {
  const b = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  let echec = false;
  for (const [nom, vides] of [['images normales', 0], ['5 premières images vides', 5], ['40 premières images vides', 40]]) {
    const pg = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage();
    await pg.addInitScript(n => {
      window.__vides = n; let c = 0; window.__fonds = [];
      const d0 = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) { if (img instanceof HTMLVideoElement && c++ < window.__vides) return; return d0.call(this, img, ...a); };
      const p0 = CanvasRenderingContext2D.prototype.putImageData;
      CanvasRenderingContext2D.prototype.putImageData = function (im, ...a) {
        if (im.width > 100 && im.height > 100) { let s = 0; for (let x = 0; x < im.width; x++) s += im.data[x * 4 + 3]; window.__fonds.push(s / im.width); }   // transparence moyenne de la 1re ligne (= fond)
        return p0.call(this, im, ...a);
      };
    }, vides);
    await pg.goto('file://' + fichier); await pg.waitForTimeout(800);
    for (let i = 0; i < 3; i++) { await pg.mouse.click(420, 200); await pg.waitForTimeout(900); }
    await pg.click('#sGo'); await pg.waitForTimeout(5000);
    const f = await pg.evaluate(() => window.__fonds);
    const apres = f.slice(-20), max = Math.max(...apres, 0);
    const ok = f.length > 5 && max < 2;
    console.log(`${ok ? 'OK    ' : 'ECHEC '} ${nom} : opacité du fond après démarrage = ${max.toFixed(1)} / 255 (doit être ~0)`);
    if (!ok) echec = true;
  }
  await b.close(); process.exit(echec ? 1 : 0);
})();
