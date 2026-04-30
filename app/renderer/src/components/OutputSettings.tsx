import { useState, useEffect } from 'react';

export function OutputSettings() {
    const [settings, setSettings] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const api = (window as any).electronAPI;
        if (api && api.getSettings) {
            api.getSettings().then(setSettings);
        }
    }, []);

    const handleSave = () => {
        const api = (window as any).electronAPI;
        if (api && api.updateSettings && settings) {
            setSaving(true);
            api.updateSettings(settings);
            setTimeout(() => setSaving(false), 500);
        }
    };

    const handleTestKey = (key: string) => {
        const api = (window as any).electronAPI;
        if (api && api.testKey) {
            // Give user 3 seconds to focus a text editor
            setTimeout(() => {
                api.testKey(key);
            }, 3000);
        }
    }

    const handleTestVigemKey = (key: string) => {
        const api = (window as any).electronAPI;
        if (api && api.testVigemKey) {
            // Give user 3 seconds to focus the game window
            setTimeout(() => {
                api.testVigemKey(key);
            }, 3000);
        }
    }

    const VIGEM_BUTTON_MAP: Record<string, string> = {
        'LEFT_SHOULDER': 'Left Bumper (LB)',
        'RIGHT_SHOULDER': 'Right Bumper (RB)',
        'A': 'Button A',
        'B': 'Button B',
        'X': 'Button X',
        'Y': 'Button Y',
        'LEFT_THUMB': 'Left Stick Click',
        'RIGHT_THUMB': 'Right Stick Click',
        'BACK': 'Back Button',
        'START': 'Start Button'
    };

    if (!settings) return <div className="p-4">Loading settings...</div>;

    const isVigem = settings.mode === 'vigem';

    return (
        <div className="p-4">
            <h2>Output Settings</h2>
            <p className="mb-4" style={{ color: '#aaa' }}>
                Configure the simulated outputs that ShiftSense sends to your game.
            </p>

            <div className="settings-card">
                <div className="setting-group" style={{ background: '#1e1e1e', padding: '1rem', borderRadius: '8px', border: '1px solid #444' }}>
                    <label style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid #333' }}>
                        <span className="setting-title" style={{ fontSize: '1.2rem', color: '#00bcd4' }}>Output Mode</span>
                        <select 
                            value={settings.mode} 
                            onChange={e => setSettings({ ...settings, mode: e.target.value as 'keyboard'|'vigem' })}
                            className="mode-select"
                        >
                            <option value="keyboard">Keyboard Simulation (robotJS)</option>
                            <option value="vigem">Virtual Gamepad (ViGEmBus)</option>
                        </select>
                    </label>
                    <p className="setting-desc" style={{ marginTop: '0.5rem' }}>
                        {isVigem ? "Simulates a hardware Xbox 360 controller. (Requires ViGEmBus driver)" : "Simulates native keyboard button presses."}
                    </p>
                </div>

                {!isVigem ? (
                    <>
                        <div className="setting-group">
                    <label>
                        <span className="setting-title">Shift Up Key</span>
                        <input 
                            type="text" 
                            maxLength={10} 
                            value={settings.shiftUpKey} 
                            onChange={e => setSettings({ ...settings, shiftUpKey: e.target.value.toLowerCase() })}
                        />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <p className="setting-desc">The key sent to shift up gear (e.g. 'e').</p>
                        <button className="test-btn" onClick={() => handleTestKey(settings.shiftUpKey)}>
                            Test Key (3s delay)
                        </button>
                    </div>
                </div>

                        <div className="setting-group">
                            <label>
                                <span className="setting-title">Shift Down Key</span>
                                <input 
                                    type="text" 
                                    maxLength={10} 
                                    value={settings.shiftDownKey} 
                                    onChange={e => setSettings({ ...settings, shiftDownKey: e.target.value.toLowerCase() })}
                                />
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <p className="setting-desc">The key sent to shift down gear (e.g. 'q').</p>
                                <button className="test-btn" onClick={() => handleTestKey(settings.shiftDownKey)}>
                                    Test Key (3s delay)
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="setting-group">
                            <label>
                                <span className="setting-title">Shift Up Button</span>
                                <select 
                                    value={settings.shiftUpButton} 
                                    onChange={e => setSettings({ ...settings, shiftUpButton: e.target.value })}
                                    className="mode-select"
                                >
                                    {Object.entries(VIGEM_BUTTON_MAP).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <p className="setting-desc">The virtual gamepad button sent to shift up gear.</p>
                                <button className="test-btn" onClick={() => handleTestVigemKey(settings.shiftUpButton)}>
                                    Test Key (3s delay)
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>
                                <span className="setting-title">Shift Down Button</span>
                                <select 
                                    value={settings.shiftDownButton} 
                                    onChange={e => setSettings({ ...settings, shiftDownButton: e.target.value })}
                                    className="mode-select"
                                >
                                    {Object.entries(VIGEM_BUTTON_MAP).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <p className="setting-desc">The virtual gamepad button sent to shift down gear.</p>
                                <button className="test-btn" onClick={() => handleTestVigemKey(settings.shiftDownButton)}>
                                    Test Key (3s delay)
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>
                                <span className="setting-title">Steering Joystick</span>
                                <select 
                                    value={settings.steerJoystick || 'left'} 
                                    onChange={e => setSettings({ ...settings, steerJoystick: e.target.value })}
                                    className="mode-select"
                                >
                                    <option value="left">Left Joystick</option>
                                    <option value="right">Right Joystick</option>
                                </select>
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                <p className="setting-desc">Which virtual joystick the steering wheel moves.</p>
                            </div>
                        </div>
                    </>
                )}

                <hr className="divider" />

                <div className="setting-group">
                    <label>
                        <span className="setting-title" title="How long the key is held down digitally to ensure games detect it.">
                            KeyPress Duration (ms) ℹ️
                        </span>
                        <input 
                            type="number" 
                            min="10" max="500" 
                            value={settings.pressDelayMs} 
                            onChange={e => setSettings({ ...settings, pressDelayMs: parseInt(e.target.value) })}
                        />
                    </label>
                    <p className="setting-desc">Time the sequence pauses between pressing and releasing (Default: 60ms).</p>
                </div>
                
                <button 
                    onClick={handleSave} 
                    className="save-btn"
                    style={{ backgroundColor: saving ? '#4caf50' : '#007acc' }}
                >
                    {saving ? 'Saved!' : 'Save Settings'}
                </button>
            </div>

            <style>{`
                .settings-card { background: #2d2d30; padding: 2rem; border-radius: 8px; max-width: 600px; }
                .setting-group { margin-bottom: 2rem; }
                .setting-group label { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .setting-group input[type="number"] { background: #1e1e1e; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; font-size: 1rem; width: 100px; text-align: center; }
                .settings-group input[type="text"] { background: #1e1e1e; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; font-size: 1.2rem; width: 100px; text-align: center; font-weight: bold; }
                .mode-select { background: #1e1e1e; border: 1px solid #555; color: white; padding: 10px; border-radius: 4px; font-size: 1rem; cursor: pointer; font-family: inherit; }
                .setting-title { font-weight: bold; cursor: help; }
                .setting-desc { font-size: 0.9rem; color: #888; margin: 0; }
                .divider { border-color: #444; margin: 2rem 0; }
                .save-btn { width: 100%; padding: 12px; border: none; border-radius: 4px; color: white; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: background 0.3s; margin-top: 1rem; }
                .save-btn:hover { filter: brightness(1.1); }
                .test-btn { background: #444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
                .test-btn:hover { background: #555; }
            `}</style>
        </div>
    );
}
