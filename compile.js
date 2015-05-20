var Template = require('./lib/Template');

// Compile Handlebars to Javascript
module.exports = function(handlebars){ 
	return new Template(handlebars).toJavascript();
};