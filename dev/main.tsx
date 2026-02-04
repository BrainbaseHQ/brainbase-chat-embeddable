import React from 'react';
import ReactDOM from 'react-dom/client';
// Import styles FIRST to ensure CSS variables are loaded
import '../src/styles/variables.css';
// Then import the component (which also imports variables, but order matters)
import { ChatWidget } from '../src';

// ============================================
// 🔧 CONFIGURE YOUR TEST WIDGET HERE
// ============================================

const TEST_CONFIG = {
  // Replace with your real embed ID to test with real API data
  embedId: 'erakRkiwWD3XPpAWbjgSi',
  
  // Set to true to use mock responses instead of real API
  mockMode: false,
  
  // Widget starts closed so we can test auto-open
  defaultOpen: false,
  
  // Position: 'bottom-right' | 'bottom-left' | 'inline'
  position: 'bottom-right' as const,
  
  theme: 'dark' as const,
  
  // Auto-open after 3 seconds and send trigger message
  timeToOpen: 3,
  
  // Voice mode configuration
  voiceTokenUrl: 'https://lk-demo-beta.vercel.app/api/token',
  voiceAgentName: 'voice-agent',
  enableVoiceMode: true,
  
  // Show collapse button when widget is open (default: true)
  showCollapseButton: true,
  
  // Optional overrides (leave undefined to use values from API/database)
  // primaryColor: '#1a1a2e',
  // agentName: 'Test Agent',
  // welcomeMessage: 'Hello! This is a test message.',
};

// ============================================

function App() {
  return (
    <ChatWidget
      embedId={TEST_CONFIG.embedId}
      mockMode={TEST_CONFIG.mockMode}
      defaultOpen={TEST_CONFIG.defaultOpen}
      position={TEST_CONFIG.position}
      theme={TEST_CONFIG.theme}
      timeToOpen={TEST_CONFIG.timeToOpen}
      voiceTokenUrl={TEST_CONFIG.voiceTokenUrl}
      voiceAgentName={TEST_CONFIG.voiceAgentName}
      enableVoiceMode={TEST_CONFIG.enableVoiceMode}
      showCollapseButton={TEST_CONFIG.showCollapseButton}
      onSessionStart={(sessionId) => console.log('Session started:', sessionId)}
      onSessionEnd={(session) => console.log('Session ended:', session)}
      onMessage={(message) => console.log('Message:', message)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
