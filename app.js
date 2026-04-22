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
const payloadPreview = document.getElementById("payload-preview");
const startPreviewButton = document.getElementById("start-preview-button");
const stopPreviewButton = document.getElementById("stop-preview-button");
const sampleLiveButton = document.getElementById("sample-live-button");
const connectSerialButton = document.getElementById("connect-serial-button");
const disconnectSerialButton = document.getElementById("disconnect-serial-button");
const serialPreview = document.getElementById("serial-preview");
const serialState = document.getElementById("serial-state");
const serialMode = document.getElementById("serial-mode");

const LED_STATE_PATTERNS = {
  blank: Array(25).fill(0),
  heart: [
    0, 1, 0, 1, 0,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    0, 1, 1, 1, 0,
    0, 0, 1, 0, 0,
  ],
  happy: [
    0, 0, 0, 0, 0,
    0, 1, 0, 1, 0,
    0, 0, 0, 0, 0,
    1, 0, 0, 0, 1,
    0, 1, 1, 1, 0,
  ],
  smile: [
    0, 0, 0, 0, 0,
    0, 1, 0, 1, 0,
    0, 0, 0, 0, 0,
    1, 0, 0, 0, 1,
    0, 1, 1, 1, 0,
  ],
  sad: [
    0, 0, 0, 0, 0,
    0, 1, 0, 1, 0,
    0, 0, 0, 0, 0,
    0, 1, 1, 1, 0,
    1, 0, 0, 0, 1,
  ],
  check: [
    0, 0, 0, 0, 1,
    0, 0, 0, 1, 0,
    1, 0, 1, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 0, 0, 0,
  ],
  yes: [
    0, 0, 0, 0, 1,
    0, 0, 0, 1, 0,
    1, 0, 1, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 0, 0, 0,
  ],
  cross: [
    1, 0, 0, 0, 1,
    0, 1, 0, 1, 0,
    0, 0, 1, 0, 0,
    0, 1, 0, 1, 0,
    1, 0, 0, 0, 1,
  ],
  no: [
    1, 0, 0, 0, 1,
    0, 1, 0, 1, 0,
    0, 0, 1, 0, 0,
    0, 1, 0, 1, 0,
    1, 0, 0, 0, 1,
  ],
  square: [
    1, 1, 1, 1, 1,
    1, 0, 0, 0, 1,
    1, 0, 0, 0, 1,
    1, 0, 0, 0, 1,
    1, 1, 1, 1, 1,
  ],
  diamond: [
    0, 0, 1, 0, 0,
    0, 1, 0, 1, 0,
    1, 0, 0, 0, 1,
    0, 1, 0, 1, 0,
    0, 0, 1, 0, 0,
  ],
  thermometer: [
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 1, 1, 1, 0,
  ],
};

for (let index = 0; index < 25; index += 1) {
  const cell = document.createElement("div");
  cell.className = "led-cell";
  ledGrid.appendChild(cell);
  cells.push(cell);
}

const mockFrames = [
  {
    displayState: "happy",
    buttonA: false,
    buttonB: false,
    temperature: 73.4,
  },
  {
    displayState: "square",
    buttonA: true,
    buttonB: false,
    temperature: 77.0,
  },
  {
    displayState: "heart",
    buttonA: false,
    buttonB: true,
    temperature: 80.6,
  },
];

const initialState = {
  ledMatrix: LED_STATE_PATTERNS.blank,
  displayState: "blank",
  buttonA: false,
  buttonB: false,
  temperature: 75.2,
  source: "Mock Data",
  connected: false,
};

let currentState = initialState;
let frameIndex = 0;
let previewIntervalId = null;
let serialPort = null;
let serialReader = null;
let serialReadLoopPromise = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeStateName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s:-]+/g, "");
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

function getLedMatrixForState(stateName) {
  const normalizedState = normalizeStateName(stateName);
  return LED_STATE_PATTERNS[normalizedState] ?? LED_STATE_PATTERNS.blank;
}

function extractLedMatrixFromObject(payload) {
  const ledKeys = Array.from({ length: 25 }, (_, index) => `led${index + 1}`);

  if (ledKeys.every((key) => key in payload)) {
    return ledKeys.map((key) => payload[key]);
  }

  if (payload.displayState || payload.state || payload.ledState || payload.icon) {
    return getLedMatrixForState(
      payload.displayState ?? payload.state ?? payload.ledState ?? payload.icon,
    );
  }

  return payload.ledMatrix;
}

function normalizeIncomingPayload(payload) {
  const ledMatrix = extractLedMatrixFromObject(payload);
  const displayState = payload.displayState ?? payload.state ?? payload.ledState ?? payload.icon ?? "blank";

  return {
    ledMatrix,
    displayState: normalizeStateName(displayState),
    buttonA: Boolean(Number(payload.buttonA ?? payload.a ?? 0)),
    buttonB: Boolean(Number(payload.buttonB ?? payload.b ?? 0)),
    temperature: Number(payload.temperature ?? payload.temp ?? 0),
    source: "Microsoft MakeCode Data Streamer",
    connected: true,
  };
}

