module.exports = VText;

var extend = require('./extend');

// Simplest node, only text
function VText(text, config) {
	this.virtual = true;
	extend(this, config);

	// Non-overridable
	this.text = [].concat(text);
	this.textOnly = true;
	this.simple = true;
}

function _textElementToJavascript(ele) {
	return (ele && ele.toJavascript) ? ele.toJavascript() : JSON.stringify(ele);
}

VText.prototype.addText = function(text) {
	this.text = this.text.concat(text);
}

VText.prototype.toJavascript = function() {
	// Ah the old days when things were simple
	// return JSON.stringify(this.text);
	
	var textJs = '';
	
	if (this.text.length == 0) {
		textJs = "''";
	} else if (this.text.length == 1) {
		textJs = _textElementToJavascript(this.text[0]);
	} else {
		textJs = [];
		for (i=0; i<this.text.length; i++) {
			textJs.push(_textElementToJavascript(this.text[i]));
		}
		textJs = '[].concat(' + textJs.join(',') + ').join(\'\')';
	}

	// use of h() is more portable and VASTLY simpler
	// return this.virtual ? 'new VText(' + textJs + ')' : textJs;

	return textJs;
};