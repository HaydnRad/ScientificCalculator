let input = document.getElementById("input");
let display = document.getElementById("display");
display.textContent = "= ";


function append(value) {
    input.value += value;
    refreshDisplay();
}
function backspace() {
    input.value = input.value.substring(0, input.value.length-1);
    refreshDisplay();
}
function refreshDisplay() {
    try {
        let p = new parser(input.value);
        display.textContent = "= ".concat(p.getTree().evaluate());
    } catch (e) {
        console.log(e);
        display.textContent = "= err";
    }
}
function clearScreen() {
    input.value = "";
    display.textContent = "= ";
}

class calcBtn extends HTMLButtonElement {
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
            this.onclick = () => { append(this.appendValue) };
    }
    
}
customElements.define("calc-btn", calcBtn, { extends: "button" });


const operations = {
    "**" : (x,y) => {return x**y;},
    "*" : (x,y) => {return x*y;},
    "/" : (x,y) => {return x/y;},
    "+" : (x,y) => {return x+y;},
    "-" : (x,y) => {return x-y;},
    "(" : (x,y) => {if (x==null) return y; else return x*y;},
    // ")" : (x,y) => {if (y==null) return x; else return x*y;},
};

class node {
    leftNode = null;
    rightNode = null;
    constructor(token){
        this.token = token;
    }
    evaluate() {
        switch (this.token.type) {
            case tokenTypes.Numeral:
                // let val = +this.token.lexeme;
                // if (this.leftNode != null) val *= this.leftNode.evaluate();
                // return val;
                return +this.token.lexeme;
            // case tokenTypes.Lexical:
            //     return // I dont have any lexicals yet
            case tokenTypes.Grouping:
            case tokenTypes.Operator:
                let left = null;
                let right = null;
                if (this.leftNode != null) left = this.leftNode.evaluate();
                if (this.rightNode != null) right = this.rightNode.evaluate();
                return operations[this.token.lexeme](left, right);
        }
    }
}

const tokenTypes = {
    Numeral : 0,
    Lexical : 1,
    Operator : 2,
    Grouping : 3,
}

function getLexemeType(lexeme) {
    if (lexeme.match(/[0-9.]/)) return tokenTypes.Numeral;
    if (lexeme.match(/[\+\-\*\/]/)) return tokenTypes.Operator;
    if (lexeme.match(/[\(\)]/)) return tokenTypes.Grouping;
    if (lexeme.match(/[a-z]/i)) return tokenTypes.Lexical;

    return null;
}

const precCategories = {
    min: 0,
    addition: 1,
    multiplication: 2,
    exponentiation: 3,
    max: 4,
}

const precedences = {
    "0": precCategories.min,
    "a": precCategories.max,
    "+": precCategories.addition,
    "-": precCategories.addition,
    "*": precCategories.multiplication,
    "/": precCategories.multiplication,
    "**": precCategories.exponentiation,
    "(": precCategories.max,
    ")": precCategories.max,
}

function getPrecedence(type, lexeme) {
        switch (type) {
        case tokenTypes.Numeral:
            return precedences["0"];
        case tokenTypes.Lexical:
            return precedences["a"];
        case tokenTypes.Operator:
        case tokenTypes.Grouping:
            return precedences[lexeme];
        default: 
            return -1;
    }
}

function makeToken(type, lexeme) {
    return {type: type, lexeme: lexeme, precedence: getPrecedence(type, lexeme)};
}

class parser {
    tokens = [];
    #currIndex = 0;
    constructor(expression){
        this.expr = expression.replace(/\s/g, "");
        this.#tokenize();
    }

    #tokenize() {
        let j = -1;
        for (let i = 0; i < this.expr.length; i++) {
            let currType = getLexemeType(this.expr[i]);
            if (this.tokens.length == 0 
                || this.tokens[j].type != currType 
                || this.tokens[j].type == tokenTypes.Grouping
                || this.tokens[j].type == tokenTypes.Operator && !(this.tokens[j].lexeme == "*" && this.expr[i] == "*")
               ){
                // Make new token
                this.tokens.push(makeToken(currType, this.expr[i]));
                j++;
                continue;
            }

            // Append to previous token
            this.tokens[j].lexeme = this.tokens[j].lexeme.concat(this.expr[i]);
        }
    }

    #getCurrent() {
        if (this.#currIndex < this.tokens.length) {
            return this.tokens[this.#currIndex];
        }
        return null;
    }

    #advance() {
        this.#currIndex++;
        return this.#getCurrent();
    }

    // returns the top node for the current terminal token and advances to the next token
    #parsePrefix() {
        let curr = this.#getCurrent();
        let temp = new node(curr);
        this.#advance();

        if (curr.type == tokenTypes.Numeral) return temp;

        temp.rightNode = this.#buildSubTree(temp.token.precedence);

        if (this.#getCurrent() != null && this.#getCurrent().lexeme == ")") { 
            this.#advance();
        }
        
        return temp;
    }

    // returns the top node for the current operator, which should have a higher precedence when called in #buildSubTree
    #parseInfix(operatorToken, leftNode) {
        if (operatorToken == null) return null;

        if (operatorToken.lexeme == ")") return leftNode;

        let retNode = new node(operatorToken);
        retNode.leftNode = leftNode;
        retNode.rightNode = this.#buildSubTree(operatorToken.precedence);
        return retNode;
    }

    #buildSubTree(precedenceLevel) {
        if (this.#getCurrent() == null) return null;
        let leftNode = this.#parsePrefix();
        let nextOperatorToken = this.#getCurrent();

        while (nextOperatorToken != null && nextOperatorToken.precedence > precedenceLevel) {
            this.#advance();
            
            leftNode = this.#parseInfix(nextOperatorToken, leftNode);
            
            nextOperatorToken = this.#getCurrent();
        }

        return leftNode;
    }

    getTree() {
        this.#currIndex = 0;
        return this.#buildSubTree(precCategories.min);
    }
}
