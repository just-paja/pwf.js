var assert = require('assert');

require('../lib/pwf');

describe('module ready test', function() {
	it('should test module status checking', function() {
		pwf.reg_module('modr', function() { this.is_ready = function() { return false; }; });
		assert.strictEqual(pwf.has('module', 'modr'), false, 'Should be false, the module is not ready.');

		pwf.reg_module('modt', function() { this.is_ready = function() { return true; }; });
		assert.strictEqual(pwf.has('module', 'modt'), true, 'Should be true, the module is ready.');
	});
});
