Dynamic Control is needed when the rule engine is in running state with a set of rules and you need to manipulate the rules which are running on it. There are a number of functions exposed by the library for this purpose.

The various functions for dynamic control are

1. Turn 
2. Prioritize
3. Register
4. FindRules
5. Init

##### 1. `RuleEngine.turn(<state>,<filter>)` 
This function is used to dynamically activate or deactivate a rule. The syntax for using this function is shown in below example.

    RuleEngine.turn("OFF", {
       "id": "one"
    });

Here `RuleEngine` is the rule engine instance. The first parameter to turn function indicates whether we need to turn the rule ON or OFF. The second parameter passed to the function is a filter. It should be a key which can be used to uniquely distinguish the targeted rule or set of rules from the other rules running in the Rule Engine. Here the above example will deactivate all the rules where the `id` attribute equals "one". 

##### 2. `RuleEngine.prioritize(<priority>,<filter>)` 
This function is used to dynamically change the priority of a rule while rule engine is running. It works similar to the Turn function and just that instead of the ON/OFF state we will be passing a priority number value to the function. See example below

    RuleEngine.prioritize(10, {
       "id": "one"
    });

The above `prioritize` call will give priority to Rule with id "one" over all the rules which are having lesser priority than 10.


##### 3. `RuleEngine.register(<rules>)`
We know that we can pass Rules as parameter into the Rule Engine constructor while we create the Rule Engine object like below.

    var RuleEngine = new RuleEngine(rules);

Where `rules` can be either an array of rule objects or a single array. But what if we need to add some rules later to the Rule Engine. Register can be used any time to append new rules into the Rule Engine. It can be used like.

    var RuleEngine = new RuleEngine();
    RuleEngine.register(newrule);
    RuleEngine.register(newrule);


##### 4. `RuleEngine.findRules(<filter>)`
This function is used to retrieve the Rules which are registered on the Rule engine which matches the filter we pass as its parameter. A sample usage can be like below.

    var rules = RuleEngine.findRules({"id": "one"});

##### 5. `RuleEngine.init()`
This function is used to remove all the rules registered on the Rule Engine. This is mostly used for rule clean up purposes by internal functions. A sample usage can be like below.

    var RuleEngine = new RuleEngine();
    RuleEngine.register(badrule);
    RuleEngine.init();//removes the bad rule and cleans up
    RuleEngine.register(newrule);






