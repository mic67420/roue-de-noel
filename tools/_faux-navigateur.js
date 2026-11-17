// Faux navigateur minimal pour exécuter le jeu sans écran (tests automatiques).
const fs = require('fs'), path = require('path');
exports.charger = function (cheminIndex, exposer) {
  const html = fs.readFileSync(cheminIndex || path.join(__dirname, '..', 'index.html'), 'utf8');
  const mains = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const code = mains[mains.length - 1][1];
  const ctx = new Proxy({}, { get(t, k) { if (k === 'createRadialGradient' || k === 'createLinearGradient' || k === 'createConicGradient') return () => ({ addColorStop() {} }); return () => {}; }, set() { return true; } });
  const mk = () => new Proxy(function () {}, {
    get(t, k) {
      if (k === 'getBoundingClientRect') return () => ({ width: 400, height: 400 });
      if (k === 'getContext') return () => ctx;
      if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (k === 'style') return { setProperty() {} };
      if (k === 'querySelectorAll') return () => [];
      if (k === 'querySelector') return () => mk();
      if (['addEventListener', 'removeEventListener', 'appendChild', 'insertAdjacentHTML', 'remove', 'click'].includes(k)) return () => {};
      if (k === 'dataset') return {};
      if (k === 'width' || k === 'height') return 400;
      if (k === 'value') return '';
      return undefined;
    }, set() { return true; }, apply() { return mk(); }
  });
  const els = {};
  global.ctx = ctx;
  global.document = { getElementById: id => els[id] || (els[id] = mk()), createElement: () => mk(), addEventListener() {}, documentElement: { style: { setProperty() {} } }, querySelectorAll: () => [], body: mk() };
  global.window = global; global.innerWidth = 800; global.innerHeight = 390; global.devicePixelRatio = 2;
  global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } };
  global.performance = { now: () => Date.now() };
  global.requestAnimationFrame = () => {}; global.addEventListener = () => {};
  const patched = code.replace('init();\n})();', 'init();\nglobal.__t={' + exposer + '};\n})();');
  if (patched === code) throw new Error('Point d’exposition introuvable dans le jeu');
  (0, eval)(patched);
  return global.__t;
};
