import { keyOutput } from './KeyOutput';

import { virtualController } from './VirtualController';

interface TranslatorSettings {
    enabled: boolean;
    requireClutch: boolean;
    clutchThreshold: number; // 0-1
    debounceMs: number;
    cooldownMs: number;
    pressDelayMs: number;
    mode: 'keyboard' | 'vigem';
    shiftUpKey: string;
    shiftDownKey: string;
    shiftUpButton: string;
    shiftDownButton: string;
    steerJoystick: 'left' | 'right';
}

export class Translator {
    private state = {
        currentVirtualGear: 0, // 0 = N, 1-6, -1 = R
        lastStableSlot: 0,
        lastActionTime: 0,
    };

    private pendingSlot: number | null = null;
    private debounceTimeout: NodeJS.Timeout | null = null;
    private latestClutchValue: number = 0;

    public settings: TranslatorSettings = {
        enabled: false,
        requireClutch: false,
        clutchThreshold: 0.7,
        debounceMs: 80,
        cooldownMs: 150,
        pressDelayMs: 60,
        mode: 'keyboard',
        shiftUpKey: 'e',
        shiftDownKey: 'q',
        shiftUpButton: 'RIGHT_SHOULDER',
        shiftDownButton: 'LEFT_SHOULDER',
        steerJoystick: 'left'
    };

    constructor() { }

    public update(slot: number, axes: number[], clutchIdx: number, steerIdx: number, throttleIdx: number, brakeIdx: number) {
        let clutchValue = 0;
        let steer = 0;
        let gas = 1; // resting default
        let brake = 1;

        if (axes && axes.length > 0) {
            clutchValue = axes.length > clutchIdx ? (1 - axes[clutchIdx]) / 2 : 0;
            steer = axes[0] ?? 0;  // Steering wheels always report on axis 0 — no calibration needed
            gas   = axes.length > throttleIdx ? axes[throttleIdx] : 1;
            brake = axes.length > brakeIdx    ? axes[brakeIdx]    : 1;
        }

        this.latestClutchValue = clutchValue;

        // Feed continuous analog axes if enabled
        if (this.settings.enabled && this.settings.mode === 'vigem') {
            virtualController.setAxes(steer, gas, brake, this.settings.steerJoystick);
        }

        if (slot !== this.pendingSlot) {
            this.pendingSlot = slot;
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.handleStableSlot(slot);
            }, this.settings.debounceMs);
        }
    }

    private handleStableSlot(slot: number) {
        if (slot === this.state.lastStableSlot) return;

        // Update last stable slot regardless of whether we translate, to track physical state
        this.state.lastStableSlot = slot;

        if (!this.settings.enabled) return;

        this.processShift(slot);
    }

    private processShift(targetSlot: number) {
        // Cooldown check
        if (Date.now() - this.state.lastActionTime < this.settings.cooldownMs) {
            // Optional: log rejection
            return;
        }

        if (targetSlot === 0) {
            // Neutral - MVP: do nothing to virtual gear
            return;
        }
        if (targetSlot === -1) {
            // Reverse - MVP: ignore
            return;
        }

        // Clutch check
        if (this.settings.requireClutch && this.latestClutchValue < this.settings.clutchThreshold) {
            console.log(`Shift blocked: Clutch ${this.latestClutchValue.toFixed(2)} < ${this.settings.clutchThreshold}`);
            return;
        }

        const current = this.state.currentVirtualGear;

        // If we assumed we were in N (0) or R (-1), logic needs care.
        // User says "Start Virtual Gear at 1".
        // If current is 0, and we shift to 1. Diff = 1. Upshift x1?
        // Sequential gearboxes usually don't have N in the middle of sequence 1-N-2.
        // Usually 1-N-2-3-4-5-6 or R-N-1...
        // MVP: "computes difference between target gear and currentVirtualGear".
        // If current is 1, target is 2. Diff 1.
        // If current is 0 (N), and target is 1. Diff 1?
        // Usually N is "between 1 and R" or "between 1 and 2"?
        // Most seq games: 1, 2, 3...
        // If I am in 4, and I go to N. Virtual stays 4.
        // Then I go to 2. Virtual 4 -> 2. Diff -2. Downshift x2. Correct.

        // What if my virtual is 0? (App start default?).
        // User said "Start Virtual Gear at 1 (default)".
        // So initialize virtual to 1.

        if (current === targetSlot) return;

        const diff = targetSlot - current;
        if (diff === 0) return;

        this.executeShift(diff, targetSlot);
    }

    private async executeShift(diff: number, targetGear: number) {
        let count = Math.abs(diff);

        console.log(`Translating: ${this.state.currentVirtualGear} -> ${targetGear} (${diff > 0 ? 'Up' : 'Down'} x${count})`);

        this.state.lastActionTime = Date.now(); // Set immediately to prevent re-entrancy/spam

        for (let i = 0; i < count; i++) {
            if (this.settings.mode === 'vigem') {
                const btn = diff > 0 ? this.settings.shiftUpButton : this.settings.shiftDownButton;
                virtualController.tap(btn, this.settings.pressDelayMs);
            } else {
                const key = diff > 0 ? this.settings.shiftUpKey : this.settings.shiftDownKey;
                keyOutput.tap(key);
            }

            if (i < count - 1) {
                // Wait for the tap to finish PLUS a gap so the game sees a distinct release
                await new Promise(r => setTimeout(r, this.settings.pressDelayMs + 40));
            }
        }

        this.state.currentVirtualGear = targetGear;
        this.emitUpdate();
    }

    // API
    public getState() {
        return this.state;
    }



    public setEnable(enabled: boolean) {
        this.settings.enabled = enabled;
        console.log(`Translator enabled: ${enabled}`);

        if (enabled && this.settings.mode === 'vigem') {
            virtualController.plugin();
        } else if (!enabled) {
            virtualController.unplug();
        }
    }

    public setVirtualGear(gear: number) {
        this.state.currentVirtualGear = gear;
        this.emitUpdate();
    }

    private onUpdateCallback: ((state: any) => void) | null = null;
    public onUpdate(cb: (state: any) => void) {
        this.onUpdateCallback = cb;
    }
    private emitUpdate() {
        if (this.onUpdateCallback) this.onUpdateCallback(this.state);
    }
}

export const translator = new Translator();
// Initialize virtual gear
translator.setVirtualGear(1); 
