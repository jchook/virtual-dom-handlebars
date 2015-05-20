module.exports = VTree;

var extend = require('./extend');

// Array of VText, VNode, and Block Expressions
function VTree(body, config) {
	var i;
	config = extend({ allowJSON: false }, config);
	Object.defineProperty(this, 'config', { enumerable: false, value: config });
	if (body && body.length) {
		for (i=0; i<body.length; i++) {
			this.push(body[i]);
		}
	}
}
VTree.prototype = new Array();
VTree.prototype.toJavascript = function() {
	var rack = [], current = [], text = [], i;
	for (i=0; i<this.length; i++) {

		// Skip null
		if (typeof this[i] === 'undefined') {}

		// toJavascript nodes
		else if (typeof this[i].toJavascript === 'function') {
			rack.push(this[i].toJavascript());
		} 
		
		// Random javascript values?
		else if (this.config.allowJSON) {
			rack.push(JSON.stringify(this[i]));
		} 

		// Forbidden
		else {
			throw new Error('Illegal value in VTree: ' + JSON.stringify(this[i]));
		}
	}

	// Javascript
	if (rack.length == 0) {
		return '[]';
	} else {
		return '[].concat(' + rack.join(',') + ')';
	}
};