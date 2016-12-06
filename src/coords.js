import m from 'mithril';
import util from './util';

function renderCoords(elems, klass, orient) {
  const el = document.createElement('coords');
  el.className = klass;
  elems.forEach(content => {
    const f = document.createElement('coord');
    f.textContent = content;
    el.appendChild(f);
  });
  return el;
}

export default (orientation, el) => {

  util.requestAnimationFrame(() => {
    const coords = document.createDocumentFragment();
    const orientClass = orientation === 'black' ? ' black' : '';
    coords.appendChild(renderCoords(util.ranks, `ranks${orientClass}`));
    coords.appendChild(renderCoords(util.files, `files${orientClass}`));
    el.appendChild(coords);
  });

  var orientation;

  return o => {
    if (o === orientation) return;
    orientation = o;
    const coords = el.querySelectorAll('coords');
    for (i = 0; i < coords.length; ++i)
      coords[i].classList.toggle('black', o === 'black');
  };
};
