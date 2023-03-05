interface Consequence {
    (API: API, fact: Fact): void;
    ruleRef?: string | undefined;
}
type Rule = {
    id?: string;
    index?: number;
    name?: string;
    on?: boolean;
    priority?: number;
    condition: (API: API, fact: Fact) => void;
    consequence: Consequence;
};
type Fact = {
    [key: string]: any;
    matchPath?: string[];
};
type Options = {
    ignoreFactChanges?: boolean;
};
interface API {
    rule: () => Rule;
    when: (outcome: any) => void;
    restart: () => void;
    stop: () => void;
    next: () => void;
}

declare class RuleEngine {
    rules: Rule[];
    activeRules: Rule[];
    private ignoreFactChanges;
    constructor(rules?: Rule | Rule[], options?: Options);
    init(): void;
    register(rules: Rule | Rule[]): void;
    sync(): void;
    execute(fact: Fact, callback: (fact: Fact) => void): void;
    nextTick(callback: () => void): void;
    findRules(query?: Record<string, unknown>): Rule[];
    turn(state: string, filter?: Record<string, unknown>): void;
    prioritize(priority: number, filter?: Record<string, unknown>): void;
}

export { RuleEngine };
