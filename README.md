# microbit-feedback-dashboard

A presentation-ready live feed dashboard for a BBC micro:bit incubator system.

## Run locally

```bash
npm start
```

Then open `http://localhost:3000`.

## Live Beat Bass Mode

This version uses hardcoded stages instead of live device input.

- Press the spacebar to move to the next stage
- Or click the `Next Step` button
- The final step loops back to the introduction
- Temperature updates once per second and gradually moves toward each stage target with decimal variation

## Live feed stages

1. Intro
2. Preheat
3. In Range
4. Out Of Range
5. Recovery
6. Destroyed

## What the live feed shows

- The incubator target range of `85°F` to `90°F`
- A warm-up phase before the sample is safe
- A stable in-range state
- A warning state with visible time out of range
- A successful recovery before the 20-second limit
- A destroyed sample after staying unsafe too long
- A unique sound cue at the beginning of each stage for clearer presentation feedback

## Main files

- `index.html` contains the dashboard structure
- `styles.css` contains the presentation styling
- `app.js` controls the scripted live feed flow and stage rendering
- `server.js` serves the project on localhost
