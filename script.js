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
    elements.displayArea = document.getElementById('displayArea');
    elements.liveRegion = document.getElementById('liveRegion');

    loadHistory();
    renderHistory();
    setupListeners();
  }

  function setupListeners() {
    const clearBtn = document.getElementById('clearButton');
    clearBtn.addEventListener('click', clearScreen);
    clearBtn.addEventListener('dblclick', clearHistory);
    const delBtn = document.getElementById('deleteButton');
    delBtn.addEventListener('click', deleteLast);
    // Appui long sur DEL => clear
    let delPressTimer = null;
    const startDelPress = () => {
      clearTimeout(delPressTimer);
      delPressTimer = setTimeout(() => {
        clearScreen();
        if (navigator.vibrate) navigator.vibrate(10);
      }, 600);
    };
    const cancelDelPress = () => clearTimeout(delPressTimer);
    delBtn.addEventListener('mousedown', startDelPress);
    delBtn.addEventListener('touchstart', startDelPress, { passive: true });
    ['mouseup','mouseleave','mouseout','touchend','touchcancel'].forEach(ev => {
      delBtn.addEventListener(ev, cancelDelPress);
    });
    document.getElementById('percentageButton').addEventListener('click', percentage);
    document.getElementById('sqrtButton').addEventListener('click', squareRoot);
    document.getElementById('equalsButton').addEventListener('click', calculate);

    document.querySelectorAll('.number').forEach(btn => {
      btn.addEventListener('click', () => handleDigit(btn.dataset.value));
    });
    document.querySelectorAll('.operator').forEach(btn => {
      btn.addEventListener('click', () => handleOperator(btn.dataset.operator));
    });

    // Historique cliquable
    if (elements.history) {
      elements.history.addEventListener('click', onHistoryClick);
      elements.history.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const target = e.target;
          if (target && target.getAttribute && target.getAttribute('role') === 'listitem') {
            e.preventDefault();
            onHistoryClick({ target });
          }
        }
      });
    }

    setupKeyboard();
    setupGestures();
  }

  function clearScreen() {
    elements.result.value = '';
    elements.operation.textContent = '';
    announce('Effacé');
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
    const next = String(digit);
    const updated = buildNextExpression(elements.result.value, next);
    if (updated === null) return invalidFlash();
    elements.result.value = updated;
    elements.operation.textContent = toDisplay(updated);
  }

  function handleOperator(op) {
    const next = String(op);
    const updated = buildNextExpression(elements.result.value, next);
    if (updated === null) return invalidFlash();
    elements.result.value = updated;
    elements.operation.textContent = toDisplay(updated);
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
    // Empêcher calcul si expression invalide (parenthèses non fermées ou termine par opérateur)
    if (!isExpressionComplete(expr)) {
      return invalidFlash();
    }
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
    announce('Erreur de calcul');
  }

  // --- Validation incrémentale et helpers ---
  const OPERATORS = ['+','-','*','/','^'];

  function isOperator(ch){ return OPERATORS.includes(ch); }
  function isDigit(ch){ return ch >= '0' && ch <= '9'; }

  function invalidFlash(){
    if (!elements.displayArea) return;
    elements.displayArea.classList.remove('invalid-blink');
    // force reflow
    void elements.displayArea.offsetWidth;
    elements.displayArea.classList.add('invalid-blink');
    announce('Entrée invalide');
  }

  function currentNumberHasDot(expr){
    // Inspecte à partir de la fin jusqu'à rencontrer un opérateur ou parenthèse
    for (let i = expr.length - 1; i >= 0; i--) {
      const c = expr[i];
      if (c === '.') return true;
      if (isOperator(c) || c === '(' || c === ')') return false;
    }
    return false;
  }

  function isExpressionComplete(expr){
    if (!expr) return false;
    const last = expr[expr.length-1];
    if (isOperator(last) || last === '(' || last === '.') return false;
    let bal = 0;
    for (const c of expr){
      if (c === '(') bal++;
      else if (c === ')') bal--;
      if (bal < 0) return false;
    }
    return bal === 0;
  }

  function toDisplay(expr){
    // Remplace * par × pour l'affichage
    return expr.replaceAll('*','×');
  }

  function buildNextExpression(prev, next){
    // Gestion collages multi-caractères via clavier: ne garder que le premier caractère pertinent
    if (next.length > 1) return null;
    const ch = next;

    // Autoriser chiffres
    if (isDigit(ch)) {
      return prev + ch;
    }

    // Point décimal
    if (ch === '.') {
      if (!prev) return '0.';
      if (currentNumberHasDot(prev)) return null;
      const last = prev[prev.length-1];
      if (isOperator(last) || last === '(') return prev + '0.';
      if (last === ')' ) return null; // 2). non valide
      return prev + '.';
    }

    // Parenthèse ouvrante avec multiplication implicite
    if (ch === '(') {
      if (!prev) return '(';
      const last = prev[prev.length-1];
      if (isDigit(last) || last === ')' || last === '.') {
        // 2( → 2*( ; )( → )*( ; 2.5( → 2.5*(
        return prev + '*' + '(';
      }
      if (last === '(' || isOperator(last)) return prev + '(';
      return null;
    }

    // Parenthèse fermante: seulement si il existe une ouvrante non fermée et que le dernier n'est pas opérateur ou '('
    if (ch === ')') {
      if (!prev) return null;
      const last = prev[prev.length-1];
      if (isOperator(last) || last === '.') return null;
      // Autoriser fermeture immédiate d'un groupe vide: ()
      if (last === '(') return prev + ')';
      let bal = 0;
      for (const c of prev){
        if (c === '(') bal++;
        else if (c === ')') bal--;
      }
      if (bal <= 0) return null;
      return prev + ')';
    }

    // Opérateurs
    if (isOperator(ch)) {
      if (!prev) return ch === '-' ? '-' : null; // autoriser - unaire en début
      const last = prev[prev.length-1];
      if (isOperator(last)) {
        // autoriser '-(' sera géré quand '(' vient après '-'
        // remplacer opérateur précédent par le nouveau sauf cas de - unaire autorisé (après '(')
        if (ch === '-' && last === '(') return prev + '-';
        // sinon, remplacer l'op précédent (évite ++, **, etc.)
        return prev.slice(0,-1) + ch;
      }
      if (last === '(') return ch === '-' ? prev + '-' : null; // - unaire après (
      if (last === '.') return null;
      return prev + ch;
    }

    // Toute autre entrée est refusée
    return null;
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Ignorer les raccourcis système
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // Mappages spéciaux
      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
        return;
      }
      if (key === 'Backspace') {
        e.preventDefault();
        deleteLast();
        return;
      }
      if (key === 'Escape') {
        e.preventDefault();
        clearScreen();
        return;
      }
      if (key === '%') {
        e.preventDefault();
        percentage();
        return;
      }
      if (key === 'v' && e.shiftKey) {
        // ne pas interférer avec collages spéciaux, donc pas de gestion
        return;
      }

      // Autoriser chiffres, opérateurs, parenthèses et point
      const allowed = /[0-9+\-*/().^]/.test(key);
      if (allowed) {
        e.preventDefault();
        if (/[0-9.]/.test(key)) {
          handleDigit(key);
        } else {
          handleOperator(key);
        }
      }
      // Sinon on laisse le navigateur gérer (pas d'insertion dans l'input car readonly)
    });

    // Raccourcis supplémentaires (Alt)
    document.addEventListener('keydown', (e) => {
      // √ : Alt+R
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          squareRoot();
        } else if (e.key.toLowerCase() === 'p') {
          // Puissance: Alt+P ajoute ^
          e.preventDefault();
          handleOperator('^');
        }
      }
    });
  }

  function setupGestures() {
    if (!elements.displayArea || !('ontouchstart' in window)) return;
    let startX = 0, startY = 0, endX = 0, endY = 0;
    const threshold = 40; // px

    elements.displayArea.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY;
      endX = startX; endY = startY;
    }, { passive: true });

    elements.displayArea.addEventListener('touchmove', (e) => {
      const t = e.changedTouches[0];
      endX = t.clientX; endY = t.clientY;
    }, { passive: true });

    elements.displayArea.addEventListener('touchend', () => {
      const dx = endX - startX;
      const dy = endY - startY;
      const act = gestureAction(dx, dy, threshold);
      if (act === 'del') { deleteLast(); if (navigator.vibrate) navigator.vibrate(8); }
      if (act === 'clear') { clearScreen(); if (navigator.vibrate) navigator.vibrate(12); }
    });
  }

  function gestureAction(dx, dy, threshold = 40) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -threshold) return 'del';
      return null;
    } else {
      if (dy > threshold) return 'clear';
      return null;
    }
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
      div.textContent = toDisplay(item);
      div.setAttribute('role', 'listitem');
      div.tabIndex = 0;
      elements.history.appendChild(div);
    });
  }

  function announce(message){
    if (!elements.liveRegion) return;
    elements.liveRegion.textContent = '';
    // petite temporisation pour forcer l'annonce successive du même message
    setTimeout(() => {
      elements.liveRegion.textContent = message;
    }, 0);
  }

  function onHistoryClick(e) {
    const node = e.target;
    if (!node || !elements.result || !elements.operation) return;
    const line = node.textContent || '';
    // Extraire la partie résultat après « = » si présente
    const idx = line.lastIndexOf('=');
    if (idx !== -1) {
      const res = line.slice(idx + 1).trim();
      elements.result.value = res;
      elements.operation.textContent = line.trim();
    } else {
      // À défaut, remet la ligne dans le résultat
      elements.result.value = line.trim();
      elements.operation.textContent = '';
    }
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
  window.CalculatorApp = { safeEval, _gestureAction: gestureAction };
})();
