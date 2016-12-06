import board from './board';
import util from './util';

const brushes = ['green', 'red', 'blue', 'yellow'];

function hashPiece(piece) {
  return piece ? `${piece.color} ${piece.role}` : '';
}

function start(data, e) {
  if (e.touches && e.touches.length > 1) return; // support one finger touch only
  e.stopPropagation();
  e.preventDefault();
  board.cancelMove(data);
  const position = util.eventPosition(e);
  const bounds = data.bounds();
  const orig = board.getKeyAtDomPos(data, position, bounds);
  data.drawable.current = {
    orig,
    epos: position,
    bounds,
    brush: brushes[(e.shiftKey & util.isRightButton(e)) + (e.altKey ? 2 : 0)]
  };
  processDraw(data);
}

function processDraw(data) {
  util.requestAnimationFrame(() => {
    const cur = data.drawable.current;
    if (cur.orig) {
      const dest = board.getKeyAtDomPos(data, cur.epos, cur.bounds);
      if (cur.orig === dest) cur.dest = undefined;
      else cur.dest = dest;
    }
    data.render();
    if (cur.orig) processDraw(data);
  });
}

function move(data, e) {
  if (data.drawable.current.orig)
    data.drawable.current.epos = util.eventPosition(e);
}

function end(data, e) {
  const drawable = data.drawable;
  const orig = drawable.current.orig;
  const dest = drawable.current.dest;
  if (orig && dest) addLine(drawable, orig, dest);
  else if (orig) addCircle(drawable, orig);
  drawable.current = {};
  data.render();
}

function cancel(data) {
  if (data.drawable.current.orig) data.drawable.current = {};
}

function clear(data) {
  if (data.drawable.shapes.length) {
    data.drawable.shapes = [];
    data.render();
    onChange(data.drawable);
  }
}

function not(f) {
  return x => !f(x);
}

function addCircle(drawable, key) {
  const brush = drawable.current.brush;
  const sameCircle = s => s.orig === key && !s.dest;
  const similar = drawable.shapes.filter(sameCircle)[0];
  if (similar) drawable.shapes = drawable.shapes.filter(not(sameCircle));
  if (!similar || similar.brush !== brush) drawable.shapes.push({
    brush,
    orig: key
  });
  onChange(drawable);
}

function addLine(drawable, orig, dest) {
  const brush = drawable.current.brush;
  const sameLine = s => s.orig && s.dest && (
    (s.orig === orig && s.dest === dest) ||
    (s.dest === orig && s.orig === dest)
  );
  const exists = drawable.shapes.filter(sameLine).length > 0;
  if (exists) drawable.shapes = drawable.shapes.filter(not(sameLine));
  else drawable.shapes.push({
    brush,
    orig,
    dest
  });
  onChange(drawable);
}

function onChange(drawable) {
  drawable.onChange(drawable.shapes);
}

export default {
  start,
  move,
  end,
  cancel,
  clear,
  processDraw
};
