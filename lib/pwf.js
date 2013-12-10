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


	return new function()
	{
		var
			/** Status of all registered modules */
			module_status = {};

			/** Reference to this object accessible from inside this function */
			self = this,

			/** Queue for modules that are registered but could not be initialized yet */
			init_later = [],

			/** List of modules that have std scan method */
			init_scan  = [],

			/** Queue for callbacks that will be run on run_callbacks */
			callbacks  = {
				'ready':[],
				'initialized':[]
			};


		this.callbacks = {};


		/** Callback for mondays */
		var callback_void = function(e)
		{
			callback_stop(e);
			callback_prevent(e);
			return e;
		};


		/** Prevent event from beiing noticed */
		var callback_prevent = function(e)
		{
			e.preventDefault();
		};


		/** Callback for mondays */
		var callback_stop = function(e)
		{
			e.stopPropagation();
		};


		this.callbacks.void    = callback_void;
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
		 * @return void
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
			} else throw new Error('Cannot overwrite module "' + name + '"');

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
						obj.init_remaining();
					};
				}(this, module_status, module));
			}

			return this
				.run_callbacks()
				.init_remaining();
		};


		/** Check if dependencies of all modules that were not initialized yet are met and if so, initialize them
		 * @return void
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


		/** Run lambda callback when listed modules are ready
		 * @param Object   modules List (array) of module names (string)
		 * @param function lambda     Callback to call when ready
		 * @param Object   args       Arguments to pass to lambda
		 * @return void
		 */
		this.when = function(modules, status, lambda, args)
		{
			if (this['modules_' + status](modules)) {
				lambda(args);
			} else callbacks[status].push([modules, lambda, args]);
		};


		/** Check if dependencies for callbacks from when_ready() are met and run them if so.
		 * @return void
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


		/** Shortcut for modules_initialized
		 */
		this.mi = function(comps)
		{
			return this.modules_initialized(comps);
		};


		/** Shortcut for modules_ready
		 */
		this.mr = function(comps)
		{
			return this.modules_ready(comps);
		};


		/** Shortcut for when_initialized
		 */
		this.wi = function(comps, lambda, args)
		{
			return this.when(comps, 'initialized', lambda, args);
		};


		/** Shortcut for when_ready
		 */
		this.wr = function(comps, lambda, args)
		{
			return this.when(comps, 'ready', lambda, args);
		};


		/** Get status of module
		 * @return undefined|bool
		 */
		this.status = function(name)
		{
			return module_status[name];
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
