const ledGrid = document.getElementById("led-grid");
const cells = [];
const temperatureValue = document.getElementById("temperature-value");
const thermometerFill = document.getElementById("thermometer-fill");
const connectionPill = document.getElementById("connection-pill");
const sourceName = document.getElementById("source-name");
const lastUpdate = document.getElementById("last-update");
const streamStatus = document.getElementById("stream-status");
const buttonAState = document.getElementById("button-a-state");
const buttonBState = document.getElementById("button-b-state");
const buttonACard = document.getElementById("button-a-card");
const buttonBCard = document.getElementById("button-b-card");

for (let index = 0; index < 25; index += 1) {
  const cell = document.createElement("div");
  cell.className = "led-cell";
  ledGrid.appendChild(cell);
  cells.push(cell);
}

const mockFrames = [
  {
    ledMatrix: [
      0, 1, 0, 1, 0,
      0, 1, 0, 1, 0,
      0, 0, 1, 0, 0,
      1, 0, 0, 0, 1,
      0, 1, 1, 1, 0,
    ],
    buttonA: false,
    buttonB: false,
    temperature: 23,
  },
  {
    ledMatrix: [
      0, 1, 1, 1, 0,
      1, 0, 0, 0, 1,
      1, 0, 1, 0, 1,
      1, 0, 0, 0, 1,
      0, 1, 1, 1, 0,
    ],
    buttonA: true,
    buttonB: false,
    temperature: 25,
  },
  {
    ledMatrix: [
      1, 1, 1, 1, 1,
      1, 0, 0, 0, 1,
      1, 0, 1, 0, 1,
      1, 0, 0, 0, 1,
      1, 1, 1, 1, 1,
    ],
    buttonA: false,
    buttonB: true,
    temperature: 27,
  },
];

const initialState = {
  ledMatrix: Array(25).fill(0),
  buttonA: false,
  buttonB: false,
  temperature: 24,
  source: "Mock Data",
  connected: false,
};

let currentState = initialState;
let frameIndex = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLedMatrix(ledMatrix) {
  if (!Array.isArray(ledMatrix)) {
    return currentState.ledMatrix;
  }

  const expanded = ledMatrix.slice(0, 25).map((value) => (Number(value) > 0 ? 1 : 0));

  while (expanded.length < 25) {
    expanded.push(0);
  }

  return expanded;
}

function setButtonState(card, labelNode, isPressed) {
  card.classList.toggle("is-pressed", isPressed);
  labelNode.textContent = isPressed ? "Pressed" : "Not Pressed";
}

function renderDashboard(state) {
  currentState = {
    ...currentState,
    ...state,
    ledMatrix: normalizeLedMatrix(state.ledMatrix ?? currentState.ledMatrix),
  };

  currentState.ledMatrix.forEach((value, index) => {
    cells[index].classList.toggle("is-on", value === 1);
  });

  setButtonState(buttonACard, buttonAState, Boolean(currentState.buttonA));
  setButtonState(buttonBCard, buttonBState, Boolean(currentState.buttonB));

  const safeTemperature = Number.isFinite(Number(currentState.temperature))
    ? Number(currentState.temperature)
    : 0;
  const fillPercent = clamp(((safeTemperature + 5) / 45) * 100, 8, 100);

  temperatureValue.textContent = `${Math.round(safeTemperature)}`;
  thermometerFill.style.height = `${fillPercent}%`;

  sourceName.textContent = currentState.source;
  lastUpdate.textContent = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  streamStatus.textContent = currentState.connected
    ? "Receiving live micro:bit values"
    : "Showing preview values until a live stream arrives";
  connectionPill.textContent = currentState.connected ? "Live Stream Active" : "Preview Mode";
}

function nextMockFrame() {
  const frame = mockFrames[frameIndex % mockFrames.length];
  frameIndex += 1;
  renderDashboard({
    ...frame,
    source: "Mock Data",
    connected: false,
  });
}

// Data Streamer integration point:
// Replace the preview feed by calling `window.updateMicrobitDashboard(...)`
// whenever MakeCode Data Streamer emits a new row of values.
// Example payload:
// {
//   ledMatrix: [0, 1, 0, ... 25 total values],
//   buttonA: 1,
//   buttonB: 0,
//   temperature: 24
// }
window.updateMicrobitDashboard = function updateMicrobitDashboard(payload) {
  renderDashboard({
    ledMatrix: payload.ledMatrix,
    buttonA: Boolean(Number(payload.buttonA)),
    buttonB: Boolean(Number(payload.buttonB)),
    temperature: Number(payload.temperature),
    source: "Microsoft MakeCode Data Streamer",
    connected: true,
  });
};

renderDashboard(initialState);
nextMockFrame();
window.setInterval(nextMockFrame, 2400);
