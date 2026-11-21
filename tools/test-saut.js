// Teste le mini-jeu « Le grand saut » sans écran : un robot qui saute au bon moment gagne, un joueur immobile perd.
const { charger } = require('./_faux-navigateur.js');
const T = charger(null, 'mjsNew,mjsUpdate,mjsJump');

// ---- Le grand saut : robot qui saute au bon moment (au centre de chaque groupe d'obstacles) ; joueur immobile
{
  function partieSaut(easy, bot, bruit) {
    const s = T.mjsNew(easy), dt = 1 / 60, rx = s.W * .22;
    for (let i = 0; i < 60 * 50 && !s.done; i++) {
      if (bot && !s.air) {
        const av = s.obs.filter(o => !o.hit && o.x + o.w / 2 > rx - 20).sort((a, b) => a.x - b.x);
        if (av.length) {
          let g = [av[0]];
          for (let k = 1; k < av.length; k++) { const p = g[g.length - 1]; if (av[k].x - av[k].w / 2 - (p.x + p.w / 2) < 120) g.push(av[k]); else break; }
          const l = g[0].x - g[0].w / 2, r = g[g.length - 1].x + g[g.length - 1].w / 2, c = (l + r) / 2;
          const vrel = s.v * (1 + g[0].ex), T2 = (2 * s.V0 / s.G) / 2;
          if ((c - rx) / vrel <= T2 + (bruit ? (Math.random() - .5) * bruit : 0)) T.mjsJump(s);
        }
      }
      T.mjsUpdate(s, dt);
    }
    return s;
  }
  const BR = +(process.env.BR || .4);
  for (const [nom, easy, seuil] of [['adultes', false, .6], ['Alix (facile)', true, .9]]) {
    let bot = 0, bruit = 0, idle = 0, N = 40;
    for (let i = 0; i < N; i++) { if (partieSaut(easy, true, 0).done === 'win') bot++; if (partieSaut(easy, true, BR).done === 'win') bruit++; if (partieSaut(easy, false).done === 'win') idle++; }
    const ok = bot >= N * seuil && idle === 0;
    console.log('Le grand saut, ' + nom + ' : un joueur précis gagne ' + bot + '/' + N + ', un joueur imprécis (±' + (BR / 2).toFixed(2) + ' s) ' + bruit + '/' + N + ' ; un joueur immobile gagne ' + idle + '/' + N + (ok ? ' OK' : ' ÉCHEC'));
    if (!ok) process.exitCode = 1;
  }
}
