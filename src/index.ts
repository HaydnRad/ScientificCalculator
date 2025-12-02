const pad = document.getElementById("buttons");
const input = document.getElementById("input")! as HTMLInputElement;
const display = document.getElementById("display")!;

const operations: dict<Function> = {
    "**": (x: number, y: number) => { return x ** y; },
    "*": (x: number, y: number) => { return x * y; },
    "/": (x: number, y: number) => { return x / y; },
    "+": (x: number, y: number) => { return x + y; },
    "-": (x: number, y: number) => { return x - y; },
    "(": (x: number, y: number) => { if (x == null) return y; else return x * y; }, // )

    "mod": (x: number, y: number) => { return x % y; },
    "ln": (x: number, y: number) => { if (x == null) x = 1; return x * Math.log(y); },
    "exp": (x: number, y: number) => { if (x == null) x = 1; return x * Math.exp(y); },
    "abs": (x: number, y: number) => { if (x == null) x = 1; return x * Math.abs(y); },

    "sin": (x: number, y: number) => { if (x == null) x = 1; return x * Math.sin(y); },
    "cos": (x: number, y: number) => { if (x == null) x = 1; return x * Math.cos(y); },
    "tan": (x: number, y: number) => { if (x == null) x = 1; return x * Math.tan(y); },
    "asin": (x: number, y: number) => { if (x == null) x = 1; return x * Math.asin(y); },
    "acos": (x: number, y: number) => { if (x == null) x = 1; return x * Math.acos(y); },
    "atan": (x: number, y: number) => { if (x == null) x = 1; return x * Math.atan(y); },
};

const constants: dict<number> = {
    "PI": Math.PI,
    "E": Math.E,
}

function append(value: string) {
    input.value += value;
}

function backspace() {
    input.value = input.value.substring(0, input.value.length - 1);
}

display.textContent = "= ";
function refreshDisplay() {
    try {
        if (input.value == null) {
            display.textContent = "= ";
            return;
        }
        const p = new parser(input.value);
        display.textContent = "= ".concat("" + p.getTree()!.evaluate());
    } catch (e) {
        console.log(e);
        display.textContent = "= err";
    }
}
function clearScreen() {
    input.value = "";
    display.textContent = "= ";
}

// The custom button element broke for no reason 30 minutes before this had to be done and I have no idea why help AAAAAAAAAAAAAA

type ButtonBrains = {
    text: string,
    lexeme?: string,
    buttonFunction?: Function,
}

class ButtonGroup {
    buttons: Array<ButtonBrains> = [];
    id = "";
    constructor(buttons: Array<ButtonBrains>, id: string) {
        this.buttons = buttons;
        this.id = id;
    }

    createButton(btnInfo: ButtonBrains) {
        let btn = document.createElement("button");
        btn.id = "btn_" + btnInfo.text;
    }

    placeAllButtons() {
        const group = document.createElement("section");
        group.id = this.id;
        for (let i = 0; i < this.buttons.length; i++) {
            
        }
        
        pad?.appendChild(group);
    }
}


class calcBtn extends HTMLButtonElement {
    appendValue: string;
    constructor() {
        super();
        let attr = this.attributes.getNamedItem("append-value");
        if (attr == null)
            this.appendValue = this.textContent;
        else
            this.appendValue = attr.textContent;

        if (this.id == "")
            this.id = "btn_" + this.appendValue;

        if (this.onclick == null)
            this.onclick = () => { append(this.appendValue); };
    }

}
customElements.define("calc-btn", calcBtn);


interface dict<T> {
    [index: string]: T;
}

const tokenTypes = {
    Numeral: 0,
    Constant: 1,
    Function: 2,
    Operator: 3,
    Grouping: 4,
}

interface token {
    type: number,
    lexeme: string,
    precedence: number
}

function makeToken(type: number, lexeme: string): token {
    return { type: type, lexeme: lexeme, precedence: getPrecedence(type, lexeme) };
}

class node {
    leftNode: node | null = null;
    rightNode: node | null = null;
    token: token;
    constructor(token: token) {
        this.token = token;
    }
    evaluate(): number {
        switch (this.token.type) {
            case tokenTypes.Numeral:
                return +this.token.lexeme;
            case tokenTypes.Constant:
                let ul = 1;
                let ur = 1;
                if (this.leftNode != null) ul = this.leftNode.evaluate();
                if (this.rightNode != null) ur = this.rightNode.evaluate();
                return ul * constants[this.token.lexeme]! * ur;
            case tokenTypes.Function:
            case tokenTypes.Grouping:
            case tokenTypes.Operator:
                let left = null;
                let right = null;
                if (this.leftNode != null) left = this.leftNode.evaluate();
                if (this.rightNode != null) right = this.rightNode.evaluate();
                return operations[this.token.lexeme]!(left, right);
            default: return 0;
        }
    }
}

