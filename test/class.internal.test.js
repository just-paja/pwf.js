var
	assert = require('assert'),
	async = require('async'),
	extend = require('xtend');

require('../lib/pwf');

describe('tests', function() {

	it('tests object internal methods', function() {
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


	it('tests object parent saving', function() {
		var obj;

		pwf.rc('test.parent.a', {});
		pwf.rc('test.parent.b', {'parents':['test.parent.a']});
		pwf.rc('test.parent.c', {'parents':['test.parent.b']});
		pwf.rc('test.parent.d', {'parents':['test.parent.c']});

		obj = pwf.create('test.parent.d');

		assert.equal(obj.meta.parents.length, 3);
	});

	it('tests multiple same inits', function() {
		var
			obj,
			init = function(proto) {
				proto.storage.value ++;
			};

		pwf.rc('test.init.a', {
			'init':init,
			'storage':{
				'value':0
			},

			'public':{
				'get_value':function(proto) {
					return proto.storage.value;
				}
			}
		});

		pwf.rc('test.init.b', {'parents':['test.init.a']});
		pwf.rc('test.init.c', {'parents':['test.init.a', 'test.init.b'], 'init':init});

		obj = pwf.create('test.init.c');

		assert.equal(obj.get_value(), 1);
	});
});
