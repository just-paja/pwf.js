(function() {

	var pwf = function()
	{
		return new function()
		{
			var
				/** Status of all registered modules */
				mstatus = {},

				/** Queue for modules that are registered but could not be initialized yet */
				init_later = [],

				/** List of modules that have std scan method */
				init_scan  = [],

				/** Queue for callbacks that will be run on run_callbacks */
				callbacks  = {
					'r':[],
					'i':[],
					'c':[]
				},

				classes = {};


			/** DEPRECATED, will be removed in next version
			 */
			this.callbacks = {
				/** Callback for mondays */
				'cancel':function(e) {
					e.stopPropagation();
					e.preventDefault();
					return e;
				},

				/** Prevent event from beiing noticed */
				'prevent':function(e) {
					e.preventDefault();
					return e;
				},

				/** Callback for mondays */
				'stop':function(e) {
					e.stopPropagation();
					return e;
				}
			};


			/** Merge objects into new one
			 *
			 * Example: pwf.merge(true, {'a':2, 'b':2}, {'a':1, 'c':3});
			 * Result: {'a':1, 'b':2, 'c':3}
			 *
			 * @param boolean deep   Make a deep merge - creates new instances of all subobjects
			 * @param Object  object Use this objects' attributes
			 * @param [Object  object Use this objects' attributes]
			 * @param [Object  object Use this objects' attributes] ...
			 * @return object
			 */
			this.merge = function()
			{
				var
					args = Array.prototype.slice.call(arguments),
					dest = {},
					deep = false;

				if (typeof args[0] == 'boolean') {
					deep = args.shift();
				}

				if (args[0] instanceof Array) {
					dest = [];
				}

				for (var i = 0, len = args.length; i < len; i++) {
					var src = args[i];

					if (src instanceof Array) {
						// Merging arrays results into calculating array union, so just push values to the end
						for (var j = 0, alen = src.length; j < alen; j++) {
							// Deep array merge attempts to clone all objects
							dest.push(deep && typeof src[j] == 'object' ? pwf.merge(src[j]):src[j]);
						}
					} else {
						for (var prop in src) {

							// Clone or copy values from src to dest. Don't event
							// attempt to clone empty values
							if (deep && src[prop] && (typeof src[prop] == 'object')) {

								if (src[prop] instanceof Array) {

									// This is a simple way to clone arrays
									dest[prop] = src[prop].slice();

								} else if (src[prop].constructor === Object) {

									// This is a simple object. We go deep
									dest[prop] = arguments.callee(deep, dest[prop], src[prop]);

								} else {

									// No need to clone anything, just copy value
									dest[prop] = src[prop];

								}
							} else {

								// Just copy value
								dest[prop] = src[prop];
							}
						}
					}
				}

				return dest;
			};


			/** Register function under name as a module under pwf
			 *
			 * Example:
			 * pwf.register('some_module', function() {
			 *   this.say_hello = function() { alert('hello'); };
			 * });
			 *
			 * @param string   name
			 * @param function module
			 * @param bool     create Create instance of the function, default true
			 * @return this
			 */
			this.register = function(name, module, create)
			{
				var create = typeof create == 'undefined' ? true:!!create;

				if (!(name in this)) {
					this[name] = create ? (new module()):module;
					mstatus[name] = false;

					if (this.module_ready(name)) {
						this.init(name);
					} else {
						init_later.push(name);
					}

					if (this[name].scan instanceof Function) {
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
				if (this[module].init instanceof Function) {
					if (!mstatus[module]) {
						mstatus[module] = this[module].init(function(pwf, mstatus) {
							return function(name, status) {
								mstatus[name] = status;
								pwf.run_callbacks().init_remaining();
							};
						}(this, mstatus));
					}
				} else {
					mstatus[module] = true;
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
						initialized = mstatus[module];

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
			 * @param jQuery el
			 */
			this.scan = function(el)
			{
				if (typeof el == 'undefined') {
					throw 'pwf:scan:missing-el';
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
				if (this['m' + status](modules)) {
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

						if (cb && this['m' + status](cb[0])) {
							cb[1](typeof cb[2] == 'undefined' ? null:cb[2]);
						} else {
							callbacks[status].push(cb);
						}
					}
				}

				return this;
			};


			/** Dear sir, is this module ready to use?
			 * @param string module module name
			 * @return bool
			 */
			this.module_ready = function(module)
			{
				return this.module_exists(module) && (!(this[module].is_ready instanceof Function) || this[module].is_ready());
			};


			/** Dear sir, does module carrying this noble name exist?
			 * @param string module module name
			 * @return bool
			 */
			this.module_exists = function(module)
			{
				return module in this;
			};


			/** Dear sir, is the module carrying this noble name initialized?
			 * @param string module module name
			 * @return bool
			 */
			this.module_initialized = function(name)
			{
				return name in mstatus && mstatus[name];
			};


			/** Compatibility method for has_classes
			 * @param list modules
			 * @return bool
			 */
			this.mc = function(modules)
			{
				return this.has_classes(modules);
			};


			/** Get status of module
			 * @return undefined|bool
			 */
			this.status = function(name)
			{
				return mstatus[name];
			};


			/** Create protocol caller, that will allow accessing protected
			 * structures and storage
			 */
			var create_proto_caller = function(obj, proto, storage)
			{
				var call = function() {
					var
						args = Array.prototype.slice.call(arguments),
						name = args.shift(args),
						targ = pwf.search_obj(proto, name),
						retval;

					if (targ instanceof Function) {
						args.unshift(arguments.callee);
						retval = targ.apply(obj, args);
					} else {
						retval = targ;
					}

					return retval;
				};

				call.object    = obj;
				call.pwf_proto = true;
				call.storage   = storage;

				call.type = function(proto) {
					return function(name) {
						return typeof proto[name];
					};
				}(proto);

				call.exists = function(name) {
					return this.type(name) != 'undefined';
				};

				return call;
			};


			/**
			 * Wrap method to allow access to protected structures
			 *
			 * @param object proto Object referencing protected structures
			 * @param object cont  Object referencing API to be wrapped
			 * @param string key   Name of the method
			 * @return void;
			 */
			var wrap_public_method = function(proto, cont, key)
			{
				var method = cont[key];

				// Check if this method has been wrapped already. Wrap the inner one if so
				if (method.ip instanceof Function) {
					method = method.ip;
				}

				cont[key] = (function(method, method_name) {
					return function() {
						var
							call,
							result,
							args = Array.prototype.slice.call(arguments),
							storage = args.shift();

						if (typeof storage == 'undefined' || storage.internal.caller === null) {
							call = create_proto_caller(this, proto, storage);

							if (typeof storage != 'undefined') {
								storage.internal.caller = call;
							}
						} else {
							call = storage.internal.caller;
						}

						/** Always pass protocol as first argument */
						args.unshift(call);

						result = method.apply(this, args);
						return result;
					};
				})(method, key);

				cont[key].ip = method;
			};


			/**
			 * Make static methods always in context of parent object
			 *
			 * @param object cdef Class definition
			 * @param string key  Method name
			 * @return void
			 */
			var wrap_static_method = function(cdef, key)
			{
				var method = cdef.static[key];

				cdef[key] = function(cdef, key) {
					return function() {
						return cdef.static[key].apply(cdef, Array.prototype.slice.call(arguments));
					};
				}(cdef, key);
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
				if (opts.fn instanceof Function) {
					for (var key in opts.public) {
						if (opts.public[key] instanceof Function) {
							wrap_public_method(opts.proto, opts.public, key);
						}
					}

					for (var key in opts.static) {
						if (opts.static[key] instanceof Function) {
							wrap_static_method(opts, key);
						}
					}

					opts.fn.prototype = opts.public;

					return opts.fn;
				} else throw new Error('pwf:extend-constructor:invalid-args');
			};


			/**
			 * Extend class using its' parents. This method extends 'storage',
			 * 'static', 'public' and 'proto' registry with the keys from all defined
			 * parents of this class.
			 *
			 * @param object opts Class definition
			 * @return object Modified class_opts
			 */
			this.extend_class = function(opts)
			{
				var
					meta    = {},
					parents = [],
					init    = [];


				// Define required class properties if missing
				(!('storage' in opts)) && (opts.storage = {});
				(!('static'  in opts)) && (opts.static  = {});
				(!('public'  in opts)) && (opts.public  = {});
				(!('proto'   in opts)) && (opts.proto   = {});
				(!('uses'    in opts)) && (opts.uses    = []);
				(!('parents' in opts)) && (opts.parents = []);
				(!('fn'      in opts)) && (opts.fn = function() {});


				// Proceed only if parents are valid
				if (opts.parents.length) {
					var
						storage = {},
						static  = {},
						public  = {},
						proto   = {},
						uses    = [];

					for (var ipar = 0, plen = opts.parents.length; ipar < plen; ipar++) {
						var
							p_name = opts.parents[ipar],
							p_opts = this.get_class(p_name);

						// Merge class object methods and properties
						storage = this.merge(true, storage, p_opts.storage);
						static  = this.merge(static, p_opts.static);
						public  = this.merge(public, p_opts.public);
						proto   = this.merge(proto, p_opts.proto);
						meta    = this.merge(true, meta, p_opts.meta);
						uses    = this.merge(uses, p_opts.uses);

						// Merge list of parents
						for (var i = 0; i < p_opts.fn.parents.length; i++) {
							parents.push(p_opts.fn.parents[i]);
						}

						parents.push(p_opts.name);

						// Add this parents' init methods to the list
						if (p_opts.fn.init instanceof Array) {
							var pinit = p_opts.fn.init;

							for (var iinit = 0, ilen = pinit.length; iinit < ilen; iinit++) {

								// Check if this exact method is not in the list already
								if (init.indexOf(pinit[iinit]) < 0) {
									init.push(pinit[iinit]);
								}
							}
						}
					}

					// Merge parent classes methods and properties with passed options
					meta            = this.merge(true, meta, opts.meta);
					opts.static     = this.merge(static, opts.static);
					opts.public     = this.merge(public, opts.public);
					opts.proto      = this.merge(proto,  opts.proto);
					opts.uses       = this.merge(uses, opts.uses);
					opts.storage    = this.merge(true, storage, opts.storage);
				}

				// Add this class init method to the end of init list if available
				if (opts.init instanceof Function && init.indexOf(opts.init) < 0) {
					init.push(opts.init);
				}

				// Use assembled init and parent list
				opts.fn.init    = init;
				opts.fn.parents = parents;

				// Assemble init function from all inherited inits of parent classes
				if (opts.fn.init instanceof Array && opts.fn.init.length) {
					opts.public.init = function(list) {
						return function() {
							// Call all init methods in correct order in context of this object
							for (var i = 0; i < list.length; i++) {
								list[i].apply(this, arguments);
							}

							return this;
						};
					}(init);
				}

				opts.fn = this.extend_constructor(opts);
				opts.fn.prototype.meta = meta;

				meta.constructor = opts.fn;
				meta.cname       = opts.name;
				meta.static      = opts.static;
				meta.parents     = opts.fn.parents;

				return opts;
			};


			/** Save class as predefined
			 * @param object opts Class definition
			 * @return this
			 */
			var save_class = function(ctrl, opts)
			{
				if (opts instanceof Object && typeof opts.name == 'string') {
					if (opts.name in classes) {
						throw new Error(['pwf:save-class:exists', opts.name]);
					}

					classes[opts.name] = opts;
				} else throw new Error(['pwf:save-class:invalid-format', opts]);

				return ctrl.run_callbacks().init_remaining();
			};


			/** Get definition of class by name
			 * @param string name
			 * @return object
			 */
			this.get_class = function(name)
			{
				return this.has_class(name) ? classes[name]:null;
			};


			/** Check if pwf has class predefined
			 * @param string name
			 * @return bool
			 */
			this.has_class = function(name)
			{
				return name in classes;
			};


			/** Has class for multiple
			 * @param string|list names
			 * @return bool
			 */
			this.has_classes = function(names)
			{
				var ok = true;

				if (names instanceof Array) {
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


			/**
			 * Create storage caller - method that always passes object storage as
			 * first argument and calls its' parent method.
			 *
			 * @param object obj     Instance of object
			 * @param string key     Key to override
			 * @param object storage Storage object to pass
			 * @return obj
			 */
			var create_storage_caller = function(obj, key, storage)
			{
				var
					method = obj[key],
					caller;

				if ('sp' in method) {
					method = method.sp;
				}

				caller = function() {
					var args = Array.prototype.slice.call(arguments);
					args.unshift(storage);
					return method.apply(obj, args);
				};

				caller.sp = method;
				return caller;
			};


			/**
			 * Extend object context if class storage is defined
			 *
			 * @param ClassInstance obj           Instance of a class
			 * @param Object        storage_proto Storage definition
			 * @param Array         args          Args to pass to init methods
			 * @return Object returns instance of obj
			 */
			this.extend_context = function(obj, storage_proto, args)
			{
				var after = [], storage;

				storage = this.merge(true, storage_proto);
				storage.internal = {
					'after_init':after,
					'caller':null,
					'object':obj
				};

				// Wrap all object methods in storage caller
				for (var key in obj) {
					if (obj[key] instanceof Function) {
						obj[key] = create_storage_caller(obj, key, storage);
					}
				}

				// Run init method
				if (obj.init instanceof Function) {
					obj.init.apply(obj, args);
				}

				// Run after init methods
				for (var i = 0, len = after.length; i < len; i++) {
					after[i].call(obj);
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
					class_def = this.get_class(name);

				if (class_def === null) {
					throw new Error('pwf:create:unknown-class:' + name);
				}

				return this.extend_context(new class_def.fn(args), class_def.storage, args);
			};


			/**
			 * Check with passed base class static method to see what class instance
			 * will be created. Class passed as first argument will be used as base
			 * class and its' #resolve_class method will be used.
			 *
			 * @param string name
			 * @param ..     args
			 * @return instance of resolved class
			 */
			this.resolve = function()
			{
				var
					args = Array.prototype.slice.call(arguments),
					name = args.shift(),
					solved = null,
					cdef = this.get_class(name);

				if (cdef === null) {
					throw new Error('pwf:resolve:unknown-class:' + name);
				}

				if (cdef.resolve_class instanceof Function) {
					solved = cdef.resolve_class.apply(cdef, args);
				} else {
					solved = name;
				}

				if (solved) {
					args.unshift(solved);
					return this.create.apply(this, args);
				}

				throw new Error('pwf:resolve:cannot-resolve:' + name);
			};


			/** Dear sir, are all members of this noble name list initialized?
			 * @param list modules module name
			 * @return bool
			 */
			this.mi = function(mods)
			{
				var ready = true;

				for (var comp_i = 0; comp_i < mods.length; comp_i++) {
					ready = this.module_initialized(mods[comp_i]);
					if (!ready) break;
				}

				return ready;
			};


			/** Dear sir, are all modules of this list ready?
			 * @param Object modules List (array) of module names
			 * @return bool
			 */
			this.mr = function(mods)
			{
				var ready = true;

				for (var comp_i = 0; comp_i < mods.length; comp_i++) {
					ready = this.module_ready(mods[comp_i]);
					if (!ready) break;
				}

				return ready;
			};


			/** Shortcut for when_initialized
			 * @param list     mods
			 * @param function lambda
			 * @param mixed    args
			 */
			this.wi = function(mods, lambda, args)
			{
				return this.when(mods, 'i', lambda, args);
			};


			/** Shortcut for when_ready
			 * @param list     cnames
			 * @param function lambda
			 * @param mixed    args
			 */
			this.wr = function(comps, lambda, args)
			{
				return this.when(comps, 'r', lambda, args);
			};


			/**
			 * Register class and extend it
			 *
			 * @param string name Name and scope of the class
			 * @param object opts Class definition
			 * @return this
			 */
			this.rc = function(name, opts)
			{
				if (name instanceof Object) {
					opts = name;
				} else {
					opts.name = name;
				}

				if (typeof opts.name == 'string') {
					if ((!('parents' in opts)) || this.has_classes(opts.parents)) {
						var class_data = this.extend_class(opts);

						if (this.mi(class_data.uses)) {
							save_class(this, class_data);
						} else {
							this.wi(class_data.uses, function(ctrl, class_data) {
								return function() {
									save_class(ctrl, class_data);
								};
							}(this, class_data));
						}
					} else {
						this.wcr(opts.parents, function(ctrl, opts) {
							return function() {
								ctrl.rc(opts);
							};
						}(this, opts));
					}
				} else throw new Error(['pwf:rc:invalid-args', opts]);

				return this;
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
				return this.when(cnames, 'c', lambda, args);
			};


			/** Check if display device has touch events
			 * @return bool
			 */
			this.has_touch = function()
			{
				return typeof window != 'undefined' && 'ontouchstart' in window;
			};


			/**
			 * List classes in a scope. Scope must end with a 'dot'. Method will
			 * return class of name equal to scope when passed scope not ending with
			 * dot.
			 *
			 * @param string scope    Scope to search
			 * @param bool   as_scope Act as if passed string ended with dot
			 * @return Array
			 */
			this.list_scope = function(scope, as_scope)
			{
				var
					as_scope = typeof as_scope == 'undefined' ? false:!!as_scope,
					is_scope = as_scope || scope.match(/\.$/),
					obj  = this.get_class(scope),
					list = [];

				if (!is_scope && obj) {
					list.push(obj.name);
				}

				if (is_scope) {
					for (var cname in classes) {
						if (cname.indexOf(scope) === 0 && list.indexOf(cname) < 0) {
							list.push(cname);
						}
					}
				}

				return list;
			};


			this.search_obj = function(source, name)
			{
				var ref = source;

				if (typeof name == 'string' && name.indexOf('.') >= 0) {
					var path = name.split('.');

					while (path.length > 1) {
						segment = path.shift();

						if (typeof ref[segment] == 'object' && ref !== null) {
							ref = ref[segment];
						} else {
							ref = null;
							break;
						}
					}

					name = path.join('.');
				}

				return (typeof ref == 'undefined' || ref === null || typeof ref[name] == 'undefined') ? null:ref[name];
			};
		};
	}();


	/** Safe dump data into console. Takes any number of any arguments
	 * @param mixed any
	 * @return void
	 */
	var v = function()
	{
		if (typeof console != 'undefined' && ((pwf.status('config') && pwf.config.get('debug.frontend')) || !pwf.status('config'))) {
			var args = Array.prototype.slice.call(arguments);

			if (args.length > 1) {
				console.log(args);
			} else {
				console.log(args[0]);
			}
		}
	};


	/** Register items into global objects
	 * @param object items Key-value objects to register
	 * @return void
	 */
	var register_as_global = function(items)
	{
		var register = [];

		/// Export as module if running under nodejs
		if (typeof global == 'object') {
			register.push(global);
		}

		if (typeof window == 'object') {
			register.push(window);
		}

		// Browse all resolved global objects and bind pwf items
		for (var i = 0; i < register.length; i++) {
			var obj = register[i];

			// Bind all requested items as global
			for (var key in items) {
				obj[key] = items[key];
			}

			// Check for all callbacks bound to this global object and call them
			if (typeof obj.on_pwf != 'undefined') {
				var calls = obj.on_pwf;

				// Expecting list/array
				if (!(calls instanceof Array)) {
					calls = [calls];
				}

				for (var j = 0; j < calls.length; j++) {
					if (typeof calls[j] == 'function') {
						calls[j].apply(obj.pwf);
					} else throw new Error('on_pwf:not-a-method:' + j);
				}
			}
		}
	};

	register_as_global({
		'pwf':pwf,
		'v':v
	});
})();
