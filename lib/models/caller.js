pwf.rc('caller', {
	'parents':['container'],

	'public':{
		'respond':function(proto, name, args)
		{
			var cb = typeof name == 'function' ? name:this.get(name);

			if (typeof cb == 'function') {
				return cb.apply(this, args);
			}

			return null;
		}
	}
});
