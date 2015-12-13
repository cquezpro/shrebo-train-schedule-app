define(['backbone', 'util', 'models', 'templates'], function($B, util, models, templates) {
    /**
     * View for staff statistics
     * 
     */
    var StatsView = $B.View.extend({
        events : {
            "click" : "select",
        },
        initialize : function(options) {
            if (this.collection) {
                this.collection.bind("change", this.modelChanged, this);
            }
            this.polls = options.polls || [];
            this.stations = options.stations || [];
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.stats_html, {
                polls : this.polls,
                stations : this.stations,
                view : this,
            }));
            var myScroll = new IScroll('.stats-scroller', {
                mouseWheel : true,
                click : false
            });
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
    });
    return StatsView;
});
