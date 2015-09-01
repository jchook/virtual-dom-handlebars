module.exports = Block;

function Block(expr, callback) {
	this.expr = expr;
	this.callback = callback;
}

// Rabbit hole. C'mon Alice, drink up :)
Block.prototype.toJavascript = function() {
	return this.expr.toJavascript(this.callback);
};