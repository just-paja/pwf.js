pwf.rc('container', {
	'storage':{
		'opts':{}
	},


	'init':function(p, arg_data) {
		this.update(arg_data);
	},


	'public':{
		'get':function(p, name)
		{
			return pwf.obj_search(p.storage.opts, name);
		},


		'set':function(p, name, value)
		{
			pwf.obj_set(p.storage.opts, name, value);
			return this;
		},


		'get_attrs':function(p)
		{
			return p.storage.opts;
		},


		'update':function(p, arg_data)
		{
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
		'transform':function(p, base)
		{
			if (typeof base == 'undefined') {
				base = this.meta.cname;
			}

			return pwf.resolve(base, this.get_attrs());
		}
	}
});
