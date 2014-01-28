# pwf.js

Javascript container for writing modules and loading them asynchronously based on simple dependency system.


## Example of use

```javascript
pwf.register('example', function() {
	this.is_ready = function(){
		return pwf.wi(['dep']);
	};
	
	
	this.init = function() {
		alert('example initialized');
	};
});


pwf.register('dep', function() {
	var some_local_variable = null;
	
	this.is_ready = function() {
		return 1 + 1 == 2;
	};

	
	var some_local_method = function() {
		return some_local_variable;
	};
	
	
	this.some_priviledged_method = function() {
		// Returns instance of dep module registered in pwf
		return this;
	};
});
```

## Methods

### pwf#register(name, module, create_instance=true)
Register a module inside pwf container

```javascript
pwf.register('example', function() {
	this.alert = function()
	{
		alert("I'm here");
	};
});
```

This will make instance of module example be inside pwf. You can call its' methods then.
```javascript
	pwf.example.alert()
```

If you set third parameter create_instance to false, pwf will not attempt to create instance out of the module, but register it anyway.

### pwf#scan(el)
Call module.scan(el) for all modules that have this method. Scan method is used in pwf modules to search for selectors and bind some methods if selector is found. For example pwf-decorator uses this.

```javascript
pwf.register('scan_example', function() {
	this.scan = function(el) 
	{
		console.log("Look, I'm scanning " + el.prop("tagName"));
	};
});

pwf.scan(pwf.jquery('body'));
```

We've told pwf to scan body. Why does jquery have to be contained inside pwf? See pwf-jquery-compat.


### pwf#mi(modules)
This is shortcut for pwf#modules_initialized. Checks if a list of modules has reached successful initialization. Returns bool.

```javascript
pwf.mi(['foo', 'bar');
```

### pwf#mr(modules)
Shortcut for pwf#modules_ready

```javascript
pwf.mr(['foo', 'bar');
```

### pwf#wi(modules, lambda, args)
Shortcut for pwf#when(modules, 'ready', lambda, args). Calls lambda when list of modules reaches successful initialization. Args are passed as first argument if defined.

```javascript
pwf.wi(['foo', 'bar', function(where) {
	alert("This readme is located on" + where);
}, 'github');

pwf.register('foo', function() {});

setTimeout(function() {
	pwf.register('bar', function() {});
}, 2500);

// After two and a half of second, alert should pop out
```

### pwf#init(name)
Called internaly. Initializes module by name. This method checks if module has method init. If so, it runs it. Otherwise the module is marked as initialized.


### pwf#init_remaining()
Initialize modules that are waiting in the queue


### pwf#remove_late_init(name)
Forget about initializing module


### pwf#get_scan_list()
Returns list of modules that have method scan


### pwf#when(modules, status, lambda, args)
Runs lambda callback when listed modules reach given status


### pwf#run_callbacks()
Check if all waiting callbacks have met their dependencies already


### pwf#module_exists(module)
Check if this module is registered


### pwf#module_ready(module)
Check if this module has reached status ready


### pwf#modules_ready(modules)
Check if these modules have reached status ready


### pwf#module_initialized(module)
Check if this module has been initialized


### pwf#modules_initialized(module)
Check if these modules have been initialized

