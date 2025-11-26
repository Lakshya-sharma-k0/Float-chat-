import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Waves, Maximize2, Minimize2, Activity, Wifi, Database, Terminal, Compass, Anchor, AlertTriangle } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage, Sender } from '../types';

interface ChatWidgetProps {
  onOpenChange?: (isOpen: boolean) => void;
  onThinking?: (isThinking: boolean) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  mode?: 'default' | 'fullscreen';
  setMode?: (mode: 'default' | 'fullscreen') => void;
}

// --- Sub-components ---

// Enhanced Markdown Renderer to handle the structured AI response
const MarkdownRenderer = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 font-sans">
      {lines.map((line, i) => {
        // H2 Headers
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-cyan-400 font-display font-bold text-lg mt-4 border-b border-cyan-500/30 pb-1">{line.replace('## ', '')}</h3>;
        }
        // H3 Headers (Sub-sections)
        if (line.startsWith('### ')) {
          return <h4 key={i} className="text-cyan-200/90 font-display font-bold text-sm mt-3 mb-1 flex items-center gap-2">{line.replace('### ', '')}</h4>;
        }
        // Blockquotes (Analyst Alerts)
        if (line.startsWith('> ')) {
            return (
                <div key={i} className="border-l-2 border-cyan-500 pl-3 py-2 my-2 bg-cyan-950/20 rounded-r-lg text-cyan-100/90 text-xs italic relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-cyan-400/5 pointer-events-none"></div>
                    {line.replace('> ', '')}
                </div>
            );
        }
        // Bullet points
        if (line.trim().startsWith('- ')) {
             const text = line.replace('- ', '');
             const parts = text.split(/(\*\*.*?\*\*)/g);
             return (
                <div key={i} className="flex gap-2 ml-2 items-start group">
                    <span className="text-cyan-500 mt-1.5 text-[10px] group-hover:text-cyan-300 transition-colors">•</span>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="text-cyan-100 font-bold">{part.slice(2, -2)}</strong>;
                            }
                            return part;
                        })}
                    </p>
                </div>
             );
        }
        // Normal Text
        if (line.trim() === '') return <br key={i} className="h-1 block"/>;
        
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={i} className="text-gray-200 text-sm leading-relaxed">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-cyan-100 font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
      })}
    </div>
  );
};

const DataLog = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toISOString().split('T')[1].split('.')[0];
      const id = Math.floor(Math.random() * 9000) + 1000;
      const metrics = ['TEMP', 'SAL', 'PRES', 'OXY'];
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      const val = (Math.random() * 100).toFixed(2);
      const newLog = `[${time}] FLOAT_${id} :: ${metric}_VAL > ${val}`;
      
      setLogs(prev => [newLog, ...prev].slice(0, 20));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] text-cyan-500/60 space-y-1 overflow-hidden h-full">
      {logs.map((log, i) => (
        <div key={i} className="opacity-70 hover:opacity-100 hover:text-cyan-400 transition-opacity truncate">
          {log}
        </div>
      ))}
    </div>
  );
};

const SignalGraph = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let offset = 0;

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      
      for (let i = 0; i < canvas.width; i++) {
        const y = canvas.height / 2 + Math.sin((i + offset) * 0.05) * 20 * Math.sin((i) * 0.01);
        ctx.lineTo(i, y);
      }
      
      ctx.strokeStyle = '#22d3ee'; // Cyan
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      offset += 2;
      frameId = requestAnimationFrame(draw);
    };

    const resize = () => {
        canvas.width = canvas.parentElement?.offsetWidth || 300;
        canvas.height = canvas.parentElement?.offsetHeight || 100;
    }
    
    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full opacity-50" />;
};

