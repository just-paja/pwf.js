pwf.rc({
	'name':'container',

	'storage':{
		'opts':{}
	},


	'init':function(proto, arg_data)
	{
		this.update(arg_data);
	},


	'public':{
		'get':function(proto, name)
		{
			return typeof proto.storage.opts[name] == 'undefined' ? null:proto.storage.opts[name];
		},

		'set':function(proto, name, value)
		{
			proto.storage.opts[name] = value;
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
