const { RuleEngine } = require("node-rules");

/* Set of Rules to be applied */
var rules = [
  {
    priority: 4,
    condition: function (R, fact) {
      R.when(fact.transactionTotal < 500);
    },
    consequence: function (R, fact) {
      fact.result = false;
      fact.reason = "The transaction was blocked as it was less than 500";
      R.stop();
    },
  },
  {
    priority: 10, // this will apply first
    condition: function (R, fact) {
      R.when(fact.cardType === "Debit");
    },
    consequence: function (R, fact) {
      fact.result = false;
      fact.reason =
        "The transaction was blocked as debit cards are not allowed";
      R.stop();
    },
  },
];
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rules);
/* Fact with more than 500 as transaction but a Debit card, and this should be blocked */
var fact = {
  name: "user4",
  application: "MOB2",
  transactionTotal: 600,
  cardType: "Debit",
};
/* This fact will be blocked by the Debit card rule as its of more priority */
R.execute(fact, function (data) {
  if (data.result !== false) {
    console.log("Valid transaction");
  } else {
    console.log("Blocked Reason:" + data.reason);
  }
});