function parseCsvLine(line) {
  return line
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry, index, entries) => !(index === entries.length - 1 && entry === ""));
}

function normalizeCsvPayload(line) {
  const values = parseCsvLine(line);

  if (values.length === 2) {
    return normalizeIncomingPayload({
      displayState: values[0],
      temperature: values[1],
      buttonA: 0,
      buttonB: 0,
    });
  }

  if (values.length >= 28) {
    return normalizeIncomingPayload({
      ledMatrix: values.slice(0, 25),
      buttonA: values[25],
      buttonB: values[26],
      temperature: values[27],
    });
  }

  if (values.length === 4 && /^[01]+$/.test(values[0])) {
    return normalizeIncomingPayload({
      ledMatrix: values[0].slice(0, 25).split(""),
      buttonA: values[1],
      buttonB: values[2],
      temperature: values[3],
    });
  }

  return null;
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
  const fillPercent = clamp(((safeTemperature - 32) / 72) * 100, 8, 100);

  temperatureValue.textContent = `${safeTemperature.toFixed(1)}`;
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
  payloadPreview.textContent = JSON.stringify(
    {
      ledMatrix: currentState.ledMatrix,
      displayState: currentState.displayState,
      buttonA: currentState.buttonA,
      buttonB: currentState.buttonB,
      temperature: currentState.temperature,
      source: currentState.source,
    },
    null,
    2,
  );
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

function startPreviewLoop() {
  if (previewIntervalId !== null) {
    return;
  }

  nextMockFrame();
  previewIntervalId = window.setInterval(nextMockFrame, 2400);
}

function stopPreviewLoop() {
  if (previewIntervalId === null) {
    return;
  }

  window.clearInterval(previewIntervalId);
  previewIntervalId = null;
}

function updateSerialState(message) {
  serialState.textContent = message;
}

async function disconnectSerial() {
  if (serialReader) {
    await serialReader.cancel();
    serialReader.releaseLock();
    serialReader = null;
  }

  if (serialPort) {
    await serialPort.close();
    serialPort = null;
  }

  if (serialReadLoopPromise) {
    try {
      await serialReadLoopPromise;
    } catch (_error) {
      // The read loop rejects on cancellation, which is expected during disconnect.
    }
    serialReadLoopPromise = null;
  }

  updateSerialState("Idle");
}

async function readSerialLoop() {
  const decoder = new TextDecoder();
  let buffer = "";

  while (serialPort?.readable && serialReader) {
    const { value, done } = await serialReader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return;
      }

      serialPreview.textContent = trimmedLine;
      const payload = normalizeCsvPayload(trimmedLine);

      if (!payload) {
        updateSerialState("Connected, waiting for supported CSV packets");
        return;
      }

      window.updateMicrobitDashboard(payload);
      updateSerialState("Receiving CSV packets");
    });
  }
}

async function connectSerial() {
  if (!("serial" in navigator)) {
    serialMode.textContent = "Unavailable in this browser";
    updateSerialState("Web Serial API not supported");
    return;
  }

  try {
    updateSerialState("Requesting device");
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 9600 });
    serialReader = serialPort.readable.getReader();
    updateSerialState("Connected");
    stopPreviewLoop();
    serialReadLoopPromise = readSerialLoop();
    await serialReadLoopPromise;
  } catch (error) {
    if (error?.name !== "NotFoundError") {
      console.error("Serial connection error:", error);
      updateSerialState("Connection failed");
    } else {
      updateSerialState("No device selected");
    }
  } finally {
    await disconnectSerial();
  }
}

// Data Streamer integration point:
// Replace the preview feed by calling `window.updateMicrobitDashboard(...)`
// whenever MakeCode Data Streamer emits a new row of values.
// Example payload:
// {
//   displayState: "heart",
//   temperature: 75.2
// }
window.updateMicrobitDashboard = function updateMicrobitDashboard(payload) {
  stopPreviewLoop();
  renderDashboard(payload.connected ? payload : normalizeIncomingPayload(payload));
};

renderDashboard(initialState);
nextMockFrame();
previewIntervalId = window.setInterval(nextMockFrame, 2400);

startPreviewButton.addEventListener("click", startPreviewLoop);
stopPreviewButton.addEventListener("click", stopPreviewLoop);
sampleLiveButton.addEventListener("click", () => {
  window.updateMicrobitDashboard({
    displayState: "cross",
    temperature: 84.2,
  });
});
connectSerialButton.addEventListener("click", () => {
  void connectSerial();
});
disconnectSerialButton.addEventListener("click", () => {
  void disconnectSerial();
});
