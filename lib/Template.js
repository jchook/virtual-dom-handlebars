/*

Rules:
	* You may not have incomplete html fragments within a handlebars block.
	* You must escape curly braces { and } that appear within handlebars expressions.
	* You may not have handlebars blocks to define a tagName (htmlparser2 will not parse them).

Basic strategy:
	* Snip the outermost handlebars blocks, marking their location
	* Parse the html
		* When you reach text with the snip marker, parse the handlebars block
			* Parsing the handlebars block will create a recursive loop by restarting the parse strategy with its contents
			* the result of the block parser is an eval()albe string- a javascript closure that returns an array of VNodes

Notes:
	* Next need to test to see if the block order is maintained regardless of attribute order
	  In other words, is (new VNode).properties in the same natural order as the html attributes
	  If not, we will need to name the blocks and store them against a key — this is probably a good idea anyway

*/
module.exports = Template;

var 
	// Helpers
	extend = require('./extend'),

	// Local Dependencies
	Block = require('./Block'),
	Expression = require('./Expression'),
	VNode = require('./VNode'),
	VText = require('./VText'),

	// External Dependency
	htmlparser = require('htmlparser2'),

	// I really hate that I have to use this...
	// I am not prepared to write my own html parser
	// at this point in time, so this will work for now
	_blockStub = '!!!------- VTEMPLATE BLOCK '  + _randomString() + ' -------!!!'
;

extend(Template.prototype, {
	appendChild: appendChild,
	appendChildren: appendChildren,
	attributesToJavascript: attributesToJavascript,
	pop: pop,
	push: push,
	reset: reset,
	toJavascript: toJavascript
});

function _randomString(length) {
	var 
		nonce = [],
		alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		l = length || 12,
		i = 0
	;
	for(i; i<l; i++) {
	    nonce.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
	}
	return nonce.join('');
}

function Template(html, config)
{
	// Define var stack = []; ?
	this.newStack = true;

	this.html = '';
	this.type = 'html';
	this.virtual = true;

	// Merge in config
	extend(this, config);

	// Reset the root
	this.reset(html);
}

Template.Runtime = 'Runtime';

// Update the HTML
function reset(html) {
	this.html = html || this.html;
	this.root = new VNode('div');
	this.node = this.root; // current working node
	this.path = []; // current working node parents
	this.blocks = []; // recursive components
}

// Edit the value of the current node
function editNode(index, value) {
	this.node[index] = value;
}

// Add a node to the children of the current node
function appendChild(newNode) {
	this.node.children.push(newNode);
}

function appendChildren(nodes) {
	var i, l;
	for (i = 0, l=nodes.length; i<l; i++) {
		this.appendChild(nodes[i]);
	}
}

// Move cursor to the latest child of the current node
function push() {
	this.path.push(this.node);
	this.node = this.node.children[this.node.children.length - 1];
}

// Move cursor to the parent node of the current node
function pop() {
	if (this.path.length == 0) throw new Error('Unmatched closing HTML tags');
	this.node = this.path.pop();
}

function readExpression(text, start) {
	var closer = text.indexOf('}}', start);
	if (!(closer > -1)) throw new Error('Unmatched expression delimiter');
	return text.substr(start, (closer + 2) - start);
}

// ontext helper for html parsing
// ensure that blocks are handled
function ontext(template, text, config) {
	var
		blockStubPos = -1,
		cursor = 0,
		children = null,
		nodes = []
	;
	
	config = extend({virtual: template.virtual}, config);

	// Ensures that consecutive textOnly components are merged into a single VText node
	function concatText(text) {
		if ((nodes.length > 0) && nodes[nodes.length - 1].addText) {
			nodes[nodes.length - 1].addText(text);
		} else {
			nodes.push(new VText(text, config));
		}
	}

	// DRY parse
	function concatInterpolatedContent(content) {
		Expression.parseInterpolated(content, {
			ontext: function(text) {
				concatText(text);
			},
			onexpression: function(expr) {
				if (expr.textOnly || (config.virtual === false)) {
					concatText(expr);
				} else {
					nodes.push(expr);
				}
			}
		});
	}

	// While we find more interpolated handlebars blocks
	while ((blockStubPos = text.indexOf(_blockStub, cursor)) > -1) {

		// Get pre-text
		if (blockStubPos > cursor) {
			concatInterpolatedContent(text.substr(cursor, blockStubPos - cursor));
		}

		// Add the block to the list of nodes
		block = template.blocks.shift();
		if (config.virtual === false) {
			block.callback.virtual = false;
			concatText(block);
		} else {
			nodes.push(block);
		}

		// Advance the cursor
		cursor = blockStubPos + _blockStub.length;
	}

	// Get post-text (or the only text)
	if (cursor < text.length) {
		concatInterpolatedContent(text.substr(cursor));
	}

	// textOnly is for things like tagName and attribute values
	return nodes;
}

