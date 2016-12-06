import board from './board';
import data from './data';
import fen from './fen';
import configure from './configure';
import anim from './anim';
import drag from './drag';

export default function(cfg) {

  this.data = data(cfg);

  this.vm = {
    exploding: false
  };

  this.getFen = () => fen.write(this.data.pieces);

  this.getOrientation = () => this.data.orientation;

  this.set = anim(configure, this.data);

  this.toggleOrientation = () => {
    anim(board.toggleOrientation, this.data)();
    if (this.data.redrawCoords) this.data.redrawCoords(this.data.orientation);
  };

  this.setPieces = anim(board.setPieces, this.data);

  this.selectSquare = anim(board.selectSquare, this.data, true);

  this.apiMove = anim(board.apiMove, this.data);

  this.apiNewPiece = anim(board.apiNewPiece, this.data);

  this.playPremove = anim(board.playPremove, this.data);

  this.playPredrop = anim(board.playPredrop, this.data);

  this.cancelPremove = anim(board.unsetPremove, this.data, true);

  this.cancelPredrop = anim(board.unsetPredrop, this.data, true);

  this.setCheck = anim(board.setCheck, this.data, true);

  this.cancelMove = anim(data => {
    board.cancelMove(data);
    drag.cancel(data);
  }, this.data, true);

  this.stop = anim(data => {
    board.stop(data);
    drag.cancel(data);
  }, this.data, true);

  this.explode = keys => {
    if (!this.data.render) return;
    this.vm.exploding = {
      stage: 1,
      keys
    };
    this.data.renderRAF();
    setTimeout(() => {
      this.vm.exploding.stage = 2;
      this.data.renderRAF();
      setTimeout(() => {
        this.vm.exploding = false;
        this.data.renderRAF();
      }, 120);
    }, 120);
  };

  this.setAutoShapes = shapes => {
    anim(data => {
      data.drawable.autoShapes = shapes;
    }, this.data, false)();
  };

  this.setShapes = shapes => {
    anim(data => {
      data.drawable.shapes = shapes;
    }, this.data, false)();
  };
};
