var
	assert = require('assert'),
	async = require('async'),
	pwf = require('../lib/pwf'),
	extend = require('xtend');

describe('extend test: ', function() {
	it('tests extend', function() {
		var
			list = ['dont'],
			a = {'z':'keep', 'e':{'f':{'upper':'base'}}},
			b = {'b':'foo', 'd':'yellow'},
			c = {'a':list, 'b':'bar', 'c':1, 'e':{'f':{'lower':'written'}}},
			merge = Object.merge(true, a, b, c);

		assert.equal(merge['a'].join(''), list.join(''));
		assert.equal(merge['b'], 'bar');
		assert.equal(merge['c'], 1);
		assert.equal(merge['d'], 'yellow');
		assert.equal(merge['z'], 'keep');

		list.push('zap');
		assert.equal(merge['a'].length, 1);
		assert.equal(merge['e']['f'].upper, 'base');
		assert.equal(merge['e']['f'].lower, 'written');
	});

	it('tests extending constructors with public methods', function() {
		var
			obj,
			fnc = pwf.extend_constructor({
				'fn':function() {},
				'public':{
					'test_prop':'test',
					'test_fn':function() {
						return 'test';
					}
				}
			});

		assert.equal(typeof fnc, 'function');

		obj = new fnc();
		assert.equal(typeof obj.test_fn, 'function');
		assert.equal(obj.test_fn(), 'test');

		assert.equal(typeof obj.test_prop, 'string');
		assert.equal(obj.test_prop, 'test');
	});

	it('tests extending constructors with protected methods', function() {
		var
			obj,
			prop = {},
			fnc = pwf.extend_constructor({
				'fn':function() {},
				'public':{
					'fn_priviledged':function(proto) {
						return proto('proto_fn');
					},
					'fn_prop':function(proto) {
						return proto('proto_prop');
					},
					'fn_reverse':function(proto) {
						return proto('proto_fn_reverse');
					},
					'fn_proto_inside':function(proto) {
						return proto('proto_fn_proto');
					}
				},
				'proto':{
					'proto_prop':prop,
					'proto_fn':function() {
						return 'proto';
					},
					'proto_fn_reverse':function(proto) {
						return this.fn_prop();
					},
					'proto_fn_proto':function(proto) {
						return proto('proto_fn_reverse');
					}
				}
			});

		obj = new fnc();

		assert.equal(typeof obj.fn_priviledged, 'function');
		assert.equal(typeof obj.proto_fn, 'undefined');
		assert.equal(obj.fn_priviledged(), 'proto');
		assert.strictEqual(obj.fn_prop(), prop);
		assert.equal(obj.fn_reverse(), obj.fn_prop());
		assert.equal(obj.fn_proto_inside(), obj.fn_prop());
	});

	it('tests registering classes', function() {
		var
			obj,
			args = {'msg':'testing-attrs'},
			func = function(args) {
				this.get_args = function() {
					return args;
				};
			};

		assert.throws(function() { pwf.rc(null); });
		assert.throws(function() { pwf.get_constructor('asdf'); });
		assert.throws(function() { pwf.create('asdf'); });

		pwf.rc({'name':'test', 'fn':func});
		assert.throws(function() { pwf.rc({'name':'test', 'fn':func}); });

		assert.strictEqual(typeof pwf.get_constructor('test'), 'function');
		assert.strictEqual(pwf.get_constructor('test'), func);

		obj = pwf.create('test', args);

		assert.strictEqual(obj.meta.cname, 'test');
		assert.strictEqual(obj.meta.constructor, func);
		assert.strictEqual(typeof obj.get_args, 'function');
		assert.strictEqual(obj.get_args().shift(), args);
	});

	it('tests extending simple objects', function() {
		var res = Object.merge(true, {'foo':'1', 'bar':'2'}, {'jeb':'3', 'bar':5});

		assert.strictEqual(res.foo, '1');
		assert.strictEqual(res.jeb, '3');
		assert.strictEqual(res.bar, 5);
	});

	it('tests extending classes', function() {
		var
			obj_ext,
			obj_ext2,
			obj_ext3,
			base = [
				{
					'name':'test_foo',
					'fn':function() {},
					'public':{
						'test_public':function() {
							return this.fn_foo();
						},
						'test_protected':function(proto) {
							return proto('fn_foo_protected');
						},
						'fn_foo':function() {
							return 'foo';
						}
					},
					'proto':{
						'fn_foo_protected':function() {
							return 'foo-protected'
						}
					}
				},
				{
					'name':'test_bar',
					'fn':function() {},
					'public':{
						'test_storage':function(proto) {
							return typeof proto.storage;
						},
						'test_public':function() {
							return this.fn_bar();
						},
						'test_protected':function(proto) {
							return proto('fn_bar_protected');
						},
						'fn_bar':function() {
							return 'bar';
						},
						'fn_var':function(proto, variable) {
							proto.storage.variable = variable;
						},
						'fn_var_get':function(proto) {
							return proto.storage.variable;
						},
					},
					'storage':{
						'variable':null,
					},
					'proto':{
						'fn_bar_protected':function() {
							return 'bar-protected';
						}
					}
				}
			],
			ext = {
				'name':'test_ext',
				'fn':function(){},
				'parents':['test_foo', 'test_bar']
			},
			ext2 = {
				'name':'test_ext2',
				'fn':function(){},
				'parents':['test_ext', 'test_foo']
			};

		base[1].public.fn_bar.d = 'd';

		for (var i = 0; i < base.length; i++) {
			pwf.register_class(base[i]);
		}

		pwf.rc(ext);
		pwf.rc(ext2);

		obj_ext = pwf.create('test_ext');
		obj_ext2 = pwf.create('test_ext2');
		obj_ext3 = pwf.create('test_ext2');

		assert.equal(typeof obj_ext.fn_bar, 'function');
		assert.equal(typeof obj_ext.fn_foo, 'function');
		assert.equal(typeof obj_ext.test_public, 'function');
		assert.equal(typeof obj_ext.test_protected, 'function');

		assert.equal(obj_ext.test_storage(), 'object');
		assert.equal(obj_ext.fn_bar(), 'bar');
		assert.equal(obj_ext.fn_foo(), 'foo');
		assert.equal(obj_ext.test_public(), 'bar');
		assert.equal(obj_ext.test_protected(), 'bar-protected');

		assert.equal(typeof obj_ext2.fn_bar, 'function');
		assert.equal(typeof obj_ext2.fn_foo, 'function');
		assert.equal(typeof obj_ext2.test_public, 'function');
		assert.equal(typeof obj_ext2.test_protected, 'function');

		assert.equal(obj_ext2.fn_bar(), 'bar');
		assert.equal(obj_ext2.fn_foo(), 'foo');
		assert.equal(obj_ext2.test_public(), 'foo');
		assert.equal(obj_ext2.test_protected(), 'foo-protected');

		obj_ext.fn_var('test1');
		obj_ext2.fn_var('test2');
		obj_ext3.fn_var('test3');

		assert.equal(obj_ext.fn_var_get(), 'test1');
		assert.equal(obj_ext3.fn_var_get(), 'test3');
		assert.equal(obj_ext2.fn_var_get(), 'test2');
	});

	it('tests delayed extending', function(done) {
		var
			fn = function(){},
			test_dext1 = {
				'fn':fn,
				'name':'test_dext1',
				'public':{
					'test_fn':function() {
						return 'foo';
					}
				}
			},
			test_dext2 = {
				'fn':fn,
				'name':'test_dext2',
				'parents':['test_dext1']
			},
			test_dext3 = {
				'fn':fn,
				'name':'test_dext3',
				'parents':['test_dext1', 'test_dext2']
			},
			test_dext4 = {
				'fn':fn,
				'name':'test_dext4',
				'parents':['test_dext3']
			},
			jobs = [];


		pwf.rc(test_dext4);

		jobs.push(function(next) {
			assert.strictEqual(pwf.has_class(test_dext1.name), false);
			assert.strictEqual(pwf.has_class(test_dext2.name), false);
			assert.strictEqual(pwf.has_classes([test_dext2.name, test_dext1.name]), false);

			pwf.rc(test_dext2);
			assert.strictEqual(pwf.has_class(test_dext2.name), false);

			pwf.rc(test_dext1);
			assert.strictEqual(pwf.has_class(test_dext1.name), true);
			assert.strictEqual(pwf.has_class(test_dext2.name), true);
			next();
		});

		jobs.push(function(next) {
			pwf.rc(test_dext3);
			pwf.wcr(['test_dext3'], function(next) {
				next();
			}, next);
		});

		jobs.push(function(next) {
			pwf.wcr(['test_dext4'], function(next) {
				next();
			}, next);
		});

		async.parallel(jobs, function(done) {
			return function() {
				done();
			};
		}(done));
	});
});
