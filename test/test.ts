import { expect } from 'chai';
import { API, RuleEngine } from '../lib/node-rules';

describe("Rules", function() {
    describe(".init()", function() {
        it("should empty the existing rule array", function() {
            const rules = [{
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                }
            }];
            const R = new RuleEngine(rules);
            R.init();
            expect(R.rules).to.deep.equal([]);
        });
    });
    describe(".register()", function() {
        it("Rule should be turned on if the field - ON is absent in the rule", function() {
            const rules = [{
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                }
            }];
            const R = new RuleEngine(rules);
            expect(R.rules[0].on).to.equal(true);
        });
        it("Rule can be passed to register as both arrays and individual objects", function() {
            const rule = {
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                }
            };
            const R1 = new RuleEngine(rule);
            const R2 = new RuleEngine([rule]);
            expect(R1.rules).to.deep.equal(R2.rules);
        });
        it("Rules can be appended multiple times via register after creating rule engine instance", function() {
            const rules = [{
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                }
            }, {
                condition(R: API) {
                    R.when(0);
                },
                consequence(R: API) {
                    R.stop();
                }
            }];
            const R1 = new RuleEngine(rules);
            const R2 = new RuleEngine(rules[0]);
            const R3 = new RuleEngine();
            R2.register(rules[1]);
            expect(R1.rules).to.deep.equal(R2.rules);
            R3.register(rules);
            expect(R1.rules).to.deep.equal(R3.rules);
        });
    });
    describe(".sync()", function() {
        it("should only push active rules into active rules array", function() {
            const rules = [{
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                },
                "id": "one",
                "on": true
            }, {
                condition(R: API) {
                    R.when(0);
                },
                consequence(R: API) {
                    R.stop();
                },
                "id": "one",
                "on": false
            }];
            const R = new RuleEngine();
            R.register(rules);
            expect(R.activeRules).not.to.equal(R.rules);
        });
        it("should sort the rules according to priority, if priority is present", function() {
            const rules = [{
                "priority": 8,
                "index": 1,
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                },
            }, {
                "priority": 6,
                "index": 2,
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                },
            }, {
                "priority": 9,
                "index": 0,
                condition(R: API) {
                    R.when(1);
                },
                consequence(R: API) {
                    R.stop();
                },
            }];
            const R = new RuleEngine();
            R.register(rules);
            expect(R.activeRules[2].index).to.equal(2);
        });
    });
    describe(".exec()", function() {
        it("should run consequence when condition matches", function() {
            const rule = {
                condition(this: any, R: API) {
                    R.when(this && (this.transactionTotal < 500));
                },
                consequence(this: any, R: API) {
                    this.result = false;
                    R.stop();
                }
            };
            const R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200
            }, function(result) {
                expect(result.result).to.equal(false);
            });
        });
        it("should chain rules and find result with next()", function() {
            const rule = [{
                condition(this: any, R: API) {
                    R.when(this && (this.card == "VISA"));
                },
                consequence(this: any, R: API) {
                    R.stop();
                    this.result = "Custom Result";
                },
                "priority": 4
            }, {
                condition(this: any, R: API) {
                    R.when(this && (this.transactionTotal < 1000));
                },
                consequence(R: API) {
                    R.next();
                },
                "priority": 8
            }];
            const R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200,
                "card": "VISA"
            }, function(result) {
                expect(result.result).to.equal("Custom Result");
            });
        });
        it("should provide access to rule definition properties via rule()", function() {
            const rule = {
                "name": "sample rule name",
                "id": "xyzzy",
                condition(this: any, R: API) {
                    R.when(this && (this.input === true));
                },
                consequence(this: any, R: API) {
                    this.result = true;
                    this.ruleName = R.rule().name;
                    this.ruleID = R.rule().id;
                    R.stop();
                }
            };
            const R = new RuleEngine(rule);
            R.execute({
                "input": true
            }, function(result) {
                expect(result.ruleName).to.equal(rule.name);
                expect(result.ruleID).to.equal(rule.id);
            });
        });
        it("should include the matched rule path", function() {
            const rules = [
                {
                    "name": "rule A",
                    condition(this: any, R: API) {
                        R.when(this && (this.x === true));
                    },
                    consequence(R: API) {
                        R.next();
                    }
                },
                {
                    "name": "rule B",
                    condition(this: any, R: API) {
                        R.when(this && (this.y === true));
                    },
                    consequence(R: API) {
                        R.next();
                    }
                },
                {
                    "id": "rule C",
                    condition(this: any, R: API) {
                        R.when(this && (this.x === true && this.y === false));
                    },
                    consequence(R: API) {
                        R.next();
                    }
                },
                {
                    "id": "rule D",
                    condition(this: any, R: API) {
                        R.when(this && (this.x === false && this.y === false));
                    },
                    consequence(R: API) {
                        R.next();
                    }
                },
                {
                    condition(this: any, R: API) {
                        R.when(this && (this.x === true && this.y === false));
                    },
                    consequence(R: API) {
                        R.next();
                    }
                }
            ];
            const lastMatch = 'index_' + ((rules.length)-1).toString();
            const R = new RuleEngine(rules);
            R.execute({
                "x": true,
                "y": false
            }, function(result) {
                expect(result.matchPath).to.deep.equal([rules[0].name, rules[2].id, lastMatch]);
            });
        });

        it("should support fact as optional second parameter for es6 compatibility", function() {
            const rule = {
                condition(R: API, fact: any) {
                    R.when(fact && (fact.transactionTotal < 500));
                },
                consequence(R: API, fact: any) {
                    fact.result = false;
                    R.stop();
                }
            };
            const R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200
            }, function(result) {
                expect(result.result).to.equal(false);
            });
        });

        it("should work even when process.NextTick is unavailable", function() {
            // @ts-expect-error
            process.nextTick = undefined;

            const rule = {
                condition(this: any, R: API) {
                    R.when(this && (this.transactionTotal < 500));
                },
                consequence(this: any, R: API) {
                    this.result = false;
                    R.stop();
                }
            };
            const R = new RuleEngine(rule);
            R.execute({
                "transactionTotal": 200
            }, function(result) {
                expect(result.result).to.equal(false);
            });
        });

    });
    describe(".findRules()", function() {
        const rules = [{
            condition(R: API) {
                R.when(1);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "one"
        }, {
            condition(R: API) {
                R.when(0);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "two"
        }];
        const R = new RuleEngine(rules);
        it("find selector function for rules should exact number of matches", function() {
            expect(R.findRules({
                "id": "one"
            }).length).to.equal(1);
        });
        it("find selector function for rules should give the correct match as result", function() {
            expect(R.findRules({
                "id": "one"
            })[0].id).to.equal("one");
        });
        it("find selector function should filter off undefined entries in the query if any", function() {
            expect(R.findRules({
                "id": "one",
                "myMistake": undefined
            })[0].id).to.equal("one");
        });
        it("find without condition works fine", function() {
            expect(R.findRules().length).to.equal(2);
        });
    });
    describe(".turn()", function() {
        const rules = [{
            condition(R: API) {
                R.when(1);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "one"
        }, {
            condition(R: API) {
                R.when(0);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "two",
            "on": false
        }];
        const R = new RuleEngine(rules);
        it("checking whether turn off rules work as expected", function() {
            R.turn("OFF", {
                "id": "one"
            });
            expect(R.findRules({
                "id": "one"
            })[0].on).to.equal(false);
        });
        it("checking whether turn on rules work as expected", function() {
            R.turn("ON", {
                "id": "two"
            });
            expect(R.findRules({
                "id": "two"
            })[0].on).to.equal(true);
        });
    });
    describe(".prioritize()", function() {
        const rules = [{
            condition(R: API) {
                R.when(1);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "two",
            "priority": 1
        }, {
            condition(R: API) {
                R.when(0);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "zero",
            "priority": 8
        }, {
            condition(R: API) {
                R.when(0);
            },
            consequence(R: API) {
                R.stop();
            },
            "id": "one",
            "priority": 4
        }];
        const R = new RuleEngine(rules);
        it("checking whether prioritize work", function() {
            R.prioritize(10, {
                "id": "one"
            });
            expect(R.findRules({
                "id": "one"
            })[0].priority).to.equal(10);
        });
        it("checking whether rules reorder after prioritize", function() {
            R.prioritize(10, {
                "id": "one"
            });
            expect(R.activeRules[0].id).to.equal("one");
        });
    });
    describe("ignoreFactChanges", function() {
        const rules = [{
            "name": "rule1",
            condition(this: any, R: API) {
                R.when(this.value1 > 5);
            },
            consequence(this: any, R: API) {
                this.result = false;
                this.errors = this.errors || [];
                this.errors.push('must be less than 5');
                R.next();
            }
        }];

        const fact = {
            "value1": 6
        };

        it("doesn't rerun when a fact changes if ignoreFactChanges is true", function(done) {
            const R = new RuleEngine(rules, { ignoreFactChanges: true });

            R.execute(fact, function(result) {
                expect(result.errors).to.have.length(1);
                done();
            });
        });
    });
    describe("test Parallelism", function() {
        const rules = [
            {
                "name": "high credibility customer - avoid checks and bypass",
                "priority": 4,
                "on": true,
                condition(this: any, R: API) {
                    R.when(this.userCredibility && this.userCredibility > 5);
                },
                consequence(this: any, R: API) {
                    this.result = true;
                    R.stop();
                }
            },
            {
                "name": "block guest payment above 10000",
                "priority": 3,
                condition(this: any, R: API) {
                    R.when(this.customerType && this.transactionTotal > 10000 && this.customerType == "guest");
                },
                consequence(this: any, R: API) {
                    this.result = false;
                    R.stop();
                }
            },
            {
                "name": "is customer guest?",
                "priority": 2,
                condition(this: any, R: API) {
                    R.when(!this.userLoggedIn);
                },
                consequence(this: any, R: API) {
                    this.customerType = "guest";
                    // the fact has been altered above, so all rules will run again since ignoreFactChanges is not set.
                    R.next();
                }
            },
            {
                "name": "block Cashcard Payment",
                "priority": 1,
                condition(this: any, R: API) {
                    R.when(this.cardType == "Cash Card");
                },
                consequence(this: any, R: API) {
                    this.result = false;
                    R.stop();
                }
            }
        ];

        const straightFact = {
            "name": "straightFact",
            "userCredibility": 1,
            "userLoggedIn": true,
            "transactionTotal": 12000,
            "cardType": "Cash Card"
        };

        /** example of a chained up rule. will take two iterations. ****/
        const chainedFact = {
            "name": "chainedFact",
            "userCredibility": 2,
            "userLoggedIn": false,
            "transactionTotal": 100000,
            "cardType": "Credit Card"
        };

        it("context switches and finishes the fact which needs least iteration first", function(done) {
            const R = new RuleEngine(rules);
            const isStraightFactFast = false;

            R.execute(chainedFact, function(result) {
                expect(isStraightFactFast).to.be.true;
                done();
            });

            R.execute(straightFact, function(result) {
                isStraightFactFast = true;
            });

        });
    });
});