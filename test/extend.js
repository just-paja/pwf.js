var
	assert = require('assert'),
	pwf = require('../lib/pwf');

describe('sanity', function() {
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
					'fn_priviledged':function() {
						return this.proto.proto_fn();
					},
					'fn_prop':function() {
						return this.proto.proto_prop;
					}
				},
				'proto':{
					'proto_prop':prop,
					'proto_fn':function() {
						return 'proto';
					}
				}
			});

		obj = new fnc();

		assert.equal(typeof obj.fn_priviledged, 'function');
		assert.equal(typeof obj.proto_fn, 'undefined');
		assert.equal(obj.fn_priviledged(), 'proto');
		assert.strictEqual(obj.fn_prop(), prop);
	});

	it('tests registering classes', function() {

	});

});

