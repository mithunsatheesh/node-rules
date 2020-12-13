(function() {
    'use strict';
    exports.version = '3.0.0';

    var isEqual = require('lodash.isequal');
    var clonedeep = require('lodash.clonedeep');

    function RuleEngine(rules, options) {
        this.init();
        if (typeof(rules) != "undefined") {
            this.register(rules);
        }
        if (options) {
            this.ignoreFactChanges = options.ignoreFactChanges;
        }
        return this;
    };
    RuleEngine.prototype.init = function(rules) {
        this.rules = [];
        this.activeRules = [];
    };
    RuleEngine.prototype.register = function(rules) {
        if (Array.isArray(rules)) {
            this.rules = this.rules.concat(rules);
        } else if (rules !== null && typeof(rules) == "object") {
            this.rules.push(rules);
        }
        this.sync();
    };
    RuleEngine.prototype.sync = function() {
        this.activeRules = this.rules.filter(function(a) {
            if (typeof(a.on) === "undefined") {
                a.on = true;
            }
            if (a.on === true) {
                return a;
            }
        });
        this.activeRules.sort(function(a, b) {
            if (a.priority && b.priority) {
                return b.priority - a.priority;
            } else {
                return 0;
            }
        });
    };
    RuleEngine.prototype.execute = function(fact, callback) {
        //these new attributes have to be in both last session and current session to support
        // the compare function
        var thisHolder = this;
        var complete = false;
        fact.result = true;
        var session = clonedeep(fact);
        var lastSession = clonedeep(fact);
        var _rules = this.activeRules;
        var matchPath = [];
        var ignoreFactChanges = this.ignoreFactChanges;
        (function FnRuleLoop(x) {
            var API = {
                "rule": function() { return _rules[x]; },
                "when": function(outcome) {
                    if (outcome) {
                        var _consequence = _rules[x].consequence;
                        _consequence.ruleRef = _rules[x].id || _rules[x].name || 'index_'+x;
                        thisHolder.nextTick(function() {
                            matchPath.push(_consequence.ruleRef);
                            _consequence.call(session, API, session);
                        });
                    } else {
                        thisHolder.nextTick(function() {
                            API.next();
                        });
                    }
                },
                "restart": function() {
                    return FnRuleLoop(0);
                },
                "stop": function() {
                    complete = true;
                    return FnRuleLoop(0);
                },
                "next": function() {
                    if (!ignoreFactChanges && !isEqual(lastSession, session)) {
                        lastSession = clonedeep(session);
                        thisHolder.nextTick(function() {
                            API.restart();
                        });
                    } else {
                        thisHolder.nextTick(function() {
                            return FnRuleLoop(x + 1);
                        });
                    }
                }
            };
            _rules = thisHolder.activeRules;
            if (x < _rules.length && complete === false) {
                var _rule = _rules[x].condition;
                _rule.call(session, API, session);
            } else {
                thisHolder.nextTick(function() {
                    session.matchPath = matchPath;
                    return callback(session);
                });
            }
        })(0);
    };
    RuleEngine.prototype.nextTick = function(callbackFn) {
        if (typeof process !== 'undefined' && process.nextTick) {
            process.nextTick(callbackFn);
        } else {
            setTimeout(callbackFn, 0);
        }
    }; 
    RuleEngine.prototype.findRules = function(query) {
        if (typeof(query) === "undefined") {
            return this.rules;
        } else {
            // Clean the properties set to undefined in the search query if any to prevent miss match issues.
            Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
            // Return rules in the registered rules array which match partially to the query.
            return this.rules.filter(function (rule) {
                return Object.keys(query).some(function (key) {
                    return query[key] === rule[key];
                });
            });
        }
    };
    RuleEngine.prototype.turn = function(state, filter) {
        var state = (state === "on" || state === "ON") ? true : false;
        var rules = this.findRules(filter);
        for (var i = 0, j = rules.length; i < j; i++) {
            rules[i].on = state;
        }
        this.sync();
    };
    RuleEngine.prototype.prioritize = function(priority, filter) {
        priority = parseInt(priority, 10);
        var rules = this.findRules(filter);
        for (var i = 0, j = rules.length; i < j; i++) {
            rules[i].priority = priority;
        }
        this.sync();
    };
    module.exports = RuleEngine;
}(module.exports));
