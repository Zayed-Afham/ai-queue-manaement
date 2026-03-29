import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { batchTickets } from './api';
import { Camera, ShieldAlert, Users, Ticket as TicketIcon, CheckCircle2 } from 'lucide-react';

const Kiosk = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // Delta Tracking State
  const [stableCount, setStableCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0); 
  const [generatedBatch, setGeneratedBatch] = useState([]); 
  const [showFlash, setShowFlash] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown countdown timer
  
  const countHistoryRef = useRef([]); 
  const stableCountRef = useRef(0);
  const processingRef = useRef(false);
  const cooldownRef = useRef(0); // Reference for the interval hook to check state accurately

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  const announceTickets = (tickets) => {
    if (!('speechSynthesis' in window)) return;
    const ticketStrings = tickets.map(t => t.number.replace('-', ' ')).join(', ');
    const text = `Attention. Tickets generated: ${ticketStrings}. Please proceed.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const processDelta = async (currentDetectedCount) => {
    if (processingRef.current) return;
    const delta = currentDetectedCount - stableCountRef.current;
    
    // Only generate if there is an INCREASE in people (positive delta)
    if (delta > 0) {
      processingRef.current = true;
      try {
        const response = await batchTickets(delta);
        const newTickets = response.data.tickets;
        
        stableCountRef.current = currentDetectedCount;
        setStableCount(currentDetectedCount);
        setGeneratedBatch(newTickets);
        setShowFlash(true);
        
        // Announce
        announceTickets(newTickets);
        
        // Start 20-second security cooldown to prevent duplicate scanning of the same person
        let timeLeft = 20;
        setCooldown(timeLeft);
        cooldownRef.current = timeLeft;
        
        const timer = setInterval(() => {
          timeLeft--;
          setCooldown(timeLeft);
          cooldownRef.current = timeLeft;
          if (timeLeft <= 0) {
            clearInterval(timer);
            setShowFlash(false);
            setGeneratedBatch([]);
            processingRef.current = false;
            // Reset the stable count so it treats someone new as a fresh delta
            stableCountRef.current = 0;
            setStableCount(0);
            countHistoryRef.current = [];
          }
        }, 1000);
      } catch (err) {
        console.error("Failed to generate batch", err);
        processingRef.current = false;
      }
    } else {
      // People left the zone, update stable baseline without generating tickets
      stableCountRef.current = currentDetectedCount;
      setStableCount(currentDetectedCount);
    }
  };

  useEffect(() => {
    if (!modelsLoaded || !isActive) return;

    const analyzeFrame = async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4 && !processingRef.current && cooldownRef.current <= 0) {
        const video = webcamRef.current.video;
        const detections = await faceapi.detectAllFaces(
          video, 
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        );
        
        // Entry-Zone Logic: Only count faces that are within the middle 60% of the screen.
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        let validFaces = 0;
        detections.forEach(det => {
          const { x, y, width, height } = det.box;
          const centerX = x + (width / 2);
          const centerY = y + (height / 2);
          
          // Zone: X between 20% and 80%, Y between 10% and 90%
          if (
            centerX > (videoWidth * 0.2) && centerX < (videoWidth * 0.8) &&
            centerY > (videoHeight * 0.1) && centerY < (videoHeight * 0.9)
          ) {
            validFaces++;
          }
        });

        // Temporal Stabilization using Statistical Mode (Most Frequent over 6 scans ~ 3 seconds)
        // This makes it INCREDIBLY tolerant to dropped frames completely fixing the 'never triggering' bug.
        const history = countHistoryRef.current;
        history.push(validFaces);
        if (history.length > 5) history.shift();

        setLiveCount(validFaces);

        if (history.length >= 3 && !processingRef.current) {
            // Find the most frequent face count in the recent history
            const frequency = {};
            let maxFreq = 0;
            let currentMode = history[0];
            
            history.forEach(val => {
               frequency[val] = (frequency[val] || 0) + 1;
               if (frequency[val] > maxFreq) {
                   maxFreq = frequency[val];
                   currentMode = val;
               }
            });

            // If the confirmed stable mode is different from our recorded baseline, process delta
            if (currentMode !== stableCountRef.current && maxFreq >= 3) {
                processDelta(currentMode);
            }
        }
      }
    };

    const interval = setInterval(analyzeFrame, 500); // Fast lightweight detection loop
    return () => clearInterval(interval);
  }, [modelsLoaded, isActive]);

  const handleActivate = () => {
    setIsActive(true);
    // Play silent utterance immediately on click to permanently unlock the browser's Audio engine
    if ('speechSynthesis' in window) {
      const unlock = new SpeechSynthesisUtterance('System Initialized.');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
  };

  if (!isActive) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <ShieldAlert size={64} className="text-indigo-500 mb-8" />
        <h1 className="text-4xl font-bold mb-4">Autonomous Ticket Node</h1>
        <p className="text-slate-400 mb-12 max-w-lg">
          This terminal continuously scans the physical entry zone using Delta Temporal Stabilizing algorithms. It will automatically dispense load-balanced sequential tickets as groups enter.
        </p>
        <button 
          onClick={handleActivate}
          className="px-12 py-6 bg-indigo-600 font-black text-xl rounded-full tracking-widest hover:scale-105 transition hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.5)]"
        >
          ACTIVATE ZONE SCANNER
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans overflow-hidden">
      
      {/* FLASH SCREEN: Takes over UI when new tickets are mathematically generated */}
      <div className={`absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-3xl flex flex-col items-center justify-center transition-all duration-700 ${showFlash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-full'}`}>
         {showFlash && (
            <div className="w-full max-w-6xl p-8 animate-in slide-in-from-bottom-24 fade-in duration-700">
               <div className="text-center mb-16">
                 <div className="relative inline-block mb-10">
                    <CheckCircle2 size={100} className="text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,0.4)]" />
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-150 animate-ping opacity-20"></div>
                 </div>
                 <h1 className="text-7xl font-black text-white tracking-tight mb-4 drop-shadow-lg">TICKETS DISPENSED</h1>
                 <p className="text-2xl text-indigo-300 font-medium tracking-wide">Please proceed to your assigned counters.</p>
               </div>
               
               <div className="flex flex-wrap justify-center gap-10">
                 {generatedBatch.map(ticket => (
                    <div key={ticket.id} className="bg-white rounded-[2.5rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.4)] flex flex-col items-center border-[12px] border-slate-50 min-w-[320px] transform hover:scale-105 transition duration-500">
                       <div className="text-7xl font-black text-slate-900 tracking-tighter mb-2">{ticket.number}</div>
                       <div className="text-indigo-600 font-black text-xl uppercase tracking-[0.2em] mb-10 border-t border-slate-100 pt-4 w-full text-center">Counter {ticket.assigned_counter}</div>
                       
                       <div className="bg-slate-50 px-10 py-8 rounded-3xl border border-slate-200 w-full flex flex-col items-center shadow-inner">
                         <div className="flex gap-1.5 h-16 w-full justify-center opacity-90 mb-6 px-4">
                            {[1, 3, 1, 5, 2, 4, 1, 3, 2].map((w, i) => (
                               <div key={i} className={`bg-slate-800 h-full rounded-sm`} style={{ width: `${w * 3}px` }}></div>
                            ))}
                         </div>
                         <div className="text-slate-700 font-mono tracking-[0.25em] font-black text-lg">
                           SEC-{ticket.id + 1000}
                         </div>
                       </div>
                       <div className="text-xs font-bold text-slate-400 mt-6 uppercase tracking-widest text-center max-w-[200px] leading-relaxed">
                         Allocation Complete
                       </div>
                    </div>
                 ))}
               </div>
               
               <div className="mt-20 flex flex-col items-center gap-6">
                  <div className="text-indigo-200 font-mono tracking-[0.5em] text-sm uppercase opacity-60">System Resetting For Safety</div>
                  <div className="flex items-center gap-6">
                    <div className="h-1.5 w-64 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(79,70,229,0.8)]" 
                        style={{ width: `${(cooldown / 20) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-6xl font-black text-white font-mono min-w-[80px]">{cooldown}s</span>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* Primary Scanner UI */}
      <div className="flex-1 relative flex items-center justify-center border-[12px] border-black overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          className={`w-full h-full object-cover transition-all duration-1000 ${cooldown > 0 ? 'blur-2xl grayscale scale-110 opacity-30' : 'opacity-70'}`}
        />
        
        {/* Cooldown Lock Screen Overlay */}
        {cooldown > 0 && !showFlash && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-in fade-in duration-1000">
             <div className="bg-black/60 p-12 rounded-[3rem] border border-white/5 backdrop-blur-md text-center max-w-lg">
               <Clock className="w-20 h-20 text-indigo-400 mx-auto mb-8 animate-pulse" />
               <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">Scanner On Standby</h2>
               <p className="text-indigo-200 text-lg opacity-80 mb-10 leading-relaxed font-medium">Please clear the entry zone after receiving your tickets. System re-activates automatically.</p>
               <div className="text-8xl font-black text-indigo-500 font-mono select-none">{cooldown}</div>
             </div>
          </div>
        )}
      </div>
      
      {/* Bottom Data Feed Ticker */}
      <div className="h-32 bg-slate-950 border-t border-slate-800 flex items-center px-12 gap-12 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-10">
        <div className="shrink-0 flex items-center gap-4 text-slate-500 font-mono">
           <Camera size={24} />
           <span className="tracking-widest uppercase">System Log</span>
        </div>
        <div className="flex-1 flex text-xl font-bold text-slate-400 tracking-wider">
           Waiting for new zone entries to trigger Auto-Ticketing delta...
        </div>
      </div>
      
    </div>
  );
};

export default Kiosk;
