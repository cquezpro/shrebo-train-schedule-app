define(['backbone', 'settings', 'datejs'], function($B, settings, xDate) {
	var TrainConnection = $B.Model.extend({
		urlRoot : settings.trainApiUri + '/connection/',
		asFilter : 'connection',
		// return attributes in JavaScript format
		parse : function(data, options) {
			// parse server response to convert
			// dates given as ISO strings (yyyy-mm-ddThh:mm)
			// into javascript objects
			data.arrival = new Date(xDate.parse(data.arrival));
			data.departure = new Date(xDate.parse(data.departure));
			return data;
		},
		/**
		 * return the time format for display given a
		 * connection. This renders the departure and
		 * arrival attributes of a connection into
		 * HH:MM-HH.MM format 
 		 */
		getTimeDisplay : function() {
			var dept_dt = this.get('departure');
			var arr_dt = this.get('arrival');
			dept_txt = dept_dt.toTimeString().substring(0,5);
			arr_txt = arr_dt.toTimeString().substring(0,5);
			return '{0}-{1}'.format([dept_txt, arr_txt]);
		}
	});
	var objects = $B.Collection.extend({
		model : TrainConnection,
		url : settings.trainApiUri + '/connection/',
	});
	TrainConnection.objects = objects;
	return TrainConnection;
});
