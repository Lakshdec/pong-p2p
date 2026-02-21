# Pong P2P (HTML only)

## Overview
Static, HTML-only P2P Pong using WebRTC DataChannel and manual copy/paste signaling.
- `index.html` — player page (host or join)
- `admin.html` — admin page (connects as a peer to send admin commands)
- `game.js` — player/host logic
- `admin.js` — admin logic
- `style.css` — styling

## Local testing
1. Serve files locally:
   - `python -m http.server 8000`
2. Open `http://localhost:8000/index.html` in two windows (or devices).
3. Host: click **Create Room**, copy the Offer from the output box.
4. Join: paste the Offer into the other window's input, click **Paste Offer & Create Answer**, copy the Answer back to the host output box and paste into host input.
5. If ICE candidates appear, exchange them by copying lines from output to the other peer's input and clicking **Add ICE**.

## Admin
1. Open `admin.html`.
2. Paste the host Offer into the input and click **Connect to Host**.
3. Copy the Answer and paste it back to the host as with a normal join.
4. Use **Pause**, **Resume**, and **Set Score** after DataChannel opens.

## Notes and tips
- Manual signaling is copy/paste only. Use the included public STUN server for NAT traversal.
- Host is authoritative for physics and admin commands are applied by the host.
- For better UX later, add a small signaling server or use a third-party signaling service.