pwf.rc({
	'name':'el.abs',
	'parents':['domel'],

	'storage':{
		'opts':{
			'center_horizontal':true,
			'center_vertical':true,
			'center_scroll':true,
		}
	},


	'public':{
		'get_center':function(proto, center_scroll)
		{
			return pwf.get_class(this.meta.cname).static.get_center(this.get_el(), this.get('parent'), center_scroll);
		},


		'center':function(proto, center_scroll)
		{
			this.get_el().css(this.get_center(center_scroll));

			proto('centered');
			return this;
		}
	},


	'static':{
		'get_center':function(el, parent, center_scroll)
		{
			var parent = typeof parent == 'undefined' ? el.parent():parent;

			if (center_scroll === true) {
				parent = pwf.jquery(window);

				center = {
					'left':Math.round((parent.width() - el.outerWidth())/2) + parent.scrollLeft(),
					'top':Math.round((parent.height() - el.outerHeight())/2) + parent.scrollTop()
				};
			} else {
				center = {
					'left':Math.round((parent.outerWidth() - el.outerWidth())/2),
					'top':Math.round((parent.outerHeight() - el.outerHeight())/2)
				};
			}

			return center;
		}
	}
});
