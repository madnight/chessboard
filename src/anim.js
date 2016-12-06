import util from './util';

// https://gist.github.com/gre/1650294
const easing = {
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  },
};

function makePiece(k, piece, invert) {
  const key = invert ? util.invertKey(k) : k;
  return {
    key,
    pos: util.key2pos(key),
    role: piece.role,
    color: piece.color
  };
}

function samePiece(p1, p2) {
  return p1.role === p2.role && p1.color === p2.color;
}

function closer(piece, pieces) {
  return pieces.sort((p1, p2) => util.distance(piece.pos, p1.pos) - util.distance(piece.pos, p2.pos))[0];
}

function computePlan(prev, current) {
  const bounds = current.bounds();
  const width = bounds.width / 8;
  const height = bounds.height / 8;
  const anims = {};
  const animedOrigs = [];
  const fadings = [];
  const missings = [];
  const news = [];
  const invert = prev.orientation !== current.orientation;
  const prePieces = {};
  const white = current.orientation === 'white';
  for (const pk in prev.pieces) {
    const piece = makePiece(pk, prev.pieces[pk], invert);
    prePieces[piece.key] = piece;
  }

  for (const key of util.allKeys) {
    if (key !== current.movable.dropped[1]) {
      const curP = current.pieces[key];
      const preP = prePieces[key];
      if (curP) {
        if (preP) {
          if (!samePiece(curP, preP)) {
            missings.push(preP);
            news.push(makePiece(key, curP, false));
          }
        } else
          news.push(makePiece(key, curP, false));
      } else if (preP)
        missings.push(preP);
    }
  }

  news.forEach(newP => {
    const preP = closer(newP, missings.filter(util.partial(samePiece, newP)));
    if (preP) {
      const orig = white ? preP.pos : newP.pos;
      const dest = white ? newP.pos : preP.pos;
      const vector = [(orig[0] - dest[0]) * width, (dest[1] - orig[1]) * height];
      anims[newP.key] = [vector, vector];
      animedOrigs.push(preP.key);
    }
  });
  missings.forEach(p => {
    if (
      p.key !== current.movable.dropped[0] &&
      !util.containsX(animedOrigs, p.key) &&
      !(current.items ? current.items.render(p.pos, p.key) : false)
    )
      fadings.push({
        piece: p,
        opacity: 1
      });
  });

  return {
    anims,
    fadings
  };
}

function roundBy(n, by) {
  return Math.round(n * by) / by;
}

function go(data) {
  if (!data.animation.current.start) return; // animation was canceled
  const rest = 1 - (new Date().getTime() - data.animation.current.start) / data.animation.current.duration;
  if (rest <= 0) {
    data.animation.current = {};
    data.render();
  } else {
    const ease = easing.easeInOutCubic(rest);
    for (const key in data.animation.current.anims) {
      const cfg = data.animation.current.anims[key];
      cfg[1] = [roundBy(cfg[0][0] * ease, 10), roundBy(cfg[0][1] * ease, 10)];
    }
    for (const i in data.animation.current.fadings) {
      data.animation.current.fadings[i].opacity = roundBy(ease, 100);
    }
    data.render();
    util.requestAnimationFrame(() => {
      go(data);
    });
  }
}

function animate(transformation, data) {
  // clone data
  const prev = {
    orientation: data.orientation,
    pieces: {}
  };
  // clone pieces
  for (const key in data.pieces) {
    prev.pieces[key] = {
      role: data.pieces[key].role,
      color: data.pieces[key].color
    };
  }
  const result = transformation();
  if (data.animation.enabled) {
    const plan = computePlan(prev, data);
    if (Object.keys(plan.anims).length > 0 || plan.fadings.length > 0) {
      const alreadyRunning = data.animation.current.start;
      data.animation.current = {
        start: new Date().getTime(),
        duration: data.animation.duration,
        anims: plan.anims,
        fadings: plan.fadings
      };
      if (!alreadyRunning) go(data);
    } else {
      // don't animate, just render right away
      data.renderRAF();
    }
  } else {
    // animations are now disabled
    data.renderRAF();
  }
  return result;
}

// transformation is a function
// accepts board data and any number of arguments,
// and mutates the board.
export default (transformation, data, skip) => function() {
  const transformationArgs = [data].concat(Array.prototype.slice.call(arguments, 0));
  if (!data.render) return transformation(...transformationArgs);
  else if (data.animation.enabled && !skip)
    return animate(util.partialApply(transformation, transformationArgs), data);
  else {
    const result = transformation(...transformationArgs);
    data.renderRAF();
    return result;
  }
};
