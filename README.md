[![Build Status](https://api.travis-ci.org/just-paja/pwf.js.png)](https://travis-ci.org/just-paja/pwf.js)

# pwf.js

Javascript container for writing modules and loading them asynchronously based on simple dependency system.


## Examples

### Modules

Modules are singleton objects capable of async waiting for dependencies.

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

### Classes

Classes are object that support inheritance from multiple parents and a sort of private variables and methods. Class waits for its' parents to become accessible.

```javascript
pwf.rc('class_name', {

	// This class will be extended by methods of these classes
	'parents':['ancestor1', 'ancestor2'],

	// All members of 'public' will be publicly visible. Methods will be passed
	// proto-caller object as first argument
	'public':{
		'public_method':function(proto, first_argument) {
			return proto('protected_method', first_argument);
		}
	},

	// All members of 'proto' will be visible only from inside. They are called
	// using proto-caller. Methods will be passed proto-caller object as
	// first argument
	'proto':{
		'protected_method':function(proto, first_argument) {
			return {
				'arg':first_argument,
				'from_storage':proto.storage.var_in_storage
			};
		}
	},

	// All members of 'static' will be public, but accessible only from class
	// definition. Try obj.meta.static or pwf.get_class('class_name')
	'static':{
		'some_value':42
	},

	// All members of 'storage' are accessible via proto-caller only.
	'storage':{
		'var_in_storage':'saved-in-storage'
	},

	// This will be appended to init chain. Inits of all ancestors are called
	// in order after creating object via pwf.create.
	// All arguments from constructor are passed.
	'init':function(proto, arg1) {
		console.log(arg1);
	},
});

var obj = pwf.create('class_name', 'value-for-arg1');
console.log(obj.public_method('first-arg'));
```


## Methods


### pwf#rc(name, def)
Register class inside pwf container. See example above.


### pwf#merge(deep, obj1, obj2, obj3, ..)
Merge objects into a new one. If deep is passed as true, all subobjects will be cloned.


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


### pwf#list_scope(str)
Get list of names of classes in passed scope


### pwf#has_class(str)
Is class ready for use?


```javascript
	pwf.list_scope('el.');
	// returns [ ... ]
```


# Objects

## container
Object designed to store and serve data from object storage. All public data are stored in ```storage.opts```.

### Container init
Init accepts arg_data as first argument. It is passed to [get_attrs](#get_attrs)

### Public methods

#### get(name)
Returns value stored inside object by ```name```

#### set(name, value)
Saves ```value``` under ```name``` inside object

#### update(arg_data)
Merge stored data with plain object ```arg_data```.

#### get_attrs
Returns all data stored in object.


## domel
Object designed to connect DOM and data operations. It uses jQuery.

### Attributes

#### tag
Tagname for created domel tag in DOM.

##### Default: ```'div'```


#### parent
Parent to append to during init

##### Default: ```null```


### Domel init
Inherits from [container](#container). After object creation jQuery object is created and saved ```storage.el```, [tag attr][#tag] is used as tagname. All parent classes of object instance are added as CSS class and if [parent attribute](#parent) is passed, [append](#appendparent) is called.

### Public methods

#### append(parent)
Append object to ```parent```. Accepts jQuery reference object as first argument. Calls protected methods ```el_attached``` and ```el_bind``` after appending. These methods are undefined by default.

#### remove
Remove object from DOM. Calls protected methods ```el_removed``` and ```el_unbind``` after removing. These methods are undefined by default.

#### add_el(name, el)
Reference ```el``` as ```name``` to ```storage.el```.

#### divs(list, prefix)
Create and reference divs from ```list``` using [create_divs](https://github.com/just-paja/pwf-jquery-compat#create_divs) on ```storage.el```

#### get_el(name)
Get element referenced to ```storage.el``` named ```name```


## caller
Object designed to simplify calling callbacks. Inherits from [container](#container).

### Public methods

#### respond(name, args)
If ```name``` is string, gets ```name``` attr by [containers' get](#getname) method. If ```name``` is function, it is used directly. If function is resolved, it is called in context of this object instance and arguments ```args``` are passed to it.

Example
```
object.respond('on_ready', [null, 'success']);
```


