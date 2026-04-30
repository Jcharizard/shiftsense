import { useState, useEffect } from 'react';
import { gamepadManager } from '../services/GamepadManager';

const STEPS = [
    { label: 'Neutral', gear: 0, type: 'button' },
    { label: 'Gear 1', gear: 1, type: 'button' },
    { label: 'Gear 2', gear: 2, type: 'button' },
    { label: 'Gear 3', gear: 3, type: 'button' },
    { label: 'Gear 4', gear: 4, type: 'button' },
    { label: 'Gear 5', gear: 5, type: 'button' },
    { label: 'Gear 6', gear: 6, type: 'button' },
    { label: 'Reverse', gear: -1, type: 'button' },
    { label: 'Steering (Turn Left or Right)', type: 'axis_steering' },
    { label: 'Throttle (Push Fully)', type: 'axis_throttle' },
    { label: 'Brake (Push Fully)', type: 'axis_brake' },
    { label: 'Clutch (Push Fully)', type: 'axis_clutch' },
];

export function Calibration() {
    const [input, setInput] = useState<any>(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [mapping, setMapping] = useState<Record<number, number>>({});
    const [clutchAxisIndex, setClutchAxisIndex] = useState<number>(1);
    const [steeringAxisIndex, setSteeringAxisIndex] = useState<number>(0);
    const [throttleAxisIndex, setThrottleAxisIndex] = useState<number>(2);
    const [brakeAxisIndex, setBrakeAxisIndex] = useState<number>(3);
    const [complete, setComplete] = useState(false);
    
    // Loaded calibration mapped for visualization
    const [savedCalib, setSavedCalib] = useState<any>({ mapping: {}, clutchAxisIndex: 1, steeringAxisIndex: 0, throttleAxisIndex: 2, brakeAxisIndex: 3 });

    useEffect(() => {
        const api = (window as any).electronAPI;
        if (api && api.getCalibration) {
            api.getCalibration().then(setSavedCalib);
        }
        return gamepadManager.onInput(setInput);
    }, []);


    // Capture axis baseline when entering an axis step, so we detect CHANGE not absolute value
    const [axisBaseline, setAxisBaseline] = useState<number[]>([]);

    // Note: The above logic has a slight React state lag with setClutchAxisIndex before save. 
    // We should compute the final axis directly in the final step.
    const findActiveAxis = (type: string, fallback: number) => {
        if (!input || !input.axes) return fallback;
        let bestAxis = fallback;
        let maxDiff = 0;
        input.axes.forEach((val: number, idx: number) => {
            // For all axis types: find which axis moved the most from its baseline
            const baseline = axisBaseline[idx] ?? val;
            const diff = Math.abs(val - baseline);
            if (diff > maxDiff && diff > 0.15) { maxDiff = diff; bestAxis = idx; }
        });
        return maxDiff > 0.15 ? bestAxis : fallback;
    }

    const finishWizard = () => {
        const currentStep = STEPS[stepIndex];
        let fClutch = clutchAxisIndex;
        let fSteer = steeringAxisIndex;
        let fThrottle = throttleAxisIndex;
        let fBrake = brakeAxisIndex;
        
        if (currentStep.type.startsWith('axis_')) {
             const active = findActiveAxis(currentStep.type, fClutch);
             if (currentStep.type === 'axis_clutch') fClutch = active;
             if (currentStep.type === 'axis_steering') fSteer = active;
             if (currentStep.type === 'axis_throttle') fThrottle = active;
             if (currentStep.type === 'axis_brake') fBrake = active;
        }
        
        setClutchAxisIndex(fClutch);
        setSteeringAxisIndex(fSteer);
        setThrottleAxisIndex(fThrottle);
        setBrakeAxisIndex(fBrake);
        
        setComplete(true);
        saveMapping(mapping, fClutch, fSteer, fThrottle, fBrake);
    };

    const handleNext = () => {
        if (!input) return;
        const currentStep = STEPS[stepIndex];
        
        if (currentStep.type.startsWith('axis_')) {
            // Snapshot baseline the moment the user arrives at this step
            if (axisBaseline.length === 0 || stepIndex !== STEPS.findIndex(s => s.type === currentStep.type)) {
                setAxisBaseline([...input.axes]);
            }
            const active = findActiveAxis(currentStep.type, 
                currentStep.type === 'axis_clutch' ? clutchAxisIndex :
                currentStep.type === 'axis_steering' ? steeringAxisIndex :
                currentStep.type === 'axis_throttle' ? throttleAxisIndex : brakeAxisIndex
            );
            if (currentStep.type === 'axis_clutch') setClutchAxisIndex(active);
            if (currentStep.type === 'axis_steering') setSteeringAxisIndex(active);
            if (currentStep.type === 'axis_throttle') setThrottleAxisIndex(active);
            if (currentStep.type === 'axis_brake') setBrakeAxisIndex(active);
        } else {
            const activeBtnIndex = input.buttons ? input.buttons.findIndex((b: boolean) => b) : -1;
            if (currentStep.gear !== undefined) {
                setMapping(prev => ({ ...prev, [currentStep.gear!]: activeBtnIndex }));
            }
        }

        if (stepIndex < STEPS.length - 1) {
            setStepIndex(stepIndex + 1);
            setAxisBaseline([]); // reset baseline for next step
        } else {
            finishWizard();
        }
    };


    const saveMapping = (map: Record<number, number>, clutch: number, steer: number, throttle: number, brake: number) => {
        const api = (window as any).electronAPI;
        if (api && api.saveCalibration) {
            const data = { mapping: map, clutchAxisIndex: clutch, steeringAxisIndex: steer, throttleAxisIndex: throttle, brakeAxisIndex: brake };
            api.saveCalibration(data);
            setSavedCalib(data);
        }
    };

    const handleReset = () => {
        setStepIndex(0);
        setMapping({});
        setComplete(false);
    };

    const currentStep = STEPS[stepIndex];
    const activeBtn = input?.buttons?.findIndex((b: boolean) => b) ?? -1;

    // Helper to render mapping table
    const renderTable = (cMap: any) => {
        const gears = [1,2,3,4,5,6,-1];
        return (
            <div className="mapping-table">
                <div className="mapping-grid">
                    {gears.map(gear => {
                        const btnIdx = cMap.mapping[gear];
                        const isPressed = input?.buttons?.[btnIdx] && btnIdx !== -1;
                        const label = gear === -1 ? 'R' : gear;
                        return (
                            <div key={gear} className={`map-item ${isPressed ? 'glow' : ''}`}>
                                <span className="m-label">Gear {label}</span>
                                <span className="m-val">{btnIdx !== undefined && btnIdx !== -1 ? `Btn ${btnIdx}` : 'Unmapped'}</span>
                            </div>
                        )
                    })}
                    
                    {[{label: 'Steering', idx: cMap.steeringAxisIndex},
                      {label: 'Throttle', idx: cMap.throttleAxisIndex},
                      {label: 'Brake', idx: cMap.brakeAxisIndex},
                      {label: 'Clutch', idx: cMap.clutchAxisIndex}].map(axis => (
                        <div key={axis.label} className="map-item glow-axis">
                            <span className="m-label">{axis.label}</span>
                            <span className="m-val">Axis {axis.idx}</span>
                            <div style={{fontSize: '0.8rem', color: '#888'}}>
                               Raw: {input?.axes?.[axis.idx]?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    };

    if (complete) {
        return (
            <div className="p-4">
                <h2>Calibration Complete</h2>
                <p>Your shifter is now calibrated and saved.</p>
                {renderTable({ mapping, clutchAxisIndex, steeringAxisIndex, throttleAxisIndex, brakeAxisIndex })}
                <button className="nav-btn active mt-4" onClick={handleReset} style={{marginTop: '20px'}}>Redo Calibration</button>
            </div>
        );
    }

    return (
        <div className="p-4" style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ flex: 1 }}>
                <h2>Calibration Wizard</h2>
                <div className="wizard-card p-4" style={{ backgroundColor: '#2d2d30', borderRadius: '8px' }}>
                    <h3>Step {stepIndex + 1} of {STEPS.length}: {currentStep.label}</h3>
                    <p className="mb-4">
                        {currentStep.type.startsWith('axis') 
                            ? 'Fully press or turn the requested input and hold it, then press Confirm.' 
                            : `Please put the shifter into ${currentStep.label} position and press Confirm.`}
                    </p>

                    <div className="debug-panel mb-4" style={{ background: '#000', padding: '10px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        <div>Status: <span style={{ color: input?.connected ? '#4caf50' : '#f44336' }}>{input?.connected ? 'Connected' : 'Disconnected'}</span></div>
                        {currentStep.type !== 'axis' && <div>Active Button Index: <b style={{ color: '#2196f3' }}>{activeBtn !== -1 ? activeBtn : 'None'}</b></div>}
                        
                        {/* Show all axes for debugging */}
                        <div style={{marginTop: '10px', borderTop: '1px solid #333', paddingTop: '5px'}}>
                           Axes Live Data:
                           {input?.axes?.map((val: number, i: number) => (
                               <div key={i} style={{fontSize: '0.8rem', color: Math.abs(val - 1) > 0.5 ? '#ffeb3b' : '#aaa'}}>Axis {i}: {val.toFixed(2)}</div>
                           ))}
                        </div>
                    </div>

                    <div className="actions">
                        <button onClick={handleNext} style={{ padding: '10px 20px', backgroundColor: '#007acc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                            Confirm {currentStep.label}
                        </button>
                        {stepIndex > 0 && <button onClick={() => setStepIndex(stepIndex - 1)} style={{ marginLeft: '10px', padding: '10px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}>Back</button>}
                    </div>
                </div>
            </div>
            
            {/* Visualizer Side Panel */}
            <div style={{ flex: 1 }}>
                <h2>Current Bindings</h2>
                <p style={{color: '#999'}}>Press buttons or pedals to highlight mapped inputs</p>
                {renderTable(stepIndex === STEPS.length - 1 ? 
                    { mapping: {...savedCalib.mapping, ...mapping}, steeringAxisIndex, throttleAxisIndex, brakeAxisIndex, clutchAxisIndex } : 
                    savedCalib
                )}
            </div>

            <style>{`
                .mapping-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
                .map-item { background: #1e1e1e; padding: 15px; border-radius: 6px; text-align: center; border: 2px solid transparent; transition: all 0.1s; display: flex; flex-direction: column; }
                .map-item .m-label { font-weight: bold; margin-bottom: 5px; color: #ccc; }
                .map-item .m-val { color: #00bcd4; font-size: 1.2rem; }
                .map-item.glow { border-color: #00bcd4; box-shadow: 0 0 15px rgba(0, 188, 212, 0.5); transform: translateY(-2px); background: #2a2a2a; }
                .clutch-item { grid-column: 1 / -1; } /* Span full width */
            `}</style>
        </div>
    );
}
