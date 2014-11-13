pwf.reg_class('caller', {
	'parents':['container'],

	'public':{
		'respond':function(p, name, args)
		{
			var cb = typeof name == 'function' ? name:this.get(name);

			if (typeof cb == 'function') {
				if (!(args instanceof Array)) {
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
