pwf.rc('container', {
	'storage':{
		'opts':{}
	},


	'init':function(proto, arg_data) {
		this.update(arg_data);
	},


	'public':{
		'get':function(proto, name) {
			var ref = proto.storage.opts;

			if (typeof name == 'string' && name.indexOf('.') >= 0) {
				var path = name.split('.');

				while (path.length > 1) {
					segment = path.shift();

					if (typeof ref[segment] == 'object' && ref !== null) {
						ref = ref[segment];
					} else {
						ref = null;
						break;
					}
				}

				name = path.join('.');
			}

			return (typeof ref == 'undefined' || ref === null || typeof ref[name] == 'undefined') ? null:ref[name];
		},

		'set':function(proto, name, value) {
			proto.storage.opts[name] = value;
			return this;
		},

		'update':function(proto, arg_data) {
			if (typeof arg_data == 'object') {
				for (var key in arg_data) {
					this.set(key, arg_data[key]);
				}
			}

			return this;
		}
	}
});
