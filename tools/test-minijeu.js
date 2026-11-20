// Teste les règles du mini-jeu du traîneau sans écran : un joueur qui esquive doit gagner, un joueur immobile doit perdre.
const { charger } = require('./_faux-navigateur.js');
const T = charger(null, 'mjNew,mjUpdate,mjcNew,mjcUpdate,mjlNew,mjlUpdate,mjlTap,mjbNew,mjbUpdate,mjbTap,mjbMove,mjbUp,mjbaNew,mjbaUpdate,mjbaTap,mjbaMove,mjbaUp,mjtNew,mjtUpdate,mjtHop,mjkNew,mjkUpdate,mjkTir,mjkPos,mjrNew,mjrUpdate,mjrJump,mjrDown,mjrUp,mjrDrag,mjrSlide,mjrBox');
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
  const bon = gagnes >= N * (easy ? .95 : .35) && perdusIdle >= N * (easy ? .3 : .95);
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

// --- bonhomme de neige, version d'Alix (3 boules puis tas d'objets) ---
{
  let g = 0, idle = 0, tapG = 0, N = 20;
  for (let i = 0; i < N; i++) {
    for (const mode of ['glisse', 'touche']) {
      const s = T.mjbaNew(); s.asp = 2; let n = 0;
      while (!s.done && n++ < 60 * 120) {
        if (!s.held) {
          const it = s.items.find(x => !x.placed && (x.ball || s.t2 >= 0 && s.t >= s.t2 + 1.2));
          if (it) {
            const sl = s.slots.find(x => !x.placed && x.kind === it.kind);
            T.mjbaTap(s, it.hx, it.hy);
            if (s.held) { const s2 = s.slots.find(x => !x.placed && x.kind === s.held.it.kind); if (mode === 'glisse' && s2) { T.mjbaMove(s, s2.x + .01, s2.y + .01); } T.mjbaUp(s); }
          }
        }
        T.mjbaUpdate(s, dt);
      }
      if (s.done === 'win') { if (mode === 'glisse') g++; else tapG++; }
    }
    const t2 = T.mjbaNew(); t2.asp = 2; for (let j = 0; j < 600; j++) T.mjbaUpdate(t2, dt); if (t2.done !== 'win') idle++;
  }
  const bon = g === N && tapG === N && idle === N;
  console.log(`Bonhomme d'Alix (boules + tas) : en glissant ${g}/${N}, en touchant seulement ${tapG}/${N} ; un joueur immobile perd ${idle}/${N} fois`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}

// --- La grande traversée : un robot qui saute quand la voie est libre gagne ; un joueur immobile ne gagne jamais ---
function mjtX(R, o, t) { const P = 24; return -9 + ((((o.x0 + R.dir * o.v * t) % P) + P) % P); }
function traversee(easy, bot) {
  const s = T.mjtNew(easy); let n = 0;
  while (!s.done && n++ < 60 * 150) {
    if (bot && !s.hop && s.stun <= 0) {
      const nr = s.rows[s.r + 1];
      let ok2 = true;
      if (nr && nr.t === 'lane') {
        for (const o of nr.objs) for (let k = 0; k <= 12; k++) {
          const tt = s.t + k * .03 + .02;
          if (Math.abs(mjtX(nr, o, tt) - s.c) < o.hw + .55) ok2 = false;
        }
      } else if (nr && nr.t === 'safe' && nr.blk.some(b => b.c === s.c)) {
        T.mjtHop(s, s.c < 3 ? 1 : -1, 0); ok2 = false;
      }
      if (ok2) T.mjtHop(s, 0, 1);
    }
    T.mjtUpdate(s, dt);
  }
  return s;
}
for (const easy of [false, true]) {
  const N = 40; let g = 0, idle = 0;
  for (let i = 0; i < N; i++) { if (traversee(easy, true).done === 'win') g++; if (traversee(easy, false).done !== 'win') idle++; }
  const bon = easy ? (g === N && idle === N) : (g >= N * .15 && idle === N);
  console.log(`Traversée, ${easy ? 'Alix (facile)' : 'adultes     '} : un joueur qui saute bien gagne ${g}/${N} fois ; un joueur immobile ne gagne jamais ${idle}/${N}`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}

// --- Catapulte : un robot qui calcule la trajectoire gagne ; un joueur qui ne tire pas ne gagne jamais ---
function catapulte(easy, bot, bruit) {
  const s = T.mjkNew(easy); s.W = 1080; s.H = 720; let n = 0, prochain = 0;
  const G = 1100, K = 7.6, Lx = 1080 * .16 - (245 / 235 * 216) * .5 + (245 / 235 * 216) * .2, Ly = 648 - 216 + 216 * .09;
  while (!s.done && n++ < 60 * 90) {
    if (bot && !s.ball && s.balls > 0 && s.t >= prochain) {
      const cible = s.gifts.find(g => g.st === 'on');
      if (cible) {
        let best = null;
        for (const v of [900, 1000, 800]) for (let T2 = .4; T2 < 1.8; T2 += .02) {
          const p = T.mjkPos(s, cible, s.t + T2, 1080, 720);
          const vx = (p.x - Lx) / T2, vy = (p.y - Ly - .5 * G * T2 * T2) / T2;
          const sp = Math.hypot(vx, vy);
          if (sp <= 150 * K && sp > 300) { best = [vx, vy]; break; }
        }
        if (best) { const b = bruit || 0; T.mjkTir(s, -best[0] / K + (Math.random() - .5) * b, -best[1] / K + (Math.random() - .5) * b); }
        prochain = s.t + .3;
      }
    }
    T.mjkUpdate(s, dt);
  }
  return s;
}
for (const easy of [false, true]) {
  const N = 30; let g = 0, idle = 0, bruit = 0;
  for (let i = 0; i < N; i++) { if (catapulte(easy, true, 0).done === 'win') g++; if (catapulte(easy, false).done !== 'win') idle++; if (catapulte(easy, true, 60).done === 'win') bruit++; }
  const bon = easy ? (g >= N * .9 && idle === N) : (g >= N * .8 && idle === N && bruit <= N);
  console.log(`Catapulte, ${easy ? 'Alix (facile)' : 'adultes     '} : un joueur précis gagne ${g}/${N} fois, un joueur approximatif ${bruit}/${N} ; un joueur qui ne tire pas perd ${idle}/${N}`, bon ? 'OK' : 'ÉCHEC');
  if (!bon) ok = false;
}
const s = jouer(false, true);
console.log('Durée adultes', s.D, 's, cœurs', s.max, '| Alix durée 30 s, cœurs 3');
if (!ok) { console.error('ÉCHEC mini-jeu'); process.exit(1); }

// ---- La course du renne : robot qui saute/se baisse au bon moment ; joueur immobile
{
  function partieRenne(easy, bot) {
    const s = T.mjrNew(easy); const dt = 1 / 60;
    for (let i = 0; i < 70 * 60 && !s.done; i++) {
      if (bot) {
        const rx = s.W * .22; let saut = false, bas = false;
        const sol = s.obs.filter(o => !o.hit && !o.bonus && !o.air).map(o => T.mjrBox(s, o, s.H)).filter(b => b[1] > rx - s.H * .1).sort((p, q) => p[0] - q[0]);
        for (const o of s.obs) {
          if (o.hit || o.bonus || !o.air) continue;
          const b = T.mjrBox(s, o, s.H), d = b[0] - rx;
          if (d < s.v * .35 && b[1] > rx - s.H * .15) bas = true;
        }
        if (sol.length && s.fy < 1) {     // doublés serrés : on atterrit au milieu de l'espace entre les deux obstacles
          const d = sol[0][0] - rx;
          let lim = s.v * .25;
          if (sol.length > 1 && sol[1][0] - sol[0][1] < s.v * .9) lim = Math.min(s.v * .5, Math.max(s.v * .25, s.v * .833 - (sol[0][1] - sol[0][0]) - (sol[1][0] - sol[0][1]) / 2));
          if (d > 0 && d < lim) saut = true;
        }
        if (saut) T.mjrJump(s, true);
        T.mjrSlide(s, bas && s.fy < 1);
      }
      T.mjrUpdate(s, dt);
    }
    return s.done;
  }
  for (const [nom, easy] of [['adultes', false], ['Alix (facile)', true]]) {
    let bot = 0, idle = 0; const N = 30;
    for (let i = 0; i < N; i++) { if (partieRenne(easy, true) === 'win') bot++; if (partieRenne(easy, false) === 'win') idle++; }
    const ok = bot >= N * .5 && idle === 0;
    console.log('Course du renne, ' + nom + ' : un joueur précis gagne ' + bot + '/' + N + ' ; un joueur immobile gagne ' + idle + '/' + N + (ok ? ' OK' : ' ÉCHEC'));
    if (!ok) process.exitCode = 1;
  }
  // gestes des adultes : toucher rapide = saut ; poser le doigt puis glisser vers le bas = glissade ; relâcher = on se relève
  {
    let s = T.mjrNew(false); T.mjrDown(s, .5, .4); T.mjrUp(s); T.mjrUpdate(s, 1 / 60);
    const saut = s.vy > 0 || s.fy > 0;
    s = T.mjrNew(false); T.mjrDown(s, .5, .4); T.mjrDrag(s, .5, .42); T.mjrUpdate(s, 1 / 60); const pasEncore = !s.slide && s.fy <= 0;
    T.mjrDrag(s, .5, .55); T.mjrUpdate(s, 1 / 60); const glisse = s.slide === true && s.fy === 0;
    T.mjrUp(s); T.mjrUpdate(s, 1 / 60); const relev = s.slide === false && s.slideEnd > 0;
    s = T.mjrNew(true); T.mjrDown(s, .5, .4); const alix = s.vy > 0;
    const ok = saut && pasEncore && glisse && relev && alix;
    console.log('Course du renne, gestes (toucher = saut, doigt vers le bas = glissade, Alix saute au toucher) : ' + (ok ? 'OK' : 'ÉCHEC ' + [saut, pasEncore, glisse, relev, alix]));
    if (!ok) process.exitCode = 1;
  }
}
