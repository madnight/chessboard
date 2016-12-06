import util from './util';

const initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

const roles = {
  p: "pawn",
  r: "rook",
  n: "knight",
  b: "bishop",
  q: "queen",
  k: "king"
};

const letters = {
  pawn: "p",
  rook: "r",
  knight: "n",
  bishop: "b",
  queen: "q",
  king: "k"
};

function read(fen) {
  if (fen === 'start') fen = initial;
  const pieces = {};
  fen.replace(/ .+$/, '').replace(/~/g, '').split('/').forEach((row, y) => {
    let x = 0;
    row.split('').forEach(v => {
      const nb = parseInt(v);
      if (nb) x += nb;
      else {
        x++;
        pieces[util.pos2key([x, 8 - y])] = {
          role: roles[v.toLowerCase()],
          color: v === v.toLowerCase() ? 'black' : 'white'
        };
      }
    });
  });

  return pieces;
}

function write(pieces) {
  return [8, 7, 6, 5, 4, 3, 2].reduce(
    (str, nb) => str.replace(new RegExp(Array(nb + 1).join('1'), 'g'), nb),
    util.invRanks.map(y => util.ranks.map(x => {
      const piece = pieces[util.pos2key([x, y])];
      if (piece) {
        const letter = letters[piece.role];
        return piece.color === 'white' ? letter.toUpperCase() : letter;
      } else return '1';
    }).join('')).join('/'));
}

export default {
  initial,
  read,
  write
};
