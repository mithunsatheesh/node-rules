This is an object injected into the condition and consequence functions defined by the user to make it easy for the user to define the Rule Engine flow.

If you look at the below rule example.

    {
		"name": "transaction minimum",
		"priority": 3,
		"on" : true,
		"condition": function(R) {
			R.when(this.transactionTotal < 500);
		},
		"consequence": function(R) {
			this.result = false;
			R.stop();
		}
    }

The `R` object injected in both condition and consequence refers to the API we are talking about.


Below are the functions available via the Flow Control API.

#### R.when
This function is used to pass the condition expression that we want to evaluate. In the above expression we pass the expression to check whether the transactionTotal attribute of the fact in context is below 500 or not. If the expression passed to `R.when` evaluates to true, then the condition will execute. Else the rule engine will move to next rule or may terminate if there are no rules left to apply.

#### R.next
This function is used inside consequence functions. This is used to instruct the rule engine to start applying the next rule on the fact if any.

#### R.stop
This function is used inside consequence functions to instruct the Rule Engine to stop processing the fact. If this function is called, even if rules are left to be applied, the rule engine will not apply rest of rules on the fact. It is used mostly when we arrive a conclusion on a particular fact and there is no need of any further process on it to generate a result. 

As you can see above example, when the transaction is less than 500, we no longer need to process the rule. So stores false in result attribute and calls the stop immediately inside consequence.

#### R.restart
This function is used inside consequence functions to instruct the rule engine to begin applying the Rules on the fact from first. This function is also internally used by the Rule engine when the fact object is modified by a consequence function and it needs to go through all the rules once gain.




