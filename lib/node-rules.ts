import isEqual from 'lodash.isequal';
import cloneDeep from 'lodash.clonedeep';

export const version = '3.0.0';

export interface API {
    rule: () => any;
    when: (outcome: any) => void;
    restart: () => void;
    stop: () => void;
    next: () => void;
};

interface Rule {
    condition: (R: API) => void;
    consequence: (R: API) => void;
};

export class RuleEngine {
    public activeRules: any[];
    public rules: any[];
    ignoreFactChanges: any;

    constructor(rules?: any, options: { ignoreFactChanges?: boolean } = {}) {
        this.rules = [];
        this.activeRules = [];

        if (typeof(rules) !== "undefined") {
            this.register(rules);
        }

        if (options) {
            this.ignoreFactChanges = options.ignoreFactChanges;
        }
    }

    init() {
        this.rules = [];
        this.activeRules = [];
    }
    
    register(rules: any) {
        if (Array.isArray(rules)) {
            this.rules = this.rules.concat(rules);
        } else if (rules !== null && typeof(rules) == "object") {
            this.rules.push(rules);
        }
        this.sync();
    }

    sync() {
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
    }

    execute(fact: Record<string, unknown>, callback: (session: Record<string, unknown>) => void) {
        // These new attributes have to be in both last session
        // and current session to support the compare function
        const thisHolder = this;
        const session: any = cloneDeep({ ...fact, result: true });
        const matchPath: any[] = [];
        const ignoreFactChanges = this.ignoreFactChanges;

        let complete = false;
        let _rules = this.activeRules;
        let lastSession = cloneDeep({ ...fact, result: true });

        (function FnRuleLoop(x) {
            const API: API = {
                "rule": function() { return _rules[x]; },
                "when": function(outcome: any) {
                    if (outcome) {
                        const _consequence = _rules[x].consequence;
                        _consequence.ruleRef = _rules[x].id || _rules[x].name || `index_${x}`;
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
                        lastSession = cloneDeep(session);
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
                const _rule = _rules[x].condition;
                _rule.call(session, API, session);
            } else {
                thisHolder.nextTick(function() {
                    session.matchPath = matchPath;
                    return callback(session);
                });
            }
        })(0);
    }

    nextTick(callback: () => void) {
        process?.nextTick ? process?.nextTick(callback) : setTimeout(callback, 0);
    }

    findRules(query?: any) {
        if (typeof(query) === "undefined") {
            return this.rules;
        }

        // Clean the properties set to undefined in the search query if any to prevent miss match issues.
        Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
        // Return rules in the registered rules array which match partially to the query.
        return this.rules.filter(function (rule) {
            return Object.keys(query).some(function (key) {
                return query[key] === rule[key];
            });
        });
    }

    turn(state: string, filter: any) {
        const rules = this.findRules(filter);
        for (let i = 0, j = rules.length; i < j; i++) {
            rules[i].on = state.toLowerCase() === 'on';
        }
        this.sync();
    }

    prioritize(priority: number, filter: any) {
        const rules = this.findRules(filter);
        for (let i = 0, j = rules.length; i < j; i++) {
            rules[i].priority = priority;
        }
        this.sync();
    }    
}