// Not particularly proud of this function.. obv it should probably be
// located in some kind of AttributeList class or something, but as it
// stands, the use of htmlparser2 requires a more 'aware' parser to do
// proper block parsing
function attributesToJavascript(template, attr) {
	var i, value, js = [];
	for (i in attr) {
		if (attr.hasOwnProperty(i)) {

			// Potentially interpolated attributes
			if (typeof attr[i] === 'string') {
				if (attr[i].length > 0) {
					js.push(JSON.stringify(i) + ':' + (ontext(template, attr[i], {virtual: false}).pop() || new VText).toJavascript());
				} else {
					js.push(JSON.stringify(i) + ':""');
				}
			} else {
				js.push(JSON.stringify(i) + ':' + JSON.stringify(attr[i]));
			}
		}
	}

	return '{' + js.join(',') + '}';
};


// Outer function that performs strategy and returns a vtree
function toJavascript() {

	// find each matching pair of handlebars blocks
	var text = this.html;
	var pairs = [];
	var opens = [];
	var opener = -1;
	var closer = -1;
	var cursor = 0;
	var block = '';
	var blocks = [];
	var snipped = '';
	var openexpr = null;
	var closexpr = null;
	var nextopen = null;
	var template = this;
	var i;

	// FIND THE OUTER BLOCKS
	closer = text.indexOf('{{/');
	opener = text.indexOf('{{#');
	nextopen = text.indexOf('{{#', opener + 3);
	while (closer > -1) {
		if ((nextopen > -1) && (closer > nextopen)) {
			opens.push(opener);
			opener = nextopen;
			nextopen = text.indexOf('{{#', nextopen + 3);
		} else {
			if (opens.length == 0) {
				if (opener == -1) {
					throw new Error('Unmatched close block');
				}
				pairs.push([opener, closer]);
			} else {
				opener = opens.pop();
			}
			closer = text.indexOf('{{/', closer + 3);
		}
	}

	// this should never happen
	if (opens.length > 0) {
		throw new Error('Unmatched open block');
	}

	// snip 
	cursor = 0;
	snipped = '';
	for (i=0; i<pairs.length; i++) {
		openexpr = readExpression(text, pairs[i][0]);
		closexpr = readExpression(text, pairs[i][1]);
		snipped += text.substr(cursor, pairs[i][0] - cursor);
		snipped += _blockStub;
		cursor = pairs[i][0] + openexpr.length; // move cursor to the end of the open block tag
		block = text.substr(cursor, pairs[i][1] - cursor);
		this.blocks.push(new Block(Expression.delimited(openexpr), new Template(block, {newStack: false})));
		cursor = pairs[i][1] + closexpr.length; // move cursor to the end of the close block tag
	}
	snipped += text.substr(cursor);
	
	// Parse HTML or Text
	// This is where the blocks are unraveled
	// This is where the text is parseInterpolated
	switch(this.type) {

		// htmlparser2
		case 'html':
			if (!this.parser) {
				this.parser = new htmlparser.Parser({
					// Let's ignore comments for now
					// This does not enable the <!DOCTYPE>
					// oncomment: function(data) {
					// 	template.appendChild(new VText(data));
					// },
					onopentag: function(tagname, attributes){
						// TODO: improve so VNode does not hold attributes as javascript (use Attributes object)
						template.appendChild(new VNode(ontext(template, tagname, {virtual: false}).pop(), attributesToJavascript(template, attributes)));
						template.push();
					},
					ontext: function(text) {
						template.appendChildren(ontext(template, text));
					},
					onclosetag: function(tagname){
						template.pop();
					}
				});
			}
			this.parser.write(snipped);
			break;

		// plaintext
		default:
			ontext(this, snipped);
			break;
	}

	// compile to js
	return [
		'(function(context){',
			this.newStack ? 'var stack = [], env = ' + Template.Runtime + ';' : '',
			'return (function(){',
				'stack.push(this);',
				'var r = ', this.root.children.toJavascript(), ';',
				'stack.pop();',
				'return r;',
			'}).call(context);',
		'})'
	].join('');
}