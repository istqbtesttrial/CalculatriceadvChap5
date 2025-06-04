(function () {
  'use strict';

  const HISTORY_KEY = 'calcHistory';
  const HISTORY_LENGTH = 9;

  const elements = {};
  let history = [];

  function init() {
    elements.result = document.getElementById('result');
    elements.operation = document.getElementById('operation');
    elements.history = document.getElementById('history');

    loadHistory();
    renderHistory();
    setupListeners();
  }

  function setupListeners() {
    const clearBtn = document.getElementById('clearButton');
    clearBtn.addEventListener('click', clearScreen);
    clearBtn.addEventListener('dblclick', clearHistory);
    document.getElementById('deleteButton').addEventListener('click', deleteLast);
    document.getElementById('percentageButton').addEventListener('click', percentage);
    document.getElementById('sqrtButton').addEventListener('click', squareRoot);
    document.getElementById('equalsButton').addEventListener('click', calculate);

    document.querySelectorAll('.number').forEach(btn => {
      btn.addEventListener('click', () => handleDigit(btn.dataset.value));
    });
    document.querySelectorAll('.operator').forEach(btn => {
      btn.addEventListener('click', () => handleOperator(btn.dataset.operator));
    });
  }

  function clearScreen() {
    elements.result.value = '';
    elements.operation.textContent = '';
  }

  function clearHistory() {
    history = [];
    saveHistory();
    renderHistory();
  }

  function deleteLast() {
    elements.result.value = elements.result.value.slice(0, -1);
    elements.operation.textContent = elements.operation.textContent.slice(0, -1);
  }

  function handleDigit(digit) {
    elements.result.value += digit;
    elements.operation.textContent += digit;
  }

  function handleOperator(op) {
    elements.result.value += op;
    elements.operation.textContent += op === '^' ? '^' : op;
  }

  function percentage() {
    const expr = elements.result.value || '0';
    try {
      const val = safeEval(expr);
      const res = val / 100;
      elements.result.value = res;
      elements.operation.textContent = `${expr}% =`;
      addToHistory(`${expr}% = ${res}`);
    } catch (e) {
      showError();
    }
  }

  function squareRoot() {
    const expr = elements.result.value || '0';
    try {
      const val = safeEval(expr);
      if (val < 0) throw new Error('neg');
      const res = Math.sqrt(val);
      elements.result.value = res;
      elements.operation.textContent = `√(${expr}) =`;
      addToHistory(`√(${expr}) = ${res}`);
    } catch (e) {
      showError();
    }
  }

  function calculate() {
    const expr = elements.result.value;
    if (!expr) return;
    try {
      const res = safeEval(expr);
      elements.result.value = res;
      elements.operation.textContent = `${expr} =`;
      addToHistory(`${expr} = ${res}`);
    } catch (e) {
      showError();
    }
  }

  function showError() {
    elements.result.value = 'Erreur';
    elements.operation.textContent = '';
  }

  function safeEval(expression) {
    if (!/^[0-9+\-*/().^ ]+$/.test(expression)) throw new Error('bad');
    const sanitized = expression.replace(/\^/g, '**');
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('bad');
    return result;
  }

  function addToHistory(entry) {
    history.unshift(entry);
    if (history.length > HISTORY_LENGTH) history.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (!elements.history) return;
    elements.history.innerHTML = '';
    history.forEach(item => {
      const div = document.createElement('div');
      div.textContent = item;
      elements.history.appendChild(div);
    });
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function loadHistory() {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history = history.slice(0, HISTORY_LENGTH);
  }

  document.addEventListener('DOMContentLoaded', init);

  // expose for tests
  window.CalculatorApp = { safeEval };
})();
