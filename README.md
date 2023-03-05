[![Build Status](https://api.travis-ci.org/mithunsatheesh/node-rules.svg?branch=master)](https://travis-ci.org/mithunsatheesh/node-rules)
[![npm](https://img.shields.io/npm/l/express.svg?style=flat-square)]()
[![npm version](https://badge.fury.io/js/node-rules.svg)](http://badge.fury.io/js/node-rules)
[![Coverage Status](https://coveralls.io/repos/github/mithunsatheesh/node-rules/badge.svg?branch=master)](https://coveralls.io/github/mithunsatheesh/node-rules?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/node-rules.svg)](https://img.shields.io/npm/dm/node-rules.svg)
[![install size](https://img.shields.io/github/size/mithunsatheesh/node-rules/dist/node-rules.min.js)](https://github.com/mithunsatheesh/node-rules/blob/master/dist/node-rules.min.js)
[![install size](https://packagephobia.com/badge?p=node-rules)](https://packagephobia.com/result?p=node-rules)
[![Known Vulnerabilities](https://snyk.io/test/npm/node-rules/badge.svg)](https://snyk.io/test/npm/node-rules)
[![CDNJS](https://img.shields.io/cdnjs/v/node-rules?color=orange&style=flat-square)](https://cdnjs.com/libraries/node-rules)

# Node Rules

Node-rules is a light weight forward chaining Rule Engine, written in JavaScript for both browser and node.js environments.

#### Installation

    npm install node-rules

![Sample Screencast](https://raw.githubusercontent.com/mithunsatheesh/node-rules/gh-pages/images/screencast.gif "See it in action")

#### Try This Out!

You can see this in action in a node.js environment using [this RunKit example](https://runkit.com/mithunsatheesh/runkit-npm-node-rules). If you are interested to use it in the browser, use [this JSFiddle](https://jsfiddle.net/mithunsatheesh/6pwohf3g/) for a quick start.

#### Overview

Node-rules takes rules written in JSON friendly format as input. Once the rule engine is running with rules registered on it, you can feed it facts and the rules will be applied one by one to generate an outcome.

###### 1. Defining a Rule

A rule will consist of a condition and its corresponding consequence. You can find the explanation for various mandatory and optional parameters of a rule in [this wiki](https://github.com/mithunsatheesh/node-rules/wiki/Rules).

```js
{
    "condition" : (R, fact) => {
        R.when(fact.transactionTotal < 500);
    },
    "consequence" : (R, fact) => {
        fact.result = false;
        R.stop();
    }
}
```

Here priority is an optional parameter which will be used to specify priority of a rule over other rules when there are multiple rules running. In the above rule `R.when` evaluates the condition expression and `R.stop` used to stop further processing of the fact as we have arrived at a result.

The functions `R.stop`, `R.when`, `R.next`, `R.restart` are part of the Flow Control API which allows user to control the Engine Flow. Read more about [Flow Controls](https://github.com/mithunsatheesh/node-rules/wiki/Flow-Control-API) in [wiki](https://github.com/mithunsatheesh/node-rules/wiki).

###### 2. Defining a Fact

Facts are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes as you decide.

A sample Fact may look like

```json
{
  "name": "user4",
  "application": "MOB2",
  "transactionTotal": 400,
  "cardType": "Credit Card"
}
```

###### 3. Using the Rule Engine

The example below shows how to use the rule engine to apply a sample rule on a specific fact. Rules can be fed into the rule engine as Array of rules or as an individual rule object.

```js
const { RuleEngine } = require("node-rules");

/* Creating Rule Engine instance */
const R = new RuleEngine();

/* Add a rule */
const rule = {
  condition: (R, fact) => {
    R.when(fact.transactionTotal < 500);
  },
  consequence: (R, fact) => {
    fact.result = false;
    fact.reason = "The transaction was blocked as it was less than 500";
    R.stop();
  },
};

/* Register Rule */
R.register(rule);

/* Add a Fact with less than 500 as transaction, and this should be blocked */
let fact = {
  name: "user4",
  application: "MOB2",
  transactionTotal: 400,
  cardType: "Credit Card",
};

/* Check if the engine blocks it! */
R.execute(fact, (data) => {
  if (data.result !== false) {
    console.log("Valid transaction");
  } else {
    console.log("Blocked Reason:" + data.reason);
  }
});
```

###### 4. Controlling Rules running on the Rule Engine

If you are looking for ways to specify the order in which the rules get applied on a fact, it can be done via using the `priority` parameter. Read more about it in the [Rule wiki](https://github.com/mithunsatheesh/node-rules/wiki/Rules). If you need to know about how to change priority of rules or remove add new rules to a Running Rule Engine, you may read more about it in [Dynamic Control Wiki](https://github.com/mithunsatheesh/node-rules/wiki/Dynamic-Control).

###### 5. Exporting Rules to an external storage

To read more about storing rules running on the engine to an external DB, refer this [wiki article](https://github.com/mithunsatheesh/node-rules/wiki/Exporting-and-Importing-Rules).

#### Wiki

To read more about the Rule engine functions, please read [the wiki here](https://github.com/mithunsatheesh/node-rules/wiki)!. To find more examples of implementation please look in the [examples](https://github.com/mithunsatheesh/node-rules/tree/master/examples) folder.

#### Issues

Got issues with the implementation?. Feel free to open an issue [here](https://github.com/mithunsatheesh/node-rules/issues/new).

#### Licence

Node rules is distributed under the MIT License.

#### External References

- https://ieeexplore.ieee.org/document/7968566

#### Credits

The JSON friendly rule formats used in version 2.x.x of this module were initially based on the node module [jools](https://github.com/tdegrunt/jools).
The screencast image shown in this page is taken from [nmotv.in](http://nmotw.in/node-rules/) which has a pretty nice article on how to use this module!
