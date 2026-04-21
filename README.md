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
- An animated vertical temperature gauge with numeric readout
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
