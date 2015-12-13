define(['models/polls/poll', 'models/polls/result', 'models/polls/vote'], function(Poll, Result, Vote) {
   /**
    * setup the Polls object
    * 
    * Polls.Poll   => poll object
    * Polls.Result => result object
    * Polls.Vote => vote object
    * 
    * usage:
    * 
    * var poll = new Polls.Poll();
    * var result = new Polls.Result();
    * var Vote = new Polls.Vote();
    * 
    */
   var Polls = {
       Poll : Poll,
       Result: Result,
       Vote: Vote,
   };
   return Polls;
});