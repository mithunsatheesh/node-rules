var _ = require('underscore');

exports.version = '0.0.4';

function RuleEngine(rules) {
	
	this.rules = rules;
	this.rules = this.rules.filter(function(a) {
					if(a.on == 1)
						return a;
	});
	
	this.rules.sort(function(a,b) { 
				return b.priority - a.priority; 
	});

}

RuleEngine.prototype.execute = function (fact,callback) {
  
	var session = _.clone(fact)
		, last_session = _.clone(fact)
		, goal = false;
		
	var _rules = this.rules;	
	
	session['process'] = false;
	session['result'] = true;
  
		   
	(function doit(x) { 

		if (x < _rules.length && session.process == false) {  

				var outcome = true;
				
				//If user gives condiotns as string we can able to execute the rules using the eval function
				
				if(typeof _rules[x].condition != 'function')
				   _rules[x].condition = eval('('+	_rules[x].condition + ')');
				
				_rulelist = _.flatten([_rules[x].condition]);
				
				(function looprules(y) {
					
					
					if(y < _rulelist.length) {
						
						
						_rulelist[y].call({}, session,function(out){
							
							outcome = outcome && out;
							process.nextTick(function(){
								return looprules(y+1);
							});
							
						
						});
						
						
					} else {
						
						
						if (outcome) {
							
							if(typeof _rules[x].consequence != 'function')
				   			   _rules[x].consequence = eval('('+	_rules[x].consequence + ')');	
							
							_consequencelist = _.flatten([_rules[x].consequence]);
							
							(function loopconsequence(z) {
								
								if(z < _consequencelist.length) {
									
									_consequencelist[z].apply(session, [function() {
										
										if (!_.isEqual(last_session,session)) { 
											
											last_session = _.clone(session);
											process.nextTick(function(){
												return doit(0);		
											});
											
																				
										
										} else {
											
											process.nextTick(function(){
												return loopconsequence(z+1);
											});											
										
										}											
												
									}]);
									
								} else {
									
									process.nextTick(function(){
										return doit(x+1);
									});	
									
									
								}
								
								
							})(0);
						
						} else {
							
							process.nextTick(function(){
								return doit(x+1);
							});			
							
									
						}
						
						
					}
					
					
					
					
				})(0);	
											

		} else {
			
			process.nextTick(function(){
				return callback(session);
			});	
			
			
		}
		 
	})(0);	
	
  
};

module.exports = RuleEngine;
