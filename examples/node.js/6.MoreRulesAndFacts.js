const { RuleEngine } = require("node-rules");

const COLORS = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

const rules = [
  /**** Rule 1 ****/
  {
    name: "transaction minimum 500",
    priority: 3,
    on: true,
    condition: function (R, f) {
      R.when(f.transactionTotal < 500);
    },
    consequence: function (R, f) {
      console.log(
        "Rule 1 matched - blocks transactions below value 500. Rejecting payment."
      );
      f.result = false;
      R.stop();
    },
  },
  /**** Rule 2 ****/
  {
    name: "high credibility customer - avoid checks and bypass",
    priority: 2,
    on: true,
    condition: function (R, f) {
      R.when(f.userCredibility && f.userCredibility > 5);
    },
    consequence: function (R, f) {
      console.log(
        "Rule 2 matched - user credibility is more, then avoid further check. Accepting payment."
      );
      f.result = true;
      R.stop();
    },
  },
  /**** Rule 3 ****/
  {
    name: "block AME > 10000",
    priority: 4,
    on: true,
    condition: function (R, f) {
      R.when(
        f.cardType == "Credit Card" &&
          f.cardIssuer == "American Express" &&
          f.transactionTotal > 1000
      );
    },
    consequence: function (R, f) {
      console.log(
        "Rule 3 matched - filter American Express payment above 10000. Rejecting payment."
      );
      f.result = false;
      R.stop();
    },
  },
  /**** Rule 4 ****/
  {
    name: "block Cashcard Payment",
    priority: 8,
    on: true,
    condition: function (R, f) {
      R.when(f.cardType == "Cash Card");
    },
    consequence: function (R, f) {
      console.log(
        "Rule 4 matched - reject the payment if cash card. Rejecting payment."
      );
      f.result = false;
      R.stop();
    },
  },
  /**** Rule 5 ****/
  {
    name: "block guest payment above 10000",
    priority: 6,
    on: true,
    condition: function (R, f) {
      R.when(
        f.customerType &&
          f.transactionTotal > 10000 &&
          f.customerType == "guest"
      );
    },
    consequence: function (R, f) {
      console.log(
        "Rule 5 matched - reject if above 10000 and customer type is guest. Rejecting payment."
      );
      f.result = false;
      R.stop();
    },
  },
  /**** Rule 6 ****/
  {
    name: "is customer guest?",
    priority: 7,
    on: true,
    condition: function (R, f) {
      R.when(!f.userLoggedIn);
    },
    consequence: function (R, f) {
      console.log(
        "Rule 6 matched - support rule written for blocking payment above 10000 from guests."
      );
      console.log("Process left to chain with rule 5.");
      f.customerType = "guest";
      R.next(); // the fact has been altered, so all rules will run again. No need to restart.
    },
  },
  /**** Rule 7 ****/
  {
    name: "block payment from specific app",
    priority: 5,
    on: true,
    condition: function (R, f) {
      R.when(f.appCode && f.appCode === "MOBI4");
    },
    consequence: function (R, f) {
      console.log("Rule 7 matched - block payment for Mobile. Reject Payment.");
      f.result = false;
      R.stop();
    },
  },
  /**** Rule 8 ****/
  {
    name: "event risk score",
    priority: 2,
    on: true,
    condition: function (R, f) {
      R.when(f.eventRiskFactor && f.eventRiskFactor < 5);
    },
    consequence: function (R, f) {
      console.log("Rule 8 matched - the event is not critical, so accept");
      f.result = true;
      R.stop();
    },
  },
  /**** Rule 9 ****/
  {
    name: "block ip range set",
    priority: 3,
    on: true,
    condition: function (R, f) {
      var ipList = [
        "10.X.X.X",
        "12.122.X.X",
        "12.211.X.X",
        "64.X.X.X",
        "64.23.X.X",
        "74.23.211.92",
      ];
      var allowedRegexp = new RegExp(
        "^(?:" +
          ipList.join("|").replace(/\./g, "\\.").replace(/X/g, "[^.]+") +
          ")$"
      );
      R.when(f.userIP && f.userIP.match(allowedRegexp));
    },
    consequence: function (R, f) {
      console.log(
        "Rule 9 matched - ip falls in the given list, then block. Rejecting payment."
      );
      f.result = false;
      R.stop();
    },
  },
  /**** Rule 10 ****/
  {
    name: "check if user's name is blacklisted",
    priority: 1,
    on: true,
    condition: function (R, f) {
      var blacklist = ["user4"];
      R.when(f && blacklist.indexOf(f.name) > -1);
    },
    consequence: function (R, f) {
      console.log(
        "Rule 10 matched - the user is malicious, then block. Rejecting payment."
      );
      f.result = false;
      R.stop();
    },
  },
];
/** example of cash card user, so payment blocked. ****/
let user1 = {
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

/** example of payment from blocked app, so payemnt blocked. ****/
let user2 = {
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

/** example of low priority event, so skips frther checks. ****/
let user3 = {
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
let user4 = {
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
let user5 = {
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
let user6 = {
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

/** example of a chaned up rule. will take two iterations. ****/
let user7 = {
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
let user8 = {
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

console.log(COLORS.yellow, "----------");
console.log(COLORS.yellow, "start execution of rules");
console.log(COLORS.yellow, "----------");

R.execute(user7, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User7 Accepted");
  else console.log(COLORS.red, "Completed", "User7 Rejected");
});
R.execute(user1, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User1 Accepted");
  else console.log(COLORS.red, "Completed", "User1 Rejected");
});
R.execute(user2, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User2 Accepted");
  else console.log(COLORS.red, "Completed", "User2 Rejected");
});
R.execute(user3, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User3 Accepted");
  else console.log(COLORS.red, "Completed", "User3 Rejected");
});
R.execute(user4, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User4 Accepted");
  else console.log(COLORS.red, "Completed", "User4 Rejected");
});
R.execute(user5, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User5 Accepted");
  else console.log(COLORS.red, "Completed", "User5 Rejected");
});
R.execute(user6, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User6 Accepted");
  else console.log(COLORS.red, "Completed", "User6 Rejected");
});
R.execute(user8, function (result) {
  if (result.result !== false)
    console.log(COLORS.green, "Completed", "User8 Accepted");
  else console.log(COLORS.red, "Completed", "User8 Rejected");
});
