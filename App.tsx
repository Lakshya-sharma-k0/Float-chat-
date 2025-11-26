import React, { useState } from 'react';
import { SplineScene } from './components/SplineScene';
import { ChatWidget } from './components/ChatWidget';
import { Hero } from './components/Hero';
import { MapOverlay } from './components/MapOverlay';
import { LoginModal } from './components/LoginModal';

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'default' | 'fullscreen'>('default');
  const [isThinking, setIsThinking] = useState(false);
  const [isHeroFocused, setIsHeroFocused] = useState(false);
  
  // Modal States
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState<'exploration' | 'routing'>('exploration');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Navigation Handlers
  const handleAccessData = () => {
    setChatMode('fullscreen');
    setIsChatOpen(true);
  };

  const handleLiveMap = () => {
    setMapMode('exploration');
    setIsMapOpen(true);
  };

  const handleSafetyCheck = () => {
    setMapMode('routing');
    setIsMapOpen(true);
  };

  const handleLogin = () => {
    setIsLoginOpen(true);
  };

  const handleCloseChat = (fullyClose: boolean) => {
    if (fullyClose) {
      setIsChatOpen(false);
      setChatMode('default');
    } else {
      // Minimalize
      setChatMode('default');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] text-white selection:bg-cyan-500 selection:text-white">
      
      {/* Navigation / Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto cursor-pointer group" onClick={() => window.location.reload()}>
          <span className="font-display font-bold text-2xl tracking-tighter">FLOAT</span>
          <span className="text-cyan-400 font-display font-bold text-2xl">CHAT</span>
        </div>
        
        <div className="hidden md:flex gap-8 pointer-events-auto">
           <button onClick={handleLiveMap} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Map</button>
           <button onClick={handleAccessData} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Data</button>
           <button onClick={handleAccessData} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Research</button>
           <a href="https://argo.ucsd.edu" target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">About</a>
        </div>

        <button 
          onClick={handleLogin}
          className="pointer-events-auto px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Researcher Login
        </button>
      </nav>

      {/* 3D Background Layer - receives state to animate */}
      <SplineScene 
        isChatOpen={isChatOpen} 
        isThinking={isThinking} 
        isFocused={isHeroFocused}
      />

      {/* Content Layer */}
      <main className="relative z-10">
        <Hero 
          onInteractStart={() => setIsHeroFocused(true)} 
          onInteractEnd={() => setIsHeroFocused(false)} 
          onAccessData={handleAccessData}
          onLiveMap={handleLiveMap}
          onSafetyCheck={handleSafetyCheck}
        />
      </main>

      {/* Modals & Overlays */}
      {isMapOpen && (
        <MapOverlay 
          onClose={() => setIsMapOpen(false)} 
          initialMode={mapMode}
        />
      )}
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}

      {/* Interactive Layer - reports state to App */}
      <ChatWidget 
        isOpen={isChatOpen} 
        setIsOpen={setIsChatOpen}
        mode={chatMode}
        setMode={setChatMode}
        onThinking={setIsThinking}
      />

      {/* Footer Note */}
      <div className="fixed bottom-4 right-0 left-0 text-center z-40 pointer-events-none">
        <p className="text-[10px] text-gray-600 font-mono">CREATED BY LAKSHYA SHARMA, LAKSHYA RATHORE, NAITIK GOYAL, ARYAN OJHA, ASHISH RAJPUT, KHUSHI SHINDE</p>
      </div>
    </div>
  );
};

export default App;