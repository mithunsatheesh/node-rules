const { RuleEngine } = require("node-rules");

/* Sample Rule to block a transaction if its below 500 */
var rule = {
  condition: function (R, fact) {
    R.when(fact.transactionTotal < 500);
  },
  consequence: function (R, fact) {
    fact.result = false;
    fact.reason = `The transaction was blocked as the transaction total of ${fact.transactionTotal} was less than threshold 500`;
    R.stop();
  },
};

/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rule);
/* Fact with less than 500 as transaction, and this should be blocked */
var fact = {
  name: "user4",
  application: "MOB2",
  transactionTotal: 400,
  cardType: "Credit Card",
};

R.execute(fact, function (data) {
  if (data.result !== false) {
    console.log("Valid transaction");
  } else {
    console.log("Blocked Reason:" + data.reason);
  }
});
