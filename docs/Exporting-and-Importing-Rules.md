This section deals with the case when you need to store the rules to an external Database or you need to load the rules stored inside an external Database.

#### Export & Import Functions

###### 1. toJSON()
This function converts the Rules running inside the engine into JSON format. This is done by stringifying the condition and consequence functions internally. For details which you need to consider while using these features, please look into the "Gotchas" section below this.

Find an example below
```js
const rules = [{
    condition(R) {
        R.when(1);
    },
    consequence(R) {
        R.stop();
    },
    on: true
}];
const R1 = new RuleEngine(rules);
const store = R1.toJSON();
```

###### 2. fromJSON()
This function loads the stringified Rules back into the Rule engine. 

:warning: **This uses eval() under the hood and should be considered dangerous!**

Find an example below
```js
const R1 = new RuleEngine();
R1.fromJSON(store);
```

Where store variable is the one similar to what we get via a `toJSON()` call


#### Gotchas to consider before exporting or importing Rules

###### 1. Don't directly JSON.stringify the rules array  

As you can see the format of the rule we use in this engine is not exactly JSON. It is because of the fact that JSON wont allow functions to be values of keys in our Rule Object. So if we take rules array and do a `JSON.stringify`, we will just loose our functions as they will get removed in the process of stringification. So a fix for this might be to `stringify` and store the functions as strings while exporting them. This will require us to loop through each rule and do a `Function.toString()` call on both conditions and consequences. To do this you can use the `.toJSON()` function provided by this library which is explained in above section.

###### 2. Don't use closures into rule objects.
There are things that an `eval` cannot bring back once a JS object is stringified. One of which is the outer environment which was bound to it. So if your condition or consequence are using any variables which are outside its function level scope, then those bindings wont be  brought back when we load the stringified Rules back into the Rule engine from the store. If you dint understand this explanation or having troubles with this, you can raise an issue on the repo which we will help out.

#### Workaround for calling external methods from rules

As a work around to allow for references to code in external modules in persisted rules here's a scheme where you can attach module references to the input fact being processed by the rules engine.

First I establish 2 known fields on the input fact. The first called 'fact' contains the actual object we want to test/change inside the rules definitions. In the example below I'm getting the object as a POST to a service I've set up. The second is a field called modules which will contain references to modules containing code we may want to call from within our rules.

```
const inputObject = {};
inputObject.modules = {};
inputObject.fact = request.body;
```

In order to populate the modules file I start with an array of field/module names like this:
```js
const requiredModules = [{
    fieldName: "guidGenerator", 
    moduleName: 'uuid' 
},
{
    fieldName: 'sprintf',
    moduleName: 'sprintf'
}];
```

I then populate the modules field in a loop like this:
```js
for (var i = 0; i < rulesCollection.modules.length; i++) {
    inputObject.modules[requiredModules[i].fieldName] = require(requiredModules[i].moduleName);
}
```

I then refer to these fields in my rules. Here's an example rules consequence function:
```js
function(R) {
    this.fact.RecordId = this.modules.guidGenerator.v4();
    this.fact.IPTCMetadata.Description = this.modules.sprintf.sprintf("%s Photo from user %s",
        this.fact.IPTCMetadata.Description, this.fact.IncomingMetadata.User);
    R.next();
}
```

This seems to work fine and the main caveat is to make sure all the modules referenced in requiredModules are available.