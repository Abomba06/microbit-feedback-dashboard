# microbit-feedback-dashboard

A lightweight real-time dashboard for a BBC micro:bit using Microsoft MakeCode Data Streamer values.

## Run locally

```bash
npm start
```

Then open `http://localhost:3000`.

## Included

- A 5x5 LED matrix that visually mirrors the micro:bit display
- Live Button A and Button B status cards
- An animated vertical temperature gauge with Fahrenheit readout
- Mock preview data so the dashboard is easy to test before a device is connected

## Files

- `index.html` contains the dashboard markup
- `styles.css` handles the responsive dashboard styling
- `app.js` renders incoming values and includes the live data adapter hook

## Connect live data

Run the local server, open the dashboard in a browser, then feed live values into:

```js
window.updateMicrobitDashboard({
  ledMatrix: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0],
  buttonA: 1,
  buttonB: 0,
  temperature: 24
});
```

`app.js` also includes normalization helpers so you can adapt keyed Data Streamer values without changing the UI layout.

## Direct micro:bit serial bridge

The dashboard can also connect straight to the micro:bit from `localhost` using the browser's Web Serial API.

- Use a Chromium-based browser such as Microsoft Edge or Google Chrome
- Open the dashboard on `http://localhost:3000`
- Click `Connect micro:bit`
- Choose the micro:bit serial device

Recommended serial packet format from MakeCode Data Streamer:

```text
led1,led2,led3,...,led25,buttonA,buttonB,temperature
```

Notes:

- Baud rate: `9600`
- Each packet should end with a newline
- The bridge reads one CSV line at a time and maps the first 25 values to the LED matrix
- It also accepts a compact fallback format of `25-character-led-string,buttonA,buttonB,temperature`
