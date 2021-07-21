const { RuleEngine } = require('../dist/node-rules');

/* Sample Rule to block a transaction if its below 500 */
/** @type {import('../dist/node-rules').Rule} */
const rule = {
    condition(R) {
        R.when(this.transactionTotal < 500);
    },
    consequence(R) {
        this.result = false;
        this.reason = "The transaction was blocked as it was less than 500";
        R.stop();
    }
};

/* Creating Rule Engine instance and registering rule */
const R = new RuleEngine();
R.register(rule);

/* Fact with less than 500 as transaction, and this should be blocked */
const fact = {
    name: "user4",
    application: "MOB2",
    transactionTotal: 400,
    cardType: "Credit Card"
};

R.execute(fact, data => {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});