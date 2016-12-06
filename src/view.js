import drag from './drag';
import draw from './draw';
import util from './util';
import svg from './svg';
import makeCoords from './coords';
import m from 'mithril';

const pieceTag = 'piece';
const squareTag = 'square';

function pieceClass(p) {
  return `${p.role} ${p.color}`;
}

function renderPiece(d, key, ctx) {
  const attrs = {
    key: `p${key}`,
    style: {},
    class: pieceClass(d.pieces[key])
  };
  const translate = posToTranslate(util.key2pos(key), ctx);
  const draggable = d.draggable.current;
  if (draggable.orig === key && draggable.started) {
    translate[0] += draggable.pos[0] + draggable.dec[0];
    translate[1] += draggable.pos[1] + draggable.dec[1];
    attrs.class += ' dragging';
  } else if (d.animation.current.anims) {
    const animation = d.animation.current.anims[key];
    if (animation) {
      translate[0] += animation[1][0];
      translate[1] += animation[1][1];
    }
  }
  attrs.style[ctx.transformProp] = util.translate(translate);
  if (d.pieceKey) attrs['data-key'] = key;
  return {
    tag: pieceTag,
    attrs
  };
}

function renderSquare(key, classes, ctx) {
  const attrs = {
    key: `s${key}`,
    class: classes,
    style: {}
  };
  attrs.style[ctx.transformProp] = util.translate(posToTranslate(util.key2pos(key), ctx));
  return {
    tag: squareTag,
    attrs
  };
}

function posToTranslate(pos, ctx) {
  return [
    (ctx.asWhite ? pos[0] - 1 : 8 - pos[0]) * ctx.bounds.width / 8, (ctx.asWhite ? 8 - pos[1] : pos[1] - 1) * ctx.bounds.height / 8
  ];
}

function renderGhost(key, piece, ctx) {
  if (!piece) return;
  const attrs = {
    key: `g${key}`,
    style: {},
    class: `${pieceClass(piece)} ghost`
  };
  attrs.style[ctx.transformProp] = util.translate(posToTranslate(util.key2pos(key), ctx));
  return {
    tag: pieceTag,
    attrs
  };
}

function renderFading(cfg, ctx) {
  const attrs = {
    key: `f${cfg.piece.key}`,
    class: `fading ${pieceClass(cfg.piece)}`,
    style: {
      opacity: cfg.opacity
    }
  };
  attrs.style[ctx.transformProp] = util.translate(posToTranslate(cfg.piece.pos, ctx));
  return {
    tag: pieceTag,
    attrs
  };
}

function addSquare(squares, key, klass) {
  if (squares[key]) squares[key].push(klass);
  else squares[key] = [klass];
}

function renderSquares(ctrl, ctx) {
  const d = ctrl.data;
  const squares = {};
  if (d.lastMove && d.highlight.lastMove) d.lastMove.forEach(k => {
    addSquare(squares, k, 'last-move');
  });
  if (d.check && d.highlight.check) addSquare(squares, d.check, 'check');
  if (d.selected) {
    addSquare(squares, d.selected, 'selected');
    const over = d.draggable.current.over;
    const dests = d.movable.dests[d.selected];
    if (dests) dests.forEach(k => {
      if (k === over) addSquare(squares, k, 'move-dest drag-over');
      else if (d.movable.showDests) addSquare(squares, k, `move-dest${d.pieces[k] ? ' oc' : ''}`);
    });
    const pDests = d.premovable.dests;
    if (pDests) pDests.forEach(k => {
      if (k === over) addSquare(squares, k, 'premove-dest drag-over');
      else if (d.movable.showDests) addSquare(squares, k, `premove-dest${d.pieces[k] ? ' oc' : ''}`);
    });
  }
  const premove = d.premovable.current;
  if (premove) premove.forEach(k => {
    addSquare(squares, k, 'current-premove');
  });
  else if (d.predroppable.current.key)
    addSquare(squares, d.predroppable.current.key, 'current-premove');

  if (ctrl.vm.exploding) ctrl.vm.exploding.keys.forEach(k => {
    addSquare(squares, k, `exploding${ctrl.vm.exploding.stage}`);
  });

  const dom = [];
  if (d.items) {
    for (let i = 0; i < 64; i++) {
      var key = util.allKeys[i];
      const square = squares[key];
      const item = d.items.render(util.key2pos(key), key);
      if (square || item) {
        const sq = renderSquare(key, square ? square.join(' ') + (item ? ' has-item' : '') : 'has-item', ctx);
        if (item) sq.children = [item];
        dom.push(sq);
      }
    }
  } else {
    for (var key in squares)
      dom.push(renderSquare(key, squares[key].join(' '), ctx));
  }
  return dom;
}

