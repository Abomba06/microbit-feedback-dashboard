const ledGrid = document.getElementById("led-grid");
const cells = [];
const temperatureValue = document.getElementById("temperature-value");
const thermometerFill = document.getElementById("thermometer-fill");
const connectionPill = document.getElementById("connection-pill");
const statePill = document.getElementById("state-pill");
const statusText = document.getElementById("status-text");
const feedbackText = document.getElementById("feedback-text");
const explanationTitle = document.getElementById("explanation-title");
const explanationBody = document.getElementById("explanation-body");
const timerValue = document.getElementById("timer-value");
const ledDescription = document.getElementById("led-description");
const payloadPreview = document.getElementById("payload-preview");
const nextStepButton = document.getElementById("next-step-button");
const buttonAState = document.getElementById("button-a-state");
const buttonBState = document.getElementById("button-b-state");
const buttonACard = document.getElementById("button-a-card");
const buttonBCard = document.getElementById("button-b-card");
const stepList = document.getElementById("step-list");

const LED_STATE_PATTERNS = {
  blank: Array(25).fill(0),
  thermometer: [
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 1, 1, 1, 0,
  ],
  check: [
    0, 0, 0, 0, 1,
    0, 0, 0, 1, 0,
    1, 0, 1, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 0, 0, 0,
  ],
  square: [
    1, 1, 1, 1, 1,
    1, 0, 0, 0, 1,
    1, 0, 1, 0, 1,
    1, 0, 0, 0, 1,
    1, 1, 1, 1, 1,
  ],
  cross: [
    1, 0, 0, 0, 1,
    0, 1, 0, 1, 0,
    0, 0, 1, 0, 0,
    0, 1, 0, 1, 0,
    1, 0, 0, 0, 1,
  ],
};

const demoSteps = [
  {
    stageName: "INTRO",
    title: "Micro:bit Incubator System",
    status: "Demo introduction ready",
    feedback:
      "The incubator keeps a sample safe by staying within the approved range and responding clearly when conditions change.",
    description:
      "This incubator maintains an internal temperature between 85°F and 90°F to keep the sample safe. The system monitors temperature continuously and provides feedback through LEDs, sound, and a dashboard.",
    ledState: "blank",
    ledDescription: "The LED display is neutral while the system rules are introduced.",
    temperatureBand: [72.2, 72.9],
    timeOutOfRangeStart: 0,
    timeOutOfRangeLimit: 0,
    alarmTone: "Quiet",
    sampleStatus: "Protected",
  },
  {
    stageName: "PREHEAT",
    title: "Preheat sequence",
    status: "Preheating system...",
    feedback: "System is warming up to reach safe temperature range.",
    description:
      "The heater is active and the incubator is climbing toward the approved temperature window before the sample can be considered fully safe.",
    ledState: "thermometer",
    ledDescription: "The LED matrix shows a thermometer icon to indicate active warming.",
    temperatureBand: [85.4, 86.8],
    timeOutOfRangeStart: 0,
    timeOutOfRangeLimit: 0,
    alarmTone: "Quiet",
    sampleStatus: "Protected",
  },
  {
    stageName: "IN_RANGE",
    title: "Temperature stable",
    status: "Temperature Stable",
    feedback: "Sample is safe. Temperature is within 85–90°F.",
    description:
      "The incubator has reached the target band, so the sample remains safe and the system confirms stable conditions with a positive indicator.",
    ledState: "check",
    ledDescription: "The LED matrix shows a checkmark because the sample is safe.",
    temperatureBand: [86.4, 88.6],
    timeOutOfRangeStart: 0,
    timeOutOfRangeLimit: 0,
    alarmTone: "Quiet",
    sampleStatus: "Protected",
  },
  {
    stageName: "OUT_OF_RANGE_HIGH",
    title: "Warning state",
    status: "Temperature Out of Range",
    feedback: "Temperature has left the safe range. Timer started.",
    description:
      "The incubator has drifted out of range, so the countdown begins. The sample is still recoverable, but action is required before the timer reaches 20 seconds.",
    ledState: "square",
    ledDescription: "The LED matrix shows a warning-style square to signal unsafe conditions.",
    temperatureBand: [91.3, 95.2],
    timeOutOfRangeStart: 0,
    timeOutOfRangeLimit: 12,
    alarmTone: "Warning Beep",
    sampleStatus: "At Risk",
  },
  {
    stageName: "RECOVERY",
    title: "Recovery complete",
    status: "Recovered",
    feedback: "Temperature returned to safe range before damage occurred.",
    description:
      "The system corrected the issue before the 20-second limit. Because the incubator re-entered the safe zone in time, the sample is still protected.",
    ledState: "check",
    ledDescription: "The LED matrix returns to a checkmark to confirm recovery.",
    temperatureBand: [86.8, 88.4],
    timeOutOfRangeStart: 8,
    timeOutOfRangeLimit: 0,
    alarmTone: "Quiet",
    sampleStatus: "Protected",
  },
  {
    stageName: "DESTROYED",
    title: "Failure condition",
    status: "Sample Destroyed",
    feedback: "Temperature remained unsafe for over 20 seconds.",
    description:
      "The incubator stayed outside the safe range too long. Once the unsafe timer passes 20 seconds, the sample is marked as destroyed and cannot recover.",
    ledState: "cross",
    ledDescription: "The LED matrix shows a cross because the sample has been destroyed.",
    temperatureBand: [80.4, 84.2],
    timeOutOfRangeStart: 21,
    timeOutOfRangeLimit: 24,
    alarmTone: "Critical Alarm",
    sampleStatus: "Destroyed",
  },
];

