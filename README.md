# Sentinel Nexus

![Jenkins](https://jenkins.example.com/job/Sentinel-Nexus/badge/icon)

Sentinel Nexus is a static, high-fidelity prototype for an AI disaster prediction and response console. It combines a live risk field, telemetry, explainability, and alert workflows in a single dashboard.

## Features
- Live risk field canvas with hazard switching
- Explainability drivers and methods
- Operational telemetry graphs
- Simulation controls and scenario impacts
- Multi-language alert preview
- WhatsApp notifications (demo success in UI)
- Jenkins pipeline for CI artifacts

## Quick Start
1. Open `index.html` in your browser.
2. If you have caching issues, hard refresh (Ctrl+F5 in Edge).

## WhatsApp Notifications
The UI currently shows a success state for demo purposes.

If you want real sends, use the local gateway:
1. Set credentials (new terminal required after `setx`):
   - `setx WHATSAPP_PHONE_NUMBER_ID "YOUR_PHONE_NUMBER_ID"`
   - `setx WHATSAPP_ACCESS_TOKEN "YOUR_ACCESS_TOKEN"`
2. Start the gateway:
   - `python whatsapp_server.py`

## Jenkins Pipeline
A Jenkins pipeline is included in `Jenkinsfile` and archives the static site assets.

Update the Jenkins badge URL above to your actual job URL, for example:
- `https://your-jenkins/job/Sentinel-Nexus/badge/icon`

## Structure
- `index.html` - main UI
- `css/styles.css` - styling
- `js/main.js` - UI logic, animations, telemetry graphs
- `whatsapp_server.py` - local WhatsApp gateway
- `Jenkinsfile` - CI pipeline
