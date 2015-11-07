var

	// Template (compile time)
	Template = require('./lib/Template'),
	
	// Handlebars polyfill
	Runtime = require('./lib/Runtime'),
	
	// VDOM (Thanks Matt Esch!!)
	h = require('virtual-dom/h'),
	
	// Utility
	_ = require('lodash'),
	colors = require('colors'),
	util = require('util'),

	// Counters
	passed = 0,
	failed = 0,
	
	// Local vars
	html, context, name
;

// Mostly because I like colors
function compare(a, b) {
	return _.isEqual(a, b);
}
function compile(handlebarsString) {
	return eval(compileToString(handlebarsString));
}
function compileToString(handlebarsString) {
	return (new Template(handlebarsString)).toJavascript();
}
function inspect(obj, config) {
	config = _.extend({depth: null}, config);
	console.log(util.inspect(obj, config));
	return obj;
}
function test(name, condition) {
	var result = (condition ? (passed++, 'pass'.green) : (failed++, 'fail'.red)) + "|" + name.cyan;
	console.log(result);
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
	[h('div', {id:'task-5', className:'type-daily'}, 'Make Bed')]
));

test('block interpolated in argument values', compare(
	compile('<div id="task-{{id}}" class="test {{#each types}}type-{{this}} {{/each}}">{{message}}</div>')({id:5, types:['daily', 'morning'], message: 'Make Bed'}),
	[h('div', {id:'task-5', className:'test type-daily type-morning '}, 'Make Bed')]
));

test('variable interpolated in tag names', compare(
	compile('<{{tagname}} class="test">Hello World</{{tagname}}>')({tagname: 'div'}),
	[h('div', {className:'test'}, 'Hello World')]
));

// This can never be supported with htmlparser2
// test('block interpolated in tag names', compare(
// 	compile('<{{#if tagname}}{{tagname}}{{/if}} class="test">Hello World</{{tagname}}>')({tagname: 'div'}),
// 	[new VNode('div', {className:'test'}, [new VText('Hello World')])]
// ));

test('handlebars section object', compare(
	compile('{{#person}}{{name}}{{/person}}')({person:{name:'Douglas Hofstadter'}}),
	['Douglas Hofstadter']
));

test('handlebars section array', compare(
	compile('{{#people}}<person>{{name}}</person>{{/people}}')({ people:[{name:'Douglas Hofstadter'}, {name:'Bertrand Russell'}, {name:'Alfred North Whitehead'}] }),
	[h('person', 'Douglas Hofstadter'), h('person', 'Bertrand Russell'), h('person','Alfred North Whitehead')]
));

// Partial
Runtime.registerPartial('user', function(context){
	return [h('h1', context.name), h('p', context.bio), h('hr')];
});
test('partial', compare(
	compile('{{#users}}{{> user}}{{/users}}')({users: [{name:'Wes', bio:'Music. Design. Code. Repeat.'}, {name:'Michael', bio:'Cooking with robots.'}]}),
	[h('h1', 'Wes'), h('p', 'Music. Design. Code. Repeat.'), h('hr'), h('h1', 'Michael'), h('p', 'Cooking with robots.'), h('hr')]
))

// Dynamic context
test('dynamic context', compare(
	compile('{{myFunction}}')({myFunction:function(){return 'test';}}),
	['test']
));

test('dynamic context w/ moustache section', compare(
	compile('{{#users}}{{name}}{{/users}}')({users:function(){ return [{name:'Wes'}, {name:'Pete'}]}}),
	['Wes', 'Pete']
));

test('dynamic context w/ each helper', compare(
	compile('{{#each users}}{{name}}{{/each}}')({users:function(){ return [{name:'Wes'}, {name:'Pete'}]}}),
	['Wes', 'Pete']
));

console.log("Passed: " + ("" + passed).green, "| Failed: " + ("" + failed)[failed > 0 ? "red" : "green"]);