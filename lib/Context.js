module.exports = Context;

var extend = require('./extend');

function Context(expr) {
	this.expr = expr;
	this.depth = 0;
	this.extra = '';
	extend(this, parse(expr || ''));
}

function parse(expr) {
	var r = {depth:1, extra:''}, regExpResult;

	// ./ is assumed
	// Context should not be ambiguous
	expr = expr.replace(/^\.$/, '').replace(/^\.\//, '').replace(/^this\.?/, '');

	// Determine stack depth
	regExpResult = /^(\.\.\/)+/.exec(expr);

	// If Depth is explicit...
	if (regExpResult && regExpResult[0]) {
		r.depth = (regExpResult[0].length / 3) + 1;
		r.extra = expr.substr(regExpResult[0].length);
	} else {
		r.extra = expr;
	}

	return r;
};

Context.prototype.toJavascript = function() {
	return ['stack[stack.length - ', this.depth, ']', this.extra ? '.' : '', this.extra].join('');
};