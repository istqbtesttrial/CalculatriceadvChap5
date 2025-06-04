// Gestion de l'affichage
function clearScreen() {
    document.getElementById("result").value = "";
    document.getElementById("operation").innerText = "";
}

function clearHistory() {
    history = [];
    saveHistory();
    renderHistory();
}

function deleteLast() {
    let resultField = document.getElementById("result");
    let operationField = document.getElementById("operation");

    resultField.value = resultField.value.slice(0, -1);
    operationField.innerText = operationField.innerText.slice(0, -1);
}

function insert(value, displayValue = value) {
    let resultField = document.getElementById("result");
    let operationField = document.getElementById("operation");

    resultField.value += value;
    operationField.innerText += displayValue;
}

// Historique
const HISTORY_KEY = "calcHistory";
const HISTORY_LENGTH = 10; // taille fixe de l'historique
let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
history = history.slice(0, HISTORY_LENGTH);

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
}

document.addEventListener("DOMContentLoaded", () => {
    renderHistory();
    const clearBtn = document.getElementById("clearButton");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearScreen);
        clearBtn.addEventListener("dblclick", clearHistory);
    }
});

function addToHistory(entry) {
    history.unshift(entry);
    if (history.length > HISTORY_LENGTH) history.pop();
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
