import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";

import { Rule, Options, Fact, API } from "./types";

export class RuleEngine {
  public rules: Rule[] = [];
  public activeRules: Rule[] = [];
  private ignoreFactChanges: boolean = false;

  constructor(rules?: Rule | Rule[], options?: Options) {
    if (rules) {
      this.register(rules);
    }
    if (options) {
      this.ignoreFactChanges = options.ignoreFactChanges || false;
    }
  }

  init(): void {
    this.rules = [];
    this.activeRules = [];
  }

  register(rules: Rule | Rule[]): void {
    if (Array.isArray(rules)) {
      this.rules.push(...rules);
    } else if (rules !== null && typeof rules === "object") {
      this.rules.push(rules);
    }
    this.sync();
  }

  sync(): void {
    this.activeRules = this.rules.filter((a) => {
      if (typeof a.on === "undefined") {
        a.on = true;
      }
      if (a.on === true) {
        return a;
      }
    });
    this.activeRules.sort((a, b) => {
      if (a.priority && b.priority) {
        return b.priority - a.priority;
      } else {
        return 0;
      }
    });
  }

  execute(fact: Fact, callback: (fact: Fact) => void): void {
    const thisHolder = this;
    let complete = false;
    const session = cloneDeep(fact);
    let lastSession = cloneDeep(fact);
    let rules = this.activeRules;
    const matchPath: string[] = [];
    const ignoreFactChanges = this.ignoreFactChanges;

    function FnRuleLoop(x: number) {
      const API: API = {
        rule: () => rules[x],
        when: (outcome: boolean) => {
          if (outcome) {
            const _consequence = rules[x].consequence;
            _consequence.ruleRef = rules[x].id || rules[x].name || `index_${x}`;
            thisHolder.nextTick(() => {
              matchPath.push(_consequence.ruleRef as string);
              _consequence.call(session, API, session);
            });
          } else {
            thisHolder.nextTick(() => {
              API.next();
            });
          }
        },
        restart: () => FnRuleLoop(0),
        stop: () => {
          complete = true;
          return FnRuleLoop(0);
        },
        next: () => {
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

      rules = thisHolder.activeRules;
      if (x < rules.length && !complete) {
        const _rule = rules[x].condition;
        _rule.call(session, API, session);
      } else {
        thisHolder.nextTick(() => {
          session.matchPath = matchPath;
          callback(session);
        });
      }
    }
    FnRuleLoop(0);
  }

  nextTick(callback: () => void) {
    process?.nextTick ? process?.nextTick(callback) : setTimeout(callback, 0);
  }

  findRules(query?: Record<string, unknown>) {
    if (typeof query === "undefined") {
      return this.rules;
    }

    // Clean the properties set to undefined in the search query if any to prevent miss match issues.
    Object.keys(query).forEach(
      (key) => query[key] === undefined && delete query[key]
    );

    // Return rules in the registered rules array which match partially to the query.
    return this.rules.filter((rule: any) => {
      return Object.keys(query).some((key: any) => {
        return query[key] === rule[key];
      });
    });
  }

  turn(state: string, filter?: Record<string, unknown>) {
    const rules = this.findRules(filter);
    for (let i = 0, j = rules.length; i < j; i++) {
      rules[i].on = state.toLowerCase() === "on";
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
