var

	// Template (compile time)
	Template = require('./lib/Template'),
	
	// VBars (runtime)
	Vbars = require('./lib/Runtime'),
	
	// VDOM (Thanks Matt Esch!!)
	h = require('virtual-dom/h'),
	
	// Utility
	_ = require('lodash'),
	colors = require('colors'),
	util = require('util'),
	
	// Local vars
	html, context, name
;

// Mostly because I like colors
function compare(a, b) {
	return _.isEqual(a, b);
}
function compile(handlebars) {
	return eval(compileToString(handlebars));
}
function compileToString(handlebars) {
	return (new Template(handlebars)).toJavascript();
}
function inspect(obj, config) {
	config = _.extend({depth: null}, config);
	console.log(util.inspect(obj, config));
	return obj;
}
function test(name, condition) {
	console.log(condition ? 'pass'.green : 'fail'.red, "|", name);
}


// LET THE TESTS BEGIN!


test('this keyword', compare(
	compile('{{this}}')
	('Hello World'),
	[ 'Hello World' ]
));

test('simple interpolated expression', compare(
	compile('Hello, {{name}}')
	({ name: "World" }),
	[ 'Hello, World' ]
));

test('two interpolated expressions', compare(
	compile('Well, {{firstWord}} {{secondWord}}!')
	({ firstWord: 'Hello', secondWord: "World" }),
	[ 'Well, Hello World!' ]
));

test('simple html node', compare(
	compile('<h1>Hello World</h1>')({}),
	[ h('h1', 'Hello World') ]
));

name = 'block with interpolated strings and args';
context = { name: 'World', messages: ['Foo', 'Bar'] };
html = ''
	+ '<body>'
		+ '{{#each messages, magic: true}}'
			+ '<p>I have a message: {{./}} [END OF MESSAGE]</p>'
		+ '{{/each}}'
	+ '</body>';
test(name, compare(
	compile(html)(context),
	[h('body', [
		h('p', 'I have a message: Foo [END OF MESSAGE]'),
		h('p', 'I have a message: Bar [END OF MESSAGE]')
	])]
));


name = 'block with reference to parent context';
context = { name: 'World', messages: ['Foo', 'Bar'] };
html = ''
	+ '<body>'
		+ '{{#each messages, magic: true}}'
			+ '<p>I have a message: {{../name}} [END OF MESSAGE]</p>'
		+ '{{/each}}'
	+ '</body>';
test(name, compare(
	compile(html)(context),
	[h('body', [
		h('p', 'I have a message: World [END OF MESSAGE]'),
		h('p', 'I have a message: World [END OF MESSAGE]')
	])]
));


name = 'block with reference to a parent\'s parent context';
context = {
	name: 'John Smith', 
	tasks: [
		{id: 1, title: 'Travel to the Northern Neck', subtasks: []},
		{id: 2, title: 'Retrieve the snakebite Antidote', subtasks: [
			{id: 3, title: 'Name the river Antidote River'}
		]}
	]
};
html = ''
	+ '<body>'
		+ '<ul>'
			+ '{{#each tasks}}'
				+ '<li>'
					+ '{{title}}'
					+ '{{#if subtasks}}'
						+ '<ul>'
							+ '{{#each ./}}'
								+ '<li>{{../../../name}}: {{title}}</li>'
							+ '{{/each}}'
						+ '</ul>'
					+ '{{/if}}'
				+ '</li>'
			+ '{{/each}}'
		+ '</ul>'
	+ '</body>';
test(name, compare(
	compile(html)(context),
	[h('body', [
		h('ul', [
			h('li', 'Travel to the Northern Neck'),
			h('li', [
				'Retrieve the snakebite Antidote',
				h('ul', [
					h('li', 'John Smith: Name the river Antidote River')
				])
			])
		]),
	])]
));


test('variable interpolated in argument values', compare(
	compile('<div id="task-{{id}}" class="type-{{type}}">{{message}}</div>')({id:5, type:'daily', message: 'Make Bed'}),
	[h('div', {id:'task-5', 'class':'type-daily'}, 'Make Bed')]
));

test('block interpolated in argument values', compare(
	compile('<div id="task-{{id}}" class="test {{#each types}}type-{{this}} {{/each}}">{{message}}</div>')({id:5, types:['daily', 'morning'], message: 'Make Bed'}),
	[h('div', {id:'task-5', 'class':'test type-daily type-morning '}, 'Make Bed')]
));

test('variable interpolated in tag names', compare(
	compile('<{{tagname}} class="test">Hello World</{{tagname}}>')({tagname: 'div'}),
	[h('div', {'class':'test'}, 'Hello World')]
));

// This can never be supported with htmlparser2
// test('block interpolated in tag names', compare(
// 	compile('<{{#if tagname}}{{tagname}}{{/if}} class="test">Hello World</{{tagname}}>')({tagname: 'div'}),
// 	[new VNode('div', {'class':'test'}, [new VText('Hello World')])]
// ));

test('handlebars section object', compare(
	compile('{{#person}}{{name}}{{/person}}')({person:{name:'Douglas Hofstadter'}}),
	['Douglas Hofstadter']
));

test('handlebars section array', compare(
	compile('{{#people}}<person>{{name}}</person>{{/people}}')({ people:[{name:'Douglas Hofstadter'}, {name:'Bertrand Russell'}, {name:'Alfred North Whitehead'}] }),
	[h('person', 'Douglas Hofstadter'), h('person', 'Bertrand Russell'), h('person','Alfred North Whitehead')]
));