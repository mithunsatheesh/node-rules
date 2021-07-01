var RuleEngine = require('../index');
describe("Rules", function() {
    describe(".init()", function() {
        it("should empty the existing rule array", function() {
            var rules = [{
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                }
            }];
            var R = new RuleEngine(rules);
            R.init();
            expect(R.rules).toEqual([]);
        });
    });
    describe(".register()", function() {
        it("Rule should be turned on if the field - ON is absent in the rule", function() {
            var rules = [{
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                }
            }];
            var R = new RuleEngine(rules);
            expect(R.rules[0].on).toEqual(true);
        });
        it("Rule can be passed to register as both arrays and individual objects", function() {
            var rule = {
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                }
            };
            var R1 = new RuleEngine(rule);
            var R2 = new RuleEngine([rule]);
            expect(R1.rules).toEqual(R2.rules);
        });
        it("Rules can be appended multiple times via register after creating rule engine instance", function() {
            var rules = [{
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                }
            }, {
                "condition": function(R) {
                    R.when(0);
                },
                "consequence": function(R) {
                    R.stop();
                }
            }];
            var R1 = new RuleEngine(rules);
            var R2 = new RuleEngine(rules[0]);
            var R3 = new RuleEngine();
            R2.register(rules[1]);
            expect(R1.rules).toEqual(R2.rules);
            R3.register(rules);
            expect(R1.rules).toEqual(R3.rules);
        });
    });
    describe(".sync()", function() {
        it("should only push active rules into active rules array", function() {
            var rules = [{
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                },
                "id": "one",
                "on": true
            }, {
                "condition": function(R) {
                    R.when(0);
                },
                "consequence": function(R) {
                    R.stop();
                },
                "id": "one",
                "on": false
            }];
            var R = new RuleEngine();
            R.register(rules);
            expect(R.activeRules).not.toEqual(R.rules);
        });
        it("should sort the rules accroding to priority, if priority is present", function() {
            var rules = [{
                "priority": 8,
                "index": 1,
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                },
            }, {
                "priority": 6,
                "index": 2,
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                },
            }, {
                "priority": 9,
                "index": 0,
                "condition": function(R) {
                    R.when(1);
                },
                "consequence": function(R) {
                    R.stop();
                },
            }];
            var R = new RuleEngine();
            R.register(rules);
            expect(R.activeRules[2].index).toEqual(2);
        });
    });
    describe(".exec()", function() {
        it("should run consequnce when condition matches", function() {
            var rule = {
                "condition": function(R) {
                    R.when(this && (this.transactionTotal < 500));
                },
                "consequence": function(R) {
                    this.result = false;
                    R.stop();
                }
            };
            var R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200
            }, function(result) {
                expect(result.result).toEqual(false);
            });
        });
        it("should chain rules and find result with next()", function() {
            var rule = [{
                "condition": function(R) {
                    R.when(this && (this.card == "VISA"));
                },
                "consequence": function(R) {
                    R.stop();
                    this.result = "Custom Result";
                },
                "priority": 4
            }, {
                "condition": function(R) {
                    R.when(this && (this.transactionTotal < 1000));
                },
                "consequence": function(R) {
                    R.next();
                },
                "priority": 8
            }];
            var R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200,
                "card": "VISA"
            }, function(result) {
                expect(result.result).toEqual("Custom Result");
            });
        });
        it("should provide access to rule definition properties via rule()", function() {
            var rule = {
                "name": "sample rule name",
                "id": "xyzzy",
                "condition": function(R) {
                    R.when(this && (this.input === true));
                },
                "consequence": function(R) {
                    this.result = true;
                    this.ruleName = R.rule().name;
                    this.ruleID = R.rule().id;
                    R.stop();
                }
            };
            var R = new RuleEngine(rule);
            R.execute({
                "input": true
            }, function(result) {
                expect(result.ruleName).toEqual(rule.name);
                expect(result.ruleID).toEqual(rule.id);
            });
        });
        it("should include the matched rule path", function() {
            var rules = [
                {
                    "name": "rule A",
                    "condition": function(R) {
                        R.when(this && (this.x === true));
                    },
                    "consequence": function(R) {
                        R.next();
                    }
                },
                {
                    "name": "rule B",
                    "condition": function(R) {
                        R.when(this && (this.y === true));
                    },
                    "consequence": function(R) {
                        R.next();
                    }
                },
                {
                    "id": "rule C",
                    "condition": function(R) {
                        R.when(this && (this.x === true && this.y === false));
                    },
                    "consequence": function(R) {
                        R.next();
                    }
                },
                {
                    "id": "rule D",
                    "condition": function(R) {
                        R.when(this && (this.x === false && this.y === false));
                    },
                    "consequence": function(R) {
                        R.next();
                    }
                },
                {
                    "condition": function(R) {
                        R.when(this && (this.x === true && this.y === false));
                    },
                    "consequence": function(R) {
                        R.next();
                    }
                }
            ];
            var lastMatch = 'index_' + ((rules.length)-1).toString();
            var R = new RuleEngine(rules);
            R.execute({
                "x": true,
                "y": false
            }, function(result) {
                expect(result.matchPath).toEqual([rules[0].name, rules[2].id, lastMatch]);
            });
        });

        it("should support fact as optional second parameter for es6 compatibility", function() {
            var rule = {
                "condition": function(R, fact) {
                    R.when(fact && (fact.transactionTotal < 500));
                },
                "consequence": function(R, fact) {
                    fact.result = false;
                    R.stop();
                }
            };
            var R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200
            }, function(result) {
                expect(result.result).toEqual(false);
            });
        });

        it("should work even when process.NextTick is unavailable", function() {
            process.nextTick = undefined;

            var rule = {
                "condition": function(R) {
                    R.when(this && (this.transactionTotal < 500));
                },
                "consequence": function(R) {
                    this.result = false;
                    R.stop();
                }
            };
            var R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200
            }, function(result) {
                expect(result.result).toEqual(false);
            });
        });

    });
    describe(".findRules()", function() {
        var rules = [{
            "condition": function(R) {
                R.when(1);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "one"
        }, {
            "condition": function(R) {
                R.when(0);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "two"
        }];
        var R = new RuleEngine(rules);
        it("find selector function for rules should exact number of matches", function() {
            expect(R.findRules({
                "id": "one"
            }).length).toEqual(1);
        });
        it("find selector function for rules should give the correct match as result", function() {
            expect(R.findRules({
                "id": "one"
            })[0].id).toEqual("one");
        });
        it("find selector function should filter off undefined entries in the query if any", function() {
            expect(R.findRules({
                "id": "one",
                "myMistake": undefined
            })[0].id).toEqual("one");
        });
        it("find without condition works fine", function() {
            expect(R.findRules().length).toEqual(2);
        });
    });
    describe(".turn()", function() {
        var rules = [{
            "condition": function(R) {
                R.when(1);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "one"
        }, {
            "condition": function(R) {
                R.when(0);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "two",
            "on": false
        }];
        var R = new RuleEngine(rules);
        it("checking whether turn off rules work as expected", function() {
            R.turn("OFF", {
                "id": "one"
            });
            expect(R.findRules({
                "id": "one"
            })[0].on).toEqual(false);
        });
        it("checking whether turn on rules work as expected", function() {
            R.turn("ON", {
                "id": "two"
            });
            expect(R.findRules({
                "id": "two"
            })[0].on).toEqual(true);
        });
    });
    describe(".prioritize()", function() {
        var rules = [{
            "condition": function(R) {
                R.when(1);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "two",
            "priority": 1
        }, {
            "condition": function(R) {
                R.when(0);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "zero",
            "priority": 8
        }, {
            "condition": function(R) {
                R.when(0);
            },
            "consequence": function(R) {
                R.stop();
            },
            "id": "one",
            "priority": 4
        }];
        var R = new RuleEngine(rules);
        it("checking whether prioritize work", function() {
            R.prioritize(10, {
                "id": "one"
            });
            expect(R.findRules({
                "id": "one"
            })[0].priority).toEqual(10);
        });
        it("checking whether rules reorder after prioritize", function() {
            R.prioritize(10, {
                "id": "one"
            });
            expect(R.activeRules[0].id).toEqual("one");
        });
    });
    describe("ignoreFactChanges", function() {
        var rules = [{
            "name": "rule1",
            "condition": function(R) {
                R.when(this.value1 > 5);
            },
            "consequence": function(R) {
                this.result = false;
                this.errors = this.errors || [];
                this.errors.push('must be less than 5');
                R.next();
            }
        }];

        var fact = {
            "value1": 6
        };

        it("doesn't rerun when a fact changes if ignoreFactChanges is true", function(done) {
            var R = new RuleEngine(rules, { ignoreFactChanges: true });

            R.execute(fact, function(result) {
                expect(result.errors).toHaveLength(1);
                done();
            });
        });
    });
    describe("test Parallelism", function() {
        var rules = [
            {
                "name": "high credibility customer - avoid checks and bypass",
                "priority": 4,
                "on": true,
                "condition": function(R) {
                    R.when(this.userCredibility && this.userCredibility > 5);
                },
                "consequence": function(R) {
                    this.result = true;
                    R.stop();
                }
            },
            {
                "name": "block guest payment above 10000",
                "priority": 3,
                "condition": function(R) {
                    R.when(this.customerType && this.transactionTotal > 10000 && this.customerType == "guest");
                },
                "consequence": function(R) {
                    this.result = false;
                    R.stop();
                }
            },
            {
                "name": "is customer guest?",
                "priority": 2,
                "condition": function(R) {
                    R.when(!this.userLoggedIn);
                },
                "consequence": function(R) {
                    this.customerType = "guest";
                    // the fact has been altered above, so all rules will run again since ignoreFactChanges is not set.
                    R.next();
                }
            },
            {
                "name": "block Cashcard Payment",
                "priority": 1,
                "condition": function(R) {
                    R.when(this.cardType == "Cash Card");
                },
                "consequence": function(R) {
                    this.result = false;
                    R.stop();
                }
            }
        ];

        var straightFact = {
            "name": "straightFact",
            "userCredibility": 1,
            "userLoggedIn": true,
            "transactionTotal": 12000,
            "cardType": "Cash Card"
        };

        /** example of a chaned up rule. will take two iterations. ****/
        var chainedFact = {
            "name": "chainedFact",
            "userCredibility": 2,
            "userLoggedIn": false,
            "transactionTotal": 100000,
            "cardType": "Credit Card"
        };

        it("context switches and finishes the fact which needs least iteration first", function(done) {
            var R = new RuleEngine(rules);
            var isStraightFactFast = false;

            R.execute(chainedFact, function(result) {
                expect(isStraightFactFast).toBe(true);
                done();
            });

            R.execute(straightFact, function(result) {
                isStraightFactFast = true;
            });

        });
    });
});