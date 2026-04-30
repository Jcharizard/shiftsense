import { translator } from './Translator';

// Define locally for now to minimize import complexity in MVP
interface InputState {
    connected: boolean;
    clutchValue?: number;
    buttons: boolean[];
    axes: number[];
    timestamp: number;
}

export class InputHandler {
    // Default G920 mapping (Example, can be calibrated)
    // Gear -> Button Index
    private gearMapping: Record<number, number> = {
        1: 12,
        2: 13,
        3: 14,
        4: 15,
        5: 16,
        6: 17,
        [-1]: 11 // Reverse
    };

    // Configurable Axes — public so main.ts can read them for debug:status
    public clutchAxisIndex: number = 1;
    public steeringAxisIndex: number = 0;
    public throttleAxisIndex: number = 2;
    public brakeAxisIndex: number = 3;

    public setAxesIndices(clutch: number, steering: number, throttle: number, brake: number) {
        this.clutchAxisIndex = clutch;
        this.steeringAxisIndex = steering;
        this.throttleAxisIndex = throttle;
        this.brakeAxisIndex = brake;
    }

    private currentSlot: number = 0;
    private currentClutch: number = 0;

    public handleState(state: InputState) {
        if (!state.connected) return;

        // Detect Slot
        let currentSlot = 0; // Neutral default

        // Iterate mapping to find active button
        // Note: Shifter buttons are mutually exclusive usually.
        for (const [gearStr, btnIdx] of Object.entries(this.gearMapping)) {
            const gear = parseInt(gearStr);
            if (state.buttons[btnIdx]) {
                currentSlot = gear;
                break;
            }
        }

        // Normalize Clutch
        // Formula: (1 - val) / 2
        let clutchVal = 0;
        if (state.axes && state.axes.length > this.clutchAxisIndex) {
            const raw = state.axes[this.clutchAxisIndex];
            if (typeof raw === 'number') {
                clutchVal = (1 - raw) / 2;
            }
        }

        this.currentSlot = currentSlot;
        this.currentClutch = clutchVal;

        // Update translator with slot and all raw axes
        translator.update(currentSlot, state.axes || [], this.clutchAxisIndex, this.steeringAxisIndex, this.throttleAxisIndex, this.brakeAxisIndex);
    }

    public getCurrentSlot() {
        return this.currentSlot;
    }

    public getCurrentClutch() {
        return this.currentClutch;
    }

    public setFullMapping(mapping: Record<number, number>) {
        this.gearMapping = mapping;
        console.log("InputHandler: Mapping updated", mapping);
    }

    public updateMapping(gear: number, buttonIndex: number) {
        this.gearMapping[gear] = buttonIndex;
    }

    public getMapping() {
        return this.gearMapping;
    }
}

export const inputHandler = new InputHandler();
