const { RuleEngine } = require("node-rules");

/* Here we can see a rule which upon matching its condition,
does some processing and passes it to other rules for processing */
var rules = [
  {
    condition: function (R, fact) {
      R.when(fact.application === "MOB");
    },
    consequence: function (R, fact) {
      fact.isMobile = true;
      R.next(); //we just set a value on to fact, now lests process rest of rules
    },
  },
  {
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

/* Fact is mobile with Credit card type. This should go through */
var fact = {
  name: "user4",
  application: "MOB",
  transactionTotal: 600,
  cardType: "Credit",
};
R.execute(fact, function (data) {
  if (data.result !== false) {
    console.log("Valid transaction");
  } else {
    console.log("Blocked Reason:" + data.reason);
  }

  if (data.isMobile) {
    console.log("It was from a mobile device too!!");
  }
});