for (let index = 0; index < 25; index += 1) {
  const cell = document.createElement("div");
  cell.className = "led-cell";
  ledGrid.appendChild(cell);
  cells.push(cell);
}

let demoStep = 0;
let currentTemperature = 72.4;
let currentOutOfRangeSeconds = 0;
let stageIntervalId = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeLedMatrix(ledMatrix) {
  const expanded = (ledMatrix ?? []).slice(0, 25).map((value) => (Number(value) > 0 ? 1 : 0));

  while (expanded.length < 25) {
    expanded.push(0);
  }

  return expanded;
}

function setButtonState(card, labelNode, label, isActive) {
  card.classList.toggle("is-pressed", isActive);
  labelNode.textContent = label;
}

function getDemoSnapshot(stepConfig) {
  return {
    demoStep,
    stageName: stepConfig.stageName,
    ledState: stepConfig.ledState,
    temperature: Number(temperatureValue.textContent),
    timeOutOfRange: timerValue.textContent,
    alarmTone: buttonAState.textContent,
    sampleStatus: buttonBState.textContent,
  };
}

function renderLedState(stateName) {
  const ledMatrix = normalizeLedMatrix(LED_STATE_PATTERNS[stateName] ?? LED_STATE_PATTERNS.blank);
  ledMatrix.forEach((value, index) => {
    cells[index].classList.toggle("is-on", value === 1);
  });
}

function renderTemperature(readingFahrenheit) {
  const safeTemperature = Number(readingFahrenheit);
  const fillPercent = clamp(((safeTemperature - 32) / 72) * 100, 8, 100);

  temperatureValue.textContent = safeTemperature.toFixed(1);
  thermometerFill.style.height = `${fillPercent}%`;
}

function renderTimer(seconds) {
  timerValue.textContent = `${Number(seconds).toFixed(1)} seconds`;
}

