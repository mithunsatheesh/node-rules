var RuleEngine = require('../index');
/* Here we can see a rule which upon matching its condition,
does some processing and passes it to other rules for processing */
var rules = [{
    "condition": function(R) {
        R.when(this.application === "MOB");
    },
    "consequence": function(R) {
        this.isMobile = true;
        R.next();//we just set a value on to fact, now lests process rest of rules
    }
}, {
    "condition": function(R) {
        R.when(this.cardType === "Debit");
    },
    "consequence": function(R) {
        this.result = false;
        this.reason = "The transaction was blocked as debit cards are not allowed";
        R.stop();
    }
}];
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rules);
/* Fact with more than 500 as transaction but a Debit card, and this should be blocked */
var fact = {
    "name": "user4",
    "application": "MOB",
    "transactionTotal": 600,
    "cardType": "Credit"
};
R.execute(fact, function(data) {

    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }

    if(data.isMobile) {
        console.log("It was from a mobile device too!!");
    }

});