const { RuleEngine } = require('../dist/node-rules');
/* Sample Rule to block a transaction if its below 500 */
/** @type {import('../dist/node-rules').Rule} */
const rule = {
    condition(R) {
        R.when(this.someval < 10);
    },
    consequence(R) {
        console.log("%s: incrementing again till 10", this.someval++);
        R.restart();
    }
};
/* Creating Rule Engine instance and registering rule */
const R = new RuleEngine();
R.register(rule);
/* some val is 0 here, rules will recursively run till it becomes 10.
This just a mock to demo the restart feature. */
const fact = {
    someval: 0
};
R.execute(fact, data => {
    console.log("Finished with value", data.someval);
});