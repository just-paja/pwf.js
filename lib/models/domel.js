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


	'init':function(proto) {
		proto.storage.el = pwf.jquery('<' + this.get('tag') + '/>');

		// Add class names of all ancestors, but omit container (not related to DOM)
		for (var i = 0; i < this.meta.constructor.parents.length; i++) {
			if (this.meta.constructor.parents[i] != 'container') {
				proto.storage.el.addClass(this.meta.static.to_cname(this.meta.constructor.parents[i]));
			}
		}

		// Add class name of this object class
		proto.storage.el.addClass(this.meta.static.to_cname(this.meta.cname));

		// Append to DOM if parent passed
		if (this.get('parent')) {
			proto.storage.internal.after_init.push(function() {
				this.append(this.get('parent'));
			});
		}
	},


	'static':{
		'to_cname':function(str) {
			return str.replace(/\./g, '-');
		}
	},


	'public':{
		'get_el':function(p, name) {
			if (typeof name == 'string') {
				return pwf.search_obj(p.storage.el, name);
			}

			return p.storage.el;
		},

		'add_el':function(proto, name, el) {
			proto.storage.el[name] = el;
			return this;
		},

		'divs':function(proto, list, prefix) {
			proto.storage.el.create_divs(list, prefix);
			return this;
		},

		'remove':function(proto) {
			if (this.get_el().is_attached()) {
				proto('el_removed');
				proto('el_unbind');
			}

			this.get_el().remove();
			return this;
		},

		'append':function(proto, parent) {
			this.remove().set('parent', parent);
			this.get('parent').append(proto.storage.el);

			proto('el_attached');
			proto('el_bind');

			return this;
		}
	}
});
