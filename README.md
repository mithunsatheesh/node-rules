[![Build Status](https://api.travis-ci.org/mithunsatheesh/node-rules.svg?branch=master)](https://travis-ci.org/mithunsatheesh/node-rules)
[![npm](https://img.shields.io/npm/l/express.svg?style=flat-square)]()
[![npm version](https://badge.fury.io/js/node-rules.svg)](http://badge.fury.io/js/node-rules)


Node-rules
=====
Node-rules is a light weight forward chaining Rule Engine, written on node.js.



####Installation

install node-rules via npm

    npm install node-rules
    
>*We have improved the API in the 3.x.x version, if you were using the v2.x.x, please find the relevant docs and code base [here](https://github.com/mithunsatheesh/node-rules/tree/v2.2.3). To migrate to 3.0.0 please  read [the wiki here](https://github.com/mithunsatheesh/node-rules/wiki)!*


####Overview

Node-rules takes rules written in JSON friendly format as input. Once the rule engine is running with rules registered on it, you can feed it facts and the rules will be applied one by one to generate an utcome.

###### 1. Defining a Rule

A rule will consist of a condition and its corresponding consequence. There can also be optional parameters to decide the flow which are discussed later below. 
Lets look at a sample rule.

    {
		"condition" : function(R) {
			R.when(this.transactionTotal < 500);
		},
		"consequence" : function(R) {
			this.result = false;
			R.stop();
		},
		"priority" : 4
	}

Here priority is an optinal paramter which will be used to specify priority of a rule over other rules when there are multiple rules running.


###### 2. Defining a Fact
Facts are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes as you decide.

A sample Fact may look like

	{
	  "name":"user4",
	  "application":"MOB2",
	  "transactionTotal":400,
	  "cardType":"Credit Card",
    }

###### 3. Using the Rule Engine

The example below shows how to use the rule engine to apply a sample rule on a specific fact. Rules fed into the rule engine as Array of rules or objects.
	
``` js
var RuleEngine = require('node-rules');

//define the rules
var rules = [{
	"condition": function(R) {
		R.when(this && (this.transactionTotal < 500));
	},
	"consequence": function(R) {
		this.result = false;
		R.stop();
	}
}];

//sample fact to run the rules on	
var fact = {
    "name":"user4",
    "application":"MOB2",
    "transactionTotal":400,
    "cardType":"Credit Card",
};

//initialize the rule engine
var R = new RuleEngine(rules);

//Now pass the fact on to the rule engine for results
R.execute(fact,function(result){ 

	if(result.result) 
		console.log("Payment Accepted"); 
	else 
		console.log("Payment Rejected");
	
});
```


#### Wiki
To read more about the Rule engine functions, please read [the wiki here](https://github.com/mithunsatheesh/node-rules/wiki)!.


#### Licence
Node rules is distributed under the MIT License.


#### Credits

The JSON friendly rule formats used in this module were initially based on the node module [jools](https://github.com/tdegrunt/jools). 
Its a modified version of jools with a non blocking version of applying the rule engine on the facts.
The rule engine logic was been modified sothat the rule executions on separate facts donot block each other.
