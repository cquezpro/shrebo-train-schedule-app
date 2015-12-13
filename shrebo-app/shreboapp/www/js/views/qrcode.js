define(['backbone', 'util'], function($B, util) {
	var ScanQRCodeView = $B.View.extend({
		events : {
			//"click .list-row": "selectShareable",
			"click .row" : "selectShareable",
			"submit form" : "search",
		},
		initialize : function() {
			if (this.collection) {
				this.collection.bind("change", this.modelChanged, this);
			}
		},
		render : function() {
			this.startScan();
		},
		renderResults : function() {
			this.startScan();
		},
		modelChanged : function() {

		},
		close : function() {
			this.remove();
			this.unbind();
			if (this.collection) {
				this.collection.unbind("change", this.modelChanged);
			}
		},
		// functionality
		/**
		 * Start the scan via barcode scanner. Will parse results
		 * using this.processScanResult. See latter for details on
		 * the events triggered. 
		 */
		startScan : function() {
			var view = this;
			if (util.isSimulator()) {
				// actual device -- process the scan result
				cordova.plugins.barcodeScanner.scan(function(result) {
					// success
					view.processScanResult(result);
				}, function() {
					// fail
					view.trigger('scan_fail', 'Scanning failed -- not a valid code or camera failure');
				});
			} else {
				// simluator -- simulate scan result 
				navigator.notification.alert("SIMULATOR: Assuming successful scan", function() {
				}, 'Shrebo', 'OK');
				var shareable = app.session.shareables.at(0);
				view.processScanResult({
					format : "QR_CODE",
					text : "http://www.shrebo.ch/reservation/add/{0}".format([shareable ? shareable.get('id') : '14'])
				});
			}
		},
		// process result of scan. triggers events:
		// scan_shareable => function(shareable)
		// scan_failed => function(error)
		// @param result as returned by BarcodeScanner plugin
		// @return null (triggers events)
		processScanResult : function(result) {
			var view = this;
			if (!result.cancelled) {
				// parse the scan data
				var resource_id = view.parseScanResult(result);
				// if a valid URL and shareable id has been found, see
				// if we can retrieve the shareable.
				if (resource_id) {
					var shareable = new app.session.shareables.model({
						id : resource_id
					});
					var result = shareable.fetch();
					result.done(function() {
						view.trigger('scan_shareable', shareable);
					});
					result.fail(function() {
						view.trigger('scan_fail', 'Could not retrieve resource id=' + resource_id);
					});
				} else {
					view.trigger('scan_fail', 'Scanning failed -- no valid id found');
				};
			} else {
				// cancelled
				view.trigger('scan_fail', 'Scanning was cancelled.');
			}
		},
		/**
		 * parse the result of the scan. returns the id of the shareable from
		 * the URL scanned. the URL format is expected as
		 * 
		 * http://valid-domain.com/reservation/add/<id>/
		 * 
		 * @param  result as returned by BarcodeScanner plugin
		 * @return <id>
		 */
		parseScanResult : function(result) {
			if (result.format == "QR_CODE") {
				if (util.validUrl(result.text)) {
					var match = result.text.match("reservation/add/(\.+)/?$");
					if (match && match.length > 0) {
						return match[1];
					} // if match
				} // if validUrl
			}// if QR_CODE
			return null;
		}
	});
	return ScanQRCodeView;
});
