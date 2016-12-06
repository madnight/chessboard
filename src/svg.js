import m from 'mithril';
import {key2pos} from './util';
import {isTrident} from './util';

function circleWidth(current, bounds) {
  return (current ? 3 : 4) / 512 * bounds.width;
}

function lineWidth(brush, current, bounds) {
  return (brush.lineWidth || 10) * (current ? 0.85 : 1) / 512 * bounds.width;
}

function opacity(brush, current) {
  return (brush.opacity || 1) * (current ? 0.9 : 1);
}

function arrowMargin(current, bounds) {
  return isTrident() ? 0 : ((current ? 10 : 20) / 512 * bounds.width);
}

function pos2px(pos, bounds) {
  const squareSize = bounds.width / 8;
  return [(pos[0] - 0.5) * squareSize, (8.5 - pos[1]) * squareSize];
}

function circle(brush, pos, current, bounds) {
  const o = pos2px(pos, bounds);
  const width = circleWidth(current, bounds);
  const radius = bounds.width / 16;
  return {
    tag: 'circle',
    attrs: {
      key: current ? 'current' : pos + brush.key,
      stroke: brush.color,
      'stroke-width': width,
      fill: 'none',
      opacity: opacity(brush, current),
      cx: o[0],
      cy: o[1],
      r: radius - width / 2
    }
  };
}

function arrow(brush, orig, dest, current, bounds) {
  const m = arrowMargin(current, bounds);
  const a = pos2px(orig, bounds);
  const b = pos2px(dest, bounds);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const angle = Math.atan2(dy, dx);
  const xo = Math.cos(angle) * m;
  const yo = Math.sin(angle) * m;
  return {
    tag: 'line',
    attrs: {
      key: current ? 'current' : orig + dest + brush.key,
      stroke: brush.color,
      'stroke-width': lineWidth(brush, current, bounds),
      'stroke-linecap': 'round',
      'marker-end': isTrident() ? null : `url(#arrowhead-${brush.key})`,
      opacity: opacity(brush, current),
      x1: a[0],
      y1: a[1],
      x2: b[0] - xo,
      y2: b[1] - yo
    }
  };
}

function piece(cfg, pos, piece, bounds) {
  const o = pos2px(pos, bounds);
  const size = bounds.width / 8 * (piece.scale || 1);
  let name = piece.color === 'white' ? 'w' : 'b';
  name += (piece.role === 'knight' ? 'n' : piece.role[0]).toUpperCase();
  const href = `${cfg.baseUrl + name}.svg`;
  return {
    tag: 'image',
    attrs: {
      class: `${piece.color} ${piece.role}`,
      x: o[0] - size / 2,
      y: o[1] - size / 2,
      width: size,
      height: size,
      href
    }
  };
}

function defs(brushes) {
  return {
    tag: 'defs',
    children: [
      brushes.map(brush => ({
        key: brush.key,
        tag: 'marker',

        attrs: {
          id: `arrowhead-${brush.key}`,
          orient: 'auto',
          markerWidth: 4,
          markerHeight: 8,
          refX: 2.05,
          refY: 2.01
        },

        children: [{
          tag: 'path',
          attrs: {
            d: 'M0,0 V4 L3,2 Z',
            fill: brush.color
          }
        }]
      }))
    ]
  };
}

function orient(pos, color) {
  return color === 'white' ? pos : [9 - pos[0], 9 - pos[1]];
}

function renderShape(data, current, bounds) {
  return (shape, i) => {
    if (shape.piece) return piece(
      data.drawable.pieces,
      orient(key2pos(shape.orig), data.orientation),
      shape.piece,
      bounds);
    else if (shape.brush) {
      const brush = shape.brushModifiers ?
        makeCustomBrush(data.drawable.brushes[shape.brush], shape.brushModifiers, i) :
        data.drawable.brushes[shape.brush];
      const orig = orient(key2pos(shape.orig), data.orientation);
      if (shape.orig && shape.dest) return arrow(
        brush,
        orig,
        orient(key2pos(shape.dest), data.orientation),
        current, bounds);
      else if (shape.orig) return circle(
        brush,
        orig,
        current, bounds);
    }
  };
}

function makeCustomBrush(base, modifiers, i) {
  return {
    key: `bm${i}`,
    color: modifiers.color || base.color,
    opacity: modifiers.opacity || base.opacity,
    lineWidth: modifiers.lineWidth || base.lineWidth
  };
}

function computeUsedBrushes(d, drawn, current) {
  const brushes = [];
  const keys = [];
  const shapes = (current && current.dest) ? drawn.concat(current) : drawn;
  for (const i in shapes) {
    const shape = shapes[i];
    if (!shape.dest) continue;
    const brushKey = shape.brush;
    if (shape.brushModifiers)
      brushes.push(makeCustomBrush(d.brushes[brushKey], shape.brushModifiers, i));
    else {
      if (!keys.includes(brushKey)) {
        brushes.push(d.brushes[brushKey]);
        keys.push(brushKey);
      }
    }
  }
  return brushes;
}

export default ctrl => {
  if (!ctrl.data.bounds) return;
  const d = ctrl.data.drawable;
  const allShapes = d.shapes.concat(d.autoShapes);
  if (!allShapes.length && !d.current.orig) return;
  const bounds = ctrl.data.bounds();
  if (bounds.width !== bounds.height) return;
  const usedBrushes = computeUsedBrushes(d, allShapes, d.current);
  return {
    tag: 'svg',
    attrs: {
      key: 'svg'
    },
    children: [
      defs(usedBrushes),
      allShapes.map(renderShape(ctrl.data, false, bounds)),
      renderShape(ctrl.data, true, bounds)(d.current, 9999)
    ]
  };
};
