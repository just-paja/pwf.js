var assert = require('assert');

require('../lib/pwf');

describe('module registering', function() {
	it('registering module as an object and calling back', function() {
		var modx_run = false;

		pwf.reg_module('modd', function() {
			this.is_ready = function() {
				return pwf.has('module', 'mod1');
			};

			this.init = function() {
				modd_run = true;
				return true;
			}
		});

		pwf.wait_for('module', ['modd'], function() { modx_run = true; });

		assert.strictEqual(typeof pwf.modd, 'object', 'Should be object, otherwise the module modd is not registered.');
		assert.strictEqual(pwf.get_status('module', 'modd'), 1, 'Should be 1, because modd does not have dependencies ready.');

		pwf.reg_module('mod1', function() {});

		assert.strictEqual(typeof pwf.mod1, 'object', 'Should be object, otherwise the module mod1 is not registered properly.');
		assert.strictEqual(pwf.get_status('module', 'mod1'), 3, 'Should be 3, mod1 needs no dependencies, so it should be initialized in place.');
		assert.strictEqual(pwf.get_status('module', 'modd'), 3, 'Should be 3, because mod1 should have fired init_remaining.');
		assert.strictEqual(modx_run, true, 'Should be true, because modd should have fired callbacks.');
	});
});
