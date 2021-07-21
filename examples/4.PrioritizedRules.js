const { RuleEngine } = require('../dist/node-rules');

/* Set of Rules to be applied */
/** @type {import('../dist/node-rules').Rule[]} */
const rules = [{
    priority: 4,
    condition(R) {
        R.when(this.transactionTotal < 500);
    },
    consequence(R) {
        this.result = false;
        this.reason = "The transaction was blocked as it was less than 500";
        R.stop();
    }
}, {
    priority: 10, // this will apply first
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

/* This fact will be blocked by the Debit card rule as its of more priority */
R.execute(fact, data => {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});