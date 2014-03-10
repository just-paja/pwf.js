var pwf = function()
{
	/// Unique items in array. Add to array prototype
	if (typeof Array.prototype.unique != 'function') {
		Array.prototype.unique = function()
		{
			return this.reduce(function(p, c) {
				if (p.indexOf(c) < 0) p.push(c);
				return p;
			}, []);
		};
	}


	/// Clone array instance
	if (typeof Array.prototype.clone != 'function') {
		Array.prototype.clone = function()
		{
			return this.slice(0);
		};
	}

	if (typeof Object.deepExtend != 'function') {
		Object.deepExtend = function() {
			var destination = {};

			for (var i = 0; i < arguments.length; i++) {
				var source = arguments[i];

				for (var property in source) {
					if (source[property] && source[property].constructor && source[property].constructor === Object) {
						destination[property] = destination[property] || {};
						arguments.callee(destination[property], source[property]);
					} else {
						destination[property] = source[property];
					}
				}
			}

			return destination;
		};
	}


	return new function()
	{
		var
			/** Status of all registered modules */
			module_status = {},

			/** Reference to this object accessible from inside this function */
			self = this,

			/** Queue for modules that are registered but could not be initialized yet */
			init_later = [],

			/** List of modules that have std scan method */
			init_scan  = [],

			/** Queue for callbacks that will be run on run_callbacks */
			callbacks  = {
				'ready':[],
				'initialized':[],
				'class':[]
			},

			classes = {},

			queue_class = [];


		this.callbacks = {};


		/** Callback for mondays */
		var callback_cancel = function(e)
		{
			callback_stop(e);
			callback_prevent(e);
			return e;
		};


		/** Prevent event from beiing noticed */
		var callback_prevent = function(e)
		{
			e.preventDefault();
			return e;
		};


		/** Callback for mondays */
		var callback_stop = function(e)
		{
			e.stopPropagation();
			return e;
		};


		this.callbacks.cancel  = callback_cancel;
		this.callbacks.prevent = callback_prevent;
		this.callbacks.stop    = callback_stop;


		/** Register function under name as a module under pwf
		 *
		 * Example:
		 * pwf.register('some_module', function() {
		 *   this.say_hello = function() { alert('hello'); };
		 * });
		 *
		 * @param string   name
		 * @param function module
		 * @param bool     create_instance Create instance of the function
		 * @return this
		 */
		this.register = function(name, module, create_instance)
		{
			var create_instance = typeof create_instance === 'undefined' ? true:!!create_instance;

			if (typeof this[name] == 'undefined') {
				if (create_instance) {
					this[name] = new module();
				} else {
					this[name] = module;
				}

				module_status[name] = false;

				if (this.module_ready(name)) {
					this.init(name);
				} else {
					init_later.push(name);
				}

				if (typeof this[name].scan == 'function') {
					init_scan.push(name);
				}
			}

			return this;
		};


		/** Initialize module
		 * @param string name module name
		 */
		this.init = function(module)
		{
			if (typeof this[module].init == 'function') {
				if (!module_status[module]) {
					module_status[module] = this[module].init();
				}
			} else {
				if (module != 'jquery') {
					module_status[module] = true;
				}
			}

			if (module == 'jquery') {
				this[module](function(obj, module_status, module) {
					return function() {
						module_status[module] = true;
						obj
							.run_callbacks()
							.init_remaining();
					};
				}(this, module_status, module));
			}

			return this
				.run_callbacks()
				.init_remaining();
		};


		/** Check if dependencies of all modules that were not initialized yet are met and if so, initialize them
		 * @return this
		 */
		this.init_remaining = function()
		{
			for (var i = 0; i < init_later.length; i++) {
				var
					module = init_later[i],
					ready = this.module_ready(module),
					initialized = module_status[module];

				if (ready && !initialized) {
					this
						.remove_late_init(module)
						.init(module);
					break;
				}
			}

			return this;
		};


		/** Forget about initializing module
		 * @param string name
		 * @return this
		 */
		this.remove_late_init = function(name)
		{
			var init_later_tmp = [];

			for (var i = 0; i < init_later.length; i++) {
				if (init_later[i] != name) {
					init_later_tmp.push(init_later[i]);
				}
			}

			init_later = init_later_tmp;
			return this;
		};


		/** Perform a scan of element for all modules with std scan method. Standard scan method takes one not mandatory argument as jQuery object to search and binds its functions to elements found by it's selector.
		 * @see /share/scripts/pwf/form/date_picker.js
		 * @param jQuery el
		 */
		this.scan = function(el)
		{
			if (typeof el === 'undefined') {
				throw 'You must pass jQuery object referencing HTML element.';
			} else {
				for (var i = 0; i < init_scan.length; i++) {
					this[init_scan[i]].scan(el);
				}
			}
		};


		/** Plain getter for scan_list
		 * @return Object
		 */
		this.get_scan_list = function()
		{
			return init_scan;
		};


		/** Get list of predefined class names
		 * @return list
		 */
		this.get_class_list = function()
		{
			return Object.keys(classes);
		};


		/** Run lambda callback when listed modules are ready
		 * @param Object   modules List (array) of module names (string)
		 * @param function lambda     Callback to call when ready
		 * @param Object   args       Arguments to pass to lambda
		 * @return this
		 */
		this.when = function(modules, status, lambda, args)
		{
			if (this['modules_' + status](modules)) {
				lambda(args);
			} else callbacks[status].push([modules, lambda, args]);

			return this;
		};


		/** Check if dependencies for callbacks from when_ready() are met and run them if so.
		 * @return this
		 */
		this.run_callbacks = function()
		{
			for (var status in callbacks) {
				var length = callbacks[status].length;

				for (var i = 0; i < length; i++) {
					var cb = callbacks[status].shift();

					if (cb !== null && this['modules_' + status](cb[0])) {
						cb[1](typeof cb[2] == 'undefined' ? null:cb[2]);
					} else {
						callbacks[status].push(cb);
					}
				}
			}

			return this;
		};


		/** Dear sir, are all modules of this list ready?
		 * @param Object modules List (array) of module names
		 * @return bool
		 */
		this.modules_ready = function(modules)
		{
			var ready;

			for (var comp_i = 0; comp_i < modules.length; comp_i++) {
				ready = this.module_ready(modules[comp_i]);
				if (!ready) break;
			}

			return ready;
		};


		/** Dear sir, is this module ready to use?
		 * @param string module module name
		 * @return bool
		 */
		this.module_ready = function(module)
		{
			return this.module_exists(module) && (typeof this[module].is_ready !== 'function' || this[module].is_ready());
		};


		/** Dear sir, does module carrying this noble name exist?
		 * @param string module module name
		 * @return bool
		 */
		this.module_exists = function(module)
		{
			return typeof this[module] != 'undefined';
		};


		/** Dear sir, is the module carrying this noble name initialized?
		 * @param string module module name
		 * @return bool
		 */
		this.module_initialized = function(module)
		{
			return typeof module_status[module] != 'undefined' && module_status[module];
		};


		/** Dear sir, are all members of this noble name list initialized?
		 * @param list modules module name
		 * @return bool
		 */
		this.modules_initialized = function(modules)
		{
			var ready;

			for (var comp_i = 0; comp_i < modules.length; comp_i++) {
				ready = this.module_initialized(modules[comp_i]);
				if (!ready) break;
			}

			return ready;
		};


		/** Compatibility method for has_classes
		 * @param list modules
		 * @return bool
		 */
		this.modules_class = function(modules)
		{
			return this.has_classes(modules);
		};


		/** Get status of module
		 * @return undefined|bool
		 */
		this.status = function(name)
		{
			return module_status[name];
		};


		this.wrap_public_method = function(proto, cont, key)
		{
			cont[key] = (function(method, method_name) {
				return function() {
					var
						result,
						args = Array.prototype.slice.call(arguments),
						call = function(proto, obj) {
							return function() {
								var
									args = Array.prototype.slice.call(arguments),
									name = args.shift(args);

								args.unshift(arguments.callee);
								args.unshift(obj);

								if (typeof proto[name] == 'undefined') {
									throw new Error('Undefined protected thing ' + name);
								}

								return typeof proto[name] == 'function' ? proto[name].apply(obj, args):proto[name];
							};
						}(proto, this);

					if (typeof args[0] !== 'function') {
						args.unshift(call);
					}

					result = method.apply(this, args);

					return result;
				};
			})(cont[key], key);

			return this;
		};


		/** Extend constructor with protected methods and data
		 * @param object opts
		 * 	{
		 * 		'fn':     function constructor to extend
		 * 		'public': object   simple object containing public API for constructor
		 * 		'proto':  object   simple object containing protected API for constructor
		 * 	}
		 * @return function Returns extended constructor
		 */
		this.extend_constructor = function(opts)
		{
			if (typeof opts.fn == 'function') {
				if (typeof opts.public != 'object') {
					opts.public = {};
				}

				if (typeof opts.proto == "object") {
					for (var key in opts.public) {
						if (opts.public.hasOwnProperty(key)) {
							this.wrap_public_method(opts.proto, opts.public, key);
						}
					}
				}

				opts.fn.prototype = opts.public;

				return opts.fn;
			} else throw new Error('pwf-extend-constructor-invalid-args');
		};


		/** Extend class by its' parents
		 * @param object class_opts Class definition
		 * @return object Modified class_opts
		 */
		this.extend_class = function(class_opts)
		{
			var parents_ok =
				typeof class_opts.parents == 'object' &&
				class_opts.parents !== null &&
				typeof class_opts.parents.length == 'number';

			if (typeof class_opts.public == 'undefined') {
				class_opts.public = {};
			}

			if (typeof class_opts.proto == 'undefined') {
				class_opts.proto = {};
			}

			if (parents_ok) {
				var
					storage = null,
					public = {},
					proto = {},
					init = [];

				for (var iparent = 0, plength = class_opts.parents.length; iparent < plength; iparent++) {
					var
						parent_name = class_opts.parents[iparent],
						parent_opts = this.get_class(parent_name);

					if (typeof parent_opts.storage == 'object') {
						if (storage === null) {
							storage = {};
						}

						storage = this.extend_obj(storage, parent_opts.storage);
					}

					public  = this.extend_obj(public, parent_opts.public);
					proto   = this.extend_obj(proto, parent_opts.proto);

					if (typeof parent_opts.public.init == 'function') {
						init.push(parent_opts.public.init);
					}
				}

				if (typeof class_opts.public.init != 'undefined') {
					init.push(class_opts.public.init);
				}

				class_opts.public = this.extend_obj(public, class_opts.public);
				class_opts.proto  = this.extend_obj(proto,  class_opts.proto);

				if (storage !== null) {
					class_opts.storage = storage;
				}

				if (typeof class_opts.fn != 'undefined') {
					class_opts.fn.parents = class_opts.parents;
					class_opts.fn.init    = init;
				}
			}

			if (typeof class_opts.fn != 'undefined') {
				class_opts.fn = this.extend_constructor(class_opts);
				class_opts.fn.prototype.constructor = class_opts.fn;
				class_opts.fn.prototype.cname = class_opts.name;
			}

			return class_opts;
		};


		/** Save class as predefined
		 * @param object opts Class definition
		 * @return this
		 */
		var save_class = function(ctrl, opts)
		{
			if (opts !== null && typeof opts == 'object' && typeof opts.name == 'string') {
				if (typeof classes[opts.name] == 'undefined') {
					classes[opts.name] = opts;
				} else throw new Error(['pwf-save-class-exists', opts.name]);
			} else throw new Error(['pwf-save-class-invalid-format', opts]);

			return ctrl.run_class_queue();
		};


		/** Get definition of class by name
		 * @param string name
		 * @return object
		 */
		this.get_class = function(name)
		{
			return typeof classes[name] == 'undefined' ? null:classes[name];
		};


		/** Check if pwf has class predefined
		 * @param string name
		 * @return bool
		 */
		this.has_class = function(name)
		{
			return this.get_class(name) !== null;
		};


		/** Has class for multiple
		 * @param string|list names
		 * @return bool
		 */
		this.has_classes = function(names)
		{
			var ok = true;

			if (typeof names == 'object' && typeof names.length == 'number') {
				for (var i = 0; i < names.length; i++) {
					ok = ok && this.has_class(names[i]);
					if (!ok) break;
				}
			} else if (typeof names == 'string') {
				ok = this.has_class(names);
			} else {
				ok = false;
			}

			return ok;
		};


		/** Get constructor of predefined class
		 * @param string name
		 * @return function
		 */
		this.get_constructor = function(name)
		{
			var class_obj = this.get_class(name);

			if (class_obj !== null) {
				return class_obj.fn;
			} else throw new Error(['pwf-get-constructor-missing-class', name]);
		};


		/** Extend object context if class storage is defined
		 * @param ClassInstance obj           Instance of a class
		 * @param Object        storage_proto Storage definition
		 */
		this.extend_context = function(obj, storage_proto, constructor, args)
		{
			var storage;

			if (typeof storage_proto == 'object') {
				storage = Object.deepExtend(storage_proto);
				storage.parent = obj;

				for (var key in obj) {
					var method = obj[key];

					if (typeof method == 'function' && key != 'init') {
						obj[key] = function(obj, key, method, storage) {
							return function() {
								var retval;

								obj.storage = storage;
								retval = method.apply(obj, arguments);
								delete obj.storage;

								return retval;
							};
						}(obj, key, method, storage);
					}
				}
			}

		if (typeof constructor.init == 'object' && typeof constructor.init.length == 'number') {
			for (var i = 0; i < constructor.init.length; i++) {
				if (typeof constructor.init[i] == 'function') {
					if (typeof storage != 'undefined') {
						obj.storage = storage;
					}

					constructor.init[i].apply(obj, args);
				}
			}

			if (typeof obj.storage != 'undefined') {
				delete obj.storage;
			}
		}


			return obj;
		};


		/** Create object of predefined class
		 * @param string name
		 * @param .. args
		 * @return instance of class named name
		 */
		this.create = function()
		{
			var
				args = Array.prototype.slice.call(arguments),
				name = args.shift(),
				class_def = this.get_class(name),
				constructor = this.get_constructor(name),
				obj = this.extend_context(new constructor(args), class_def.storage, constructor, args);

			return obj;
		};


		/** Register and extend class
		 * @param object opts
		 * @return this
		 */
		this.register_class = function(opts)
		{
			if (typeof opts.name == 'string') {
				if (typeof opts.parents == 'undefined') {
					opts.parents = [];
				}

				if (this.has_classes(opts.parents)) {
					save_class(this, this.extend_class(opts));
				} else {
					queue_class.push(opts);
				}
			} else throw new Error(['pwf-register-class-invalid-args', opts]);

			return this;
		};


		/** Extend all remaining classes that have all parents ready
		 * @return this
		 */
		this.run_class_queue = function()
		{
			var
				renew = [],
				opts,
				cont = true;

			while (opts = queue_class.shift()) {
				if (cont && this.has_classes(opts.parents)) {
					this.rc(opts);
					cont = false;
				} else {
					renew.push(opts);
				}
			}

			queue_class = renew;
			return this;
		};


		/** Shortcut for modules_initialized
		 */
		this.mi = function(mods)
		{
			return this.modules_initialized(mods);
		};


		/** Shortcut for modules_ready
		 * @param list mods
		 */
		this.mr = function(mods)
		{
			return this.modules_ready(mods);
		};


		/** Shortcut for when_initialized
		 * @param list     mods
		 * @param function lambda
		 * @param mixed    args
		 */
		this.wi = function(mods, lambda, args)
		{
			return this.when(mods, 'initialized', lambda, args);
		};


		/** Shortcut for when_ready
		 * @param list     cnames
		 * @param function lambda
		 * @param mixed    args
		 */
		this.wr = function(comps, lambda, args)
		{
			return this.when(comps, 'ready', lambda, args);
		};


		/** Shortcut for register_class
		 * @param object
		 */
		this.rc = function(opts)
		{
			return this.register_class(opts);
		};


		/** Shortcut for has_classes
		 * @param list cnames
		 * @return bool
		 */
		this.cr = function(cnames)
		{
			return this.has_classes(cnames);
		};


		/** Shortcut for when class ready
		 * @param list     cnames
		 * @param function lambda
		 * @param mixed    args
		 */
		this.wcr = function(cnames, lambda, args)
		{
			return this.when(cnames, 'class', lambda, args);
		};


		/** Basic version of extend to ommit having dependencies
		 * @params objects
		 * @return object
		 */
		this.extend_obj = function()
		{
			var obj = {};

			for (var i = 0; i < arguments.length; i++) {
				for (var key in arguments[i]) {
					obj[key] = arguments[i][key];
				}
			}

			return obj;
		};
	};
}();


/// Export as module if running under nodejs
if (typeof module == 'object' && module !== null) {
	module.exports = pwf;
}


/** Safe dump data into console */
var v = function(variable)
{
	var allowed = true;

	if ((pwf.status('config') && pwf.config.get('debug.frontend')) || !pwf.status('config')) {
		if (typeof console != 'undefined') {
			console.log(variable);
		}
	}
};
