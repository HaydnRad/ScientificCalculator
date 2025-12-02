declare const input: HTMLInputElement;
declare const display: HTMLElement;
declare const operations: dict<Function>;
declare const constants: dict<number>;
declare function append(value: string): void;
declare function backspace(): void;
declare function refreshDisplay(): void;
declare function clearScreen(): void;
interface dict<T> {
    [index: string]: T;
}
declare const tokenTypes: {
    Numeral: number;
    Constant: number;
    Function: number;
    Operator: number;
    Grouping: number;
};
interface token {
    type: number;
    lexeme: string;
    precedence: number;
}
declare function makeToken(type: number, lexeme: string): token;
declare class node {
    leftNode: node | null;
    rightNode: node | null;
    token: token;
    constructor(token: token);
    evaluate(): number;
}
declare function getLexemeType(lexeme: string): number;
declare enum precCategories {
    stop = -1,
    min = 0,
    low = 1,
    addition = 2,
    multiplication = 3,
    exponentiation = 4,
    max = 5
}
declare const precedences: dict<precCategories>;
declare function getPrecedence(type: number, lexeme: string): number;
declare class parser {
    expr: string;
    tokens: Array<token>;
    currIndex: number;
    constructor(expression: string);
    tokenize(): void;
    getCurrent(): token | null;
    advance(): token | null;
    parsePrefix(): node | null;
    parseInfix(operatorToken: token, leftNode: node | null): node | null;
    buildSubTree(precedenceLevel: number): node | null;
    getTree(): node | null;
}
//# sourceMappingURL=index.d.ts.map