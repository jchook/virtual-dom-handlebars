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
		return [Vbars.callHelper('each', context.messages, {}, function(message, options){
			return h('div', {className: 'mood-' + message.currentMood}, [
				h('h1', message.title),
				h('p', message.content)
			]);
		})];
	})


## Compile Examples

Output compiled javascript to stdout

	vbars < my-template.hbs

Compile a haml handlebars template to a javascript file

	haml my-template.haml | vbars > my-template.js

Use node to compile your handelbars

	var compile = require('vbars/compile');
	var javascript = compile('<h1>{{title}}</h1><p>{{message}}</p>');
	var template = eval(javascript);
	var vtree = template({ title:'Hello', message:'World' });

Gulp.js

	coming soon...


## Stability

v0.0.1 Experimental


## Roadmap

* Escape output by default
* Add support for `{{> partial}}` and `{{> (subexpression) otherContext}}`
* Add support for `{{else helper context args}}`
* Add support for `{{{no-escape}}}` content
* Add support for `{{! comments }}`


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