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
const connectMicrobitButton = document.getElementById("connect-microbit-button");
const disconnectMicrobitButton = document.getElementById("disconnect-microbit-button");
const microbitConnectionStatus = document.getElementById("microbit-connection-status");
const microbitConnectionNote = document.getElementById("microbit-connection-note");

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
  skull: [
    0, 1, 1, 1, 0,
    1, 0, 1, 0, 1,
    1, 1, 1, 1, 1,
    0, 1, 0, 1, 0,
    0, 1, 1, 1, 0,
  ],
};

const demoSteps = [
  {
    stageName: "INTRO",
    title: "Micro:bit Incubator System",
    status: "Live feed introduction ready",
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
    soundCue: "intro",
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
    entryTemperature: 76.3,
    temperatureBand: [85.4, 86.8],
    timeOutOfRangeStart: 0,
    timeOutOfRangeLimit: 0,
    alarmTone: "Quiet",
    sampleStatus: "Protected",
    soundCue: "warming",
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
    soundCue: "stable",
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
    soundCue: "warning",
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
    soundCue: "recovery",
  },
  {
    stageName: "FAILURE_X",
    title: "Critical failure warning",
    status: "Sample Lost",
    feedback: "The system has reached the final warning state before destruction is confirmed.",
    description:
      "The incubator has stayed unsafe past the allowed limit, so the system raises a final visual X warning before confirming destruction.",
    ledState: "cross",
    ledDescription: "The LED matrix shows an X to signal a critical failure condition.",
    temperatureBand: [80.1, 83.8],
    timeOutOfRangeStart: 20,
    timeOutOfRangeLimit: 21,
    alarmTone: "Critical Alarm",
    sampleStatus: "Lost",
    soundCue: "destroyed",
  },
  {
    stageName: "DESTROYED",
    title: "Destruction confirmed",
    status: "Sample Destroyed",
    feedback: "Temperature remained unsafe for over 20 seconds.",
    description:
      "The incubator stayed outside the safe range too long. Once the unsafe timer passes 20 seconds, the sample is marked as destroyed and cannot recover.",
    ledState: "skull",
    ledDescription: "The LED matrix shows a skull because the sample has been out of range for more than 20 seconds.",
    temperatureBand: [80.4, 84.2],
    timeOutOfRangeStart: 21,
    timeOutOfRangeLimit: 24,
    alarmTone: "Critical Alarm",
    sampleStatus: "Destroyed",
    soundCue: "destroyed",
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
let microbitPort = null;
let audioContext = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  audioContext = new AudioContextCtor();
  return audioContext;
}

function playTone(context, frequency, startAt, duration, type, gainValue) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playNoiseCue(cueName) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume();
  }

  const now = context.currentTime + 0.02;

  if (cueName === "intro") {
    playTone(context, 392, now, 0.18, "sine", 0.06);
    playTone(context, 523.25, now + 0.14, 0.2, "sine", 0.05);
    return;
  }

  if (cueName === "warming") {
    playTone(context, 330, now, 0.18, "triangle", 0.05);
    playTone(context, 392, now + 0.12, 0.18, "triangle", 0.05);
    playTone(context, 494, now + 0.24, 0.22, "triangle", 0.05);
    return;
  }

  if (cueName === "stable") {
    playTone(context, 523.25, now, 0.15, "sine", 0.05);
    playTone(context, 659.25, now + 0.12, 0.2, "sine", 0.05);
    return;
  }

  if (cueName === "warning") {
    playTone(context, 220, now, 0.18, "square", 0.05);
    playTone(context, 220, now + 0.24, 0.18, "square", 0.05);
    playTone(context, 196, now + 0.48, 0.24, "square", 0.05);
    return;
  }

  if (cueName === "recovery") {
    playTone(context, 392, now, 0.14, "triangle", 0.05);
    playTone(context, 523.25, now + 0.1, 0.14, "triangle", 0.05);
    playTone(context, 659.25, now + 0.2, 0.22, "triangle", 0.05);
    return;
  }

  if (cueName === "destroyed") {
    playTone(context, 196, now, 0.28, "sawtooth", 0.05);
    playTone(context, 164.81, now + 0.2, 0.28, "sawtooth", 0.05);
    playTone(context, 130.81, now + 0.42, 0.38, "sawtooth", 0.05);
  }
}

function setMicrobitConnectionState(status, note) {
  microbitConnectionStatus.textContent = status;
  microbitConnectionNote.textContent = note;
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
    currentTemperature = stepTowardTarget(currentTemperature, desiredReading, 0.9, 1.2);
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
  nextStepButton.textContent = demoStep === demoSteps.length - 1 ? "Restart Live Feed" : "Next Step";
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
  if (typeof stepConfig.entryTemperature === "number") {
    currentTemperature = stepConfig.entryTemperature;
  }

  if (demoStep === 0 && currentTemperature < 70) {
    currentTemperature = 72.4;
  }

  playNoiseCue(stepConfig.soundCue);
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

async function disconnectMicrobit() {
  if (!microbitPort) {
    setMicrobitConnectionState(
      "Not connected",
      "You can connect a real micro:bit here, but Live Beat Bass Mode will continue using scripted live feed data.",
    );
    return;
  }

  try {
    await microbitPort.close();
  } catch (_error) {
    // Ignore close errors so the live feed can recover gracefully.
  }

  microbitPort = null;
  setMicrobitConnectionState(
    "Disconnected",
    "The micro:bit link has been closed. The scripted walkthrough is still active.",
  );
}

async function connectMicrobit() {
  if (!("serial" in navigator)) {
    setMicrobitConnectionState(
      "Web Serial unavailable",
      "Use a Chromium-based browser on localhost if you want to pair a micro:bit during the live feed.",
    );
    return;
  }

  try {
    setMicrobitConnectionState(
      "Requesting device...",
      "Choose your micro:bit from the browser prompt. Live feed visuals will remain scripted after connection.",
    );

    microbitPort = await navigator.serial.requestPort();
    await microbitPort.open({ baudRate: 9600 });

    setMicrobitConnectionState(
      "micro:bit connected",
      "The micro:bit is paired successfully. Live Beat Bass Mode is still using hardcoded live feed stages instead of incoming device data.",
    );
  } catch (error) {
    if (error?.name === "NotFoundError") {
      setMicrobitConnectionState(
        "Connection canceled",
        "No micro:bit was selected. The live feed is still fully usable without a device connection.",
      );
      return;
    }

    microbitPort = null;
    setMicrobitConnectionState(
      "Connection failed",
      "The browser could not open the micro:bit serial port. The scripted live feed will keep running normally.",
    );
  }
}

connectMicrobitButton.addEventListener("click", () => {
  void connectMicrobit();
});

disconnectMicrobitButton.addEventListener("click", () => {
  void disconnectMicrobit();
});

renderDemoStep(0);
