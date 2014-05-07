var
	assert = require('assert'),
	async = require('async'),
	pwf = require('../lib/pwf'),
	extend = require('xtend');

describe('tests', function() {

	it ('tests object internal methods', function() {
		var obj;

		pwf.rc('test.internal', {
			'public':{
				'type':function(proto, name) {
					return proto.type(name);
				},

				'exists':function(proto, name) {
					return proto.exists(name);
				},
			},

			'proto':{
				'test':function(){}
			}
		});

		obj = pwf.create('test.internal');

		assert.equal(obj.type('test'), 'function');
		assert.equal(obj.type('test2'), 'undefined');

		assert.equal(obj.exists('test'), true);
		assert.equal(obj.exists('test2'), false);
	});
});
