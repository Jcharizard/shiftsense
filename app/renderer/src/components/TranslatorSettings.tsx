import { useState, useEffect } from 'react';

export function TranslatorSettings() {
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
            setTimeout(() => setSaving(false), 500); // UI feedback
        }
    };

    if (!settings) return <div className="p-4">Loading settings...</div>;

    return (
        <div className="p-4">
            <h2>Translator Settings</h2>
            <p className="mb-4" style={{ color: '#aaa' }}>
                Configure the core logic engine of ShiftSense. These rules apply specifically to how shifter inputs are processed.
            </p>

            <div className="settings-card">
                <div className="setting-group">
                    <label>
                        <span className="setting-title" title="Time to wait for the shifter switch to stop bouncing physically before counting it. Higher prevents double shifts but adds delay.">
                            Debounce (ms) ℹ️
                        </span>
                        <input 
                            type="number" 
                            min="0" max="500" 
                            value={settings.debounceMs} 
                            onChange={e => setSettings({ ...settings, debounceMs: parseInt(e.target.value) })}
                        />
                    </label>
                    <p className="setting-desc">Wait time to ensure shifter stability. (Default: 80ms)</p>
                </div>

                <div className="setting-group">
                    <label>
                        <span className="setting-title" title="Enforced minimum time between two different shifts. Prevents rapid-fire shifting.">
                            Action Cooldown (ms) ℹ️
                        </span>
                        <input 
                            type="number" 
                            min="0" max="1000" 
                            value={settings.cooldownMs} 
                            onChange={e => setSettings({ ...settings, cooldownMs: parseInt(e.target.value) })}
                        />
                    </label>
                    <p className="setting-desc">Minimum delay between translations. (Default: 150ms)</p>
                </div>

                <hr className="divider" />

                <div className="setting-group">
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            checked={settings.requireClutch} 
                            onChange={e => setSettings({ ...settings, requireClutch: e.target.checked })}
                        />
                        <span className="setting-title">Require Clutch to Shift</span>
                    </label>
                    <p className="setting-desc">If enabled, shifts are ignored unless the clutch is pressed past the threshold.</p>
                </div>

                {settings.requireClutch && (
                    <div className="setting-group" style={{ marginLeft: '2rem', paddingLeft: '1rem', borderLeft: '2px solid #00bcd4' }}>
                        <label>
                            <span className="setting-title">Clutch Threshold: {Math.round(settings.clutchThreshold * 100)}%</span>
                            <input 
                                type="range" 
                                min="0.1" max="1.0" step="0.05"
                                value={settings.clutchThreshold} 
                                onChange={e => setSettings({ ...settings, clutchThreshold: parseFloat(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                        </label>
                        <p className="setting-desc">How far the clutch must be pressed to allow a shift.</p>
                    </div>
                )}
                
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
                .setting-group { margin-bottom: 1.5rem; }
                .setting-group label { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; margin-bottom: 0.5rem; }
                .setting-group input[type="number"], .setting-group input[type="text"] { background: #1e1e1e; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; font-size: 1rem; width: 100px; text-align: center; }
                .setting-title { font-weight: bold; cursor: help; }
                .setting-desc { font-size: 0.9rem; color: #888; margin-top: 0.2rem; }
                .checkbox-label { justify-content: flex-start !important; gap: 1rem; cursor: pointer; }
                .checkbox-label input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; }
                .divider { border-color: #444; margin: 2rem 0; }
                .save-btn { width: 100%; padding: 12px; border: none; border-radius: 4px; color: white; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: background 0.3s; margin-top: 1rem; }
                .save-btn:hover { filter: brightness(1.1); }
            `}</style>
        </div>
    );
}
