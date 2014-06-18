pwf.rc('caller', {
	'parents':['container'],

	'public':{
		'respond':function(proto, name, args) {
			var cb = typeof name == 'function' ? name:this.get(name);

			if (typeof cb == 'function') {
				if (typeof args != 'object' || typeof args.length == 'undefined') {
					if (typeof args == 'undefined') {
						args = [];
					} else {
						args = [args];
					}
				}

				return cb.apply(this, args);
			}

			return null;
		}
	}
});
