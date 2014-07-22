var assert = require('assert');

require('../lib/pwf');

describe('register', function() {
	it('should test module status checking', function() {
		assert.strictEqual(pwf.status('modr'), undefined, 'Should be undefined, the module does not exist yet.');

		pwf.register('modr', function() { this.is_ready = function() { return false; }; });
		assert.strictEqual(pwf.status('modr'), false, 'Should be false, the module is not ready.');

		pwf.register('modt', function() { this.is_ready = function() { return true; }; });
		assert.strictEqual(pwf.status('modt'), true, 'Should be true, the module is ready.');
		assert.strictEqual(pwf.mr(['modt']), true);
	});
});
