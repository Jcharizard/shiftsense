type GamepadListener = (state: any) => void;

// Minimum ms between IPC sends — prevents flooding Electron IPC / Python stdin
const IPC_THROTTLE_MS = 33; // ~30fps is plenty for axis data

export class GamepadManager {
    private loopId: number | null = null;
    private listeners: GamepadListener[] = [];
    private lastSendTime: number = 0;

    start() {
        console.log('GamepadManager starting...');
        this.loop();
    }

    stop() {
        if (this.loopId) cancelAnimationFrame(this.loopId);
    }

    private loop = () => {
        const gamepads = navigator.getGamepads();
        let device: Gamepad | null = null;

        // Scan all gamepads — skip virtual Xbox devices spawned by ShiftSense itself
        for (const gp of gamepads) {
            if (!gp || !gp.connected) continue;
            const id = gp.id.toLowerCase();
            // Exclude the ViGEm virtual Xbox controller to prevent feedback loop
            if (id.includes('xbox 360 for windows') || id.includes('vigem') || id.includes('virtual')) continue;
            device = gp;
            // If it's explicitly a wheel, stop searching
            if (id.includes('wheel') || id.includes('g29') || id.includes('g920') || id.includes('logitech')) {
                break;
            }
        }

        const api = (window as any).electronAPI;

        if (device) {
            // Map buttons to simple boolean for now, or values if they are analog buttons
            const buttons = device.buttons.map(b => b.pressed);
            const axes = [...device.axes];

            const state = {
                connected: true,
                id: device.id,
                buttons,
                axes,
                timestamp: Date.now()
            };

            this.notify(state);

            // Throttle IPC sends to prevent flooding the Python bridge stdin
            const now = Date.now();
            if (api && now - this.lastSendTime >= IPC_THROTTLE_MS) {
                this.lastSendTime = now;
                api.sendInputState(state);
            }
        } else {
            const state = { connected: false, timestamp: Date.now() };
            this.notify(state);

            if (api) {
                api.sendInputState(state);
            }
        }

        this.loopId = requestAnimationFrame(this.loop);
    }

    public onInput(listener: GamepadListener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(state: any) {
        this.listeners.forEach(l => l(state));
    }
}

export const gamepadManager = new GamepadManager();
