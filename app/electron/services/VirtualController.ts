import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ESM-compatible __dirname
const _dirname = path.dirname(fileURLToPath(import.meta.url));

export class VirtualController {
    public isConnected: boolean = false;
    private pythonProcess: ChildProcess | null = null;
    private intentionalUnplug: boolean = false;

    private readonly buttonMap: Record<string, string> = {
        'LEFT_SHOULDER':  'XUSB_GAMEPAD_LEFT_SHOULDER',
        'RIGHT_SHOULDER': 'XUSB_GAMEPAD_RIGHT_SHOULDER',
        'A':              'XUSB_GAMEPAD_A',
        'B':              'XUSB_GAMEPAD_B',
        'X':              'XUSB_GAMEPAD_X',
        'Y':              'XUSB_GAMEPAD_Y',
        'START':          'XUSB_GAMEPAD_START',
        'BACK':           'XUSB_GAMEPAD_BACK',
        'DPAD_UP':        'XUSB_GAMEPAD_DPAD_UP',
        'DPAD_DOWN':      'XUSB_GAMEPAD_DPAD_DOWN',
        'DPAD_LEFT':      'XUSB_GAMEPAD_DPAD_LEFT',
        'DPAD_RIGHT':     'XUSB_GAMEPAD_DPAD_RIGHT',
    };

    public plugin() {
        if (this.isConnected || this.pythonProcess) return;
        this.intentionalUnplug = false;

        try {
            // Try compiled dist-electron location first, then fall back to source tree
            let scriptPath = path.join(_dirname, 'vigem_bridge.py');
            if (!fs.existsSync(scriptPath)) {
                scriptPath = path.join(process.cwd(), 'app', 'electron', 'services', 'vigem_bridge.py');
            }
            console.log('[VirtualController] Starting bridge:', scriptPath);
            this.pythonProcess = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

            this.pythonProcess.stdout?.on('data', (data: Buffer) => {
                const str = data.toString().trim();
                if (str === 'READY') {
                    this.isConnected = true;
                    console.log('[VirtualController] Python bridge READY');
                } else {
                    console.log('[Python Bridge]:', str);
                }
            });

            this.pythonProcess.stderr?.on('data', (data: Buffer) => {
                console.error('[Python Bridge Error]:', data.toString());
            });

            this.pythonProcess.on('close', (code: number | null) => {
                const wasConnected = this.isConnected;
                console.log(`[VirtualController] Bridge exited (code ${code})`);
                this.isConnected = false;
                this.pythonProcess = null;

                // Auto-restart only on unexpected crash — NOT on intentional unplug()
                if (wasConnected && !this.intentionalUnplug) {
                    console.warn('[VirtualController] Bridge crashed — restarting in 1s...');
                    setTimeout(() => this.plugin(), 1000);
                }
            });
        } catch (e) {
            console.error('[VirtualController] Failed to start bridge:', e);
        }
    }

    public unplug() {
        if (!this.pythonProcess) return;
        // Set intentional flag BEFORE kill() so the async close handler won't auto-restart
        this.intentionalUnplug = true;
        this.isConnected = false;
        try {
            this.pythonProcess.kill();
            this.pythonProcess = null;
            console.log('[VirtualController] Unplugged intentionally');
        } catch (e) {
            console.error(e);
        }
    }

    private sendCmd(cmd: object) {
        if (!this.isConnected || !this.pythonProcess?.stdin) return;
        try {
            this.pythonProcess.stdin.write(JSON.stringify(cmd) + '\n');
        } catch (e) {
            console.error('[VirtualController] sendCmd write error:', e);
        }
    }

    /** Polls until the Python bridge reports READY or times out */
    private waitUntilReady(timeoutMs = 3000): Promise<boolean> {
        return new Promise(resolve => {
            if (this.isConnected) { resolve(true); return; }
            const start = Date.now();
            const check = setInterval(() => {
                if (this.isConnected) {
                    clearInterval(check);
                    resolve(true);
                } else if (Date.now() - start > timeoutMs) {
                    clearInterval(check);
                    console.error('[VirtualController] Timed out waiting for bridge READY');
                    resolve(false);
                }
            }, 50);
        });
    }

    public async tap(buttonName: string, durationMs = 60) {
        if (!this.pythonProcess) this.plugin();
        const ready = await this.waitUntilReady(3000);
        if (!ready) {
            console.warn(`[VirtualController] Tap ignored (not ready): ${buttonName}`);
            return;
        }
        const pyBtn = this.buttonMap[buttonName] ?? buttonName;
        this.sendCmd({ type: 'tap', button: pyBtn, durationMs });
    }

    public setAxes(steering: number, gas: number, brake: number, steerJoystick: 'left' | 'right' = 'left') {
        if (!this.isConnected) return;
        // Raw G29 pedal range: 1 = released, -1 = fully pressed → normalize to 0..1 for triggers
        const normGas   = Math.max(0, Math.min(1, (1 - gas)   / 2));
        const normBrake = Math.max(0, Math.min(1, (1 - brake)  / 2));
        this.sendCmd({ type: 'axes', steer: steering, gas: normGas, brake: normBrake, steerJoystick });
    }
}

export const virtualController = new VirtualController();
