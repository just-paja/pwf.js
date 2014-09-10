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


	'init':function(p) {
		p.storage.el = pwf.jquery('<' + this.get('tag') + '/>');

		// Add class names of all ancestors, but omit container (not related to DOM)
		for (var i = 0; i < this.meta.constructor.parents.length; i++) {
			if (this.meta.constructor.parents[i] != 'container') {
				p.storage.el.addClass(this.meta.static.to_cname(this.meta.constructor.parents[i]));
			}
		}

		// Add class name of this object class
		p.storage.el.addClass(this.meta.static.to_cname(this.meta.cname));

		// Append to DOM if parent passed
		if (this.get('parent')) {
			p.storage.internal.after_init.push(function() {
				this.append(this.get('parent'));
			});
		}
	},


	'static':{
		'to_cname':function(str)
		{
			return str.replace(/\./g, '-');
		}
	},


	'public':{
		'get_el':function(p, name)
		{
			if (typeof name == 'string') {
				return pwf.search_obj(p.storage.el, name);
			}

			return p.storage.el;
		},


		'add_el':function(p, name, el)
		{
			p.storage.el[name] = el;
			return this;
		},


		'divs':function(p, list, prefix)
		{
			p.storage.el.create_divs(list, prefix);
			return this;
		},


		'remove':function(p)
		{
			if (this.get_el().is_attached()) {
				p('el_removed');
				p('el_unbind');
			}

			this.get_el().remove();
			return this;
		},


		'append':function(p, parent)
		{
			this.remove().set('parent', parent);
			this.get('parent').append(p.storage.el);

			p('el_attached');
			p('el_bind');

			return this;
		}
	}
});
