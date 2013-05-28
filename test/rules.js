var RuleEngine = require('../index');


var rules = [
  
  /**** Rule 1 ****/
  {
	"name": "transaction minimum",
	"description": "blocks transactions below value x",
	"priority": 3,
	"on":1,
	"condition":
		function(fact,cb) {
			return cb(fact && (fact.transactionTotal < 500));
		},
	"consequence":
		function(cb) {
			console.log("Rule 1 matched for "+this.name+": blocks transactions below value 500. Rejecting payment.");
			this.result = false;
			this.process = true;
            cb();
		}
  },
  /**** Rule 2 ****/
  {
	"name" : "high credibility customer - avoid checks and bypass",
	"description" : "if the users credibility value is more, then avoid checking further.",
	"priority":2,
	"on":1, 
	"condition":
		function(fact,cb) {
			return cb(fact && fact.userCredibility && (fact.userCredibility > 5));
		},
	"consequence":
		function(cb) {
			console.log("Rule 2 matched for "+this.name+": if the users credibility value is more, then avoid checking further. Accepting payment. ");
			this.result = true; 
			this.process = true;
            cb();
		}
  },
  /**** Rule 3 ****/
  {
	"name": "block AME > 10000",
	"description": "filter American Express credit cards for payment above 10000",
	"priority": 4,
	"on":1,
	"condition":
		function(fact,cb) {
			return cb(fact && (fact.cardType == "Credit Card") && (fact.cardIssuer == "American Express") && (fact.transactionTotal > 1000));
		},
	"consequence":
		function(cb) {
			console.log("Rule 3 matched for "+this.name+": filter American Express credit cards for payment above 10000. Rejecting payment.");
			this.result = false;
			this.process = true;
            cb();
		}
  },
  /**** Rule 4 ****/
  {
	"name":"block Cashcard Payment",
	"description": "reject the payment if the payment type belong to cash card",
	"priority":8,
	"on":1,
	"condition":
		function(fact,cb) {
			return cb(fact && (fact.cardType == "Cash Card"));
		},
	"consequence":
		function(cb) {
			console.log("Rule 4 matched for "+this.name+": reject the payment if the payment type belong to cash card. Rejecting payment.");
			this.result = false; 
			this.process = true;
            cb();
		}
  },
  /**** Rule 5 ****/
  {
	"name":"block guest payment above 10000",
	"description": "reject the payment if the payment above 10000 and customer type is guest",
	"priority":6,
	"on":1,
	"condition":
		function(fact,cb) {
			return cb(fact && fact.customerType && (fact.transactionTotal > 10000) && (fact.customerType == "guest"));
		},
	"consequence":
		function(cb) {
			console.log("Rule 5 matched for "+this.name+": reject the payment if the payment above 10000 and customer type is guest. Rejecting payment.");
			this.result = false; 
			this.process = true;
            cb();
		}
  },
  /**** Rule 6 ****/
  {
	"name" : "is customer guest?",
	"description" : "support rule written for blocking payment above 10000 from guests",
	"priority":7,
	"on":1,
	"condition":
		function(fact,cb) {
			return cb(fact && !fact.userLoggedIn);
		},
	"consequence":
		function(cb) {
			console.log("Rule 6 matched for "+this.name+": support rule written for blocking payment above 10000 from guests. Process left to chain with rule 6.");
			this.customerType = "guest"; 
            cb();
		}  
  },
  /**** Rule 7 ****/
  {
	"name" : "block payment from specific app",
	"description" : "turn on this rule to block the payment from a specific app",
	"priority":5,
	"on":1, 
	"condition":
		function(fact,cb) {
			return cb(fact && fact.appCode && (fact.appCode == "MOBI4"));
		},
	"consequence":
		function(cb) {
			console.log("Rule 7 matched for "+this.name+": turn on this rule to block the payment from a specific app. Reject Paymant.");
			this.result = false; 
			this.process = true;
            cb();
		}
  },
  /**** Rule 8 ****/
  {
	"name" : "event risk score",
	"description" : "if the event is top priority event, then do further checks else leave.",
	"priority":2,
	"on":1, 
	"condition":
		function(fact,cb) {
			return cb(fact && fact.eventRiskFactor && (fact.eventRiskFactor < 5));
		},
	"consequence":
		function(cb) {
			console.log("Rule 8 matched for "+this.name+": if the event is top priority event, then do further checks else leave. Accept payment as low priority event.");
			this.result = true; 
			this.process = true;
            cb();
		}
  },
  /**** Rule 9 ****/
  {
	"name" : "block ip range set",
	"description" : "if the ip fall in the given list of formats, then block the transaction.",
	"priority":3,
	"on":1, 
	"condition":
		function(fact,cb) {
			 var allowedRegexp = new RegExp('^(?:' + 
			  [ 
			  "10.X.X.X", 
			  "12.122.X.X",
			  "12.211.X.X",
			  "64.X.X.X",
			  "64.23.X.X",
			  "74.23.211.92"
			].join('|').replace(/\./g, '\\.').replace(/X/g, '[^.]+') + 
			')$');
			return cb(fact && fact.userIP && fact.userIP.match(allowedRegexp));
		},
	"consequence":
		function(cb) {
			console.log("Rule 9 matched for "+this.name+": if the ip fall in the given list of formats, then block the transaction. Rejecting payment.");
			this.result = false; 
			this.process = true;
            cb();
		}
  }
];


