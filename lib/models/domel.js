pwf.rc({
	'name':'domel',
	'uses':['jquery'],

	'storage':{
		'el':null
	},

	'public':{
		'init':function()
		{
			this.storage.el = pwf.jquery.div(this.cname);
		},

		'get_el':function()
		{
			return this.storage.el;
		}
	}
});
