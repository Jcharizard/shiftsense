import { useEffect, useState } from 'react'
import './App.css'
import { gamepadManager } from './services/GamepadManager'
import { Dashboard } from './components/Dashboard'
import { Calibration } from './components/Calibration'
import { TranslatorSettings } from './components/TranslatorSettings'
import { OutputSettings } from './components/OutputSettings'

enum Tab {
  DASHBOARD = 'Dashboard',
  CALIBRATION = 'Calibration',
  TRANSLATOR = 'Translator Settings',
  OUTPUT = 'Output Settings'
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);

  useEffect(() => {
    gamepadManager.start();
    return () => gamepadManager.stop();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD: return <Dashboard />;
      case Tab.CALIBRATION: return <Calibration />;
      case Tab.TRANSLATOR: return <TranslatorSettings />;
      case Tab.OUTPUT: return <OutputSettings />;
      default: return <div>Select a tab</div>;
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1 className="logo-text">ShiftSense</h1>
        <nav>
          {Object.values(Tab).map(tab => (
            <button
              key={tab}
              className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
      <div className="main-content">
        {renderContent()}
      </div>
    </div>
  )
}

export default App
