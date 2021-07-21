import isEqual from 'lodash.isequal';
import cloneDeep from 'lodash.clonedeep';

export const version = '3.0.0';

export interface API {
    rule: () => any;
    when: (outcome: boolean | number) => void;
    restart: () => void;
    stop: () => void;
    next: () => void;
};

interface Consequence {
    (R: API, fact: Record<string, unknown>): void;
    ruleRef?: string;
}

export interface Rule {
    id?: string;
    name?: string;
    on?: boolean;
    priority?: number;
    index?: number;
    condition: (R: API, fact: Record<string, unknown>) => void;
    consequence: Consequence;
};

export class RuleEngine {
    public activeRules: Rule[];
    public rules: Rule[];
    public ignoreFactChanges?: boolean;

    constructor(rules?: Rule | Rule[], options: { ignoreFactChanges?: boolean } = {}) {
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
    
    register(rules: Rule | Rule[]) {
        if (Array.isArray(rules)) {
            this.rules = this.rules.concat(rules);
        } else if (rules !== null && typeof(rules) == "object") {
            this.rules.push(rules);
        }
        this.sync();
    }

    sync() {
        this.activeRules = this.rules.filter(rule => {
            if (typeof(rule.on) === "undefined") {
                rule.on = true;
            }

            if (rule.on === true) {
                return rule;
            }
        });
        this.activeRules.sort((a, b) => {
            if (a.priority && b.priority) {
                return b.priority - a.priority;
            }

            return 0;
        });
    }

    execute(fact: Record<string, unknown>, callback: (session: Record<string, unknown>) => void) {
        // These new attributes have to be in both last session
        // and current session to support the compare function
        const thisHolder = this;
        const session = cloneDeep({ ...fact, result: true }) as { result: boolean, matchPath?: string[] };
        const matchPath: string[] = [];
        const ignoreFactChanges = this.ignoreFactChanges;

        let complete = false;
        let _rules = this.activeRules;
        let lastSession = cloneDeep({ ...fact, result: true });

        (function FnRuleLoop(x) {
            const API: API = {
                rule() { return _rules[x]; },
                when(outcome: boolean | number) {
                    if (outcome) {
                        const _consequence = _rules[x].consequence;
                        _consequence.ruleRef = _rules[x].id || _rules[x].name || `index_${x}`;
                        thisHolder.nextTick(function() {
                            matchPath.push(_consequence.ruleRef!);
                            _consequence.call(session, API, session);
                        });
                    } else {
                        thisHolder.nextTick(function() {
                            API.next();
                        });
                    }
                },
                restart() {
                    return FnRuleLoop(0);
                },
                stop() {
                    complete = true;
                    return FnRuleLoop(0);
                },
                next() {
                    if (!ignoreFactChanges && !isEqual(lastSession, session)) {
                        lastSession = cloneDeep(session);
                        thisHolder.nextTick(() => {
                            API.restart();
                        });
                    } else {
                        thisHolder.nextTick(() => {
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

    findRules(query?: Record<string, unknown>) {
        if (typeof(query) === "undefined") {
            return this.rules;
        }

        // Clean the properties set to undefined in the search query if any to prevent miss match issues.
        Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);

        // Return rules in the registered rules array which match partially to the query.
        return this.rules.filter(rule => {
            return Object.keys(query).some(key => {
                return query[key] === rule[key as keyof Rule];
            });
        });
    }

    turn(state: string, filter?: Record<string, unknown>) {
        const rules = this.findRules(filter);
        for (let i = 0, j = rules.length; i < j; i++) {
            rules[i].on = state.toLowerCase() === 'on';
        }
        this.sync();
    }

    prioritize(priority: number, filter?: Record<string, unknown>) {
        const rules = this.findRules(filter);
        for (let i = 0, j = rules.length; i < j; i++) {
            rules[i].priority = priority;
        }
        this.sync();
    }    
}
