import { useState, useEffect } from 'react';
import { gamepadManager } from '../services/GamepadManager';

export function Dashboard() {
    const [input, setInput] = useState<any>(null);
    const [translatorState, setTranslatorState] = useState<any>(null);
    const [enabled, setEnabled] = useState(false);
    const [calibration, setCalibration] = useState<any>({ mapping: {}, clutchAxisIndex: 1 });
    const [dbg, setDbg] = useState<any>(null);

    useEffect(() => {
        // Input Sub
        const unsubInput = gamepadManager.onInput(setInput);

        // Translator Sub
        const api = (window as any).electronAPI;
        if (api && api.onTranslatorUpdate) {
            api.onTranslatorUpdate((_e: any, state: any) => {
                setTranslatorState(state);
                // Note: state here used to contain enabled, but we moved it to settings
            });
            api.getCalibration().then(setCalibration);
            if (api.getSettings) {
                api.getSettings().then((settings: any) => {
                    setEnabled(settings.enabled);
                });
            }
        }

        // Poll debug status every 500ms
        const pollId = setInterval(async () => {
            if (api?.debugStatus) {
                try {
                    const s = await api.debugStatus();
                    setDbg(s);
                } catch (e) {
                    console.error('[Dashboard] debugStatus error:', e);
                }
            }
        }, 500);

        return () => {
            unsubInput();
            clearInterval(pollId);
        };
    }, []);

    const toggleEnable = () => {
        const newState = !enabled;
        setEnabled(newState);
        (window as any).electronAPI?.toggleTranslator(newState);
    };

    // Helpers
    const gear = translatorState?.currentVirtualGear ?? 0;
    const gearLabel = gear === 0 ? 'N' : gear === -1 ? 'R' : gear;

    // Normalizing clutch for display
    const rawClutch = input?.axes?.[calibration.clutchAxisIndex] ?? 1;
    const clutchPercent = ((1 - rawClutch) / 2 * 100).toFixed(0);

    // Calculate Physical Gear from Mapping
    let physicalGear = 0; // default N
    for (const [gearStr, btnIdx] of Object.entries(calibration.mapping)) {
        if (input?.buttons?.[btnIdx as unknown as number]) {
            physicalGear = parseInt(gearStr);
            break;
        }
    }
    const physicalGearLabel = physicalGear === 0 ? 'N' : physicalGear === -1 ? 'R' : physicalGear;

    return (
        <div className="p-4">
            <h2>Dashboard</h2>

            <div className="cards-grid">
                <div className="card status-card">
                    <h3 title="Converts physical H-pattern shifting into sequential up/down key presses for games.">
                        Translation ℹ️
                    </h3>
                    <div className={`status-badge ${enabled ? 'enabled' : 'disabled'}`}>
                        {enabled ? 'ENABLED' : 'DISABLED'}
                    </div>
                    <button onClick={toggleEnable} className="toggle-btn">
                        {enabled ? 'Disable' : 'Enable'}
                    </button>
                </div>

                <div className="card gear-card">
                    <h3>Physical Gear</h3>
                    <div className="gear-display" style={{ color: '#bbb' }}>{physicalGearLabel}</div>
                </div>

                <div className="card gear-card">
                    <h3 title="The simulated state sent to the game">Virtual Gear</h3>
                    <div className="gear-display" style={{ color: '#00bcd4' }}>{gearLabel}</div>
                </div>

                <div className="card clutch-card">
                    <h3>Clutch</h3>
                    <div className="clutch-bar-bg">
                        <div className="clutch-bar-fill" style={{ width: `${clutchPercent}%` }}></div>
                    </div>
                    <div className="clutch-val">{clutchPercent}%</div>
                </div>
            </div>

            <div className="mt-4 p-4" style={{ background: '#1a1a1e', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ color: '#00bcd4', marginBottom: '1rem' }}>🔧 Pipeline Debug</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    <div style={{ color: '#888' }}>Device:</div>
                    <div style={{ color: input?.connected ? '#4caf50' : '#f44336' }}>
                        {input?.connected ? `✓ ${input.id?.substring(0, 40)}` : '✗ Disconnected'}
                    </div>
                    <div style={{ color: '#888' }}>Bridge:</div>
                    <div style={{ color: dbg?.bridgeConnected ? '#4caf50' : '#f44336' }}>
                        {dbg ? (dbg.bridgeConnected ? '✓ Connected' : '✗ Not connected') : 'polling…'}
                    </div>
                    <div style={{ color: '#888' }}>Mode:</div>
                    <div style={{ color: dbg?.translatorMode === 'vigem' ? '#4caf50' : '#ffeb3b' }}>
                        {dbg ? `${dbg.translatorMode} / ${dbg.translatorEnabled ? 'enabled' : 'disabled'}` : 'polling…'}
                    </div>
                    <div style={{ color: '#888' }}>Steer Axis:</div>
                    <div style={{ color: '#aaa' }}>
                        {dbg ? `A${dbg.steeringAxisIndex} = ${dbg.lastAxes?.[dbg.steeringAxisIndex]?.toFixed(3) ?? 'n/a'}` : 'polling…'}
                    </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Live Raw Axes from G29:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(input?.axes || []).map((v: number, i: number) => (
                            <div key={i} style={{
                                background: '#2a2a2e', padding: '4px 8px', borderRadius: '4px',
                                color: Math.abs(v) > 0.05 ? '#ffeb3b' : '#555',
                                border: `1px solid ${Math.abs(v) > 0.05 ? '#ffeb3b44' : '#333'}`
                            }}>
                                A{i}: {v.toFixed(2)}
                            </div>
                        ))}
                        {(!input?.axes || input.axes.length === 0) && (
                            <div style={{ color: '#555' }}>No axes data — is G29 connected?</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
            .cards-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 1.5rem; 
            }
            .card { 
                background: #2d2d30; 
                padding: 2rem; 
                border-radius: 12px; 
                text-align: center; 
                box-shadow: 0 8px 16px rgba(0,0,0,0.2); 
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 250px;
            }
            .status-badge { font-size: 1.2rem; font-weight: bold; margin: 1rem 0; padding: 0.5rem; border-radius: 4px; }
            .status-badge.enabled { background: #1b5e20; color: #a5d6a7; }
            .status-badge.disabled { background: #b71c1c; color: #ffcdd2; }
            .toggle-btn { padding: 12px 20px; font-size: 1.1rem; cursor: pointer; border: none; border-radius: 4px; background: #007acc; color: white; width: 100%; transition: background 0.2s; font-weight: bold; margin-top: auto; }
            .toggle-btn:hover { background: #005f9e; }
            .gear-display { font-size: 8rem; font-weight: bold; color: #fff; line-height: 1; margin: auto; }
            .clutch-bar-bg { background: #444; height: 32px; border-radius: 16px; overflow: hidden; margin: 2rem 0; position: relative; }
            .clutch-bar-fill { background: linear-gradient(90deg, #00bcd4, #2196f3); height: 100%; transition: width 0.1s linear; }
            .clutch-val { font-size: 1.5rem; font-weight: bold; }
            .mt-4 { margin-top: 2rem; }
        `}</style>
        </div>
    );
}
