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
				
				_rulelist = _.flatten([_rules[x].condition]);
				
				(function looprules(y) {
					
					
					if(y < _rulelist.length) {
						
						if(typeof _rulelist[y] === 'string')
						   _rulelist[y] = eval('('+ _rulelist[y] + ')');
						
						   _rulelist[y].call({}, session,function(out){
							
							outcome = outcome && out;
							process.nextTick(function(){
								return looprules(y+1);
							});
							
						
						});
						
						
					} else {
						
						
						if (outcome) {
							
							_consequencelist = _.flatten([_rules[x].consequence]);
							
							(function loopconsequence(z) {
								
								if(z < _consequencelist.length) {
									
									if(typeof _consequencelist[z] === 'string')
									   _consequencelist[z] = eval('('+ _consequencelist[z] + ')');
						
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
