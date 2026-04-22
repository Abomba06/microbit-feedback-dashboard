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
  displayState: "heart",
  temperature: 75.2
});
```

`app.js` maps named display states to 5x5 LED patterns, so the micro:bit only needs to send the state name and the temperature.

## Direct micro:bit serial bridge

The dashboard can also connect straight to the micro:bit from `localhost` using the browser's Web Serial API.

- Use a Chromium-based browser such as Microsoft Edge or Google Chrome
- Open the dashboard on `http://localhost:3000`
- Click `Connect micro:bit`
- Choose the micro:bit serial device

Recommended serial packet format from MakeCode Data Streamer:

```text
stateName,temperature
```

Notes:

- Baud rate: `9600`
- Each packet should end with a newline
- The bridge reads one CSV line at a time and maps the state name to a built-in 5x5 LED pattern
- Supported built-in state names include `blank`, `heart`, `happy`, `smile`, `sad`, `check`, `yes`, `cross`, `no`, `square`, `diamond`, and `thermometer`
- If you want more state names later, add them to `LED_STATE_PATTERNS` in `app.js`
