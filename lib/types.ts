export interface Consequence {
  (API: API, fact: Fact): void;
  ruleRef?: string | undefined;
}

export type Rule = {
  id?: string;
  index?: number;
  name?: string;
  on?: boolean;
  priority?: number;
  condition: (API: API, fact: Fact) => void;
  consequence: Consequence;
};

export type Fact = {
  [key: string]: any;
  matchPath?: string[];
};

export type Options = {
  ignoreFactChanges?: boolean;
};

export interface API {
  rule: () => Rule;
  when: (outcome: any) => void;
  restart: () => void;
  stop: () => void;
  next: () => void;
}
