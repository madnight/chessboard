import board from './board';

export default controller => ({
  set: controller.set,
  toggleOrientation: controller.toggleOrientation,
  getOrientation: controller.getOrientation,

  getPieces() {
    return controller.data.pieces;
  },

  getMaterialDiff() {
    return board.getMaterialDiff(controller.data);
  },

  getFen: controller.getFen,
  move: controller.apiMove,
  newPiece: controller.apiNewPiece,
  setPieces: controller.setPieces,
  setCheck: controller.setCheck,
  playPremove: controller.playPremove,
  playPredrop: controller.playPredrop,
  cancelPremove: controller.cancelPremove,
  cancelPredrop: controller.cancelPredrop,
  cancelMove: controller.cancelMove,
  stop: controller.stop,
  explode: controller.explode,
  setAutoShapes: controller.setAutoShapes,
  setShapes: controller.setShapes,

  // directly exposes chessground state for more messing around
  data: controller.data
});
