define(['backbone', 'util', 'templates', 'autocomplete', 'models/itry/geocode',
    'moment'], function($B, util, templates, autocomplete, GeoCode, moment) {
    var SearchView = $B.View.extend({
        events : {
            // "click .list-row": "selectShareable",
            "click .action-query" : "search",
            "click .action-pickdate" : "pickDateRange",
            "click .action-reset" : "resetInput",
            "click .action-geopos" : 'setCurrentPosition',
            "click .action-select-queryby" : "selectQueryBy",
            "click .action-select-paxclass" : "selectPaxClass",
            "click .action-picktime" : "pickTime",
        },
        initialize : function() {
            if (this.collection) {
                this.collection.bind("change", this.modelChanged, this);
            }
            this.selectedDeparture = null;
            this.selectedArrival = null;
            this.paxClass = 2;
            this.queryby = 'departure';
            // autocomplete suggestions from/to
            this.suggested = {};
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.search_html, {
                view : this
            }));
            // new IScroll('#wrapper', { mouseWheel: true, click: false });
            // new IScroll('#wrapper1', {
            // mouseWheel : true,
            // click : true
            // });
            // initialise date time
            var today = new Date();
            $("#date_txt").val("{dd}.{mm}.{yy}".format({
                dd : today.getDate(),
                mm : today.getMonth() + 1,
                yy : today.getFullYear()
            }));
            $("#time_txt").val(today.toTimeString().substring(0, 5));
            this.geocode = new GeoCode.objects();
            view = this;
            this.$('#from-station, #to-station').autocomplete({
                lookup : function(q, autocomplete) {
                    view.suggested[this.id] = null;
                    view.geocode.lookup(q, autocomplete);
                },
                onSelect : function(suggestion) {
                    var lat = suggestion.data.get('latitude');
                    var lon = suggestion.data.get('longitude');
                    view.suggested[this.id] = '{0},{1}'.format([lat, lon]);
                },
                onHide : function() {
                    // if nothing was selected, clear the input box
                    if(!view.suggested[this.id]) {
                        $("#" + this.id).val(''); 
                    }
                },
            });
            setTimeout(function() {
                view.$('#from-station').focus();
            }, 500);
        },
        modelChanged : function() {

        },
        close : function() {
            this.remove();
            this.unbind();
            if (this.collection) {
                this.collection.unbind("change", this.modelChanged);
            }
            // be nice and clean up
            this.geocode.clearCache();
        },
        /**
         * reset input fields and suggested selections
         */
        resetInput : function(e) {
            var target = e.target;
            var id_input = this.$(target).attr('data-reset');
            this.$(id_input).val('');
            this.suggested = {};
        },
        /**
         * render the itinerary travel times
         */
        renderTravelTimes : function(departure, arrival) {
            if (arrival && departure) {
                this.$('.selected-date').html('Departure: {0}<br>Return: {1}'
                    .format([moment(departure).format('DD.MM.YYYY'),
                        moment(arrival).format('DD.MM.YYYY')]));
            } else if (departure) {
                this.$('.selected-date')
                    .html('Departure: {0}<br>no return ticket'
                        .format([moment(departure).format('DD.MM.YYYY')]));
            } else {
                this.$('.selected-date').empty();
            }
        },
        // functionality
        getInfoText : function() {
            return app.settings.texts['search_info'];
        },
        /**
         * return the time format for display given a connection. This renders
         * the departure and arrival attributes of a connection into HH:MM-HH.MM
         * format
         * 
         * @param {Object}
         *            connection
         */
        getTimeDisplay : function(connection) {
            return connection.getTimeDisplay();
        },
        getCurrentTime : function() {
            return moment().format('HH:mm');
        },
        getUserName : function() {
            return "";
        },
        /**
         * find itineraries. triggers results_ready, passing the itineraries
         * found for the search query. If both departure and arrival are set, a
         * return journey is also searched.
         * 
         * @return collection with itineraries set as 'to' or 'return' journeys
         */
        search : function(e) {
            e.preventDefault();
            console.trace('SearchView.search triggered');
            app.progress.show();
            // build the queries
            var options = {
                origin : this.suggested['from-station']
                    || this.$("#from-station").val() || 'Luzern',
                destination : this.suggested['to-station']
                    || this.$("#to-station").val() || 'Zurich',
                departure : this.selectedDeparture || '',
                arrival : this.selectedArrival || '',
                paxcount : parseInt(this.$("#pax_count").val() || 1),
                paxclass : this.paxclass || '2',
                byname : this.suggested['from-station']
                    && this.suggested['to-station'] ? 0 : 1,
            };
            console.debug("search: need to pass on pax count");
            console.debug('search departure>={0},arrival<={1}'.format([
                options.departure, options.arrival]));
            var results = app.session.connections.findSchedule(options);
            results.done(function(itries) {
                view.collection.reset(itries.models);
                view.trigger('results_ready', view.collection);
            });
            results.always(function() {
                app.progress.hide();
            });
        },
        pickDateRange : function(e) {
            console.trace('pickDateRange triggered');
            var view = this;
            var options = {
                theme : 'ios7',
                lang : 'de',
                display : 'bottom',
                controls : ['calendar'],
                layout : 'liquid',
                navigation : 'month',
                multiSelect : false,
                setText : 'Ok',
                cancelText : 'Cancel',
                marked : [{
                    d : new Date(),
                    color : "red",
                }],
                markedDisplay : 'circle',
                onMarkupReady : function(jq, inst) {
                    return;
                    var additional = view.$("#datecancel").clone();
                    jq.append(additional);
                    additional.show();
                },
                onSelect : function(text, inst) {
                    console.trace('pickDateRange select triggered');
                    // slice => clone to avoid confusing mobiscroll...
                    var selected = util.sortArray(inst.getValues().slice(0));
                    if (selected.length > 0) {
                        // at least one day selected
                        var departure = _.first(selected);
                        var arrival = _.last(selected);
                        if (arrival != departure) {
                            var arrival = new Date(moment(arrival)
                                .add(1, 'days').subtract(1, 'minute'));
                        } else {
                            arrival = null;
                        }
                        console.debug('departure>={0},arrival<={1}'.format([
                            departure, arrival]));
                        view.selectedDeparture = departure;
                        view.selectedArrival = arrival;
                        // view.renderTravelTimes(departure, arrival);
                    } else {
                        // no date selected, assume default values
                        view.selectedArrival = null;
                        view.selectedDeparture = null;
                        // view.renderTravelTimes(null, null);
                    }
                },
                onCancel : function(text, inst) {
                    // no action, cancel is cancel...
                    console.trace('pickDateRange cancel triggered');
                },
                onShow : function(el, text, inst) {
                    console.trace('pickDateRange show triggered');
                },
                onClose : function(el, text, inst) {
                    console.trace('pickDateRange close triggered');
                    inst.destroy();
                },
            };
            this.$("#daterange").mobiscroll().calendar(options);
            this.$("#daterange").mobiscroll('show');
        },
        /**
         * pick a time
         */
        pickTime : function(e) {
            console.trace('pickTime triggered');
            var view = this;
            var options = {
                theme : 'ios7',
                display : 'bottom',
                buttons : ['set', 'cancel'],
                headerText : false,
                timeFormat : "HH:ii",
                timeWheels : "HHii",
                stepMinute : 15,
                onSelect : function(text, inst) {
                    console.trace('pickTime select triggered');
                    if (view.queryby == 'arrival') {
                        view.selectedArrival = inst.getDate();
                        view.selectedDeparture = null;
                    }
                    if (view.queryby == 'departure') {
                        view.selectedDeparture = inst.getDate();
                        view.selectedArrival = null;
                    }
                    view.$(".timetext").val(text);
                },
                onCancel : function(text, inst) {
                    // no action, cancel is cancel...
                    console.trace('pickTime cancel triggered');
                },
                onShow : function(el, text, inst) {
                    console.trace('pickTime show triggered');
                },
                onClose : function(el, text, inst) {
                    console.trace('pickTime close triggered');
                    inst.destroy();
                },

            };
            this.$("#timepick").mobiscroll().time(options);
            this.$("#timepick").mobiscroll('show');
        },
        /**
         * geo code -- get current position, if available
         */
        setCurrentPosition : function() {
            console.log('current position triggered');
            util.getCurrentPosition().done(function(pos) {
                view.$("#from-station").val(pos.address.city
                    || pos.address.town || pos.address.state
                    || pos.address.country);
            });
        },
        /**
         * select query by arrival / departure
         */
        selectQueryBy : function(e) {
            console.trace('select queryby triggered');
            var target = this.$(e.target);
            this.queryby = target.data('queryby');
            target.closest('.select_box').find('li').removeClass('active');
            target.closest('li').addClass('active');
            console.trace('new queryby={0}'.format([this.queryby]));
        },
        /**
         * select pax class
         */
        selectPaxClass : function(e) {
            console.trace('select paxclass triggered');
            var target = this.$(e.target);
            var t = target.closest('.number_list').find('li')
            t.removeClass('active');
            target.closest('li').addClass('active');
            this.paxclass = target.closest('[data-paxclass]').data('paxclass');
            console.trace('new paxclass={0}'.format([this.paxclass]));
        }
    });
    return SearchView;
});
