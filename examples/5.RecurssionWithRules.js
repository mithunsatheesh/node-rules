var RuleEngine = require('../index');
/* Sample Rule to block a transaction if its below 500 */
var rule = {
    "condition": function(R) {
        R.when(this.someval < 10);
    },
    "consequence": function(R) {
        console.log(++this.someval, " : incrementing again till 10");
        R.restart();
    }
};
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rule);
/* some val is 0 here, rules will recursively run till it becomes 10.
This just a mock to demo the restart feature. */
var fact = {
    "someval": 0
};
R.execute(fact, function(data) {
    console.log("Finished with value", data.someval);
});