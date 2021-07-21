A rule will consist of a condition and its corresponding consequence. If the fact you feed into the engine satisfies the condition, then the consequence will run. Also optionally user may choose to define the priority of a rule applied. The rule engine will be applying the rules on the fact according to the priority defined.

Lets see how a sample rule will look like and then proceed to explain the different attributes of a rule.

```js
/** @type {import('node-rules').Rule} */
const rule = {
	name: "transaction minimum",
	priority: 3,
	on : true,
	condition(R) {
		R.when(this.transactionTotal < 500);
	},
	consequence(R) {
		this.result = false;
		R.stop();
	}
}
```

Above is a sample rule which has mandatory as well as optional parameters. You can choose to use which all attributes you need to use while defining your rule. Now lets look into the attributes one by one.

###### 1. condition
Condition is a function where the user can do the checks on the fact provided. The fact variable will be available in `this` context of the condition function. Lets see a sample condition below.

```js
"condition": function(R) {
	R.when(this.transactionTotal < 500);
}
```

As you can see, the we have to pass an expression on to the `R.when` function which is a part of the [Flow Control API](https://github.com/mithunsatheesh/node-rules/wiki/Flow-Control-API). You can read more about the API [Flow Control API](https://github.com/mithunsatheesh/node-rules/wiki/Flow-Control-API). If the expression evaluates to true for a fact, the corresponding consequence will execute.

Its mandatory to have this field.

###### 2. consequence
The consequence is the part where we define what happens when the condition evaluates to true for a particular fact. Just like in condition, fact variable will be available in `this` context. You may utilize it to add extra result attributes if needed.

```js
"consequence": function(R) {
	this.result = false;
	R.stop();
}
```

In the above example we use an additional parameter `result` to communicate to the code outside the rule engine that the fact has succeeded. Also the Rule API provides a number of functions here to control the flow of the rule engine. They are `R.stop()`, `R.restart()` and `R.next()`. Stop refers to stop processing the rule engine. Restart tells the rule engine to start applying all the rules again to the fact. Next is to instruct the rule engine to continue applying the rest of the rules to the fact before stopping. Check [Flow Control API](https://github.com/mithunsatheesh/node-rules/wiki/Flow-Control-API) in wiki to read more about this.

You can read more about flow control API here.

Its mandatory to have this field.

###### 3. priority
This field is used to specify the priority of a rule. The rules with higher priority will be applied on the fact first and then followed by lower priority rules. You can have multiple rules with same priority and the engine will not ensure the order in that case.

Its not mandatory to have this field.

###### 4. on
This field is used to store the state of a rule. This is used to activate and deactivate rules at run time. Rules with `on` set to `false` will not be applied on the facts.

It is not mandatory to have this field.

###### 5. add a unique attribute
It is suggested that you should add a property which can be used as a unique identifier for a rule. Why it is because when you need to dynamically turn on/off or change priority of a rule, you will need a filter to select a rule from the engine via the APIs. That time you may use the unique property as a key for the filter for selection process.

Suppose that in the above example `name` is unique for each rule. Then for changing state or re prioritizing a rule at run time, you may use a filter like `{"name":"transaction minimum"}`. 

Again its optional to add a unique identifier. You may ignore adding it to your rules if you are not changing rule states at run time.