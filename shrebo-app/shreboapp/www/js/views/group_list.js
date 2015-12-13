define(['backbone', 'util', 'text!templates/group_list.html'], function($B, util, group_list_html) {
	var GroupListView = $B.View.extend({
		events : {
			//"click .list-row": "selectShareable",	
			"click .row": "selectGroup",
		},
		initialize : function() {
			if (this.collection) {
				this.collection.bind("change", this.modelChanged, this);
			}
		},
		selectGroup : function(e) {
			// get the id of the selected shareable
			// note that this is the id of the model object
			// and not the id attribute (the id attribute
		    // is the server-side pk, whereas the model
		    // id is the resource URI).
			var target = $(e.currentTarget);
			var sid = target.attr('data-id');
			console.debug('GroupListView click shareable id=' + sid);
			var group = this.collection.get(sid);
			this.trigger('select_group', group);
		},
		render : function() {
			this.$el.empty();
			this.$el.append(util.render(group_list_html, { col : this.collection }));
		},
		modelChanged : function() {

		},
		close : function() {
			this.remove();
			this.unbind();
			if(this.collection) {
				this.collection.unbind("change", this.modelChanged);
			}
		}
	});
	return GroupListView;
});
