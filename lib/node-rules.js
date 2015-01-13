(function() {
    'use strict';

    var _ = require('underscore');

    exports.version = '2.2.1';

    function RuleEngine(rules) {

        this.rules = [];

        if(typeof(rules) != "undefined") {
            this.register(rules);
        }

        this.sync();
        return this;

    }

    RuleEngine.prototype.register = function(rules) {

        if(rules instanceof Array) {

            this.rules = this.rules.concat(rules);

        } else if(typeof(rules) != "undefined") {

            this.rules.push(rules);

        }
        this.sync();

    };


    RuleEngine.prototype.sync = function() {

        this.rules = this.rules.filter(function(a) {
            if(a.on === 1) {
                return a;
            }
        });

        this.rules.sort(function(a, b) {
            return b.priority - a.priority;
        });

    };


    RuleEngine.prototype.execute = function(fact, callback) {

        //these new attributes have to be in both last session and current session to support
        // the compare function
        fact.process = false;
        fact.result = true;

        var session = _.clone(fact);
        var lastSession = _.clone(fact);
        var _rules = this.rules;

        (function doit(x) {

            if (x < _rules.length && session.process === false) {

                var _rule = _rules[x].condition;

                _rule.call(session, function(outcome) {
                    
                    if (outcome) {

                        var _consequence = _rules[x].consequence;     
                        
                        _consequence.call(session, function() {

                            if (!_.isEqual(lastSession,session)) {
                                lastSession = _.clone(session);
                                process.nextTick(function(){
                                    return doit(0);
                                });
                            } else {
                                process.nextTick(function(){
                                    return doit(x+1);
                                });
                            }

                        });

                    } else {

                        process.nextTick(function(){
                            return doit(x+1);
                        });

                    } 

                
                }); 

            } else {
                process.nextTick(function(){
                    return callback(session);
                });
            }
            
        })(0);
    };

    RuleEngine.prototype.toJSON = function() {

        var rules = this.rules;

        if(rules instanceof Array) {

            rules = rules.map(function(rule){

                rule.condition = rule.condition.toString();
                return rule;

            });

        } else if(typeof(rules) != "undefined") {

            rules.condition = rules.condition.toString();

        }

        return rules;

    };

    RuleEngine.prototype.fromJSON = function(rules) {

        if(rules instanceof Array) {

            rules = rules.map(function(rule){

                rule.condition = eval("("+rule.condition+")");
                return rule;

            });

        } else if(typeof(rules) != "undefined") {

            rules.condition = eval("("+rules.condition+")");

        }
        
        this.register(rules);

    };

    module.exports = RuleEngine;

}(module.exports));