function clearScreen() {
    document.getElementById("result").value = "";
    document.getElementById("operation").innerText = "";
}

function deleteLast() {
    let resultField = document.getElementById("result");
    let operationField = document.getElementById("operation");

    resultField.value = resultField.value.slice(0, -1);
    operationField.innerText = operationField.innerText.slice(0, -1);
}

function insert(value) {
    let resultField = document.getElementById("result");
    let operationField = document.getElementById("operation");

    resultField.value += value;
    operationField.innerText += value;
}

function calculate() {
    let expression = document.getElementById("result").value;
    if (expression) {
        try {
            document.getElementById("result").value = eval(expression);
            document.getElementById("operation").innerText = expression + " =";
        } catch (error) {
            document.getElementById("result").value = "Erreur";
            document.getElementById("operation").innerText = "";
        }
    }
}
