let input = document.getElementById("input");
let display = document.getElementById("display");
display.textContent = "Hello, world!";


function append(value) {
    input.value += value;
}
function backspace() {
    input.value = input.value.substring(0, input.value.length-1);
}
function refreshDisplay() {
    display.textContent = "TODO: this"
}
function clearScreen() {
    input.value = "";
    display.textContent = "";
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


