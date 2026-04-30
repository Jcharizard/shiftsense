import Store from 'electron-store';

interface AppStore {
    calibration: Record<number, number>;
    clutchAxisIndex?: number;
    steeringAxisIndex?: number;
    throttleAxisIndex?: number;
    brakeAxisIndex?: number;
    settings: any;
    currentProfileId?: string;
}

// Ensure electron-store is working in main process
export const store = new Store<AppStore>({
    defaults: {
        calibration: {}, // Gear -> ButtonIndex
        clutchAxisIndex: 1, // Default G920 clutch axis
        steeringAxisIndex: 0,
        throttleAxisIndex: 2, // arbitrary default
        brakeAxisIndex: 3, // arbitrary default
        settings: {
            // Default translator settings could go here
        }
    }
});
