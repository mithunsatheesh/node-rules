var _ = require('underscore'),
	async = require("async");

exports.version = '0.0.2';

function RuleEngine(rules) {
	
	this.rules = rules;

}



RuleEngine.prototype.execute = function (fact,callback) {
  
  var session = _.clone(fact)
	, last_session = _.clone(fact)
    , goal = false;
  var _rules = [];
  for(var i = 0; i < this.rules.length; i++) {
  	if(this.rules[i].on)
  		_rules[this.rules[i].priority] = this.rules[i];
  }
  _rules = _.compact(_rules);

  session['process'] = false;
  session['result'] = true;
  
	async.until( 
		
		function() { return goal || session.process; },
		
		function(callback) {
			
			var changes = false;
    
			for (var x=0; x < _rules.length; x++) { 
	
					var outcome = true;

					async.each(_.flatten([_rules[x].condition]), //rules can be array
						
						function(cnd,callback) {
							
							cnd.call({}, session,function(out){
								outcome = outcome && out;
								callback();
							});
							
							
						}, 
						
						function(err) {
						
							if (outcome) {								
								
								async.each(_.flatten([_rules[x].consequence]), //consequences can be array
								
									function(csq,callback) { 
										
										csq.apply(session, [function(){
											if (!_.isEqual(last_session,session)) { 
												changes = true;
												last_session = _.clone(session);											
											}
											callback();		
										}]);
										
									},
										
									function(err){ 	}
								
								);
								
							}
							
														
						
						}
					);
					
					if(changes){ break;}					
      
			} 
		
				
			
	
			if (!changes || session.process)				
				goal = true;
			
			callback();
		},
		
		function(err){ callback(session); }
		
	);	
  
};

module.exports = RuleEngine;