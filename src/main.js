import m from 'mithril';
import ctrl from './ctrl';
import view from './view';
import api from './api';

// for usage outside of mithril
function init(element, config) {

  const controller = new ctrl(config);

  m.render(element, view(controller));

  return api(controller);
}

export default init;
export {ctrl as controller};
export {view};
export var fen = require('./fen');
export var util = require('./util');
export var configure = require('./configure');
export var anim = require('./anim');
export var board = require('./board');
export var drag = require('./drag');