/** example of cash card user, so payment blocked. ****/
var user1 =  {
  "userIP": "10.3.4.5",
  "name":"user1",
  "eventRiskFactor":6,
  "userCredibility":1,
  "appCode":"WEB1",
  "userLoggedIn":false,
  "transactionTotal":12000,
  "cardType":"Cash Card",
  "cardIssuer":"OXI",
  
};

/** example of payment from blocked app, so payemnt blocked. ****/
var user2 =  {
  "userIP": "27.3.4.5",
  "name":"user2",
  "eventRiskFactor":2,
  "userCredibility":2,
  "appCode":"MOBI4",
  "userLoggedIn":true,
  "transactionTotal":500,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};

/** example of low priority event, so skips frther checks. ****/
var user3 =  {
  "userIP": "27.3.4.5",
  "name":"user3",
  "eventRiskFactor":2,
  "userCredibility":2,
  "appCode":"WEB1",
  "userLoggedIn":true,
  "transactionTotal":500,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};

/** none of rule matches and fires exit clearance. ****/
var user4 =  {
  "userIP": "27.3.4.5",
  "name":"user4",
  "eventRiskFactor":8,
  "userCredibility":2,
  "appCode":"WEB1",
  "userLoggedIn":true,
  "transactionTotal":500,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};

/** highly credible user exempted from further checks. ****/
var user5 =  {
  "userIP": "27.3.4.5",
  "name":"user5",
  "eventRiskFactor":8,
  "userCredibility":8,
  "appCode":"WEB1",
  "userLoggedIn":true,
  "transactionTotal":500,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};

/** example of a user whose ip listed in malicious list. ****/
var user6 =  {
  "userIP": "10.3.4.5",
  "name":"user6",
  "eventRiskFactor":8,
  "userCredibility":2,
  "appCode":"WEB1",
  "userLoggedIn":true,
  "transactionTotal":500,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};

/** example of a chaned up rule. will take two iterations. ****/
var user7 =  {
  "userIP": "27.3.4.5",
  "name":"user7",
  "eventRiskFactor":2,
  "userCredibility":2,
  "appCode":"WEB1",
  "userLoggedIn":false,
  "transactionTotal":100000,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};


var R = new RuleEngine(rules);

console.log("\n-------\nstart execution of rules\n------");

R.execute(user7,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user1,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n"); console.log(result); });

R.execute(user2,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user3,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user4,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user5,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user6,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

