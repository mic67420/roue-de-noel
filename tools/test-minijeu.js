// Teste les règles du mini-jeu du traîneau sans écran : un joueur qui esquive doit gagner, un joueur immobile doit perdre.
const { charger } = require('./_faux-navigateur.js');
const T = charger(null, 'mjNew,mjUpdate,mjcNew,mjcUpdate,mjlNew,mjlUpdate,mjlTap,mjbNew,mjbUpdate,mjbTap,mjbMove,mjbUp');
let ok = true;
const dt = 1 / 60, MJ_ZS = .86;
function jouer(easy, bot) {
  const s = T.mjNew(easy);
  let n = 0;
  while (!s.done && n++ < 60 * 80) {
    if (bot) {          // robot : va vers la zone libre la plus proche, en regardant les obstacles qui arrivent
      let best = 0, bs = 1e9;
      for (let c = -1; c <= 1.001; c += .05) {
        let danger = 0;
        for (const o of s.obj) if (o.type === 'obst' && o.z > MJ_ZS - .5 && o.z < MJ_ZS + .05) { const ta = Math.max(0, (MJ_ZS - .035 - o.z) / s.spd), pos = o.wx + (o.vx || 0) * ta; if (Math.abs(pos - c) < o.hw + s.hw + .12) danger += 1000; }
        const sc = danger + Math.abs(c - s.x);
        if (sc < bs) { bs = sc; best = c; }
      }
      s.tx = best;
    }
    T.mjUpdate(s, dt);
  }
  return s;
}
for (const easy of [false, true]) {
  let gagnes = 0, N = 60, perdusIdle = 0;
  for (let i = 0; i < N; i++) { if (jouer(easy, true).done === 'win') gagnes++; if (jouer(easy, false).done === 'lose') perdusIdle++; }
  const bon = gagnes >= N * (easy ? .95 : .5) && perdusIdle >= N * (easy ? .3 : .95);
  console.log(`${easy ? 'Alix (facile)' : 'Adultes     '} : un joueur qui esquive gagne ${gagnes}/${N} fois ; un joueur immobile perd ${perdusIdle}/${N} fois`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}

// --- mini-jeu 2 : les cadeaux qui tombent ---
function jouerC(easy, bot) {
  const s = T.mjcNew(easy); let n = 0; const CATCH = .76;
  while (!s.done && n++ < 60 * 80) {
    if (bot) {
      const vy = s.vy0 * (1 + .45 * Math.min(1, s.t / s.D));
      let cible = null, meilleur = 1e9;
      for (const o of s.obj) {
        if (o.done || o.kind === 'mauvais' || o.kind === 'eclair' || o.kind === 'meteo') continue;
        const ta = (CATCH - o.y) / vy, dx = Math.abs(o.x + (o.dx || 0) * ta - s.x);
        if (dx / s.maxV > ta + .02) continue;
        if (ta < meilleur) { meilleur = ta; cible = o; }
      }
      let tx = cible ? cible.x : s.x;
      // éviter les mauvais objets qui arrivent sur le sac
      for (const o of s.obj) {
        if (o.done || (o.kind !== 'mauvais' && o.kind !== 'eclair' && o.kind !== 'meteo')) continue;
        const ta = (CATCH - o.y) / vy;
        if (ta < .6 && Math.abs(o.x + (o.dx || 0) * ta - tx) < s.hw + .05) { tx = o.x + (o.dx || 0) * ta + (o.x > .5 ? -1 : 1) * (s.hw + .09); }
      }
      s.tx = Math.max(.04, Math.min(.96, tx));
    }
    T.mjcUpdate(s, dt);
  }
  return s;
}
for (const easy of [false, true]) {
  let gagnes = 0, N = 60, perdusIdle = 0;
  for (let i = 0; i < N; i++) { if (jouerC(easy, true).done === 'win') gagnes++; if (jouerC(easy, false).done !== 'win') perdusIdle++; }
  const bon = gagnes >= N * (easy ? .9 : .4) && perdusIdle >= N * (easy ? .25 : .9);
  console.log(`Cadeaux qui tombent, ${easy ? 'Alix (facile)' : 'adultes     '} : un joueur qui joue bien gagne ${gagnes}/${N} fois ; un joueur immobile perd ${perdusIdle}/${N} fois`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}

// --- mini-jeu 3 : lutins farceurs ---
function jouerL(easy, bot) {
  const s = T.mjlNew(easy); s.asp = 2; let n = 0, prochain = 0; const vu = new Map();
  while (!s.done && n++ < 60 * 80) {
    if (bot && s.t >= prochain) {
      // le robot repère un lutin visible depuis 0,3 s et tire dessus (90 % de précision)
      for (const e of s.el) {
        if (e.hit) continue;
        if (!vu.has(e)) vu.set(e, s.t);
        if (s.t - vu.get(e) < .3) continue;
        const dec = e.kind === 'run' && e.hop ? Math.abs(Math.sin(e.ph)) * .08 : 0;
        const ratage = Math.random() < .1 ? .3 : 0;
        T.mjlTap(s, e.x + ratage, e.y - e.size * .5 - dec);
        prochain = s.t + .22; break;
      }
    }
    T.mjlUpdate(s, dt);
  }
  return s;
}
for (const easy of [false, true]) {
  let gagnes = 0, N = 60, perdusIdle = 0;
  for (let i = 0; i < N; i++) { if (jouerL(easy, true).done === 'win') gagnes++; if (jouerL(easy, false).done !== 'win') perdusIdle++; }
  const bon = gagnes >= N * (easy ? .9 : .4) && perdusIdle >= N * (easy ? .0 : .95);
  console.log(`Lutins farceurs, ${easy ? 'Alix (facile)' : 'adultes     '} : un joueur qui joue bien gagne ${gagnes}/${N} fois ; un joueur immobile perd ${perdusIdle}/${N} fois`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}

// --- mini-jeu 4 : bonhomme de neige ---
function jouerB(easy, bot) {
  const s = T.mjbNew(easy); s.asp = 2; let n = 0, mode = 0, tx = .3, ty = .6, dir = 1, pause = 0; const TG = [.18, .13, .09];
  while (!s.done && n++ < 60 * 90) {
    if (bot) {
      if (pause > 0) pause -= dt;
      else if (s.stack.length < 3) {
        if (!s.cur) { T.mjbTap(s, .3, .6); tx = .3; ty = .6; dir = 1; }
        else {   // fait des allers-retours (1 H/s) puis lâche quand la boule est dans la zone (adultes) ou continue (Alix)
          tx += dir * (1 / 60) / 2 / 1; if (tx > .45 || tx < .15) dir = -dir;
          T.mjbMove(s, tx, ty);
          if (s.cur && !s.easy && s.cur.r >= TG[s.stack.length] * 1.02) { T.mjbUp(s); pause = .25; }
        }
      } else {
        const a = s.acc.find(x => !x.placed && !x.fly);
        if (a) { T.mjbTap(s, a.x, a.y); pause = .3; }
      }
    }
    T.mjbUpdate(s, dt);
  }
  return s;
}
for (const easy of [false, true]) {
  let gagnes = 0, N = 40, perdusIdle = 0;
  for (let i = 0; i < N; i++) { if (jouerB(easy, true).done === 'win') gagnes++; if (jouerB(easy, false).done !== 'win') perdusIdle++; }
  const bon = gagnes >= N * .8 && perdusIdle >= N * .95;
  console.log(`Bonhomme de neige, ${easy ? 'Alix (facile)' : 'adultes     '} : un joueur qui joue bien gagne ${gagnes}/${N} fois ; un joueur immobile perd ${perdusIdle}/${N} fois`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}
const s = jouer(false, true);
console.log('Durée adultes', s.D, 's, cœurs', s.max, '| Alix durée 30 s, cœurs 3');
if (!ok) { console.error('ÉCHEC mini-jeu'); process.exit(1); }
