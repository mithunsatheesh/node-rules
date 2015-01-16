var RuleEngine = require('../index');


/**** Support function written for mocking db calls for rule 10 ****/
function dbQuery(query,name,cb) {
	
	var start = new Date().getTime();
	var now;
	
	while(now = new Date().getTime()) {
		
		if((now-start) > 600) {
		
			//value user4 is assumed fetched from db or file with delay. used the while sleeper to demo it.
			if(name == "user4")
				return cb(1);
			else
				return cb(0);
		
		}
		
	}	
	
}




var rules = [
  
  /**** Rule 1 ****/
  {
	"name": "transaction minimum",
	"description": "blocks transactions below value x",
	"priority": 3,
	"on":true,
	"condition":
		function(R) {
			R.when(this && (this.transactionTotal < 500));
		},
	"consequence":
		function(R) {
			console.log("Rule 1 matched for "+this.name+": blocks transactions below value 500. Rejecting payment.");
			this.result = false;
			R.stop();
		}
  },
  /**** Rule 2 ****/
  {
	"name" : "high credibility customer - avoid checks and bypass",
	"description" : "if the users credibility value is more, then avoid checking further.",
	"priority":2,
	"on":true, 
	"condition":
		function(R) {
			R.when(this && this.userCredibility && (this.userCredibility > 5));
		},
	"consequence":
		function(R) {
			console.log("Rule 2 matched for "+this.name+": if the users credibility value is more, then avoid checking further. Accepting payment. ");
			this.result = true; 
			R.stop();
		}
  },
  /**** Rule 3 ****/
  {
	"name": "block AME > 10000",
	"description": "filter American Express credit cards for payment above 10000",
	"priority": 4,
	"on":true,
	"condition":
		function(R) {
			R.when(this && (this.cardType == "Credit Card") && (this.cardIssuer == "American Express") && (this.transactionTotal > 1000));
		},
	"consequence":
		function(R) {
			console.log("Rule 3 matched for "+this.name+": filter American Express credit cards for payment above 10000. Rejecting payment.");
			this.result = false;
			R.stop();
		}
  },
  /**** Rule 4 ****/
  {
	"name":"block Cashcard Payment",
	"description": "reject the payment if the payment type belong to cash card",
	"priority":8,
	"on":true,
	"condition":
		function(R) {
			
			R.when(this && (this.cardType == "Cash Card"));
			
		},
	"consequence":
		function(R) {
			
			console.log("Rule 4 matched for "+this.name+": reject the payment if the payment type belong to cash card. Rejecting payment.");
			this.result = false; 
			R.stop();
            
		}
  },
  /**** Rule 5 ****/
  {
	"name":"block guest payment above 10000",
	"description": "reject the payment if the payment above 10000 and customer type is guest",
	"priority":6,
	"on":true,
	"condition":
		function(R) {
			R.when(this && this.customerType && (this.transactionTotal > 10000) && (this.customerType == "guest"));
		},
	"consequence":
		function(R) {
			console.log("Rule 5 matched for "+this.name+": reject the payment if the payment above 10000 and customer type is guest. Rejecting payment.");
			this.result = false; 
			R.stop();
		}
  },
  /**** Rule 6 ****/
  {
	"name" : "is customer guest?",
	"description" : "support rule written for blocking payment above 10000 from guests",
	"priority":7,
	"on":true,
	"condition":
		function(R) {
			R.when(this && !this.userLoggedIn);
		},
	"consequence":
		function(R) {
			console.log("Rule 6 matched for "+this.name+": support rule written for blocking payment above 10000 from guests. complete left to chain with rule 6.");
			this.customerType = "guest"; 
            R.next();
		}  
  },
  /**** Rule 7 ****/
  {
	"name" : "block payment from specific app",
	"description" : "turn on this rule to block the payment from a specific app",
	"priority":5,
	"on":true, 
	"condition":
		function(R) {
			R.when(this && this.appCode && (this.appCode == "MOBI4"));
		},
	"consequence":
		function(R) {
			console.log("Rule 7 matched for "+this.name+": turn on this rule to block the payment from a specific app. Reject Paymant.");
			this.result = false; 
			R.stop();
		}
  },
  /**** Rule 8 ****/
  {
	"name" : "event risk score",
	"description" : "if the event is top priority event, then do further checks else leave.",
	"priority":2,
	"on":true, 
	"condition":
		function(R) {
			R.when(this && this.eventRiskFactor && (this.eventRiskFactor < 5));
		},
	"consequence":
		function(R) {
			console.log("Rule 8 matched for "+this.name+": if the event is top priority event, then do further checks else leave. Accept payment as low priority event.");
			this.result = true; 
			R.stop();
		}
  },
  /**** Rule 9 ****/
  {
	"name" : "block ip range set",
	"description" : "if the ip fall in the given list of formats, then block the transaction.",
	"priority":3,
	"on":true, 
	"condition":
		function(R) {
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
			R.when(this && this.userIP && this.userIP.match(allowedRegexp));
		},
	"consequence":
		function(R) {
			console.log("Rule 9 matched for "+this.name+": if the ip fall in the given list of formats, then block the transaction. Rejecting payment.");
			this.result = false; 
			R.stop();
		}
  },
  /**** Rule 10 * fails 
  
  This rule has to be rewritten. Because the rules defined should not have closures which prevent its 
  export-ability. Pass the details as fact.
  
  {
	"name" : "check if user's name is blacklisted in db",
	"description" : "if the user's name is found then block transaction.",
	"priority":1,
	"on":1, 
	"condition":
		function(cb) {
			
			 dbQuery("query",this.name,function(x){ cb(this && x); });
		
		},
	"consequence":
		function(cb) {
			
			console.log("Rule 10 matched for "+this.name+": if the user is malicious, then block the transaction. Rejecting payment.");
			this.result = false; 
			this.complete = true;
            cb();
		
		}
  }****/
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

/** malicious list of users in rule 10 matches and exists. ****/
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

/** none of rule matches and fires exit clearance with accepted payment. ****/
var user8 =  {
  "userIP": "27.3.4.5",
  "name":"user8",
  "eventRiskFactor":8,
  "userCredibility":2,
  "appCode":"WEB1",
  "userLoggedIn":true,
  "transactionTotal":500,
  "cardType":"Credit Card",
  "cardIssuer":"VISA",
  
};


var R = new RuleEngine(rules);

console.log("\n-------\nstart execution of rules\n------");

R.execute(user7,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

/*R.execute(user1,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n"); console.log(result); });

R.execute(user2,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user3,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user4,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user5,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user6,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });

R.execute(user8,function(result){ if(result.result) console.log("\n-----Payment Accepted for----\n"); else console.log("\n-----Payment Rejected for----\n");console.log(result); });
*/