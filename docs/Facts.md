Facts are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes as you decide.

A sample Fact may look like

    {
	  "userIP": "27.3.4.5",
	  "name":"user4",
	  "application":"MOB2",
	  "userLoggedIn":true,
	  "transactionTotal":400,
	  "cardType":"Credit Card",
    }

The above fact goes through the rule engine when its executed. The conditions inside each rule will inspect the attributes again user defined conditions and consequences will be applied if they match for the fact. 