function getLexemeType(lexeme: string): number {
    if (lexeme.match(/[0-9.]/)) return tokenTypes.Numeral;
    if (lexeme.match(/[\+\-\*\^\/]/)) return tokenTypes.Operator;
    if (lexeme.match(/[\(\)]/)) return tokenTypes.Grouping;
    if (lexeme.match(/[a-z]/)) return tokenTypes.Function;
    if (lexeme.match(/[A-Z]/)) return tokenTypes.Constant;

    return -1;
}

enum precCategories {
    stop = -1,
    min = 0,
    low = 1,
    addition = 2,
    multiplication = 3,
    exponentiation = 4,
    max = 5,
}

const precedences: dict<precCategories> = {
    "0": precCategories.min,
    "a": precCategories.max,
    "A": precCategories.low,
    "+": precCategories.addition,
    "-": precCategories.addition,
    "*": precCategories.multiplication,
    "/": precCategories.multiplication,
    "**": precCategories.exponentiation,
    "(": precCategories.max,
    ")": precCategories.stop,
}

function getPrecedence(type: number, lexeme: string): number {
    switch (type) {
        case tokenTypes.Numeral:
            return precCategories.min;
        case tokenTypes.Constant:
            return precCategories.low;
        case tokenTypes.Function:
            return precCategories.max;
        case tokenTypes.Operator:
        case tokenTypes.Grouping:
            return precedences[lexeme]!;
        default:
            return -1;
    }
}

class parser {
    expr: string;
    tokens: Array<token> = [];
    currIndex = 0;
    constructor(expression: string) {
        this.expr = expression.replace(/\s/g, "");
        this.tokenize();
    }

    tokenize() {
        let j = -1;
        for (let i = 0; i < this.expr.length; i++) {
            let currType = getLexemeType(this.expr[i]!);
            if (this.tokens.length == 0
                || this.tokens[j]!.type != currType
                || this.tokens[j]!.type == tokenTypes.Grouping
                || this.tokens[j]!.type == tokenTypes.Operator && !(this.tokens[j]!.lexeme == "*" && this.expr[i] == "*")
            ) {
                // Make new token
                this.tokens.push(makeToken(currType, this.expr[i]!));
                j++;
                continue;
            }

            // Append to previous token
            this.tokens[j]!.lexeme = this.tokens[j]!.lexeme.concat(this.expr[i]!);
        }
    }

    getCurrent(): token | null {
        if (this.currIndex < this.tokens.length) {
            return this.tokens[this.currIndex]!;
        }
        return null;
    }

    advance(): token | null {
        this.currIndex++;
        return this.getCurrent();
    }

    // returns the top node for the current terminal token and advances to the next token
    parsePrefix(): node | null {
        let curr = this.getCurrent();
        if (curr == null) return null;
        this.advance();

        if (curr.lexeme == "(") {
            let temp = this.buildSubTree(precCategories.min);
            if (this.getCurrent() != null && this.getCurrent()!.lexeme == ")") {
                this.advance();
            }
            return temp;
        }

        let ret = new node(curr);

        if (curr.type != tokenTypes.Numeral && curr.type != tokenTypes.Constant) {
            ret.rightNode = this.parsePrefix();
        }

        return ret;
    }

    // returns the top node for the current operator, which should have a higher precedence when called in buildSubTree
    parseInfix(operatorToken: token, leftNode: node | null): node | null {
        if (operatorToken == null) return leftNode;
        if (leftNode == null) return null;

        if (operatorToken.lexeme == "(") {
            this.advance();
            let temp = this.buildSubTree(precCategories.min);
            temp!.leftNode = leftNode;
            return temp;
        }

        if (operatorToken.lexeme == ")") {
            return leftNode;
        }

        let retNode = new node(operatorToken);
        retNode.leftNode = leftNode;
        retNode.rightNode = this.buildSubTree(operatorToken.precedence);
        return retNode;
    }

    buildSubTree(precedenceLevel: number): node | null {
        if (this.getCurrent() == null) return null;
        let leftNode = this.parsePrefix();
        let nextOperatorToken = this.getCurrent();

        while (nextOperatorToken != null && nextOperatorToken.precedence > precedenceLevel) {
            this.advance();

            leftNode = this.parseInfix(nextOperatorToken, leftNode);

            nextOperatorToken = this.getCurrent();
        }

        return leftNode;
    }

    getTree() {
        this.currIndex = 0;
        return this.buildSubTree(precCategories.min);
    }
}
