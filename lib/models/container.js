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


		'get_attrs':function(proto) {
			return proto.storage.opts;
		},


		'update':function(proto, arg_data) {
			if (typeof arg_data == 'object') {
				for (var key in arg_data) {
					this.set(key, arg_data[key]);
				}
			}

			return this;
		},


		/**
		 * Transform this object into another class using resolve method
		 *
		 * @param string base Base class to use as choice. This objects' class will be used if undefined
		 * @return new object instance
		 */
		'transform':function(proto, base)
		{
			if (typeof base == 'undefined') {
				base = this.meta.cname;
			}

			return pwf.resolve(base, this.get_attrs());
		}
	}
});
