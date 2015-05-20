module.exports = Block;

function Block(expr, yield) {
	this.expr = expr;
	this.yield = yield;
}

// Rabbit hole. C'mon Alice, drink up :)
Block.prototype.toJavascript = function() {
	return this.expr.toJavascript(this.yield);
};