function renderContent(ctrl) {
  const d = ctrl.data;
  if (!d.bounds) return;
  const ctx = {
    asWhite: d.orientation === 'white',
    bounds: d.bounds(),
    transformProp: util.transformProp()
  };
  const children = renderSquares(ctrl, ctx);
  if (d.animation.current.fadings)
    d.animation.current.fadings.forEach(p => {
      children.push(renderFading(p, ctx));
    });

  // must insert pieces in the right order
  // for 3D to display correctly
  const keys = ctx.asWhite ? util.allKeys : util.invKeys;
  if (d.items)
    for (var i = 0; i < 64; i++) {
      if (d.pieces[keys[i]] && !d.items.render(util.key2pos(keys[i]), keys[i]))
        children.push(renderPiece(d, keys[i], ctx));
    } else
      for (var i = 0; i < 64; i++) {
        if (d.pieces[keys[i]]) children.push(renderPiece(d, keys[i], ctx));
      }

  if (d.draggable.showGhost) {
    const dragOrig = d.draggable.current.orig;
    if (dragOrig && !d.draggable.current.newPiece)
      children.push(renderGhost(dragOrig, d.pieces[dragOrig], ctx));
  }
  if (d.drawable.enabled) children.push(svg(ctrl));
  return children;
}

function startDragOrDraw(d) {
  return e => {
    if (util.isRightButton(e) && d.draggable.current.orig) {
      if (d.draggable.current.newPiece) delete d.pieces[d.draggable.current.orig];
      d.draggable.current = {}
      d.selected = null;
    } else if ((e.shiftKey || util.isRightButton(e)) && d.drawable.enabled) draw.start(d, e);
    else drag.start(d, e);
  };
}

function dragOrDraw(d, withDrag, withDraw) {
  return e => {
    if ((e.shiftKey || util.isRightButton(e)) && d.drawable.enabled) withDraw(d, e);
    else if (!d.viewOnly) withDrag(d, e);
  };
}

function bindEvents(ctrl, el, context) {
  const d = ctrl.data;
  const onstart = startDragOrDraw(d);
  const onmove = dragOrDraw(d, drag.move, draw.move);
  const onend = dragOrDraw(d, drag.end, draw.end);
  const startEvents = ['touchstart', 'mousedown'];
  const moveEvents = ['touchmove', 'mousemove'];
  const endEvents = ['touchend', 'mouseup'];
  startEvents.forEach(ev => {
    el.addEventListener(ev, onstart);
  });
  moveEvents.forEach(ev => {
    document.addEventListener(ev, onmove);
  });
  endEvents.forEach(ev => {
    document.addEventListener(ev, onend);
  });
  context.onunload = () => {
    startEvents.forEach(ev => {
      el.removeEventListener(ev, onstart);
    });
    moveEvents.forEach(ev => {
      document.removeEventListener(ev, onmove);
    });
    endEvents.forEach(ev => {
      document.removeEventListener(ev, onend);
    });
  };
}

function renderBoard(ctrl) {
  const d = ctrl.data;
  return {
    tag: 'div',
    attrs: {
      class: `cg-board orientation-${d.orientation}`,
      config(el, isUpdate, context) {
        if (isUpdate) return;
        if (!d.viewOnly || d.drawable.enabled)
          bindEvents(ctrl, el, context);
        // this function only repaints the board itself.
        // it's called when dragging or animating pieces,
        // to prevent the full application embedding chessground
        // rendering on every animation frame
        d.render = () => {
          m.render(el, renderContent(ctrl));
        };
        d.renderRAF = () => {
          util.requestAnimationFrame(d.render);
        };
        d.bounds = util.memo(el.getBoundingClientRect.bind(el));
        d.element = el;
        d.render();
      }
    },
    children: []
  };
}

export default ctrl => {
  const d = ctrl.data;
  return {
    tag: 'div',
    attrs: {
      config(el, isUpdate) {
        if (isUpdate) {
          if (d.redrawCoords) d.redrawCoords(d.orientation);
          return;
        }
        if (d.coordinates) d.redrawCoords = makeCoords(d.orientation, el);
        el.addEventListener('contextmenu', e => {
          if (d.disableContextMenu || d.drawable.enabled) {
            e.preventDefault();
            return false;
          }
        });
        if (d.resizable)
          document.body.addEventListener('chessground.resize', e => {
            d.bounds.clear();
            d.render();
          }, false);
        ['onscroll', 'onresize'].forEach(n => {
          const prev = window[n];
          window[n] = () => {
            prev && prev();
            d.bounds.clear();
          };
        });
      },
      class: [
        'cg-board-wrap',
        d.viewOnly ? 'view-only' : 'manipulable'
      ].join(' ')
    },
    children: [renderBoard(ctrl)]
  };
};
