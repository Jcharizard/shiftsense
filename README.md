<div align="center">
  <h1>🏎️ ShiftSense</h1>
  <p><strong>A powerful hardware middleware layer for Sim Racing</strong></p>
  <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</div>

<br />

**ShiftSense** is a full-stack desktop application that bridges the gap between hardware sim-racing peripherals (like the Logitech G29/G920) and games that lack native support for custom setups. It intercepts raw USB inputs and intelligently translates them into customized outputs via either a **Virtual Xbox 360 Controller** or **simulated keyboard inputs**.

Have an H-pattern shifter but playing a game that only supports sequential shifting? ShiftSense reads your physical gear position and instantly fires the exact number of sequential shifts needed to match it in-game.

## ✨ Features

* 🎮 **Virtual Controller Emulation (ViGEmBus):** A custom Python daemon communicates with the Windows ViGEmBus kernel driver to synthesize a virtual Xbox 360 controller in real-time.
* ⌨️ **Keyboard Simulation (RobotJS):** Alternatively, translate hardware inputs directly into native keyboard strokes for legacy games.
* ⚡ **Zero-Latency IPC Streaming:** Node.js streams axis data at 30+ FPS to the Python daemon via local IPC pipes, optimized with strict threading locks to eliminate Global Interpreter Lock (GIL) contention and prevent dropped packets.
* 🕹️ **Smart Sequential Translation:** Calculates the exact difference between your current virtual gear and physical gear to fire sequential multi-shifts (e.g., slamming from 4th to 2nd fires two rapid downshifts).
* ⚙️ **Clutch Gating & Debouncing:** Optional settings to enforce clutch thresholds before shifting, plus advanced debouncing to prevent mis-shifts and hardware ghosting.
* 🎛️ **Universal Calibration Wizard:** A React-based UI to map and normalize any USB racing wheel, pedals, and shifter directly within the app.

---

## 🏗️ Architecture

ShiftSense operates on a three-tier architecture:
1. **Frontend (React/Vite):** A dynamic Electron renderer providing a live dashboard of raw telemetry, calibration tools, and output settings.
2. **Main Process (Node.js/Electron):** The core engine that polls the HTML5 Gamepad API, processes the raw analog axes, calculates shift logic, and manages state.
3. **Hardware Bridge (Python):** A headless background daemon that receives IPC commands and interfaces directly with the ViGEmBus Windows driver to manipulate the virtual controller state.

---

## 🚀 Setup & Installation

### Prerequisites
* Windows 10/11
* Node.js (v18+)
* Python 3.10+
* [ViGEmBus Driver](https://github.com/nefarius/ViGEmBus/releases) installed
* Logitech G29/G920 or similar wheel

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Jcharizard/ShiftSense.git
   cd ShiftSense
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
   *(Note: This project uses `robotjs` which requires Windows build tools (C++/Python) to compile successfully).*

3. Install Python dependencies:
   ```bash
   pip install vgamepad
   ```

4. Run the app in development mode:
   ```bash
   npm run dev
   ```

---

## 🏎️ How to Use

1. **Connect your Wheel:** Ensure your racing wheel is plugged in and recognized by Windows before launching the app.
2. **Calibrate:** Navigate to the **Calibration** tab and follow the 12-step wizard to map your steering, pedals, and shifter slots.
3. **Choose Output Mode:** In **Output Settings**, select either *Virtual Gamepad (ViGEmBus)* or *Keyboard Simulation*.
4. **Enable:** Go to the Dashboard, toggle Translation to **ON**.
5. **Drive:** ShiftSense will now seamlessly intercept your hardware and output the translated controls to your game!

---
*Built by [Jhonny Alvarado](https://github.com/jcharizard)*
