module.exports = VNode;

var
	VTree = require('./VTree')
;

// Node that can have children
function VNode(tagName, attributes, children) {
	this.simple = true;
	this.tagName = tagName; // non-virtual VText
	this.attributes = attributes; // javascript
	this.children = new VTree(children);
}

function _tagNameToJavascript(ele) {
	return (ele && ele.toJavascript) ? ele.toJavascript() : JSON.stringify(ele);
}

VNode.prototype.toJavascript = function() {
	// use of h() is more portable and VASTLY simpler
	// return 'new VNode(' + [this.tagName.toJavascript(), this.attributes, this.children.toJavascript()].join(',') + ')';
	return 'h(' + [this.tagName.toJavascript(), this.attributes, this.children.toJavascript()].join(',') + ')';
};
VNode.prototype.appendChild = function(obj) {
	this.children.push(obj);
};