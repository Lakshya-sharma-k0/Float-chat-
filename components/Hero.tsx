import React from 'react';
import { ArrowRight, Play, ShieldAlert } from 'lucide-react';

interface HeroProps {
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
  onAccessData?: () => void;
  onLiveMap?: () => void;
  onSafetyCheck?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ 
  onInteractStart, 
  onInteractEnd,
  onAccessData,
  onLiveMap,
  onSafetyCheck
}) => {
  return (
    <div className="relative z-10 w-full min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 pointer-events-none">
      <div className="max-w-2xl pointer-events-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-display font-medium text-cyan-200 tracking-widest uppercase">ARGO Network Live</span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold font-display text-white leading-[0.9] tracking-tight mb-6">
          OCEAN <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">INTELLIGENCE</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
          Access real-time oceanographic data from the global ARGO float array. 
          Monitor temperature, salinity, and deep-sea currents through our conversational AI interface.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <button 
            onMouseEnter={onInteractStart}
            onMouseLeave={onInteractEnd}
            onClick={onAccessData}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2">
              Access Data
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <button 
            onMouseEnter={onInteractStart}
            onMouseLeave={onInteractEnd}
            onClick={onLiveMap}
            className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-colors backdrop-blur-sm flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play className="w-3 h-3 fill-current" />
            </div>
            <span>Live Map</span>
          </button>

          <button 
            onMouseEnter={onInteractStart}
            onMouseLeave={onInteractEnd}
            onClick={onSafetyCheck}
            className="px-8 py-4 rounded-full border border-red-500/30 text-red-100 font-medium hover:bg-red-500/10 transition-colors backdrop-blur-sm flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <span>Safety Check</span>
          </button>
        </div>
      </div>

      {/* Statistics / Social Proof */}
      <div className="absolute bottom-12 left-6 sm:left-12 lg:left-24 flex gap-12 pointer-events-auto">
        <div>
            <p className="text-3xl font-display font-bold text-white">3.8k</p>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Active Floats</p>
        </div>
        <div>
            <p className="text-3xl font-display font-bold text-white">2000m</p>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Scan Depth</p>
        </div>
        <div>
            <p className="text-3xl font-display font-bold text-white">100%</p>
            <p className="text-sm text-gray-500 uppercase tracking-wider">Global Coverage</p>
        </div>
      </div>
    </div>
  );
};