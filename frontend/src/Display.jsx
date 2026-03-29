import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Ticket, Clock, Zap } from 'lucide-react';
import { getActiveSystem } from './api';

const Display = () => {
  const [history, setHistory] = useState([]); 
  const [currentlyCalling, setCurrentlyCalling] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    let lastTicketCalledId = null;

    const fetchSystemData = async () => {
      try {
        const response = await getActiveSystem();
        const activeTickets = response.data.calling || [];
        
        if (activeTickets.length > 0) {
          const latestTicket = activeTickets[0];
          setHistory(activeTickets.slice(1));

          if (latestTicket.id !== lastTicketCalledId) {
            setCurrentlyCalling(latestTicket);
            lastTicketCalledId = latestTicket.id;
            playAudio(latestTicket.number, latestTicket.counter);
          } else if (!currentlyCalling) {
             setCurrentlyCalling(latestTicket);
             lastTicketCalledId = latestTicket.id;
          }
        } else {
           setCurrentlyCalling(null);
           setHistory([]);
        }
      } catch (err) {
        console.error("Django Backend offline", err);
      }
    };
    
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 1500); // Super fast polling for Autonomous systems
    return () => clearInterval(interval);
  }, [audioEnabled]);

  const playAudio = (number, counter) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    const cleanNumber = number.replace('-', ' ');
    const text = `Attention. Ticket ${cleanNumber}, please proceed to counter ${counter}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-6 font-sans">
      <header className="flex justify-between items-center mb-8 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex items-center gap-6">
          <Zap size={32} className="text-yellow-400" />
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white uppercase">Fast-Track Delivery Display</h1>
            <p className="text-slate-400 font-medium">Autonomous Delta Ticket Routing</p>
          </div>
        </div>
        <button 
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`px-8 py-4 rounded-xl flex items-center gap-3 font-bold transition ${
            audioEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 border border-slate-600'
          }`}
        >
          {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          <span>{audioEnabled ? 'AUDIO ENABLED' : 'ENABLE AUDIO'}</span>
        </button>
      </header>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Serving Screen */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 bg-slate-800/50 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden text-center">
          <h2 className="text-4xl font-semibold text-slate-400 mb-8 uppercase tracking-[0.3em]">Now Serving</h2>
          
          {currentlyCalling ? (
            <div className="flex flex-col items-center animate-in zoom-in duration-500 w-full max-w-2xl">
               
               <div className="bg-indigo-600/20 p-6 rounded-full border border-indigo-500/50 mb-8">
                 <Ticket size={64} className="text-indigo-400" />
               </div>

               <div className="text-[12rem] font-black leading-none tracking-tighter text-amber-400 drop-shadow-[0_0_50px_rgba(251,191,36,0.3)] mb-12">
                 {currentlyCalling.number}
               </div>

               <div className="text-5xl font-bold bg-slate-900 px-12 py-8 rounded-[2rem] flex items-center justify-between gap-12 text-slate-300 w-full shadow-[inset_0_5px_20px_rgba(0,0,0,0.5)] border border-slate-800">
                 <span className="uppercase tracking-widest text-indigo-300">Proceed To</span>
                 <div className="flex items-center gap-6">
                    <span className="text-indigo-500 font-light">Counter</span>
                    <span className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center text-7xl text-white font-black shadow-[0_0_20px_rgba(79,70,229,0.5)]">
                      {currentlyCalling.counter}
                    </span>
                 </div>
               </div>
            </div>
          ) : (
             <div className="text-slate-500 flex flex-col items-center gap-6">
               <Clock size={64} className="opacity-50" />
               <div className="text-3xl font-light tracking-wide">Waiting for system allocation...</div>
             </div>
          )}
        </div>

        {/* Call History Visual List */}
        <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8 flex flex-col shadow-xl">
          <h3 className="text-xl font-bold text-slate-400 mb-8 uppercase tracking-[0.2em]">Recently Called</h3>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            {history.map((t, i) => (
              <div key={t.id + i} className="flex gap-6 items-center p-6 bg-slate-800 rounded-2xl border border-slate-700 hover:bg-slate-700 transition shadow-md">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                   <Ticket size={28} />
                </div>
                <div className="flex-1 font-black text-4xl text-slate-300 tracking-tight">
                  {t.number}
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-1">Counter</span>
                   <span className="text-3xl font-bold text-indigo-400 leading-none">{t.counter}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-slate-500 pb-12">
                No tickets in history.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Display;
