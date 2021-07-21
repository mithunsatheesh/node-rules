const { RuleEngine } = require('../dist/node-rules');

/* Set of Rules to be applied
First blocks a transaction if less than 500
Second blocks a debit card transaction.*/
/*Note that here we are not specifying which rule to apply first.
Rules will be applied as per their index in the array.
If you need to enforce priority manually, then see examples with prioritized rules */
/** @type {import('../dist/node-rules').Rule[]} */
const rules = [{
    condition(R) {
        R.when(this.transactionTotal < 500);
    },
    consequence(R) {
        this.result = false;
        this.reason = "The transaction was blocked as it was less than 500";
        R.stop();//stop if matched. no need to process next rule.
    }
}, {
    condition(R) {
        R.when(this.cardType === "Debit");
    },
    consequence(R) {
        this.result = false;
        this.reason = "The transaction was blocked as debit cards are not allowed";
        R.stop();
    }
}];

/* Creating Rule Engine instance and registering rule */
const R = new RuleEngine();
R.register(rules);

/* Fact with more than 500 as transaction but a Debit card, and this should be blocked */
const fact = {
    name: "user4",
    application: "MOB2",
    transactionTotal: 600,
    cardType: "Debit"
};

R.execute(fact, data => {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});