// --- Main Component ---

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  onOpenChange, 
  onThinking,
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  mode = 'default',
  setMode
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isEffectiveOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleOpenChange = (newState: boolean) => {
    if (controlledSetIsOpen) controlledSetIsOpen(newState);
    else setInternalIsOpen(newState);
    onOpenChange?.(newState);
  };

  const toggleMode = () => {
    if (setMode) {
      setMode(mode === 'default' ? 'fullscreen' : 'default');
    }
  };

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: Sender.Model,
      text: "Link established with ARGO network.\n\nI am ready to analyze simulated oceanographic data, perform route safety checks, or discuss marine conditions.\n\n**Awaiting command...**",
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onThinking?.(loading);
  }, [loading, onThinking]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isEffectiveOpen, mode]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || loading) return;

    if (!textOverride) setInput('');

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: Sender.User,
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend, messages);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: Sender.Model,
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: Sender.Model,
        text: "**Alert**: Connection Interrupted.\n\nPlease verify your uplink and try again.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQueries = [
    { icon: Compass, text: "Analyze North Atlantic" },
    { icon: AlertTriangle, text: "Route Safety: NY to London" },
    { icon: Anchor, text: "Latest Float Telemetry" },
    { icon: Activity, text: "Gulf Stream Status" }
  ];

  // --- RENDER LOGIC ---
  
  const containerClasses = mode === 'fullscreen' 
    ? "fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-xl flex flex-col animate-[fadeIn_0.5s_ease-out]"
    : "mb-4 w-[90vw] sm:w-96 h-[600px] bg-nexus-panel backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[float_0.3s_ease-out]";

  const ChatContent = (
    <div className="flex flex-col h-full relative z-10">
        {/* Header */}
        <div className={`flex justify-between items-center ${mode === 'fullscreen' ? 'p-6 border-b border-white/10 bg-white/5' : 'p-4 border-b border-white/10 bg-white/5'}`}>
        <div className="flex items-center gap-3">
            <Waves className={`text-cyan-400 ${mode === 'fullscreen' ? 'w-8 h-8' : 'w-5 h-5'}`} />
            <div>
            <span className={`font-display font-bold text-white tracking-wide ${mode === 'fullscreen' ? 'text-2xl' : 'text-base'}`}>
                {mode === 'fullscreen' ? 'ARGO COMMAND CENTER' : 'ARGO LINK'}
            </span>
            {mode === 'fullscreen' && (
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-green-500 font-mono tracking-wider">SYSTEM ONLINE • ANALYST AI V2.5</span>
                </div>
            )}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
            onClick={toggleMode}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={mode === 'fullscreen' ? "Minimize" : "Maximize"}
            >
            {mode === 'fullscreen' ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
            onClick={() => handleOpenChange(false)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Close"
            >
            <X className={mode === 'fullscreen' ? "w-6 h-6" : "w-5 h-5"} />
            </button>
        </div>
        </div>

        {/* Body Area */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left HUD (Fullscreen only) */}
            {mode === 'fullscreen' && (
                <div className="hidden lg:flex w-64 border-r border-white/10 flex-col p-6 bg-black/20 gap-6">
                    <div className="h-1/3 border border-white/10 rounded-lg p-4 bg-black/40 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold tracking-wider">
                            <Activity className="w-4 h-4" />
                            SIGNAL STRENGTH
                        </div>
                        <div className="h-full w-full absolute inset-0 top-8">
                            <SignalGraph />
                        </div>
                    </div>
                    <div className="flex-1 border border-white/10 rounded-lg p-4 bg-black/40 flex flex-col">
                        <div className="flex items-center gap-2 mb-3 text-cyan-400 text-xs font-bold tracking-wider">
                            <Terminal className="w-4 h-4" />
                            LIVE TELEMETRY
                        </div>
                        <DataLog />
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                 {/* Grid Background for Fullscreen */}
                 {mode === 'fullscreen' && (
                     <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
                        backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', 
                        backgroundSize: '40px 40px' 
                     }}></div>
                 )}

                <div className={`flex-1 overflow-y-auto space-y-6 ${mode === 'fullscreen' ? 'p-8 max-w-5xl mx-auto w-full' : 'p-4'}`}>
                    {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.role === Sender.User ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`rounded-full flex items-center justify-center flex-shrink-0 border ${
                        msg.role === Sender.User 
                            ? 'bg-white/10 w-8 h-8 border-white/20' 
                            : 'bg-cyan-950/30 text-cyan-400 border-cyan-500/30 ' + (mode === 'fullscreen' ? 'w-12 h-12' : 'w-8 h-8')
                        }`}>
                        {msg.role === Sender.User ? <User className="w-4 h-4" /> : <Bot className={mode === 'fullscreen' ? "w-6 h-6" : "w-4 h-4"} />}
                        </div>
                        <div className={`max-w-[90%] sm:max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed backdrop-blur-sm shadow-lg ${
                        msg.role === Sender.User 
                            ? 'bg-white text-black rounded-tr-none' 
                            : 'bg-black/40 border border-white/10 rounded-tl-none'
                        } ${msg.isError ? 'border-red-500/50 text-red-200 bg-red-950/20' : ''} ${mode === 'fullscreen' ? 'text-base' : ''}`}>
                           {/* Use Markdown Rendering for Bot messages */}
                           {msg.role === Sender.Model ? <MarkdownRenderer content={msg.text} /> : msg.text}
                        </div>
                    </div>
                    ))}
                    {loading && (
                    <div className="flex gap-3">
                        <div className={`rounded-full bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 ${mode === 'fullscreen' ? 'w-12 h-12' : 'w-8 h-8'}`}>
                           <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="bg-black/40 p-5 rounded-2xl rounded-tl-none border border-white/10">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        </div>
                    </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Commands (Suggested Queries) */}
                {!loading && (
                  <div className={`px-4 pb-2 overflow-x-auto flex gap-2 ${mode === 'fullscreen' ? 'max-w-5xl mx-auto w-full' : ''}`}>
                     {suggestedQueries.map((q, i) => (
                       <button
                         key={i}
                         onClick={() => handleSend(q.text)}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors text-xs text-cyan-300 whitespace-nowrap"
                       >
                         <q.icon className="w-3 h-3" />
                         {q.text}
                       </button>
                     ))}
                  </div>
                )}

                {/* Input Area */}
                <div className={`${mode === 'fullscreen' ? 'p-8 border-t border-white/10 bg-black/40 flex justify-center' : 'p-4 border-t border-white/10 bg-white/5'}`}>
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={`relative ${mode === 'fullscreen' ? 'w-full max-w-5xl' : 'w-full'}`}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Query ARGO database..."
                        autoFocus={mode === 'fullscreen'}
                        className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all ${mode === 'fullscreen' ? 'py-5 text-lg shadow-2xl font-mono' : 'py-3 text-sm'}`}
                    />
                    <button 
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-white disabled:opacity-50 disabled:hover:text-cyan-400 transition-colors"
                    >
                        <Send className={mode === 'fullscreen' ? "w-6 h-6" : "w-4 h-4"} />
                    </button>
                    </form>
                </div>
            </div>

             {/* Right HUD (Fullscreen only) */}
             {mode === 'fullscreen' && (
                <div className="hidden lg:flex w-64 border-l border-white/10 flex-col p-6 bg-black/20 gap-6">
                     <div className="border border-white/10 rounded-lg p-4 bg-black/40">
                        <div className="flex items-center gap-2 mb-4 text-cyan-400 text-xs font-bold tracking-wider">
                            <Database className="w-4 h-4" />
                            ACTIVE DATASETS
                        </div>
                        <div className="space-y-3">
                            {[
                                { name: 'NOAA_ATL_V2', status: 'SYNCED' },
                                { name: 'PACIFIC_ARRAY_A', status: 'SYNCED' },
                                { name: 'IND_OCEAN_BUOY', status: 'UPDATING...' },
                                { name: 'ARGO_CORE_NET', status: 'ONLINE' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2 last:border-0">
                                    <span className="text-gray-300">{item.name}</span>
                                    <span className={item.status === 'ONLINE' || item.status === 'SYNCED' ? 'text-green-400' : 'text-yellow-400 animate-pulse'}>{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 border border-white/10 rounded-lg p-4 bg-black/40 flex flex-col justify-end">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[10px] text-cyan-500 font-mono tracking-widest">PROCESSING</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  if (mode === 'fullscreen') {
    if (!isEffectiveOpen) return null;
    return (
      <div className={containerClasses}>
         {ChatContent}
      </div>
    );
  }

  // Default Floating Mode
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
      {isEffectiveOpen && (
          <div className={containerClasses}>
             {ChatContent}
          </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => handleOpenChange(!isEffectiveOpen)}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
          isEffectiveOpen ? 'bg-red-500/80 hover:bg-red-600' : 'bg-white hover:scale-110'
        }`}
      >
        <div className={`absolute inset-0 rounded-full ${isEffectiveOpen ? '' : 'bg-cyan-400 blur-lg opacity-40 group-hover:opacity-60'}`}></div>
        {isEffectiveOpen ? (
          <X className="w-6 h-6 text-white relative z-10" />
        ) : (
          <MessageCircle className="w-6 h-6 text-black relative z-10" />
        )}
      </button>
    </div>
  );
};