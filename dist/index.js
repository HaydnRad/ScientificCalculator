"use strict";
const input = document.getElementById("input");
const display = document.getElementById("display");
const operations = {
    "**": (x, y) => { return x ** y; },
    "*": (x, y) => { return x * y; },
    "/": (x, y) => { return x / y; },
    "+": (x, y) => { return x + y; },
    "-": (x, y) => { return x - y; },
    "(": (x, y) => { if (x == null)
        return y;
    else
        return x * y; }, // )
    "mod": (x, y) => { return x % y; },
    "ln": (x, y) => { if (x == null)
        x = 1; return x * Math.log(y); },
    "exp": (x, y) => { if (x == null)
        x = 1; return x * Math.exp(y); },
    "abs": (x, y) => { if (x == null)
        x = 1; return x * Math.abs(y); },
    "sin": (x, y) => { if (x == null)
        x = 1; return x * Math.sin(y); },
    "cos": (x, y) => { if (x == null)
        x = 1; return x * Math.cos(y); },
    "tan": (x, y) => { if (x == null)
        x = 1; return x * Math.tan(y); },
    "asin": (x, y) => { if (x == null)
        x = 1; return x * Math.asin(y); },
    "acos": (x, y) => { if (x == null)
        x = 1; return x * Math.acos(y); },
    "atan": (x, y) => { if (x == null)
        x = 1; return x * Math.atan(y); },
};
const constants = {
    "PI": Math.PI,
    "E": Math.E,
};
function append(value) {
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
        display.textContent = "= ".concat("" + p.getTree().evaluate());
    }
    catch (e) {
        console.log(e);
        display.textContent = "= err";
    }
}
function clearScreen() {
    input.value = "";
    display.textContent = "= ";
}
const tokenTypes = {
    Numeral: 0,
    Constant: 1,
    Function: 2,
    Operator: 3,
    Grouping: 4,
};
function makeToken(type, lexeme) {
    return { type: type, lexeme: lexeme, precedence: getPrecedence(type, lexeme) };
}
class node {
    leftNode = null;
    rightNode = null;
    token;
    constructor(token) {
        this.token = token;
    }
    evaluate() {
        switch (this.token.type) {
            case tokenTypes.Numeral:
                return +this.token.lexeme;
            case tokenTypes.Constant:
                let ul = 1;
                let ur = 1;
                if (this.leftNode != null)
                    ul = this.leftNode.evaluate();
                if (this.rightNode != null)
                    ur = this.rightNode.evaluate();
                return ul * constants[this.token.lexeme] * ur;
            case tokenTypes.Function:
            case tokenTypes.Grouping:
            case tokenTypes.Operator:
                let left = null;
                let right = null;
                if (this.leftNode != null)
                    left = this.leftNode.evaluate();
                if (this.rightNode != null)
                    right = this.rightNode.evaluate();
                return operations[this.token.lexeme](left, right);
            default: return 0;
        }
    }
}
function getLexemeType(lexeme) {
    if (lexeme.match(/[0-9.]/))
        return tokenTypes.Numeral;
    if (lexeme.match(/[\+\-\*\^\/]/))
        return tokenTypes.Operator;
    if (lexeme.match(/[\(\)]/))
        return tokenTypes.Grouping;
    if (lexeme.match(/[a-z]/))
        return tokenTypes.Function;
    if (lexeme.match(/[A-Z]/))
        return tokenTypes.Constant;
    return -1;
}
var precCategories;
(function (precCategories) {
    precCategories[precCategories["stop"] = -1] = "stop";
    precCategories[precCategories["min"] = 0] = "min";
    precCategories[precCategories["low"] = 1] = "low";
    precCategories[precCategories["addition"] = 2] = "addition";
    precCategories[precCategories["multiplication"] = 3] = "multiplication";
    precCategories[precCategories["exponentiation"] = 4] = "exponentiation";
    precCategories[precCategories["max"] = 5] = "max";
})(precCategories || (precCategories = {}));
const precedences = {
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
};
function getPrecedence(type, lexeme) {
    switch (type) {
        case tokenTypes.Numeral:
            return precCategories.min;
        case tokenTypes.Constant:
            return precCategories.low;
        case tokenTypes.Function:
            return precCategories.max;
        case tokenTypes.Operator:
        case tokenTypes.Grouping:
            return precedences[lexeme];
        default:
            return -1;
    }
}
class parser {
    expr;
    tokens = [];
    currIndex = 0;
    constructor(expression) {
        this.expr = expression.replace(/\s/g, "");
        this.tokenize();
    }
    tokenize() {
        let j = -1;
        for (let i = 0; i < this.expr.length; i++) {
            let currType = getLexemeType(this.expr[i]);
            if (this.tokens.length == 0
                || this.tokens[j].type != currType
                || this.tokens[j].type == tokenTypes.Grouping
                || this.tokens[j].type == tokenTypes.Operator && !(this.tokens[j].lexeme == "*" && this.expr[i] == "*")) {
                // Make new token
                this.tokens.push(makeToken(currType, this.expr[i]));
                j++;
                continue;
            }
            // Append to previous token
            this.tokens[j].lexeme = this.tokens[j].lexeme.concat(this.expr[i]);
        }
    }
    getCurrent() {
        if (this.currIndex < this.tokens.length) {
            return this.tokens[this.currIndex];
        }
        return null;
    }
    advance() {
        this.currIndex++;
        return this.getCurrent();
    }
    // returns the top node for the current terminal token and advances to the next token
    parsePrefix() {
        let curr = this.getCurrent();
        if (curr == null)
            return null;
        this.advance();
        if (curr.lexeme == "(") {
            let temp = this.buildSubTree(precCategories.min);
            if (this.getCurrent() != null && this.getCurrent().lexeme == ")") {
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
    parseInfix(operatorToken, leftNode) {
        if (operatorToken == null)
            return leftNode;
        if (leftNode == null)
            return null;
        if (operatorToken.lexeme == "(") {
            this.advance();
            let temp = this.buildSubTree(precCategories.min);
            temp.leftNode = leftNode;
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
    buildSubTree(precedenceLevel) {
        if (this.getCurrent() == null)
            return null;
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
//# sourceMappingURL=index.js.map