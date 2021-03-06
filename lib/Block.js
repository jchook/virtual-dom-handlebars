module.exports = Block;

function Block(expr, callback) {
	this.expr = expr;
	this.callback = callback;
}

Block.prototype.toJavascript = function() {
	return this.expr.toJavascript(this.callback);
};