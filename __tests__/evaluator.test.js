const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = `<!DOCTYPE html><html><body>
<div id="result"></div>
<div id="operation"></div>
<div id="history"></div>
<button id="clearButton"></button>
<button id="deleteButton"></button>
<button id="percentageButton"></button>
<button id="sqrtButton"></button>
<button id="equalsButton"></button>
<button id="powerButton"></button>
</body></html>`;

describe('safeEval', () => {
  let window;
  beforeEach(() => {
    const dom = new JSDOM(html, { runScripts: 'dangerously' });
    window = dom.window;
    const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    window.document.body.appendChild(scriptEl);
  });

  test('computes basic expression', () => {
    expect(window.CalculatorApp.safeEval('2+3*4')).toBe(14);
  });

  test('computes power expression', () => {
    expect(window.CalculatorApp.safeEval('2^3')).toBe(8);
  });

  test('throws on invalid characters', () => {
    expect(() => window.CalculatorApp.safeEval('process.exit()')).toThrow();
  });
});
