import { cloneDeep, isEqual } from 'lodash';

type GenericObject = Record<string | number | symbol, unknown>;

type SessionType<TFact extends GenericObject> = TFact & {
    result: boolean;
    matchPath?: string[];
};

export interface API<TFact extends GenericObject> {
    rule: () => Rule<TFact>;
    when: (outcome: boolean | number) => void;
    restart: () => void;
    stop: () => void;
    next: () => void;
}

interface Consequence<TFact extends GenericObject> {
    (this: SessionType<TFact>, R: API<TFact>, fact: SessionType<TFact>): void;
    ruleRef?: string;
}

export interface Rule<TFact extends GenericObject> {
    id?: string;
    name?: string;
    on?: boolean;
    priority?: number;
    index?: number;
    condition: (this: SessionType<TFact>, R: API<TFact>, fact: SessionType<TFact>) => void;
    consequence: Consequence<TFact>;
}

export class RuleEngine<TFact extends GenericObject> {
    public activeRules: Rule<TFact>[];
    public rules: Rule<TFact>[];
    public ignoreFactChanges?: boolean;

    constructor(rules?: Rule<TFact> | Rule<TFact>[], options: { ignoreFactChanges?: boolean } = {}) {
        this.rules = [];
        this.activeRules = [];

        if (typeof rules !== 'undefined') {
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

    register(rules: Rule<TFact> | Rule<TFact>[]) {
        if (Array.isArray(rules)) {
            this.rules = this.rules.concat(rules);
        } else if (rules !== null && typeof rules == 'object') {
            this.rules.push(rules);
        }
        this.sync();
    }

    sync() {
        this.activeRules = this.rules.filter((rule) => {
            if (typeof rule.on === 'undefined') {
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

    execute(fact: TFact, callback: (session: SessionType<TFact>) => void) {
        // These new attributes have to be in both last session
        // and current session to support the compare function
        const thisHolder = this;
        const session: SessionType<TFact> = cloneDeep({
            ...fact,
            result: true,
            matchPath: undefined,
        });
        const matchPath: string[] = [];
        const ignoreFactChanges = this.ignoreFactChanges;

        let complete = false;
        let _rules = this.activeRules;
        let lastSession = cloneDeep({ ...fact, result: true });

        (function FnRuleLoop(x) {
            const API: API<TFact> = {
                rule() {
                    return _rules[x];
                },
                when(outcome: boolean | number) {
                    if (outcome) {
                        const _consequence = _rules[x].consequence;
                        _consequence.ruleRef = _rules[x].id || _rules[x].name || `index_${x}`;
                        thisHolder.nextTick(function () {
                            matchPath.push(_consequence.ruleRef!);
                            _consequence.call(session, API, session);
                        });
                    } else {
                        thisHolder.nextTick(function () {
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
                },
            };

            _rules = thisHolder.activeRules;
            if (x < _rules.length && complete === false) {
                const _rule = _rules[x].condition;
                _rule.call(session, API, session);
            } else {
                thisHolder.nextTick(function () {
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
        if (typeof query === 'undefined') {
            return this.rules;
        }

        // Clean the properties set to undefined in the search query if any to prevent miss match issues.
        Object.keys(query).forEach((key) => query[key] === undefined && delete query[key]);

        // Return rules in the registered rules array which match partially to the query.
        return this.rules.filter((rule) => {
            return Object.keys(query).some((key) => {
                return query[key] === rule[key as keyof Rule<TFact>];
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
