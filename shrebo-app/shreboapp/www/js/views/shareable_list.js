define(['backbone', 'util', 'bootstrap', 'text!templates/shareable_list.html'], function($B, util, bootstrap, home_html) {
	var ShareabeListView = $B.View.extend({
		events : {
			//"click .list-row": "selectShareable",
			"click .row" : "selectShareable",
			"click .filter-experts" : "filter",
			"click .filter-workshops" : "filter",
			"click .filter-booths" : "filter",
			"click .action-select" : "select",
			"click .action-infobox" : "infobox",
			"click .action-infobox-close" : "closeInfobox",
		},
		initialize : function(options) {
			this.experts = options.experts;
			this.booths = options.booths;
			this.workshops = options.workshops;
			// create an empty collection for non-displays
			this.empty = new $B.Collection();
			// display flags
			this.filters = {
				experts : true,
				workshops : true,
				booths : true
			};
		},
		select : function(e) {
			// get the id of the selected item
			// it will be the own with the item.active class
			var target = this.$('.item.active');
			var sid = target.attr('data-id');
			var type = target.attr('data-type');
			console.debug('ShareabeList click shareable type={0} id={1}'.format(type, sid));
			var shareable = null;
			switch(type) {
				case 'experts' :
					shareable = this.experts.get(sid);
					break;
				case 'workshops' :
					shareable = this.workshops.get(sid);
					break;
				case 'booths' :
					shareable = this.booths.get(sid);
					break;
				default:
					break;
			}
			if (shareable) {
				if (this.$(e.target).hasClass('infobox')) {
					// show infobox
					this.$("#info-img").attr("src", shareable.get('picture_url'));
					this.$("#info-name").html(shareable.get('label'));
					this.$("#info-place").html(shareable.get('location_pickup'));
					this.$("#info-text").html(shareable.get('description'));
					this.$("#infobox").css('display', 'block');
				} else {
					this.trigger('select_shareable', shareable);
				}
			}
		},
		render : function() {
			this.$el.empty();
			this.$el.append(util.render(home_html, {
				experts : this.experts,
				booths : this.booths,
				workshops : this.workshops,
				view : this
			}));
			// make first item active
			this.$('.item').first().addClass('active');
			// Activates the Carousel, but don't spin
			this.$('.carousel').carousel({
				interval : false
			});
			// activate swiping touch support for carousel
			// source: http://lazcreative.com/blog/adding-swipe-support-to-bootstrap-carousel-3-0/
			var carousel = this.$('#carousel-example-generic');
			carousel.swiperight(function() {
				$(this).carousel('prev');
			});
			carousel.swipeleft(function() {
				$(this).carousel('next');
			});
			// set visible filter state
			for (key in this.filters) {
				if (this.filterActive(key)) {
					$('.filter-' + key).addClass('active');
				}
			}
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
		// actions
		closeInfobox : function(e) {
			this.$("#infobox").css('display', 'none');
		},
		/**
		 * return true if any of the filters is active while some others
		 * are not (i.e. at least one is false)
		 */
		anyFilter : function() {
			return !(_.all(this.filters));
		},
		/**
		 * return true if the given filter is the only one active
		 */
		filterActive : function(filter) {
			return this.filters[filter] && this.anyFilter();
		},
		resetFilters : function(new_state) {
			for (key in this.filters) {
				this.filters[key] = new_state;
			};
		},
		/**
		 * toggle filter display. if a filter is selected,
		 * don't show any of the others. if it is deselected,
		 * show all.
		 */
		filter : function(e) {
			// get the filter we should apply
			var filter = $(e.target).attr('data-filter');
			// get button and see if it is (visibly) active
			var btn = $(".filter-" + filter);
			var vis_active = btn.hasClass('active');
			// toggle visible active stage, remove all active
			$('.top_link a.active').removeClass('active');
			// if the button was active, it is no longer, so
			// all filters are now active => set all to true
			if (vis_active) {
				this.resetFilters(true);
				btn.addClass('nohover');
			} else {
				// it is now active, so it must be the only
				// one active
				this.resetFilters(false);
				this.filters[filter] = true;
				btn.addClass('active');
			}
			var view = this;
			setTimeout(function() {
				// finally re-render, but allow refresh first
				// to toggle buttons faster
				view.render();
			}, 500);
		}
	});
	return ShareabeListView;
});
