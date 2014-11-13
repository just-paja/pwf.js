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
		assert.strictEqual(pwf.get_module_status('modd'), false, 'Should be false, because modd does not have dependencies ready.');

		pwf.reg_module('mod1', function() {});

		assert.strictEqual(typeof pwf.mod1, 'object', 'Should be object, otherwise the module mod1 is not registered properly.');
		assert.strictEqual(pwf.get_module_status('mod1'), true, 'Should be true, mod1 needs no dependencies, so it should be initialized in place.');
		assert.strictEqual(pwf.get_module_status('modd'), true, 'Should be true, because mod1 should have fired init_remaining.');
		assert.strictEqual(modx_run, true, 'Should be true, because modd should have fired callbacks.');
	});
});
