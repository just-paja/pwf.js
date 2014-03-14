var
	assert = require('assert'),
	async = require('async'),
	pwf = require('../lib/pwf'),
	extend = require('xtend');

describe('tests', function() {
	it('calling all inherited init functions', function() {
		var
			obj,
			fn1 = function(proto) { proto.storage.pass.push(1) },
			fn2 = function(proto) { proto.storage.pass.push(2) },
			fn3 = function(proto) { proto.storage.pass.push(3) },
			fn4 = function(proto) { proto.storage.pass.push(4) },
			helper = {
				'get_pass':function(proto) {
					return proto.storage.pass;
				}
			};

		pwf.rc({'name':'test1', 'init':fn1, 'storage':{'pass':[]}});
		pwf.rc({'name':'test2', 'init':fn2, 'parents':['test1']});
		pwf.rc({'name':'test3', 'init':fn3, 'parents':['test2']});
		pwf.rc({'name':'test4', 'init':fn4, 'parents':['test3'], 'public':helper});

		obj = pwf.create('test4');
		assert.equal(obj.get_pass().join(''), '1234');
	});
});