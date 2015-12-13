define(['jquery'], function() {
	/*
	 * ios 7 clarity with jqm compatility layer
	 */
	$(function() {
		/**
		 * top-navigation bar
		 */
		$("[data-rel='top-bar-back']").addClass("top-bar-link left icon-back");
		$("[data-rel='top-bar-button']").addClass("top-bar-link right");
		$("[data-role='content']").addClass("top-bar-content-offset");

		/* remove jqm button classes */

		//.content.ui-btn, .content.ui-btn-hidden, .content.ui-submit, .content.ui-shadow, .content.ui-btn-corner-all
		/*
		 * bottom navigation bar
		 */
		$("[data-role='page']").on("pageshow", function() {
			$("[data-rel='bottom-bar']").addClass("bottom-bar-offset");
			$("[data-rel='bottom-bar-no-offset']").addClass("bottom-bar-no-offset");
		});

		/**
		 * click handler for back buttons
		 */
		$("[data-rel='top-bar-back']").click(function() {
			history.back();
			return false;
		});

		// utility stuff
		$.fn.hasAttr = function(name) {
			return this.attr(name) !== undefined;
		};
	});
});