function renderStepList() {
  Array.from(stepList.children).forEach((item, index) => {
    item.classList.toggle("is-active", index === demoStep);
    item.classList.toggle("is-complete", index < demoStep);
  });
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function stepTowardTarget(currentValue, targetValue, minStep, maxStep) {
  const difference = targetValue - currentValue;

  if (Math.abs(difference) < minStep) {
    return targetValue;
  }

  const direction = Math.sign(difference) || 1;
  const magnitude = clamp(Math.abs(difference), minStep, maxStep);
  return currentValue + direction * magnitude;
}

function updateTemperatureTowardBand(stepConfig) {
  const [bandMin, bandMax] = stepConfig.temperatureBand;
  const bandMidpoint = (bandMin + bandMax) / 2;
  const desiredReading = randomBetween(bandMin, bandMax);

  if (stepConfig.stageName === "PREHEAT") {
    currentTemperature = stepTowardTarget(currentTemperature, desiredReading, 1.8, 3.7);
  } else if (stepConfig.stageName === "OUT_OF_RANGE_HIGH") {
    currentTemperature = stepTowardTarget(currentTemperature, desiredReading, 1.2, 2.9);
  } else if (stepConfig.stageName === "DESTROYED") {
    currentTemperature = stepTowardTarget(currentTemperature, desiredReading, 0.9, 2.4);
  } else if (stepConfig.stageName === "RECOVERY") {
    currentTemperature = stepTowardTarget(currentTemperature, desiredReading, 0.9, 2.2);
  } else {
    currentTemperature += (desiredReading - currentTemperature) * 0.45;
  }

  if (Math.abs(currentTemperature - bandMidpoint) < 0.18) {
    currentTemperature = desiredReading;
  }

  currentTemperature = clamp(currentTemperature, 65, 100);
  currentTemperature = Number(currentTemperature.toFixed(1));
}

function updateOutOfRangeTimer(stepConfig) {
  if (stepConfig.timeOutOfRangeLimit === 0) {
    currentOutOfRangeSeconds = 0;
    return;
  }

  if (currentOutOfRangeSeconds < stepConfig.timeOutOfRangeLimit) {
    currentOutOfRangeSeconds += 1;
  }
}

function applyStepFrame(stepConfig) {
  renderLedState(stepConfig.ledState);
  renderTemperature(currentTemperature);
  renderTimer(currentOutOfRangeSeconds);

  connectionPill.textContent = `Stage ${demoStep} of ${demoSteps.length - 1}`;
  statePill.textContent = stepConfig.stageName;
  statusText.textContent = stepConfig.status;
  feedbackText.textContent = stepConfig.feedback;
  explanationTitle.textContent = stepConfig.title;
  explanationBody.textContent = stepConfig.description;
  ledDescription.textContent = stepConfig.ledDescription;

  setButtonState(
    buttonACard,
    buttonAState,
    stepConfig.alarmTone,
    stepConfig.alarmTone !== "Quiet",
  );
  setButtonState(
    buttonBCard,
    buttonBState,
    stepConfig.sampleStatus,
    stepConfig.sampleStatus !== "Protected",
  );

  payloadPreview.textContent = JSON.stringify(getDemoSnapshot(stepConfig), null, 2);
  renderStepList();
  nextStepButton.textContent = demoStep === demoSteps.length - 1 ? "Restart Demo" : "Next Step";
}

function stopStageTicker() {
  if (stageIntervalId !== null) {
    window.clearInterval(stageIntervalId);
    stageIntervalId = null;
  }
}

function startStageTicker(stepConfig) {
  stopStageTicker();
  applyStepFrame(stepConfig);

  stageIntervalId = window.setInterval(() => {
    updateTemperatureTowardBand(stepConfig);
    updateOutOfRangeTimer(stepConfig);
    applyStepFrame(stepConfig);
  }, 1000);
}

function renderDemoStep(step) {
  demoStep = clamp(step, 0, demoSteps.length - 1);
  const stepConfig = demoSteps[demoStep];

  currentOutOfRangeSeconds = stepConfig.timeOutOfRangeStart ?? 0;

  if (demoStep === 0 && currentTemperature < 70) {
    currentTemperature = 72.4;
  }

  startStageTicker(stepConfig);
}

function advanceDemoStep() {
  if (demoStep === demoSteps.length - 1) {
    renderDemoStep(0);
    return;
  }

  renderDemoStep(demoStep + 1);
}

nextStepButton.addEventListener("click", advanceDemoStep);

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space") {
    return;
  }

  const targetTag = event.target instanceof HTMLElement ? event.target.tagName : "";
  if (targetTag === "BUTTON") {
    return;
  }

  event.preventDefault();
  advanceDemoStep();
});

renderDemoStep(0);
