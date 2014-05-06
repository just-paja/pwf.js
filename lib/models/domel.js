pwf.rc({
	'name':'domel',
	'uses':['jquery'],
	'parents':['container'],

	'storage':{
		'el':null,
		'opts':{
			'tag':'div'
		}
	},


	'init':function(proto)
	{
		proto.storage.el = pwf.jquery('<' + this.get('tag') + '/>').addClass(this.meta.cname.replace(/\./g, '-'));

		if (this.get('parent')) {
			this.get('parent').append(proto.storage.el);
		}
	},


	'public':{
		'get_el':function(proto, name)
		{
			if (typeof name == 'string') {
				return typeof proto.storage.el[name] == 'undefined' ? null:proto.storage.el[name];
			}

			return proto.storage.el;
		},

		'add_el':function(proto, name, el)
		{
			proto.storage.el[name] = el;
			return this;
		},

		'divs':function(proto, list, prefix)
		{
			proto.storage.el.create_divs(list, prefix);
			return this;
		}
	}
});
