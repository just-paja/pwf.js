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
		proto.storage.el = pwf.jquery('<' + this.get('tag') + '/>');

		for (var i = 0; i < this.meta.constructor.parents.length; i++) {
			proto.storage.el.addClass(this.meta.static.to_cname(this.meta.constructor.parents[i]));
		}

		proto.storage.el.addClass(this.meta.static.to_cname(this.meta.cname));

		if (this.get('parent')) {
			this.get('parent').append(proto.storage.el);
		}
	},


	'static':{
		'to_cname':function(str) {
			return str.replace(/\./g, '-');
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
		},

		'remove':function(proto)
		{
			proto('remove_el');
			proto('unbind');

			this.get_el().remove();
			return this;
		}
	}
});
