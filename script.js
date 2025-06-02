// Gestion de l'affichage
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

// Historique
const HISTORY_KEY = "calcHistory";
const HISTORY_LENGTH_KEY = "historyLength";
let historyLength = parseInt(localStorage.getItem(HISTORY_LENGTH_KEY)) || 5;
let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
    const container = document.getElementById("history");
    if (!container) return;
    container.innerHTML = "";
    history.forEach(item => {
        const div = document.createElement("div");
        div.textContent = item;
        container.appendChild(div);
    });
    const input = document.getElementById("history-length");
    if (input) input.value = historyLength;
}

document.addEventListener("DOMContentLoaded", renderHistory);

function addToHistory(entry) {
    history.unshift(entry);
    if (history.length > historyLength) history.pop();
    saveHistory();
    renderHistory();
}

function updateHistoryLength() {
    const input = document.getElementById("history-length");
    historyLength = parseInt(input.value) || 0;
    localStorage.setItem(HISTORY_LENGTH_KEY, historyLength);
    history = history.slice(0, historyLength);
    saveHistory();
    renderHistory();
}

// Calculs avancés
function squareRoot() {
    let expression = document.getElementById("result").value || "0";
    try {
        let value = eval(expression);
        if (value < 0) throw new Error("Valeur négative");
        let result = Math.sqrt(value);
        document.getElementById("result").value = result;
        document.getElementById("operation").innerText = `√(${expression}) =`;
        addToHistory(`√(${expression}) = ${result}`);
    } catch (error) {
        document.getElementById("result").value = "Erreur";
        document.getElementById("operation").innerText = "";
    }
}

function percentage() {
    let expression = document.getElementById("result").value || "0";
    try {
        let value = eval(expression);
        let result = value / 100;
        document.getElementById("result").value = result;
        document.getElementById("operation").innerText = `${expression}% =`;
        addToHistory(`${expression}% = ${result}`);
    } catch (error) {
        document.getElementById("result").value = "Erreur";
        document.getElementById("operation").innerText = "";
    }
}

function calculate() {
    let expression = document.getElementById("result").value;
    if (!expression) return;
    try {
        let result = eval(expression);
        if (!isFinite(result)) throw new Error("Division par zéro");
        document.getElementById("result").value = result;
        document.getElementById("operation").innerText = expression + " =";
        addToHistory(`${expression} = ${result}`);
    } catch (error) {
        document.getElementById("result").value = "Erreur";
        document.getElementById("operation").innerText = "";
    }
}
