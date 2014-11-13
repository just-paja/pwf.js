var assert = require('assert');

require('../lib/pwf');

describe('class resolve', function() {
	it('resolving class names', function() {
		pwf.reg_class('test.resolve.a', {
			'static':{
				'resolve_class':function(val) {
					if (val == 1) {
						return this.name;
					} else if (val == 2) {
						return 'test.resolve.b';
					} else if (val == 3) {
						return 'test.resolve.c';
					}
				}
			}
		});


		pwf.reg_class('test.resolve.c', {});

		assert.throws(function() { pwf.resolve('test.resolve.a'); });
		assert.throws(function() { pwf.resolve('test.resolve.a', 2); });

		var obj = pwf.resolve('test.resolve.a', 3);

		assert.equal(obj.meta.cname, 'test.resolve.c');
	});
});
