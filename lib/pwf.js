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

				/** Storage for classes */
				classes = {},

				/** Reference to this instance of pwf */
				self = this,

				/** Object for internal methods. Created to not interfere with public API. */
				internal = function() {};


			internal.prototype.questions = {
				'mc':function(names) {
					return internal.has_classes(names);
				},

				'mr':function(names) {
					return internal.mr(names);
				},

				'mi':function(modules) {
					return internal.mi(modules);
				}
			};


			internal.prototype.states = {
				'undefined':0,
				'registered':1,
				'initializing':2,
				'initialized':3,
				'failed':4
			};



			/**
			 * Check if pwf has all these classes prepared for use
			 *
			 * @param Array names
			 * @return bool
			 */
			internal.prototype.has_classes = function(names)
			{
				var ok = true;

				for (var i = 0, len = names.length; i < len; i++) {
					ok = ok && names[i] in classes;
					if (!ok) break;
				}

				return ok;
			};


			/** Dear sir, is this module ready to use?
			 * @param string module module name
			 * @return bool
			 */
			internal.prototype.is_module_ready = function(module)
			{
				return module in self && (typeof self[module].is_ready != 'function' || self[module].is_ready());
			};


			/** Dear sir, is the module carrying this noble name initialized?
			 * @param string module module name
			 * @return bool
			 */
			internal.prototype.is_module_initialized = function(name)
			{
				return self.get_module_status(name) == internal.states.initialized;
			};


			/**
			 * Dear sir, are all members of this noble name list initialized?
			 *
			 * @param list modules module name
			 * @return bool
			 */
			internal.prototype.mi = function(mods)
			{
				var ready = true;

				for (var comp_i = 0, len = mods.length; comp_i < len; comp_i++) {
					ready = internal.is_module_initialized(mods[comp_i]);
					if (!ready) break;
				}

				return ready;
			};


			/** Dear sir, are all modules of this list ready?
			 * @param Object modules List (array) of module names
			 * @return bool
			 */
			internal.prototype.mr = function(mods)
			{
				var ready = true;

				for (var comp_i = 0, len = mods.length; comp_i < len; comp_i++) {
					ready = internal.is_module_ready(mods[comp_i]);
					if (!ready) break;
				}

				return ready;
			};


			/**
			 * Plain getter for scan_list
			 *
			 * @return Object
			 */
			internal.prototype.get_scan_list = function()
			{
				return init_scan;
			};


			/**
			 * Initialize module
			 *
			 * @param string name module name
			 * @return pwf
			 */
			internal.prototype.init = function(module)
			{
				if (typeof self[module].init == 'function') {
					if (mstatus[module] != internal.states.initialized) {
						var stat = self[module].init(function(pwf, mstatus) {
							return function(name, status) {
								if (status) {
									mstatus[name] = internal.states.initialized;
								} else {
									mstatus[name] = internal.states.failed;
								}

								internal.run_callbacks();
								internal.init_remaining();
							};
						}(self, mstatus));

						if (stat) {
							mstatus[module] = internal.states.initialized;
						}
					}
				} else {
					mstatus[module] = internal.states.initialized;
				}

				internal.run_callbacks();
				internal.init_remaining();
				return self;
			};


			/**
			 * Check if dependencies of all modules that were not initialized yet are met and if so, initialize them
			 *
			 * @return pwf
			 */
			internal.prototype.init_remaining = function()
			{
				for (var i = 0; i < init_later.length; i++) {
					var
						module = init_later[i],
						status = self.get_module_status(module);

					if (status === internal.states.registered && internal.is_module_ready(module)) {
						internal.remove_late_init(module);
						internal.init(module);
						break;
					}
				}

				return self;
			};


			/**
			 * Check if dependencies for callbacks from when_ready() are met and run them if so.
			 *
			 * @return this
			 */
			internal.prototype.run_callbacks = function()
			{
				for (var status in callbacks) {
					for (var i = 0, len = callbacks[status].length ; i < len; i++) {
						var cb = callbacks[status].shift();

						if (cb && internal.questions['m' + status](cb[0])) {
							cb[1](typeof cb[2] == 'undefined' ? null:cb[2]);
						} else {
							callbacks[status].push(cb);
						}
					}
				}

				return self;
			};


			/**
			 * Forget about initializing module
			 *
			 * @param string name
			 * @return this
			 */
			internal.prototype.remove_late_init = function(name)
			{
				var init_later_tmp = [];

				for (var i = 0; i < init_later.length; i++) {
					if (init_later[i] != name) {
						init_later_tmp.push(init_later[i]);
					}
				}

				init_later = init_later_tmp;
				return self;
			};


			/**
			 * Create protocol caller, that will allow accessing protected
			 * structures and storage
			 *
			 * @param Object obj     Class instance object
			 * @param Object proto   Definition of protected members
			 * @param Object storage Storage object instance
			 * @return protocaller Returns fresh new protocaller
			 */
			internal.prototype.create_proto_caller = function(obj, proto, storage)
			{
				var call = function() {
					var
						args = self.clone_array(arguments),
						name = args.shift(args),
						targ = pwf.obj_search(proto, name),
						retval;

					if (typeof targ == 'function') {
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

				call.get = function(path) {
					return pwf.obj_search(proto, path);
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
			internal.prototype.wrap_public_method = function(proto, cont, key)
			{
				var method = cont[key];

				// Check if this method has been wrapped already. Wrap the inner one if so
				if (typeof method.ip == 'function') {
					method = method.ip;
				}

				cont[key] = (function(method, method_name) {
					return function() {
						var
							call,
							result,
							args = self.clone_array(arguments),
							storage = args.shift();

						if (typeof storage == 'undefined' || storage.internal.caller === null) {
							call = internal.create_proto_caller(this, proto, storage);

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
			internal.prototype.wrap_static_method = function(cdef, key)
			{
				var method = cdef.static[key];

				cdef[key] = function(cdef, key, method) {
					return function() {
						return method.apply(cdef, self.clone_array(arguments));
					};
				}(cdef, key, method);
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
			internal.prototype.extend_constructor = function(opts)
			{
				if (typeof opts.fn == 'function') {
					for (var key in opts.public) {
						if (typeof opts.public[key] == 'function') {
							internal.wrap_public_method(opts.proto, opts.public, key);
						}
					}

					for (var key in opts.static) {
						if (typeof opts.static[key] == 'function') {
							internal.wrap_static_method(opts, key);
						} else if (typeof opts.static[key] == 'object') {
							opts.static[key] = pwf.merge(opts.static[key]);
						}

						opts[key] = opts.static[key];
					}

					opts.fn.prototype = opts.public;

					return opts.fn;
				} else throw new Error('pwf:extend-constructor:invalid-args');
			};


			/**
			 * Setup default class options and add default values if not passed
			 *
			 * @param Object opts
			 * @return Object
			 */
			internal.prototype.reset_class_opts = function(opts)
			{
				opts.internal = {
					'init':[],
					'parents':[]
				};

				// Define required class properties if missing
				if (typeof opts.storage == 'undefined') {
					opts.storage = {};
				}

				if (typeof opts.static == 'undefined') {
					opts.static = {};
				}

				if (typeof opts.public == 'undefined') {
					opts.public = {};
				}

				if (typeof opts.proto == 'undefined') {
					opts.proto = {};
				}

				if (typeof opts.uses == 'undefined') {
					opts.uses = [];
				}

				if (typeof opts.parents == 'undefined') {
					opts.parents = [];
				}

				if (typeof opts.fn == 'undefined') {
					opts.fn = function() {};
				}

				return opts;
			};


			/**
			 * Extend class using its' parents. This method extends 'storage',
			 * 'static', 'public' and 'proto' registry with the keys from all defined
			 * parents of this class.
			 *
			 * @param object opts Class definition
			 * @return object Modified class_opts
			 */
			internal.prototype.extend_class = function(opts)
			{
				var
					meta    = {},
					parents = [],
					init    = [],
					opts    = internal.reset_class_opts(opts),

					storage, static, public, proto, uses;

				// Proceed only if parents are valid
				if (opts.parents.length) {
					storage = {};
					static  = {};
					public  = {};
					proto   = {};
					uses    = [];

					for (var ipar = 0, plen = opts.parents.length; ipar < plen; ipar++) {
						var
							p_name = opts.parents[ipar],
							p_opts = self.get_class(p_name),
							p_init = p_opts.internal.init;

						// Merge class object methods and properties
						meta    = self.merge(true, meta, p_opts.meta);
						storage = self.merge(true, storage, p_opts.storage);
						static  = self.merge(static, p_opts.static);
						public  = self.merge(public, p_opts.public);
						proto   = self.merge(proto, p_opts.proto);
						uses    = self.merge(uses, p_opts.uses);

						// Merge list of parents
						for (var i = 0, merge_len = p_opts.internal.parents.length; i < merge_len; i++) {
							parents.push(p_opts.internal.parents[i]);
						}

						parents.push(p_opts.name);

						// Add this parents' init methods to the list
						for (var iinit = 0, ilen = p_init.length; iinit < ilen; iinit++) {

							// Check if this exact method is not in the list already
							if (!~init.indexOf(p_init[iinit])) {
								init.push(p_init[iinit]);
							}
						}
					}

					// Merge parent classes methods and properties with passed options
					meta         = self.merge(true, meta, opts.meta);
					opts.storage = self.merge(true, storage, opts.storage);
					opts.static  = self.merge(static, opts.static);
					opts.public  = self.merge(public, opts.public);
					opts.proto   = self.merge(proto,  opts.proto);
					opts.uses    = self.merge(uses, opts.uses);
				}

				// Add this class init method to the end of init list if available
				if (typeof opts.init == 'function' && !~init.indexOf(opts.init)) {
					init.push(opts.init);
				}

				// Use assembled init and parent list
				opts.internal.init = init;
				opts.internal.parents = parents;

				// Assemble init function from all inherited inits of parent classes
				if (opts.internal.init.length) {
					opts.public.init = function(list) {
						return function() {
							// Call all init methods in correct order in context of this object
							for (var i = 0, llen = list.length; i < llen; i++) {
								list[i].apply(this, arguments);
							}

							return this;
						};
					}(init);
				}

				opts.fn = internal.extend_constructor(opts);
				opts.fn.prototype.meta = meta;

				meta.constructor = opts.fn;
				meta.cname       = opts.name;
				meta.static      = opts;
				meta.parents     = opts.internal.parents;

				return opts;
			};


			/** Save class as predefined
			 * @param object opts Class definition
			 * @return this
			 */
			internal.prototype.save_class = function(ctrl, opts)
			{
				if (opts instanceof Object && typeof opts.name == 'string') {
					if (typeof classes[opts.name] != 'undefined') {
						throw new Error(['pwf:save-class:exists', opts.name]);
					}

					classes[opts.name] = opts;

					if (typeof opts.config == 'function') {
						opts.config();
					}
				} else throw new Error(['pwf:save-class:invalid-format', opts]);

				internal.run_callbacks();
				internal.init_remaining();

				return self;
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
			internal.prototype.create_storage_caller = function(obj, key, storage)
			{
				var
					method = obj[key],
					caller;

				if (typeof method.sp != 'undefined') {
					method = method.sp;
				}

				caller = function() {
					var args = self.clone_array(arguments);
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
			internal.prototype.extend_context = function(obj, storage_proto, args)
			{
				var
					after = [], storage;

				storage = self.merge(true, storage_proto);
				storage.internal = {
					'after_init':after,
					'caller':null,
					'object':obj
				};

				// Wrap all object methods in storage caller
				for (var key in obj) {
					if (typeof obj[key] == 'function') {
						obj[key] = internal.create_storage_caller(obj, key, storage);
					}
				}

				// Run init method
				if (typeof obj.init == 'function') {
					obj.init.apply(obj, args);
				}

				// Run after init methods
				for (var i = 0, len = after.length; i < len; i++) {
					after[i].call(obj);
				}

				return obj;
			};



			/** Run lambda callback when listed modules are ready
			 * @param Object   modules List (array) of module names (string)
			 * @param function lambda     Callback to call when ready
			 * @param Object   args       Arguments to pass to lambda
			 * @return this
			 */
			internal.prototype.when = function(modules, status, lambda)
			{
				if (internal.questions['m' + status](modules)) {
					lambda.apply(self);
				} else callbacks[status].push([modules, lambda]);

				return self;
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
					args = self.clone_array(arguments),
					deep = false,
					dest;

				if (typeof args[0] == 'boolean') {
					deep = args.shift();
				}

				if (args[0] instanceof Array) {
					dest = [];
				} else {
					dest = {};
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


			/**
			 * Register function under name as a module under pwf
			 *
			 * Example:
			 * pwf.reg_module('some_module', function() {
			 *   this.say_hello = function() { alert('hello'); };
			 * });
			 *
			 * @param string   name
			 * @param function module
			 * @param bool     create Create instance of the function, default true
			 * @return this
			 */
			this.reg_module = function(name, module, create)
			{
				var create = typeof create == 'undefined' ? true:!!create;

				if (!(name in this)) {
					this[name] = create ? (new module()):module;
					mstatus[name] = internal.states.registered;

					if (internal.is_module_ready(name)) {
						internal.init(name);
					} else {
						init_later.push(name);
					}

					if (typeof this[name].scan == 'function') {
						init_scan.push(name);
					}
				}

				return this;
			};


			/** Perform a scan of element for all modules with std scan method. Standard scan method takes one not mandatory argument as jQuery object to search and binds its functions to elements found by it's selector.
			 * @param jQuery el
			 */
			this.scan = function(el)
			{
				for (var i = 0; i < init_scan.length; i++) {
					this[init_scan[i]].scan(el);
				}
			};


			/** Get list of predefined class names
			 * @return list
			 */
			this.list_classes = function()
			{
				return Object.keys(classes);
			};


			/**
			 * Get list of predefined class names
			 *
			 * @return list
			 */
			this.list_modules = function()
			{
				var names = [];

				for (var key in mstatus) {
					if (mstatus[key]) {
						names.push(key);
					}
				}

				return names;
			};


			/** Get status of module
			 * @return undefined|bool
			 */
			this.get_module_status = function(name)
			{
				if (typeof mstatus[name] == 'undefined') {
					return 0;
				}

				return mstatus[name];
			};


			/** Get definition of class by name
			 * @param string name
			 * @return object
			 */
			this.get_class = function(name)
			{
				return this.has('class', name) ? classes[name]:null;
			};


			this.has = function(type, names)
			{
				if (typeof names == 'string') {
					names = [names];
				}

				if (type == 'class') {
					return internal.questions.mc(names);
				}

				if (type == 'module') {
					return internal.questions.mi(names);
				}

				throw new Error('pwf:has:unknown-type:' + type);
			};


			this.wait_for = function(type, names, next)
			{
				if (typeof names == 'string') {
					names = [names];
				}

				if (typeof next == 'function') {
					if (type == 'class') {
						return internal.when(names, 'c', next);
					}

					if (type == 'module') {
						return internal.when(names, 'i', next);
					}
				} else {
					throw new Error('pwf:wait_for:callback-must-be-function');
				}

				throw new Error('pwf:wait_for:unknown-type:' + type);
			};


			/** Create object of predefined class
			 * @param string name
			 * @param .. args
			 * @return instance of class named name
			 */
			this.create = function()
			{
				var
					args = self.clone_array(arguments),
					name = args.shift(),
					class_def = this.get_class(name);

				if (!class_def) {
					throw new Error('pwf:create:unknown-class:' + name);
				}

				return internal.extend_context(new class_def.fn(), class_def.storage, args);
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
					args = self.clone_array(arguments),
					name = args.shift(),
					solved = null,
					cdef = this.get_class(name);

				if (cdef === null) {
					throw new Error('pwf:resolve:unknown-class:' + name);
				}

				if (typeof cdef.resolve_class == 'function') {
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


			/**
			 * Register class and extend it
			 *
			 * @param string name Name and scope of the class
			 * @param object opts Class definition
			 * @return this
			 */
			this.reg_class = function(name, opts)
			{
				if (typeof name == 'object') {
					opts = name;
				} else {
					opts.name = name;
				}

				if (typeof opts.name == 'string') {
					if (typeof opts.parents == 'undefined' || internal.has_classes(opts.parents)) {
						var class_data = internal.extend_class(opts);

						if (this.has('module', class_data.uses)) {
							internal.save_class(this, class_data);
						} else {
							this.wait_for('module', class_data.uses, function(ctrl, class_data) {
								return function() {
									internal.save_class(ctrl, class_data);
								};
							}(this, class_data));
						}
					} else {
						this.wait_for('class', opts.parents, function(ctrl, opts) {
							return function() {
								ctrl.reg_class(opts);
							};
						}(this, opts));
					}
				} else throw new Error(['pwf:reg_class:invalid-args', opts]);

				return this;
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
						if (cname.indexOf(scope) === 0 && !~list.indexOf(cname)) {
							list.push(cname);
						}
					}
				}

				return list;
			};


			/**
			 * Search given object for path. Return null if not found.
			 *
			 * @param Object source Object to search and retrieve value
			 * @param string name   Dot separated path to search for
			 * @return mixed|null
			 */
			this.obj_search = function(source, name)
			{
				var
					seg,
					ref = source;

				if (ref && typeof ref == 'object' && typeof name == 'string' && ~name.indexOf('.')) {
					var path = name.split('.');

					while (path.length > 1) {
						seg = path.shift();

						if (typeof ref[seg] == 'object') {
							ref = ref[seg];
						} else {
							ref = null;
							break;
						}
					}

					name = path.join('.');
				}

				return (typeof ref != 'object' || !ref || typeof ref[name] == 'undefined') ? null:ref[name];
			};


			/**
			 * Set value on given path inside given object
			 *
			 * @param Object src   Object to search and set value
			 * @param string name  Path separated by dots to set value to
			 * @param mixed  value Value to save inside object
			 * @return source
			 */
			this.obj_set = function(src, name, value)
			{
				var
					path,
					seg,
					targ = name,
					ref  = src;

				if (typeof name == 'string' && ~name.indexOf('.')) {
					var path = name.split('.');

					while (path.length > 1) {
						seg = path.shift();

						if (typeof ref[seg] == 'undefined' || ref[seg] === null) {
							ref[seg] = {};
						}

						if (typeof ref[seg] == 'object') {
							ref  = ref[seg];
						} else {
							throw new Error('data-set-collision:' + name + ':' + ref[seg]);
						}
					}

					targ = path.shift();
				}

				if (typeof ref == 'object') {
					ref[targ] = value;
				} else {
					throw new Error('invalid-source:' + typeof src + ':' + name);
				}

				return src;
			};


			/**
			 * Wrapper function for pwf-locales. Returns what it gets. When module
			 * pwf-locales is registered, this will be overwritten with actual
			 * translate method.
			 *
			 * @param string str
			 * @return str
			 */
			this.trans = function(str)
			{
				return str;
			};


			/**
			 * Expose internal object for testing purposes
			 *
			 * @return internal
			 */
			this.internal = function()
			{
				return internal;
			};


			/**
			 * Fastest way to duplicate array (jsperf)
			 *
			 * @param Array opts
			 * @return Array
			 */
			this.clone_array = function(args)
			{
				var copy = [];

				for (var i = 0, len = args.length; i < len; i++) {
					copy[i] = args[i];
				}

				return copy;
			};


			// Backwards compatibility aliases

			this.rc = function() {
				return this.reg_class.apply(this, arguments);
			};


			this.register = function() {
				return this.reg_module.apply(this, arguments);
			};


			this.status = function(name) {
				if (typeof mstatus[name] != 'undefined') {
					if (mstatus[name] == internal.states.initialized) {
						return true;
					}

					return false;
				}
			};


			this.mi = function() {
				var args = this.clone_array(arguments);
				args.unshift('module')
				return this.has.apply(this, args);
			};


			this.cr = function() {
				var args = this.clone_array(arguments);
				args.unshift('class')
				return this.has.apply(this, args);
			};


			this.has_class = function() {
				var args = this.clone_array(arguments);
				args.unshift('class')
				return this.has.apply(this, args);
			};


			this.wcr = function() {
				var args = this.clone_array(arguments);
				args.unshift('class')
				return this.wait_for.apply(this, args);
			};


			this.wi = function() {
				var args = this.clone_array(arguments);
				args.unshift('module')
				return this.wait_for.apply(this, args);
			};


			internal = new internal();
		};
	}();


	/** Safe dump data into console. Takes any number of any arguments
	 * @param mixed any
	 * @return void
	 */
	var v = function()
	{
		if (typeof console != 'undefined' && ((pwf.status('config') && pwf.config.get('debug.frontend')) || !pwf.status('config'))) {
			var args = pwf.clone_array(arguments);

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
