var pwf = require('./pwf');

global.pwf = pwf;

require('./models/container');
require('./models/domel');
require('./models/caller');
require('./models/el/abs');

delete global.pwf;
module.exports = pwf;
