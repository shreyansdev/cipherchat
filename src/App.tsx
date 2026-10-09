import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import { ChatProvider } from './contexts/ChatContext';
import DemoPage from './components/ui/demo';
import ParticleDrift from './components/ui/particle-drift';

function App() {
  return (
    <div className="relative min-h-screen w-full bg-[#030509] text-slate-100 overflow-x-hidden">
      {/* Particle Drift Global Ambient Background */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <ParticleDrift
          className="w-full h-full"
          mode="dark"
          speed={0.8}
          density={1}
          opacity={0.85}
        />
      </div>

      {/* Foreground Routes */}
      <div className="relative z-10 min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route 
            path="/chat/:roomName" 
            element={
              <ChatProvider>
                <ChatPage />
              </ChatProvider>
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
