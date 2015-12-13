define(['backbone', 'util', 'models', 'templates', 'moment'], function($B, util, models, templates, moment) {
    /**
     * View to select the current service for staff
     * 
     * @param collection the ItineraryServices to show for selection
     * @return the ItineraryServiceselected
     */
    var StaffServiceView = $B.View.extend({
        events : {
            "click .action-select" : "select",
        },
        initialize : function(options) {
            if (this.collection) {
                this.collection.bind("change", this.modelChanged, this);
            }
            this.collection = options.collection; 
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.staff_service_html, {
                view : this,
                services : this.collection,
            }));
            var myScroll = new IScroll('.staff-service-scroller', {
                mouseWheel : true,
                click : false
            });
            // reset action ok button
            var view = this;
            $('.action-staffvote').removeClass('active');
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
        //functionality
        /**
         * select a service
         */
        select : function(e) {
            var t = this.$(e.target).closest('.service');
            var serviceid = t.data('serviceid');
            this.$('.service').removeClass('active');
            t.addClass('active');
            $('.action-staffvote').addClass('active');
            this.service = this.collection.at(serviceid);
            this.trigger('service_selected', this.service);
        },
        /**
         * get service origin/destination display
         */
        getServiceOD : function(s) {
            var origin = s.get('origin_code');
            var destination = s.get('destination_code');
            return "{0}-{1}".format([origin, destination]);
        },
        getServiceDate : function(s) {
            var d = moment(s.get('departure'));
            return d.format('ddd D.MM.YYYY');
        },
        getServiceTime : function(s) {
            var d = moment(s.get('departure'));
            return d.format('HH.mm');
        },
    });
    return StaffServiceView;
});
