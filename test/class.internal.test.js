var
	assert = require('assert'),
	async  = require('async');

require('../lib/pwf');

describe('internal class module', function() {

	it('tests listing class scope', function() {
		pwf.rc('test.scope.a', {});
		pwf.rc('test.scope.b', {});
		pwf.rc('test.scope.a.c', {});
		pwf.rc('test.scope.a.d', {});
		pwf.rc('test.scope.b.e', {});

		// Test basic scope listing
		assert.equal(pwf.list_scope('test.scope').length, 0);
		assert.equal(pwf.list_scope('test.scope.').length, 5);
		assert.equal(pwf.list_scope('test.scope.a.').length, 2);

		// Test if acting as scope works (includes name and all subnames)
		assert.equal(pwf.list_scope('test.scope.a', true).length, 3);
		assert.equal(pwf.list_scope('test.scope.a', true).indexOf('test.scope.a'), 0);
		assert.equal(pwf.list_scope('test.scope.a', true).indexOf('test.scope.a.c'), 1);
		assert.equal(pwf.list_scope('test.scope.a', true).indexOf('test.scope.a.d'), 2);

		assert.equal(pwf.list_scope('test.scope.b.').length, 1);
		assert.equal(pwf.list_scope('test.scope.b', true).length, 2);
		assert.equal(pwf.list_scope('test.scope.b', true).indexOf('test.scope.b'), 0);
		assert.equal(pwf.list_scope('test.scope.b', true).indexOf('test.scope.b.e'), 1);
	});


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


	it('tests waiting for static modules', function() {
		var c = {'uses':['mod_a', 'mod_b']};

		pwf.rc('test.uses', c);

		assert.equal(pwf.has_class('test.uses'), false);

		pwf.register('mod_a', function(){});
		assert.equal(pwf.has_class('test.uses'), false);

		pwf.register('mod_b', function(){});
		assert.equal(pwf.has_class('test.uses'), true);
	});
});
