const files = "abcdefgh".split('');
const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
const invRanks = [8, 7, 6, 5, 4, 3, 2, 1];
const fileNumbers = {
  a: 1,
  b: 2,
  c: 3,
  d: 4,
  e: 5,
  f: 6,
  g: 7,
  h: 8
};

function pos2key(pos) {
  return files[pos[0] - 1] + pos[1];
}

function key2pos(pos) {
  return [fileNumbers[pos[0]], parseInt(pos[1])];
}

function invertKey(key) {
  return files[8 - fileNumbers[key[0]]] + (9 - parseInt(key[1]));
}

const allPos = ((() => {
  const ps = [];
  invRanks.forEach(y => {
    ranks.forEach(x => {
      ps.push([x, y]);
    });
  });
  return ps;
}))();
const allKeys = allPos.map(pos2key);
const invKeys = allKeys.slice(0).reverse();

function opposite(color) {
  return color === 'white' ? 'black' : 'white';
}

function containsX(xs, x) {
  return xs && xs.includes(x);
}

function distance(pos1, pos2) {
  return Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2);
}

// this must be cached because of the access to document.body.style
let cachedTransformProp;

function computeTransformProp() {
  return 'transform' in document.body.style ?
    'transform' : 'webkitTransform' in document.body.style ?
    'webkitTransform' : 'mozTransform' in document.body.style ?
    'mozTransform' : 'oTransform' in document.body.style ?
    'oTransform' : 'msTransform';
}

function transformProp() {
  if (!cachedTransformProp) cachedTransformProp = computeTransformProp();
  return cachedTransformProp;
}

let cachedIsTrident = null;

function isTrident() {
  if (cachedIsTrident === null)
    cachedIsTrident = window.navigator.userAgent.includes('Trident/');
  return cachedIsTrident;
}

function translate(pos) {
  return `translate(${pos[0]}px,${pos[1]}px)`;
}

function eventPosition(e) {
  if (e.clientX || e.clientX === 0) return [e.clientX, e.clientY];
  if (e.touches && e.targetTouches[0]) return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
}

function partialApply(fn, args) {
  return fn.bind(...[null].concat(args));
}

function partial() {
  return partialApply(arguments[0], Array.prototype.slice.call(arguments, 1));
}

function isRightButton(e) {
  return e.buttons === 2 || e.button === 2;
}

function memo(f) {
  let v;

  const ret = () => {
    if (v === undefined) v = f();
    return v;
  };

  ret.clear = () => {
    v = undefined;
  }
  return ret;
}

export default {
  files,
  ranks,
  invRanks,
  allPos,
  allKeys,
  invKeys,
  pos2key,
  key2pos,
  invertKey,
  opposite,
  translate,
  containsX,
  distance,
  eventPosition,
  partialApply,
  partial,
  transformProp,
  isTrident,
  requestAnimationFrame: (window.requestAnimationFrame || window.setTimeout).bind(window),
  isRightButton,
  memo
};
