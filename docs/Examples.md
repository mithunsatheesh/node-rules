The example below shows how to use the rule engine to apply a sample rule on a specific fact. Rules fed into the rule engine may be arrays of rules or a single rule object.
	
```js
// import the package
const RuleEngine = require('node-rules');

//define the rules
const rules = [{
	condition(R) {
		R.when(this && (this.transactionTotal < 500));
	},
	consequence(R) {
		this.result = false;
		R.stop();
	}
}];
```

As you can see above we didn't provide the `priority` and `on` properties for this example as they're optional.
```js
// sample fact to run the rules on	
const fact = {
    userIP:  "27.3.4.5",
    name: "user4",
    application: "MOB2",
    userLoggedIn: true,
    transactionTotal: 400,
    cardType: "Credit Card"
};

// initialize the rule engine
const R = new RuleEngine(rules);

// Now pass the fact on to the rule engine for results
R.execute(fact, result => { 
	if (result.result) console.log("\n-----Payment Accepted----\n"); 
	else console.log("\n-----Payment Rejected----\n");
});
```