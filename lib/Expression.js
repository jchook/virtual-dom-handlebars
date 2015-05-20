module.exports = Expression;

var 
	Context = require('./Context'),
	extend = require('./extend')
;

// Expression formats:
// 	helper context [args]
// 	#blockHelper context [args]
//  #context
// 	context

function Expression(expr, config) {

	// Properties
	this.helper = null;
	this.context = null;
	this.escaped = null;
	this.args = null;
	this.yield = null;

	// Parse & config
	extend(this, Expression.parse(expr));
	extend(this, config);

	// Unless otherwise specified, blocks are not textOnly
	if ((typeof this.textOnly) === 'undefined') {
		this.textOnly = !this.isBlock;
	}
}

String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function readValue(text, start) {
	var chr = text[start], value, regex = ' ';
	if ((chr == '"') || (chr == "'")) {
		return chr + readUntil(text, start + chr.length, chr) + chr;
	} else {
		return readUntil(text, start, regex).trim();
	}
}

function readUntil(text, start, endStr) {
	var closer = start;

	// allow escape char
	do { closer = text.indexOf(endStr, closer); } 
	while (closer > 0 && (text[closer - 1] == '\\'));

	// read the whole string if endStr is missing?
	if (closer < 0) {
		return text.substr(start);
		// throw new Error('Missing delimiter ' + endStr + ' near ' + text.substr(start, 10));
	}

	return text.substr(start, closer - start);
}

// Convert a Handlebars context var reference into javascript
function compileContextVar(value) {
	return (new Context(value)).toJavascript();
};

function noop(){}

Expression.delimited = function(expr) {
	// var escaped = (expr[2] !== '{');
	// working here on supporting {{{no-escape}}}
	return new Expression(expr.substr(2, (expr.length - 4)));
};

Expression.parseInterpolated = function(text, callbacks) {
	var opener, closer, cursor = 0, expr, js = [], str;

	// defaults
	callbacks = extend({ 
		ontext: noop, 
		onexpression: noop 
	}, callbacks);

	// loop
	while ((opener = text.indexOf('{{', cursor)) > -1) {

		// match closing delimiter
		if (!((closer = text.indexOf('}}', opener + 2)) > -1)) {
			throw new Error('Unmatched expression delimiter');
		}

		// pre-text
		if ((opener - cursor) > 0) {
			callbacks.ontext(text.substr(cursor, opener - cursor));
		}

		// extract expression
		expr = new Expression(text.substr(opener + 2, closer - (opener + 2)));
		callbacks.onexpression(expr);

		// advance cursor
		cursor = closer + 2;
	}

	// post-text
	if (cursor < text.length) {
		callbacks.ontext(text.substr(cursor));
	}
};

Expression.parse = function(expr) {
	var 
		args = null,
		context = null,
		helper = '=',
		cursor = 0,
		isBlock = false
	;

	function advanceCursor() {
		if (!(cursor > -1)) return false;
		return (cursor = expr.regexIndexOf(/[^ ]/, cursor)) > -1;
	}

	// helper
	if (helper = readValue(expr, cursor)) {
		cursor += helper.length;
		
		// context
		if (advanceCursor() && (context = readValue(expr, cursor))) {
			cursor += context.length;
			context = context.replace(/,$/, ''); // removing trailing comma

			// args
			if (advanceCursor()) {
				args = expr.substr(cursor);
			}
		}
	}

	// Blocks all start with {{#
	if (helper.substr(0, 1) === '#') {
		isBlock = true;
		helper = helper.substr(1);

		// Moustache sections 
		// Same syntax as Handlebars Blocks
		// https://github.com/wycats/handlebars.js#block-helpers
		if (!context) {
			context = helper;
			helper = '_moustacheSection';
		}
	}

	// If the first value is a variable, assume we want to safe output.
	//
	// We cannot know whether the value is a helper or a variable at compile time..
	// unless we require the compiler script to include the helper registration, OR
	// append a prefix to every context reference, WHICH WOULD COMPELTELY SOLVE IT.
	//
	// In the case of Handlebars, we will know that the reference is a context var
	// if it begins with a period, but this does not cover all cases.
	//
	// One way to bypass the weirdness here is to understand that helpers are designed
	// to operate on a context which is passed to it. One could assume, if there is no
	// context, then it is not a helper call. Stateless helper call should be replaced
	// with a partial.
	//
	if (!context) {
		context = helper;
		helper = '=';
	}

	return {
		isBlock: isBlock,
		helper: helper,
		context: new Context(context),
		args: args || ''
	};
};

Expression.prototype.toJavascript = function(yield) {
	if (this.isBlock && !yield)  {
		throw new Error('Block is missing yield function');
	}
	return ['Vbars.callHelper(', JSON.stringify(this.helper), ',', this.context.toJavascript(), ',{', this.args, '}', (yield ? ',' + yield.toJavascript() : ''), ', this)'].join('');
}