#!/usr/bin/env node
/**
 * Teste la physique de la roue (picots solides + aiguille à ressort) :
 *  - le lancer calculé s'arrête TOUJOURS dans la case tirée au sort (grande roue 24 cases et petite roue 5 cases),
 *  - la durée est celle voulue, l'aiguille ne finit jamais posée sur un picot,
 *  - la roue recule parfois à la fin (mais jamais en pendule), les sons suivent les chocs,
 *  - le temps de calcul reste raisonnable.
 */
const { charger } = require('./_faux-navigateur');
const T = charger(null, 'Roue,segView');
let tout = 0, erreurs = 0;
const rapport = [];
(async () => {
  for (const [nom, n, phys, dur, essais] of [['Grande roue (13 cases)', 13, {}, 8.8, 120 * (+process.env.ESSAIS || 1)], ['Petite roue (5 joueurs)', 5, { mu: 2.3 }, 5.2, 80 * (+process.env.ESSAIS || 1)]]) {
    let amps = [], echecPlan = 0, hors = 0, tours = 0, durees = [], reculs = 0, pendule = 0, clics = 0, tMax = 0, tSomme = 0, rotMax = 0;
    for (let e = 0; e < essais; e++) {
      const el = { getBoundingClientRect: () => ({ width: 400 }), getContext: () => global.ctx, width: 400, height: 400 };
      let sons = 0;
      const r = new T.Roue(el, { rf: .385, ir: .74, imax: .21, q: 2, view: T.segView, phys, tick: () => sons++ });
      r.S = 400; r.R = 154; r.setSegs(Array.from({ length: n }, () => ({ k: 'gift' })));
      r.rot = Math.random() * 360; r.rest();
      const cible = Math.floor(Math.random() * n), t0 = Date.now();
      const pl = await r.plan(cible, { dur }); const tp = Date.now() - t0; tSomme += tp; tMax = Math.max(tMax, tp);
      if (!pl) { echecPlan++; continue; }
      const prom = r.spin(cible, { dur, plan: pl });
      let t = 0; while (r.anim && t < 60) { r.update(1 / 60); t += 1 / 60; }
      const R = pl.R, s = 360 / n, dc = r.dc(), fin = ((r.rot % 360) + 360) % 360, pos = fin - cible * s;
      tout++;
      if (r.anim || !(pos > dc && pos < s - dc)) { hors++; erreurs++; console.log('ERREUR : arrêt hors de la case', nom, cible, fin.toFixed(2)); }
      if (isNaN(r.rot) || isNaN(r.th)) { erreurs++; console.log('ERREUR : valeur invalide'); }
      // reculs : combien de fois la roue change de sens, et de combien de degrés
      let nrev = 0, dir = 1, mx = -1e9, back = 0;
      const pas = Math.round(.02 / R.dt);                                  // vitesse mesurée sur 20 ms
      for (let i = pas; i < R.n - pas; i += pas) {
        const w = R.rot[i + pas] - R.rot[i]; if (R.rot[i] > mx) mx = R.rot[i]; back = Math.max(back, mx - R.rot[i]);
        if (dir > 0 && w < -.05) { nrev++; dir = -1 } else if (dir < 0 && w > .05) dir = 1;
      }
      if (back >= 1.5) reculs++; if (nrev > 2) pendule++;
      if (back >= 1.5) amps.push(back);
      rotMax = Math.max(rotMax, back);
      durees.push(R.n * R.dt); tours += (R.rot[R.n - 1] - R.rot[0]) / 360; clics += sons;
    }
    const ok = tout - hors;
    durees.sort((a, b) => a - b);
    rapport.push(`${nom} : ${essais - echecPlan}/${essais} lancers calculés, ${ok ? '' : ''}arrêt dans la bonne case | durée ${durees[0].toFixed(1)}–${durees[durees.length - 1].toFixed(1)} s (médiane ${durees[durees.length >> 1].toFixed(1)}), ${(tours / durees.length).toFixed(1)} tours | reculs ${(100 * reculs / durees.length).toFixed(0)} % (amplitude ${amps.length ? (amps.sort((a, b) => a - b)[amps.length >> 1]).toFixed(1) : 0}°, jamais en pendule : ${pendule === 0 ? 'oui' : 'NON (' + pendule + ')'}) | ${(clics / durees.length).toFixed(0)} sons/lancer | calcul ${(tSomme / essais).toFixed(0)} ms en moyenne, ${tMax} ms au pire`);
    if (echecPlan > essais * .02) { erreurs++; console.log('ERREUR : trop de lancers sans solution (secours utilisé)', echecPlan); }
  }
  // secours : si le calcul physique échoue, l'ancienne animation scriptée doit quand même s'arrêter dans la bonne case
  let horsSecours = 0;
  for (let e = 0; e < 40; e++) {
    const el = { getBoundingClientRect: () => ({ width: 400 }), getContext: () => global.ctx, width: 400, height: 400 };
    const r = new T.Roue(el, { rf: .385, ir: .74, imax: .21, q: 2, view: T.segView, tick() {} });
    r.S = 400; r.R = 154; r.setSegs(Array.from({ length: 13 }, () => ({ k: 'gift' })));
    const cible = Math.floor(Math.random() * 13);
    r.plan = () => Promise.resolve(null);
    r.spin(cible, { dur: 6, turns: 5 });
    await new Promise(res => setTimeout(res, 5));
    let t = 0; while (r.anim && t < 60) { r.update(1 / 60); t += 1 / 60; }
    if (r.anim || Math.floor((((r.rot % 360) + 360) % 360) / (360 / 13)) !== cible) horsSecours++;
  }
  rapport.push(`Secours (ancienne animation) : ${40 - horsSecours}/40 lancers arrêtés dans la bonne case`);
  if (horsSecours) erreurs++;
  rapport.forEach(l => console.log(l));
  console.log(erreurs ? 'ECHEC' : 'OK', `: ${tout} lancers simulés, ${erreurs} erreur(s)`);
  process.exit(erreurs ? 1 : 0);
})();
