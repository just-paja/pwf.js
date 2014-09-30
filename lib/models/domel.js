pwf.rc({
	'name':'domel',
	'uses':['jquery'],
	'parents':['container'],

	'storage':{
		// Base element
		'el':null,

		'opts':{
			// Define tagname for base element
			'tag':'div',

			// Should the initial parent be overtaken instead of appending?
			'tag_overtake':false
		}
	},


	'init':function(p) {
		// Append to DOM if parent passed
		p.storage.internal.after_init.push(function() {
			if (this.get('tag_overtake')) {
				this.overtake(this.get('parent'));
			} else {
				p('base_el_create');
				p('base_el_mark');

				if (this.get('parent')) {
					this.append(this.get('parent'));
				}
			}
		});
	},


	'proto':{
		/**
		 * Create base element for this object
		 *
		 * @return void
		 */
		'base_el_create':function(p)
		{
			p.storage.el = pwf.jquery('<' + this.get('tag') + '/>');
		},


		/**
		 * Label base element with CSS classes derived from class ancestors
		 * and its' own name.
		 *
		 * @return void
		 */
		'base_el_mark':function(p)
		{
			// Add class names of all ancestors, but omit container (not related to DOM)
			for (var i = 0; i < this.meta.constructor.parents.length; i++) {
				if (this.meta.constructor.parents[i] != 'container') {
					p.storage.el.addClass(this.meta.static.to_cname(this.meta.constructor.parents[i]));
				}
			}

			// Add class name of this object class
			p.storage.el.addClass(this.meta.static.to_cname(this.meta.cname));
		}
	},


	'static':{
		/**
		 * Convert string to CSS class name
		 *
		 * @param string str
		 * @return string
		 */
		'to_cname':function(str)
		{
			return str.replace(/\./g, '-');
		}
	},


	'public':{
		/**
		 * Get objects' element by name
		 *
		 * @param string name Dot separated path to element
		 * @return null|jQuery
		 */
		'get_el':function(p, name)
		{
			if (typeof name == 'string') {
				return pwf.obj_search(p.storage.el, name);
			}

			return p.storage.el;
		},


		/**
		 * Add element to objects' element collection
		 *
		 * @param string name
		 * @param jQuery el
		 * @return this
		 */
		'add_el':function(p, name, el)
		{
			p.storage.el[name] = el;
			return this;
		},


		/**
		 * Remove this object from DOM. Calls el_removed and el_unbind.
		 *
		 * @return this
		 */
		'remove':function(p)
		{
			if (this.get_el().is_attached()) {
				p('el_removed');
				p('el_unbind');
			}

			this.get_el().remove();
			return this;
		},


		/**
		 * Append this object to DOM at 'parent'. Calls el_attached and
		 * el_bind.
		 *
		 * @param jQuery parent
		 * @return this
		 */
		'append':function(p, parent)
		{
			this.remove().set('parent', parent);
			this.get('parent').append(p.storage.el);

			p('el_attached');
			p('el_bind');

			return this;
		},


		/**
		 * Overtakes element as its' own base. Calls el_attached and el_bind.
		 *
		 * @param jQuery el
		 * @return this
		 */
		'overtake':function(p, el)
		{
			this.remove().set('parent', el.parent());

			p.storage.el = el;

			p('base_el_mark');
			p('el_attached');
			p('el_bind');

			return this;
		}
	}
});
