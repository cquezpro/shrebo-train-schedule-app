define(['backbone', 'settings', 'models/polls/vote'], function($B, settings, Vote) {
    var Poll = $B.Model.extend({
        urlRoot : settings.pollsApiUri + '/poll/',
        /**
         * if we have a reference, use that as the
         * resource key
         * 
         * with reference
         * => /poll/ref/
         * with primary key
         * => /poll/pk/
         * 
         * without primary key or reference, reverts to 
         * urlRoot
         */
        url : function() {
            var id = this.get('id');
            var ref = this.get('reference');
            if(id || ref) {
                return '{urlRoot}{key}/'.format({
                    urlRoot : this.urlRoot,
                    key : ref ? ref : this.get('id'),
                });
            } else {
                return this.urlRoot;
            }
        },
        initialize : function() {
            this._vote = null;
        },
        /**
         * vote on this poll
         * 
         * create a vote and sync it
         */
        vote : function(choice, comment, data) {
            if(!_.isArray(choice)) {
                choice = [choice];
            }
            this._vote = new Vote();
            this._vote.set('poll', this.url());
            this._vote.set('choice', choice);
            this._vote.set('comment', comment || '');
            this._vote.set('data', data || {} );
            this._vote.save();
            return this._vote;
        },
        getVote : function() {
          return this._vote || new Vote();  
        },
        isVoted : function() {
            return this._vote != null;
        },
    }); 
    var objects = $B.Collection.extend({
        model : Poll,
        url : settings.apiUri + '/poll/',
    });
        // use as
    // var results = new Shareable.objects().fetch();
    // results.done(function() {...});
    Poll.objects = objects;
    // use as
    // var results = new Shareable.objects().search.byTerm('someterm').fetch();
    // results.done(function() { ...});
    return Poll;
});
