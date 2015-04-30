var
	assert = require('assert'),
	async  = require('async');

require('../lib/pwf');

describe('class internals', function() {

	it('listing class scope', function() {
		pwf.reg_class('test.scope.a', {});
		pwf.reg_class('test.scope.b', {});
		pwf.reg_class('test.scope.a.c', {});
		pwf.reg_class('test.scope.a.d', {});
		pwf.reg_class('test.scope.b.e', {});

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


	it('class instance internal methods', function() {
		var obj;

		pwf.reg_class('test.internal', {
			'public':{
				'type':function(proto, name) {
					return proto.type(name);
				}
			},

			'proto':{
				'test':function(){}
			}
		});

		obj = pwf.create('test.internal');

		assert.equal(obj.type('test'), 'function');
		assert.equal(obj.type('test2'), 'undefined');
	});


	it('class instance parents', function() {
		var obj;

		pwf.reg_class('test.parent.a', {});
		pwf.reg_class('test.parent.b', {'parents':['test.parent.a']});
		pwf.reg_class('test.parent.c', {'parents':['test.parent.b']});
		pwf.reg_class('test.parent.d', {'parents':['test.parent.c']});

		obj = pwf.create('test.parent.d');

		assert.equal(obj.meta.parents.length, 3);
		assert(~obj.meta.parents.indexOf('test.parent.a'));
		assert(~obj.meta.parents.indexOf('test.parent.b'));
		assert(~obj.meta.parents.indexOf('test.parent.c'));
	});


	it('class instance multiple inits', function() {
		var
			obj,
			init = function(proto) {
				proto.storage.value ++;
			};

		pwf.reg_class('test.init.a', {
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

		pwf.reg_class('test.init.b', {'parents':['test.init.a']});
		pwf.reg_class('test.init.c', {'parents':['test.init.a', 'test.init.b'], 'init':init});

		obj = pwf.create('test.init.c');

		assert.equal(obj.get_value(), 1);
	});


	it('class dependencies', function() {
		var c = {'uses':['mod_a', 'mod_b']};

		pwf.reg_class('test.uses', c);

		assert.equal(pwf.has('class', 'test.uses'), false);

		pwf.reg_module('mod_a', function(){});
		assert.equal(pwf.has('class', 'test.uses'), false);

		pwf.reg_module('mod_b', function(){});
		assert.equal(pwf.has('class', 'test.uses'), true);
	});
});
