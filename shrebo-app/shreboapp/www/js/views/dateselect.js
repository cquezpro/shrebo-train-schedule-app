define([], function() {
	var DateSelector = function() {
		this.initialize();
	};
	
	
	DateSelector.prototype.initialize = function(modelProp, container, options) {
		this.mobiscroll = mobiscroll.calendar(modelProp, container, options, true);
	};
	
	/* fails uglificatoin
	DateSelector.prototype.setOptions = function(options) {
		this.mobiscroll.
	}
	*/
	
	return DataSelector;
});
