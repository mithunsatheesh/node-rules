[Node-rules](http://mithunsatheesh.github.io/node-rules)
=====

## About

Node-rules is a forward chaining Rules Engine, written on node.js.


## Rules 

Node-rules takes rules written in JSON format as input. These rules get applied on the specified iputs(facts) to the rule engine.

A Rules consist of 

1. name - the name for the rule

2. conditions - a function which takes inputs and upon returning its results the rule engine executes the corresponding consequence.

3. consequence - a function which gets executed accoring to the return value from a condititon after executed. 

4. description - the description for the rule

5. priority - number which decides the order at which the rule gets applied on the supplied facts.

6. on - boolean telling whether or not the rule should be considered by the rule engine.

## Example rule


    {
		"name": "transaction minimum",
		"description": "blocks transactions below value x",
		"priority": 3,
		"on":1,
		"condition":
			function(fact) {
				return fact && (fact.transactionTotal < 500);
			},
		"consequence":
			function() {
				console.log("Rule 1 matched for "+this.name+": blocks transactions below value 500. Rejecting payment.");
				this.result = false;
				this.process = true;
			}
	}


## Facts

Facts are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes.

## Example Fact

	{
	  "userIP": "27.3.4.5",
	  "name":"user4",
	  "eventRiskFactor":8,
	  "userCredibility":2,
	  "application":"MOB2",
	  "userLoggedIn":true,
	  "transactionTotal":400,
	  "cardType":"Credit Card",
	  "cardIssuer":"VISA",
	  
	}
	
##Usage

The example below shows how to use the rule engine to apply a sample rule on a specific fact.
	
``` js

var RuleEngine = require('node-rules');

var rules = [{
		"name": "transaction minimum",
		"description": "blocks transactions below value x",
		"priority": 3,
		"on":1,
		"condition":
			function(fact) {
				return fact && (fact.transactionTotal < 500);
			},
		"consequence":
			function() {
				console.log("Rule 1 matched for "+this.name+": blocks transactions below value 500. Rejecting payment.");
				this.result = false;
				this.process = true;
			}
	}];
	
var fact = {
	  "userIP": "27.3.4.5",
	  "name":"user4",
	  "eventRiskFactor":8,
	  "userCredibility":2,
	  "application":"MOB2",
	  "userLoggedIn":true,
	  "transactionTotal":400,
	  "cardType":"Credit Card",
	  "cardIssuer":"VISA",
	  
	};
	
var R = new RuleEngine(rules);

R.execute(user7,function(result){ 

	if(result.result) 
		console.log("\n-----Payment Accepted for----\n"); 
	else 
		console.log("\n-----Payment Rejected for----\n");
	
	console.log(result); 
	
});
```

## Credits

Both the rules and the facts used in this module are based on the node module [jools](https://github.com/tdegrunt/jools). 
Its a modified version of jools with a non blocking version of applying the rule engine on the facts.
The rule engine logic was been modified sothat the rule executions on separate facts donot block each other.
