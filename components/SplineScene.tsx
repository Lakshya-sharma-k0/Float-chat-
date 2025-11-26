import React, { useState, useRef, useEffect } from 'react';
import Spline from '@splinetool/react-spline';

interface SplineSceneProps {
  onLoad?: () => void;
  isChatOpen?: boolean;
  isThinking?: boolean;
  isFocused?: boolean;
}

export const SplineScene: React.FC<SplineSceneProps> = ({ 
  onLoad, 
  isChatOpen = false, 
  isThinking = false,
  isFocused = false
}) => {
  const [loading, setLoading] = useState(true);
  const splineRef = useRef<any>(null);

  // Restored to the primary FloatChat Robot Scene (High Quality)
  const SCENE_URL = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"; 

  const handleLoad = (spline: any) => {
    setLoading(false);
    splineRef.current = spline;
    if (onLoad) onLoad();
  };

  // React to AI Thinking State
  useEffect(() => {
    if (splineRef.current && isThinking) {
       try {
         // Trigger animation on the Robot character when AI is processing
         const objectToAnimate = splineRef.current.findObjectByName('Shape') || 
                                 splineRef.current.findObjectByName('Robot') ||
                                 splineRef.current.findObjectByName('Character');
         if (objectToAnimate) {
           splineRef.current.emitEvent('mouseDown', objectToAnimate.name); 
         }
       } catch (e) {
         // Silently fail if object not found
       }
    }
  }, [isThinking]);

  // Calculate CSS transforms based on state for a cinematic feel
  const getSceneStyles = () => {
    let transform = 'scale(1) translate(0, 0)';
    let filter = 'none';

    if (isChatOpen) {
      // Move robot slightly to the side to allow chat visibility
      // scale(1.1) keeps it prominent, translateX(-5%) shifts it slightly left
      transform = 'scale(1.1) translateX(-5%)'; 
    } else if (isFocused) {
      // Zoom in slightly when hovering hero elements
      transform = 'scale(1.15)';
    } else if (isThinking) {
      // Subtle pulse scale
      transform = 'scale(1.05)';
    }

    if (isThinking) {
        filter = 'brightness(1.2) drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))';
    }

    return {
      transform,
      filter,
      transition: 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.5s ease'
    };
  };

  return (
    <div className="fixed inset-0 z-0 w-full h-full overflow-hidden bg-[#050505]">
        {/* Loading Overlay */}
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050505] z-20 transition-opacity duration-700">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-t-nexus-accent border-white/10 rounded-full animate-spin"></div>
                    <p className="text-nexus-accent font-display tracking-widest text-sm animate-pulse">ESTABLISHING LINK...</p>
                </div>
            </div>
        )}
        
        <div 
            className={`w-full h-full transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}
            style={getSceneStyles()}
        >
            <Spline 
                scene={SCENE_URL} 
                onLoad={handleLoad}
                className="w-full h-full"
            />
        </div>
        
        {/* Gradient Overlay for text readability */}
        <div className={`absolute inset-0 pointer-events-none bg-gradient-to-r from-[#050505]/80 via-[#050505]/20 to-transparent z-10 transition-opacity duration-700 ${isChatOpen ? 'opacity-60' : 'opacity-100'}`} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
    </div>
  );
};