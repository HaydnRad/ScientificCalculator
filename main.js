var input = document.getElementById("input");
var display = document.getElementById("display");
var operations = {
    "**": function (x, y) { return Math.pow(x, y); },
    "*": function (x, y) { return x * y; },
    "/": function (x, y) { return x / y; },
    "+": function (x, y) { return x + y; },
    "-": function (x, y) { return x - y; },
    "(": function (x, y) { if (x == null)
        return y;
    else
        return x * y; },
    "mod": function (x, y) { return x % y; },
    "ln": function (x, y) { if (x == null)
        x = 1; return x * Math.log(y); },
    "exp": function (x, y) { if (x == null)
        x = 1; return x * Math.exp(y); },
    "sin": function (x, y) { if (x == null)
        x = 1; return x * Math.sin(y); },
    "cos": function (x, y) { if (x == null)
        x = 1; return x * Math.cos(y); },
    "tan": function (x, y) { if (x == null)
        x = 1; return x * Math.tan(y); },
    "asin": function (x, y) { if (x == null)
        x = 1; return x * Math.asin(y); },
    "acos": function (x, y) { if (x == null)
        x = 1; return x * Math.acos(y); },
    "atan": function (x, y) { if (x == null)
        x = 1; return x * Math.atan(y); }
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
        var p = new parser(input.value);
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
var tokenTypes = {
    Numeral: 0,
    Lexical: 1,
    Operator: 2,
    Grouping: 3
};
function makeToken(type, lexeme) {
    return { type: type, lexeme: lexeme, precedence: getPrecedence(type, lexeme) };
}
var node = /** @class */ (function () {
    function node(token) {
        this.leftNode = null;
        this.rightNode = null;
        this.token = token;
    }
    node.prototype.evaluate = function () {
        switch (this.token.type) {
            case tokenTypes.Numeral:
                return +this.token.lexeme;
            case tokenTypes.Lexical:
            case tokenTypes.Grouping:
            case tokenTypes.Operator:
                var left = null;
                var right = null;
                if (this.leftNode != null)
                    left = this.leftNode.evaluate();
                if (this.rightNode != null)
                    right = this.rightNode.evaluate();
                return operations[this.token.lexeme](left, right);
            default: return 0;
        }
    };
    return node;
}());
function getLexemeType(lexeme) {
    if (lexeme.match(/[0-9.]/))
        return tokenTypes.Numeral;
    if (lexeme.match(/[\+\-\*\^\/]/))
        return tokenTypes.Operator;
    if (lexeme.match(/[\(\)]/))
        return tokenTypes.Grouping;
    if (lexeme.match(/[a-z]/i))
        return tokenTypes.Lexical;
    return -1;
}
var precCategories;
(function (precCategories) {
    precCategories[precCategories["stop"] = -1] = "stop";
    precCategories[precCategories["min"] = 0] = "min";
    precCategories[precCategories["addition"] = 1] = "addition";
    precCategories[precCategories["multiplication"] = 2] = "multiplication";
    precCategories[precCategories["exponentiation"] = 3] = "exponentiation";
    precCategories[precCategories["max"] = 4] = "max";
})(precCategories || (precCategories = {}));
var precedences = {
    "0": precCategories.min,
    "a": precCategories.max,
    "+": precCategories.addition,
    "-": precCategories.addition,
    "*": precCategories.multiplication,
    "/": precCategories.multiplication,
    "**": precCategories.exponentiation,
    "(": precCategories.max,
    ")": precCategories.stop
};
function getPrecedence(type, lexeme) {
    switch (type) {
        case tokenTypes.Numeral:
            return precCategories.min;
        case tokenTypes.Lexical:
            return precCategories.max;
        case tokenTypes.Operator:
        case tokenTypes.Grouping:
            return precedences[lexeme];
        default:
            return -1;
    }
}
var parser = /** @class */ (function () {
    function parser(expression) {
        this.tokens = [];
        this.currIndex = 0;
        this.expr = expression.replace(/\s/g, "");
        this.tokenize();
    }
    parser.prototype.tokenize = function () {
        var j = -1;
        for (var i = 0; i < this.expr.length; i++) {
            var currType = getLexemeType(this.expr[i]);
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
    };
    parser.prototype.getCurrent = function () {
        if (this.currIndex < this.tokens.length) {
            return this.tokens[this.currIndex];
        }
        return null;
    };
    parser.prototype.advance = function () {
        this.currIndex++;
        return this.getCurrent();
    };
    // returns the top node for the current terminal token and advances to the next token
    parser.prototype.parsePrefix = function () {
        var curr = this.getCurrent();
        if (curr == null)
            return null;
        this.advance();
        if (curr.lexeme == "(") {
            var temp = this.buildSubTree(precCategories.min);
            if (this.getCurrent() != null && this.getCurrent().lexeme == ")") {
                this.advance();
            }
            return temp;
        }
        var ret = new node(curr);
        if (curr.type != tokenTypes.Numeral) {
            ret.rightNode = this.parsePrefix();
        }
        return ret;
    };
    // returns the top node for the current operator, which should have a higher precedence when called in buildSubTree
    parser.prototype.parseInfix = function (operatorToken, leftNode) {
        if (operatorToken == null)
            return leftNode;
        if (leftNode == null)
            return null;
        if (operatorToken.lexeme == "(") {
            this.advance();
            var temp = this.buildSubTree(precCategories.min);
            temp.leftNode = leftNode;
            return temp;
        }
        if (operatorToken.lexeme == ")") {
            return leftNode;
        }
        var retNode = new node(operatorToken);
        retNode.leftNode = leftNode;
        retNode.rightNode = this.buildSubTree(operatorToken.precedence);
        return retNode;
    };
    parser.prototype.buildSubTree = function (precedenceLevel) {
        if (this.getCurrent() == null)
            return null;
        var leftNode = this.parsePrefix();
        var nextOperatorToken = this.getCurrent();
        while (nextOperatorToken != null && nextOperatorToken.precedence > precedenceLevel) {
            this.advance();
            leftNode = this.parseInfix(nextOperatorToken, leftNode);
            nextOperatorToken = this.getCurrent();
        }
        return leftNode;
    };
    parser.prototype.getTree = function () {
        this.currIndex = 0;
        return this.buildSubTree(precCategories.min);
    };
    return parser;
}());
