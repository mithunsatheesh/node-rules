[![Build Status](https://api.travis-ci.org/mithunsatheesh/node-rules.svg?branch=master)](https://travis-ci.org/mithunsatheesh/node-rules)
[![npm](https://img.shields.io/npm/l/express.svg?style=flat-square)]()
[![npm version](https://badge.fury.io/js/node-rules.svg)](http://badge.fury.io/js/node-rules)


[Node-rules](http://mithunsatheesh.github.io/node-rules)
=====

## About

Node-rules is a forward chaining Rules Engine, written on node.js.

## Installation

install this via npm

    npm install node-rules


## Rules 

Node-rules takes rules written in JSON friendly format as input. You can register different rules on the rule engine after initiating it. Once the rule engine is running with registered rule, you can feed it with different fact objects and the rule engine will process them with the various rules registred on it.


### 1. Defining a Rule

A rule will consist of a condition and its corresponding consequence. If the fact you feed into the engine satisfies the condition, then the consequence will run. Also optionally user may choose to define the priority of a rule applied. The rule engine will be applying the rules on the fact according to the priority defined.

Lets see how a sample rule will look like and then proceed to explain the different attributes of a rule.

    {
		"name": "transaction minimum",
		"priority": 3,
		"on" : true,
		"condition": function(R) {
			R.when(this && (this.transactionTotal < 500));
		},
		"consequence": function(R) {
			this.result = false;
			R.stop();
		}
	}

Above is a sample rule which has mandatory as well as optional parameters. You can choose to use which all attributes you need to use while defining your rule. Now let look into the attributes one by one.

##### 1.1. condition
Condition is a function where the user can do the checks on the fact provided. The fact varaiable will be available in `this` context of the condition function. Lets see a sample condition below.

	"condition": function(R) {
		R.when(this && (this.transactionTotal < 500));
	}

As you can see, the we have to pass an expression on to the `R.when` API. If the expression evaluates to true for a fact, the corresponding consequence will execute.

Its mandatory to have this field.

##### 1.2. consequnce
The consequence is the part where the we define what happens when the condition evaluates to true for a particular fact. Just like in condition, fact varaiable will be available in `this` context. You may utilize it to add extra result attributes if needed.

    "consequence": function(R) {
		this.result = false;
		R.stop();
	}
In the above example we use an additional parameter `result` to communicate to the code outside the rule engine that the fact was succeeded. Also the Rule API provides a number of functions here to control the flow of the rule engine. They are `R.stop()`, `R.restart()` and `R.next()`. Stop refers to stop processing the rule engine. Restart tells the rule engine to start applying all the rules again to the fact. Next is to instruct the rule engine to continue applying the rest of the rules to the fact before stoping. 

Its mandatory to have this field.

##### 1.3. priority
This field is used to specify the priority of a rule. The rules with higher priority will be applied on the fact first and then followed by lower priority rules. You can have multiple rules with same priority and the engine will not ensure the order in that case.

Its not mandatory to have this field.

##### 1.4. on
This is field is used to store the state of a rule. This is used to activate and diactivate rules at run time. Rules with `on` set to `false` will not be applied on the facts.

It is not mandatory to have this field.

##### 1.5. add a unique attribute
It is suggested that you should add a property which can be used as a unique identifier for a rule. Why it is because when you need to dynamically turn on/off or change priority of a rule, you will need a filter to select a rule from the engine via the APIs. That time you may use the unique property as a key for the filter for selection process.

Suppose that in the above example `name` is unique for each rule. Then for changing state or re prioritizing a rule at run time, you may use a filter like `{"name":"transaction minimum"}`. 

Again its optional to add a unique identifier. You may ignore adding it to your rules if you are not changing rule states at run time.


### 2. Defining a Fact
Facts are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes as you decide.

Example Fact may look like

	{
	  "userIP": "27.3.4.5",
	  "name":"user4",
	  "application":"MOB2",
	  "userLoggedIn":true,
	  "transactionTotal":400,
	  "cardType":"Credit Card",
    }
	
### 3. Using the Rule Engine

The example below shows how to use the rule engine to apply a sample rule on a specific fact. Rules fed into the rule engine may be as Array of rules or as individual rule objects.
	
``` js
//import the package
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
/*as you can see above we removed the priority 
and on properties for this example as they are optional.*/ 

//sample fact to run the rules on	
var fact = {
    "userIP": "27.3.4.5",
    "name":"user4",
    "application":"MOB2",
    "userLoggedIn":true,
    "transactionTotal":400,
    "cardType":"Credit Card",
};

//initialize the rule engine
var R = new RuleEngine(rules);

//Now pass the fact on to the rule engine for results
R.execute(fact,function(result){ 

	if(result.result) 
		console.log("\n-----Payment Accepted----\n"); 
	else 
		console.log("\n-----Payment Rejected----\n");
	
});
```


## Credits

The JSON friendly rule formats used in this module were initially based on the node module [jools](https://github.com/tdegrunt/jools). 
Its a modified version of jools with a non blocking version of applying the rule engine on the facts.
The rule engine logic was been modified sothat the rule executions on separate facts donot block each other.
