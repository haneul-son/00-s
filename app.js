(function () {
  "use strict";

  const mainDisplay = document.getElementById("mainDisplay");
  const subDisplay = document.getElementById("subDisplay");
  const keypad = document.getElementById("keypad");

  /** @type {{ current: string, stored: number | null, operator: string | null, fresh: boolean }} */
  const state = {
    current: "0",
    stored: null,
    operator: null,
    fresh: false,
  };

  function formatNumber(n) {
    if (!Number.isFinite(n)) return "오류";
    const s = String(n);
    if (s.length > 12) {
      const exp = n.toExponential(6);
      return exp.length > 12 ? n.toExponential(4) : exp;
    }
    return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function updateDisplay() {
    mainDisplay.textContent = state.current;
    if (state.stored !== null && state.operator) {
      const opLabel = { "+": "+", "-": "−", "*": "×", "/": "÷" }[state.operator] ?? state.operator;
      subDisplay.textContent = `${formatNumber(state.stored)} ${opLabel}`;
      subDisplay.hidden = false;
    } else {
      subDisplay.textContent = "";
      subDisplay.hidden = true;
    }
  }

  function parseCurrent() {
    const n = parseFloat(state.current);
    return Number.isFinite(n) ? n : 0;
  }

  function applyOperator(b, op, a) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function inputDigit(d) {
    if (state.fresh) {
      state.current = d;
      state.fresh = false;
    } else if (state.current === "0" && d !== "0") {
      state.current = d;
    } else if (state.current === "0" && d === "0") {
      return;
    } else if (state.current.replace(".", "").length >= 12) {
      return;
    } else {
      state.current += d;
    }
  }

  function inputDecimal() {
    if (state.fresh) {
      state.current = "0.";
      state.fresh = false;
      return;
    }
    if (!state.current.includes(".")) state.current += ".";
  }

  function inputOperator(op) {
    const value = parseCurrent();
    if (state.stored !== null && state.operator && !state.fresh) {
      const result = applyOperator(value, state.operator, state.stored);
      if (!Number.isFinite(result)) {
        state.current = "오류";
        state.stored = null;
        state.operator = null;
        state.fresh = true;
        updateDisplay();
        return;
      }
      state.stored = result;
    } else {
      state.stored = value;
    }
    state.operator = op;
    state.fresh = true;
  }

  function equals() {
    if (state.stored === null || !state.operator) return;
    const value = parseCurrent();
    const result = applyOperator(value, state.operator, state.stored);
    state.current = Number.isFinite(result) ? formatNumber(result) : "오류";
    state.stored = null;
    state.operator = null;
    state.fresh = true;
  }

  function clearAll() {
    state.current = "0";
    state.stored = null;
    state.operator = null;
    state.fresh = false;
  }

  function toggleSign() {
    if (state.current === "오류") return;
    if (state.current === "0" || state.current === "0.") return;
    if (state.current.startsWith("-")) state.current = state.current.slice(1);
    else state.current = "-" + state.current;
  }

  function percent() {
    if (state.current === "오류") return;
    const n = parseCurrent() / 100;
    state.current = formatNumber(n);
    state.fresh = true;
  }

  keypad.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (state.current === "오류" && action !== "clear") return;

    switch (action) {
      case "digit":
        inputDigit(btn.dataset.value);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "operator":
        inputOperator(btn.dataset.value);
        break;
      case "equals":
        equals();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      default:
        break;
    }
    updateDisplay();
  });

  const keyMap = {
    Escape: () => clearAll(),
    Backspace: () => {
      if (state.fresh || state.current === "오류") return;
      if (state.current.length <= 1) state.current = "0";
      else state.current = state.current.slice(0, -1);
    },
    Enter: () => equals(),
    "=": () => equals(),
    "+": () => inputOperator("+"),
    "-": () => inputOperator("-"),
    "*": () => inputOperator("*"),
    "/": () => inputOperator("/"),
    ".": () => inputDecimal(),
    ",": () => inputDecimal(),
  };

  for (let d = 0; d <= 9; d++) {
    keyMap[String(d)] = () => inputDigit(String(d));
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const fn = keyMap[e.key];
    if (!fn) return;
    e.preventDefault();
    if (state.current === "오류" && e.key !== "Escape") return;
    fn();
    updateDisplay();
  });

  updateDisplay();
})();
