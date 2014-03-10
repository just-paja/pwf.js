pwf.rc({
	'name':'container',

	'storage':{
		'opts':{}
	},

	'public':{
		'init':function(arg_data)
		{
			this.update(arg_data);
		},

		'get':function(proto, name)
		{
			return typeof this.storage.opts[name] == 'undefined' ? null:this.storage.opts[name];
		},

		'set':function(proto, name, value)
		{
			this.storage.opts[name] = value;
			return this;
		},

		'update':function(proto, arg_data)
		{
			if (typeof arg_data == 'object') {
				for (var key in arg_data) {
					this.set(key, arg_data[key]);
				}
			}

			return this;
		}
	}
});
