var assert = require('assert');

require('../lib/pwf');

describe('pwf', function() {
	it('tests class resolve method', function() {
		pwf.rc('test.resolve.a', {
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


		pwf.rc('test.resolve.c', {});

		assert.throws(function() { pwf.resolve('test.resolve.a'); });
		assert.throws(function() { pwf.resolve('test.resolve.a', 2); });

		var obj = pwf.resolve('test.resolve.a', 3);

		assert.equal(obj.meta.cname, 'test.resolve.c');
	});
});
