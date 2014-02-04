var assert = require('assert');

describe('sanity', function() {
	it(' tests only sanity of js code', function() {
		var
			error = null,
			pwf = null;

		try {
			pwf = require('../lib/pwf');
		} catch (e) {
			error = e;
		}

		assert.strictEqual(null, error, 'An error was thrown during pwf inclusion. File is damaged or there is a syntax error.');
		assert.notEqual(null, pwf, 'Pwf was not loaded successfuly. Check if it\'s being exported properly.');

		pwf.register('mod0', function() {});

		assert.doesNotThrow(function() {
			pwf.register('mod0', function() {});
		}, Error, 'Should\'nt throw error about overwriting modules. This behaivour is deprecated.');
	});
});
