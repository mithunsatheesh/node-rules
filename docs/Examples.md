The example below shows how to use the rule engine to apply a sample rule on a specific fact. Rules fed into the rule engine may be as Array of rules or as individual rule objects.

```js
//import the package
const { RuleEngine } = require("node-rules");

//define the rules
const rules = [
  {
    condition: (R, fact) => {
      R.when(fact && fact.transactionTotal < 500);
    },
    consequence: (R, fact) => {
      fact.result = false;
      R.stop();
    },
  },
];
/*as you can see above we removed the priority 
and on properties for this example as they are optional.*/

//sample fact to run the rules on
let fact = {
  userIP: "27.3.4.5",
  name: "user4",
  application: "MOB2",
  userLoggedIn: true,
  transactionTotal: 400,
  cardType: "Credit Card",
};

//initialize the rule engine
const R = new RuleEngine(rules);

//Now pass the fact on to the rule engine for results
R.execute(fact, (result) => {
  if (result.result) console.log("\n-----Payment Accepted----\n");
  else console.log("\n-----Payment Rejected----\n");
});
```
