import React, { useState, useEffect } from 'react';

export const Screensaver = () => {
  const [isActive, setIsActive] = useState(false);
  const IDLE_TIMEOUT = 60000; // 1 minute in milliseconds

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      setIsActive(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsActive(true), IDLE_TIMEOUT);
    };

    // Initialize timer
    timeoutId = setTimeout(() => setIsActive(true), IDLE_TIMEOUT);

    // Event listeners to reset timer
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0a192f] flex items-center justify-center overflow-hidden"
      style={{ animation: 'fadeIn 1s ease-in-out' }}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect behind the logo */}
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
        
        <img 
          src="/logo.png?v=4" 
          alt="CrimeVision Logo" 
          className="w-[90vw] max-w-[1200px] h-auto drop-shadow-[0_35px_35px_rgba(59,130,246,0.5)] z-10"
          style={{ 
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes float {
            0% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.4)); }
            50% { transform: translateY(-25px) scale(1.05); filter: drop-shadow(0 0 50px rgba(59, 130, 246, 0.8)); }
            100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.4)); }
          }
        `}</style>
      </div>
    </div>
  );
};
