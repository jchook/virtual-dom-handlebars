module.exports = function(target, more) {
	if (target && more) for (i in more) if (more.hasOwnProperty(i)) target[i] = more[i];
	return target;
};