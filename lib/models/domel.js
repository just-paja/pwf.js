pwf.rc({
	'name':'domel',
	'uses':['jquery'],
	'parents':['container'],

	'storage':{
		'el':null
	},


	'init':function(proto)
	{
		proto.storage.el = pwf.jquery.div(this.cname);

		if (this.get('parent')) {
			this.get('parent').append(proto.storage.el);
		}
	},


	'public':{
		'get_el':function(proto)
		{
			return proto.storage.el;
		}
	}
});
