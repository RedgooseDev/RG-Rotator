Object.size = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

/**
 * Rotator class
 *
 * @Param {DOM} $el : container element
 * @Param {Object} options
 * @Return void
 */
function Rotator($el, options)
{
	// ..
}
