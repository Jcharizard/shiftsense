import robot from 'robotjs';

export class KeyOutput {
    constructor() {
        // Optional: Configure robotjs
        robot.setKeyboardDelay(5);
    }

    tap(key: string) {
        // Ensure key is valid for robotjs
        // Single char keys usually work.
        try {
            console.log(`KeyOutput: Tapping ${key}`);
            robot.keyTap(key.toLowerCase());
        } catch (error) {
            console.error(`KeyOutput Error tapping ${key}:`, error);
        }
    }
}

export const keyOutput = new KeyOutput();
