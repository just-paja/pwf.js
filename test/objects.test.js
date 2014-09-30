var
	assert = require('assert'),
	extend = require('xtend');

require('../lib/pwf');
require('../lib/models/container');
require('../lib/models/caller');

describe('object module', function() {
	it('tests container object', function() {
		var obj = pwf.create('container', {
			'jebka':'foo',
			'bar':{
				'food':'burger'
			}
		});

		assert.equal(obj.get('jebka'), 'foo');
		assert.equal(obj.get('bar.food'), 'burger');

		obj.set('bar.food', 'pizza');
		assert.equal(obj.get('bar.food'), 'pizza');
	});
});
