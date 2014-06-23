var assert = require('assert');

require('../lib/pwf');

describe('register', function() {
	it('should register module as an object and run init_remaining', function() {
		var modx_run = false;

		pwf.register('modd', function() {
			this.is_ready = function() {
				return pwf.mi(['mod1']);
			};

			this.init = function() {
				modd_run = true;
				return true;
			}
		});

		pwf.wi(['modd'], function() { modx_run = true; });

		assert.strictEqual(typeof pwf.modd, 'object', 'Should be object, otherwise the module modd is not registered.');
		assert.strictEqual(pwf.module_exists('modd'), true, 'Should be true, otherwise the module modd was not registered properly.');
		assert.strictEqual(pwf.status('modd'), false, 'Should be false, because modd does not have dependencies ready.');

		pwf.register('mod1', function() {});

		assert.strictEqual(typeof pwf.mod1, 'object', 'Should be object, otherwise the module mod1 is not registered properly.');
		assert.strictEqual(pwf.module_exists('mod1'), true, 'Should be true, otherwise the module mod1 was not registered properly.');
		assert.strictEqual(pwf.status('mod1'), true, 'Should be true, mod1 needs no dependencies, so it should be initialized in place.');
		assert.strictEqual(pwf.status('modd'), true, 'Should be true, because mod1 should have fired init_remaining.');
		assert.strictEqual(modx_run, true, 'Should be true, because modd should have fired callbacks.');
	});
});
