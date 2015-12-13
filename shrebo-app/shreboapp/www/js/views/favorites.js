define(['jquery', 'backbone', 'mobiscroll', 'templates', 'util'], function($, $B, mobiscroll, templates, util) {
    /**
     * Favorites dialog to choose/manipulate favorites
     * 
     * Pass in options as follows. Each favorite is an object with properties
     * 
     * <pre>
     * var options = {
     *     favorites : [{
     *         origin : 'lat,lon',
     *         destination : 'lat,lon',
     *         text : 'from - to',
     *     },
     *     //...
     *     ]
     * };
     * var dialog = new FavoritesDialog(options);
     * dialog.render();
     * dialog.show();
     * </pre>
     * 
     * Note that lat, lon must be actual coordinates, e.g. 47.050170,8.310170
     * The text can be an arbitrary string. The dialog triggers the following
     * events:
     * 
     * @event favorite_selected(favorite) where favorite is the option selected.
     *        Note this is a copy of the original favorite, don't rely on object
     *        equality.
     * @event favorite_cancelled
     * 
     * @param favorites
     *            list of favorites
     */
    var FavoritesDialog = $B.View.extend({
        events : {},
        initialize : function(options) {
            this.$el = $('#modal-dialog');
            this.services = options.favorites || [];
        },
        render : function() {
            this.$el.empty();
            this.$el.append(util.render(templates.favorites_dialog_html, {
                view : this,
                services : this.services,
            }));
        },
        show : function() {
            this.pickService();
        },
        pickService : function() {
            console.trace('pickService triggered');
            var view = this;
            var options = {
                theme : 'ios7',
                display : 'bottom',
                buttons : ['set', 'cancel'],
                headerText : 'Pendlerstrecke',
                setText : 'Auswahl',
                cancelText : 'Zur&uuml;ck',
                onValueTap : function(el, inst) {
                    var value = $(el).data('val');
                    var text = $(el).find('.dw-i').text()
                    inst.setValue(value);
                    inst.select();
                },
                onSelect : function(text, inst) {
                    var values = inst.getValue().split('#');
                    view.trigger('favorite_selected', {
                        text : text,
                        origin : values[0],
                        destination : values[1],
                    });
                },
                onCancel : function(text, inst) {
                    // no action, cancel is cancel...
                    console.trace('pickService cancel triggered');
                    view.trigger('favorite_cancelled');
                },
                onShow : function(el, text, inst) {
                    console.trace('pickService show triggered');
                },
                onClose : function(el, text, inst) {
                    console.trace('pickService close triggered');
                    inst.destroy();
                },
            };
            this.$("#favpick").mobiscroll().select(options);
            this.$("#favpick").mobiscroll('show');
        },
        // view functions to get formatted values
        // note that service is in fact an entry in favorites
        getCoord : function(service) {
            return '{origin}#{destination}'.format(service);
        },
        getServiceText : function(service) {
            return service.text;
        }
    });
    return FavoritesDialog;
});
