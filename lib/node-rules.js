'use strict';

const isEqual = require('lodash.isequal');
const clonedeep = require('lodash.clonedeep');

class RuleEngine {
  constructor(rules, options) {
    this.init();
    this.ignoreFactChanges = false;
    if (rules) {
      this.register(rules);
    }
    if (options) {
      this.ignoreFactChanges = options.ignoreFactChanges || false;
    }
  }

  init() {
    this.rules = [];
    this.activeRules = [];
  }

  register(rules) {
    if (Array.isArray(rules)) {
      this.rules.push(...rules);
    } else if (rules !== null && typeof rules === "object") {
      this.rules.push(rules);
    }
    this.sync();
  }

  sync() {
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

  execute(fact, callback) {
    const thisHolder = this;
    let complete = false;
    fact.result = true;
    const session = clonedeep(fact);
    let lastSession = clonedeep(fact);
    let rules = this.activeRules;
    const matchPath = [];
    const ignoreFactChanges = this.ignoreFactChanges;

    function FnRuleLoop(x) {
      const API = {
        rule: () => rules[x],
        when: (outcome) => {
          if (outcome) {
            const _consequence = rules[x].consequence;
            _consequence.ruleRef = rules[x].id || rules[x].name || `index_${x}`;
            thisHolder.nextTick(() => {
              matchPath.push(_consequence.ruleRef);
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
            lastSession = clonedeep(session);
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

  nextTick(callbackFn) {
    if (typeof process !== "undefined" && process.nextTick) {
      process.nextTick(callbackFn);
    } else {
      setTimeout(callbackFn, 0);
    }
  }

  findRules(query) {
    if (query === undefined) {
      return this.rules;
    }

    // Remove any properties set to undefined in the search query to prevent mismatches
    Object.keys(query).forEach(
      (key) => query[key] === undefined && delete query[key]
    );

    // Return rules in the registered rules array which match partially to the query.
    return this.rules.filter((rule) => {
      return Object.keys(query).some((key) => {
        return query[key] === rule[key];
      });
    });
  }

  turn(state, filter) {
    const newState = state.toLowerCase() === "on";
    const rules = this.findRules(filter);
    rules.forEach((rule) => {
      rule.on = newState;
    });
    this.sync();
  }

  prioritize(priority, filter) {
    priority = parseInt(priority, 10);
    const rules = this.findRules(filter);
    rules.forEach((rule) => {
      rule.priority = priority;
    });
    this.sync();
  }
}

module.exports = RuleEngine;
