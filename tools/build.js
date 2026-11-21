#!/usr/bin/env node
/**
 * Assemble le jeu : src/*  +  assets/*  ->  index.html (un seul fichier autonome) et met à jour sw.js.
 * Usage :  node tools/build.js
 * - Le numéro de version est lu dans src/1-donnees-audio-roue.js (ligne  const VERSION='x.y';).
 * - sw.js reçoit automatiquement le même numéro (c'est ce qui force les téléphones à se mettre à jour).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const rd = p => fs.readFileSync(path.join(root, p), 'utf8');
const b64 = p => fs.readFileSync(path.join(root, p)).toString('base64');

// 1) les unités « vh » sont converties en une unité variable (--v) : hauteur réelle de l'écran du téléphone.
//    ATTENTION : cette conversion ne s'applique qu'au CODE, jamais aux données intégrées (base64) !
function conv(t) {
  t = t.replace('--v:1vh', '--v:__UNVH__');
  t = t.replace(/(-?\d*\.?\d+)vh/g, (m, n) => `calc(var(--v)*${n})`);
  return t.replace('__UNVH__', '1vh');
}

const head = rd('src/0-entete.html');
const parts = fs.readdirSync(path.join(root, 'src')).filter(f => /^[1-9]-.*\.js$/.test(f)).sort();
const code = parts.map(f => rd('src/' + f)).join('');

// 2) ressources intégrées dans le fichier : vidéos du Père Noël (MP4 + WebM) et icônes de la roue
const videos = {
  SANTA_IDLE_MP4: 'assets/santa_attente.mp4', SANTA_IDLE_WEBM: 'assets/santa_attente.webm',
  SANTA_THR_MP4: 'assets/santa_lancer.mp4', SANTA_THR_WEBM: 'assets/santa_lancer.webm'
};
let embed = '<script id="santaData">' + Object.entries(videos).map(([k, f]) => `window.${k}="${b64(f)}";`).join('') + '</script>\n';
embed += '<script id="iconData">window.SANTA_ICONS=' + JSON.stringify(JSON.parse(rd('assets/icones.json'))) + ';</script>\n';

embed += '<script id="sfxData">window.SANTA_SFX=' + JSON.stringify(JSON.parse(rd('assets/sons.json'))) + ';</script>\n';
embed += '<script id="mjData">window.MJ_IMGS=' + JSON.stringify(JSON.parse(rd('assets/mini-jeux.json'))) + ';</script>\n';

const html = conv(head) + embed + conv(code);
fs.writeFileSync(path.join(root, 'index.html'), html);

// 3) contrôles : syntaxe du script principal, présence des ressources, intégrité des données
const mains = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const main = mains[mains.length - 1][1];
new vm.Script(main);                                   // lève une erreur si la syntaxe est fausse
for (const [k, f] of Object.entries(videos)) {
  if (!html.includes(`window.${k}="${b64(f)}";`)) throw new Error('Ressource corrompue : ' + k);
}
const version = (main.match(/const VERSION='([0-9.]+)'/) || [])[1];
if (!version) throw new Error('Numéro de version introuvable');

// 4) service worker : même numéro que le jeu
let sw = rd('sw.js');
const sw2 = sw.replace(/roue-noel-cache-v[0-9.]+/, 'roue-noel-cache-v' + version);
if (sw2 !== sw) fs.writeFileSync(path.join(root, 'sw.js'), sw2);

console.log(`OK  index.html construit : version ${version}, ${(html.length / 1048576).toFixed(2)} Mo, syntaxe valide, sw.js = v${version}`);
