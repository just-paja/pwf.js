var pwf = require('./pwf');

global.pwf = pwf;

require('./models/container');
require('./models/domel');

delete global.pwf;
module.exports = pwf;
