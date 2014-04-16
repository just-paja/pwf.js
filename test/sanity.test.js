var assert = require('assert');

describe('sanity', function() {
	it(' tests only sanity of js code', function() {
		var pwf = null;

		assert.doesNotThrow(function() {
			pwf = require('../lib/include');
		});

		assert.notEqual(null, pwf, 'Pwf was not loaded successfuly. Check if it\'s being exported properly.');

		pwf.register('mod0', function() {});

		assert.doesNotThrow(function() {
			pwf.register('mod0', function() {});
		}, Error, 'Should\'nt throw error about overwriting modules. This behaivour is deprecated.');
	});
});
