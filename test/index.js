var RuleEngine = require('../index');
var expect = require("chai").expect;

describe("Rules", function() {
   
   	describe(".init()", function() {
       
       it("should empty the existing rule array", function(){
           
           	var rules = [
  			{
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop();}
			}];
       		var R = new RuleEngine(rules);
       		R.init();

       		expect(R.rules).to.eql([]);
       });

	});


   	describe(".register()", function() {
       
       it("Rule should be turned on if the field - ON is absent in the rule", function(){
           
           	var rules = [
  			{
				"condition": function(R) {	R.when(1); },
				"consequence": function(R) { R.stop(); }
			}];
       		var R = new RuleEngine(rules);

       		expect(R.rules[0].on).to.eql(true);
       });
       
       it("Rule can be passed to register as both arrays and individual objects", function(){
           
           	var rule = {
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop(); }
			};
       		var R1 = new RuleEngine(rule);
       		var R2 = new RuleEngine([rule]);

       		expect(R1.rules).to.eql(R2.rules);
       });

       it("Rules can be appended multiple times via register after creating rule engine instance", function(){
           
           	var rules = [{
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop(); }
			},{ "condition": function(R) { R.when(0); },
				"consequence": function(R) { R.stop(); }
			}];
       		var R1 = new RuleEngine(rules);
       		var R2 = new RuleEngine(rules[0]);
       		R2.register(rules[1]);

       		expect(R1.rules).to.eql(R2.rules);
       });

	});


	describe(".sync()", function() {
       
       it("should only push active rules into active rules array", function(){
           
           	var rules = [{
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop(); },"id" : "one", "on" : true
			},{ "condition": function(R) { R.when(0); },
				"consequence": function(R) { R.stop(); },"id" : "one", "on" : false
			}];
       		var R = new RuleEngine();
       		R.register(rules);

       		expect(R.activeRules).not.to.eql(R.rules);
       });

       it("should sort the rules accroding to priority, if priority is present", function(){
           
           	var rules = [{
           		"priority" : 8,
				"index" : 1,
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop(); },
				
			},{
           		"priority" : 6,
				"index" : 2,
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop(); },
				
			},{
           		"priority" : 9,
				"index" : 0,
				"condition": function(R) { R.when(1); },
				"consequence": function(R) { R.stop(); },
				
			}
			];
       		var R = new RuleEngine();
       		R.register(rules);

       		expect(R.activeRules[2].index).to.eql(2);
       });

	});

	describe(".exec()", function() {
       
       it("should run consequnce when condition matches", function(){
           
           	var rule = {
				"condition":function(R) {
					R.when(this && (this.transactionTotal < 500));
				},
				"consequence":function(R) {
					this.result = false;
					R.stop();
				}
			};
       		var R = new RuleEngine(rule);
       		R.execute({
			  "transactionTotal":200
			},function(result){
				expect(result.result).to.eql(false);
			});

       	});

       	it("should chain rules and find result with next()", function(){
           
           	var rule = [{
				"condition":function(R) {
					R.when(this && (this.card == "VISA"));
				},
				"consequence":function(R) {
					R.stop();
					this.result = "Custom Result";
				},"priority":4
			},{
				"condition":function(R) {
					R.when(this && (this.transactionTotal < 1000));
				},
				"consequence":function(R) {
					R.next();
				},"priority":8
			}];
       		var R = new RuleEngine(rule);
       		R.execute({
			  "transactionTotal":200,"card":"VISA"
			},function(result){
				expect(result.result).to.eql("Custom Result");
			});

       	});

	});
	
	describe(".findRules()", function() {
       
		var rules = [{
			"condition": function(R) { R.when(1); },
			"consequence": function(R) { R.stop(); },"id" : "one"
		},{ "condition": function(R) { R.when(0); },
			"consequence": function(R) { R.stop(); },"id" : "two"
		}];
   		var R = new RuleEngine(rules);

       it("find selector function for rules should exact number of matches", function(){
           expect(R.findRules({"id" : "one"}).length).to.eql(1);
       });

       it("find selector function for rules should give the correct match as result", function(){
           expect(R.findRules({"id" : "one"})[0].id).to.eql("one");
       });

	});

	describe(".turn()", function() {
       
		var rules = [{
			"condition": function(R) { R.when(1); },
			"consequence": function(R) { R.stop(); },"id" : "one"
		},{ "condition": function(R) { R.when(0); },
			"consequence": function(R) { R.stop(); },"id" : "two","on":false
		}];
   		var R = new RuleEngine(rules);

       it("checking whether turn off rules work as expected", function(){
           R.turn("OFF",{"id" : "one"});
           expect(R.findRules({"id" : "one"})[0].on).to.eql(false);
       });

       it("checking whether turn on rules work as expected", function(){
           R.turn("ON",{"id" : "two"});
           expect(R.findRules({"id" : "two"})[0].on).to.eql(true);
       });

	});

	describe(".prioritize()", function() {
       
		var rules = [{
			"condition": function(R) { R.when(1); },
			"consequence": function(R) { R.stop(); },"id" : "two","priority":1
		},{ "condition": function(R) { R.when(0); },
			"consequence": function(R) { R.stop(); },"id" : "zero","priority":8
		},{ "condition": function(R) { R.when(0); },
			"consequence": function(R) { R.stop(); },"id" : "one","priority":4
		}];
   		var R = new RuleEngine(rules);

       it("checking whether prioritize work", function(){
           R.prioritize(10,{"id" : "one"});
           expect(R.findRules({"id" : "one"})[0].priority).to.eql(10);
       });

       it("checking whether rules reorder after prioritize", function(){
           R.prioritize(10,{"id" : "one"});
           expect(R.activeRules[0].id).to.eql("one");
       });

	});

	describe(".toJSON() & .fromJSON", function() {
       
       var rules = [
			{
			"condition": function(R) { R.when(1); },
			"consequence": function(R) { R.stop();},"on":true
		}];
       
       it("rules after toJSON and fromJSON back should be equivalent to the old form", function(){
       		var R1 = new RuleEngine(rules);
       		var store = R1.toJSON();
       		var R2 = new RuleEngine();
       		R2.fromJSON(store);
       		expect(R1.rules).to.eql(R2.rules);
       });

       it("rules serilisation & back working fine?", function(){
       		var R = new RuleEngine(rules);
       		var store = R.toJSON();
       		R.fromJSON(store);
       		expect(rules).to.eql(R.rules);
       });

	});

});
