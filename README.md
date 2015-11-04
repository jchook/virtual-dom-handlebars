# Virtual DOM Handlebars

Compile [Handlebars](http://handlebarsjs.com/) templates to javascript that returns a [Virtual DOM](https://github.com/Matt-Esch/virtual-dom).

Turn this:

	{{#each messages}}
		<div class="mood-{{currentMood}}">
			<h1>{{title}}</h1>
			<p>{{content}}</p>
		</div>
	{{/each}}

into (essentially) this:

	(function(context) {
		return [Runtime.callHelper('each', context.messages, {}, function(context, options){
			return h('div', {className: 'mood-' + context.currentMood}, [
				h('h1', context.title),
				h('p', context.content)
			]);
		})];
	})


## Implementation

The end-game is a set of javascript (.js) files that define functions that return a virtual-dom tree
dictated by the corresponding handlebars template (and a provided context). First install.

	npm install --save virtual-dom-handlebars virtual-dom

Compiled templates assume both a virtual-hyperscript `h()` function and a virtual-dom-handlebars `Runtime`
are defined. See an [example gulpfile.js](https://github.com/jchook/gulp-virtual-dom-handlebars) to learn how
to automate this file header.

	var Runtime = require('virtual-dom-handlebars');
	var h = require('virtual-dom');

Assign compiled templates (they're functions) to variables and call them to generate a virtual-dom tree.

	var templates = [
		index: require('templates/compiled/index.js'),
		login: require('templates/compiled/login.js')
	];


## Compile Examples

**Output compiled javascript to stdout**

	vbars < my-template.hbs

**Compile a haml handlebars template to a javascript file**

	haml my-template.haml | vbars > my-template.js

**Compile your handlebars with node**

	var compile = require('virtual-dom-handlebars/compile');
	var javascript = compile('<h1>{{title}}</h1><p>{{message}}</p>');

**Gulp.js**

See [gulp-virtual-dom-handlebars](https://github.com/jchook/gulp-virtual-dom-handlebars).


## Stability

Experimental


## Roadmap

* Escape output by default
* HTML attribute style arguments
* Add support for `{{> (subexpression) otherContext}}`
* Add support for `{{else helper context args}}`
* Add support for `{{{no-escape}}}` content
* Add support for `{{! comments }}`


## Changelog

### v0.0.2 Partials!

Support for [partials](http://handlebarsjs.com/partials.html) with the format `{{> partialName [context] [args] }}`.


### v0.0.1 Initial Release


## Dependencies

* [htmlparser2](https://github.com/fb55/htmlparser2)

## Also See

* [HTMLBars](https://github.com/tildeio/htmlbars)
* [haml-coffee](https://github.com/netzpirat/haml-coffee)
* [haml-js](https://github.com/creationix/haml-js)
* [html-to-vdom](https://github.com/TimBeyer/html-to-vdom)
* [vdom-virtualize](https://github.com/marcelklehr/vdom-virtualize)
* [html-virutalize](https://github.com/alexmingoia/html-virtualize)
* [virtual-dom-stringify](https://github.com/alexmingoia/virtual-dom-stringify)
* [handlebars-html-parser](https://github.com/stevenvachon/handlebars-html-parser)
* [Watch.JS](https://github.com/melanke/Watch.JS)
