const { green, red, blue } = require('chalk');
const { RuleEngine } = require('../dist/node-rules');
const rules = [
    /**** Rule 1 ****/
    {
        name: "transaction minimum 500",
        priority: 3,
        on: true,
        condition(R) {
            R.when(this.transactionTotal < 500);
        },
        consequence(R) {
            console.log("Rule 1 matched - blocks transactions below value 500. Rejecting payment.");
            this.result = false;
            R.stop();
        }
    },
    /**** Rule 2 ****/
    {
        name: "high credibility customer - avoid checks and bypass",
        priority: 2,
        on: true,
        condition(R) {
            R.when(this.userCredibility && this.userCredibility > 5);
        },
        consequence(R) {
            console.log("Rule 2 matched - user credibility is more, then avoid further check. Accepting payment.");
            this.result = true;
            R.stop();
        }
    },
    /**** Rule 3 ****/
    {
        name: "block AME > 10000",
        priority: 4,
        on: true,
        condition(R) {
            R.when(this.cardType == "Credit Card" && this.cardIssuer == "American Express" && this.transactionTotal > 1000);
        },
        consequence(R) {
            console.log("Rule 3 matched - filter American Express payment above 10000. Rejecting payment.");
            this.result = false;
            R.stop();
        }
    },
    /**** Rule 4 ****/
    {
        name: "block Cashcard Payment",
        priority: 8,
        on: true,
        condition(R) {
            R.when(this.cardType == "Cash Card");
        },
        consequence(R) {
            console.log("Rule 4 matched - reject the payment if cash card. Rejecting payment.");
            this.result = false;
            R.stop();
        }
    },
    /**** Rule 5 ****/
    {
        name: "block guest payment above 10000",
        priority: 6,
        on: true,
        condition(R) {
            R.when(this.customerType && this.transactionTotal > 10000 && this.customerType == "guest");
        },
        consequence(R) {
            console.log("Rule 5 matched - reject if above 10000 and customer type is guest. Rejecting payment.");
            this.result = false;
            R.stop();
        }
    },
    /**** Rule 6 ****/
    {
        name: "is customer guest?",
        priority: 7,
        on: true,
        condition(R) {
            R.when(!this.userLoggedIn);
        },
        consequence(R) {
            console.log("Rule 6 matched - support rule written for blocking payment above 10000 from guests.");
            console.log("Process left to chain with rule 5.");
            this.customerType = "guest";
            R.next(); // the fact has been altered, so all rules will run again. No need to restart.
        }
    },
    /**** Rule 7 ****/
    {
        name: "block payment from specific app",
        priority: 5,
        on: true,
        condition(R) {
            R.when(this.appCode && this.appCode === "MOBI4");
        },
        consequence(R) {
            console.log("Rule 7 matched - block payment for Mobile. Reject Payment.");
            this.result = false;
            R.stop();
        }
    },
    /**** Rule 8 ****/
    {
        name: "event risk score",
        priority: 2,
        on: true,
        condition(R) {
            R.when(this.eventRiskFactor && this.eventRiskFactor < 5);
        },
        consequence(R) {
            console.log("Rule 8 matched - the event is not critical, so accept");
            this.result = true;
            R.stop();
        }
    },
    /**** Rule 9 ****/
    {
        name: "block ip range set",
        priority: 3,
        on: true,
        condition(R) {
        	const ipList = ["10.X.X.X", "12.122.X.X", "12.211.X.X", "64.X.X.X", "64.23.X.X", "74.23.211.92"];
            const allowedRegexp = new RegExp('^(?:' + ipList.join('|').replace(/\./g, '\\.').replace(/X/g, '[^.]+') + ')$');
            R.when(this.userIP && this.userIP.match(allowedRegexp));
        },
        consequence(R) {
            console.log("Rule 9 matched - ip falls in the given list, then block. Rejecting payment.");
            this.result = false;
            R.stop();
        }
    },
    /**** Rule 10 ****/
    {
        name: "check if user's name is blacklisted",
        priority: 1,
        on: true,
        condition(R) {
            const blacklist = ["user4"];
            R.when(this && blacklist.indexOf(this.name) > -1);
        },
        consequence(R) {
            console.log("Rule 10 matched - the user is malicious, then block. Rejecting payment.");
            this.result = false;
            R.stop();
        }
    }
];
/** example of cash card user, so payment blocked. ****/
const user1 = {
    userIP: "10.3.4.5",
    name: "user1",
    eventRiskFactor: 6,
    userCredibility: 1,
    appCode: "WEB1",
    userLoggedIn: false,
    transactionTotal: 12000,
    cardType: "Cash Card",
    cardIssuer: "OXI",
};
/** example of payment from blocked app, so payment blocked. ****/
const user2 = {
    userIP: "27.3.4.5",
    name: "user2",
    eventRiskFactor: 2,
    userCredibility: 2,
    appCode: "MOBI4",
    userLoggedIn: true,
    transactionTotal: 500,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
/** example of low priority event, so skips further checks. ****/
const user3 = {
    userIP: "27.3.4.5",
    name: "user3",
    eventRiskFactor: 2,
    userCredibility: 2,
    appCode: "WEB1",
    userLoggedIn: true,
    transactionTotal: 500,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
/** malicious list of users in rule 10 matches and exists. ****/
const user4 = {
    userIP: "27.3.4.5",
    name: "user4",
    eventRiskFactor: 8,
    userCredibility: 2,
    appCode: "WEB1",
    userLoggedIn: true,
    transactionTotal: 500,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
/** highly credible user exempted from further checks. ****/
const user5 = {
    userIP: "27.3.4.5",
    name: "user5",
    eventRiskFactor: 8,
    userCredibility: 8,
    appCode: "WEB1",
    userLoggedIn: true,
    transactionTotal: 500,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
/** example of a user whose ip listed in malicious list. ****/
const user6 = {
    userIP: "10.3.4.5",
    name: "user6",
    eventRiskFactor: 8,
    userCredibility: 2,
    appCode: "WEB1",
    userLoggedIn: true,
    transactionTotal: 500,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
/** example of a chained up rule. will take two iterations. ****/
const user7 = {
    userIP: "27.3.4.5",
    name: "user7",
    eventRiskFactor: 2,
    userCredibility: 2,
    appCode: "WEB1",
    userLoggedIn: false,
    transactionTotal: 100000,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
/** none of rule matches and fires exit clearance with accepted payment. ****/
const user8 = {
    userIP: "27.3.4.5",
    name: "user8",
    eventRiskFactor: 8,
    userCredibility: 2,
    appCode: "WEB1",
    userLoggedIn: true,
    transactionTotal: 500,
    cardType: "Credit Card",
    cardIssuer: "VISA",
};
const R = new RuleEngine(rules);
console.log(blue("----------"));
console.log(blue("start execution of rules"));
console.log(blue("----------"));
R.execute(user7, function(result) {
    if (result.result) console.log("Completed", green("User7 Accepted"));
    else console.log("Completed", red("User7 Rejected"));
});
R.execute(user1, function(result) {
    if (result.result) console.log("Completed", green("User1 Accepted"));
    else console.log("Completed", red("User1 Rejected"));
});
R.execute(user2, function(result) {
    if (result.result) console.log("Completed", green("User2 Accepted"));
    else console.log("Completed", red("User2 Rejected"));
});
R.execute(user3, function(result) {
    if (result.result) console.log("Completed", green("User3 Accepted"));
    else console.log("Completed", red("User3 Rejected"));
});
R.execute(user4, function(result) {
    if (result.result) console.log("Completed", green("User4 Accepted"));
    else console.log("Completed", red("User4 Rejected"));
});
R.execute(user5, function(result) {
    if (result.result) console.log("Completed", green("User5 Accepted"));
    else console.log("Completed", red("User5 Rejected"));
});
R.execute(user6, function(result) {
    if (result.result) console.log("Completed", green("User6 Accepted"));
    else console.log("Completed", red("User6 Rejected"));
});
R.execute(user8, function(result) {
    if (result.result) console.log("Completed", green("User8 Accepted"));
    else console.log("Completed", red("User8 Rejected"));
});