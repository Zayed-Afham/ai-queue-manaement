import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle2, Megaphone, Ticket } from 'lucide-react';
import { callNextTicket, completeTicket, getDashboardAnalytics } from './api';

const Counter = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentTicket, setCurrentTicket] = useState(null); 
  const [queueCount, setQueueCount] = useState(0); 
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardAnalytics();
        const myCounter = response.data.counters.find(c => c.number.toString() === id);
        if (myCounter) {
            setQueueCount(myCounter.queue_size);
        }
      } catch (e) {
        console.error("Backend offline", e);
      }
    };
    fetchStats();
    const int = setInterval(fetchStats, 2000);
    return () => clearInterval(int);
  }, [id]);

  const handleCallNext = async () => {
    setCalling(true);
    try {
      const response = await callNextTicket(id);
      if (response.data.status === 'success') {
         setCurrentTicket(response.data);
      } else {
         alert("Nobody is assigned to your queue!");
      }
    } catch (err) {
      alert("Failed to call next. Is backend running?");
    } finally {
      setCalling(false);
    }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    try {
      await completeTicket(currentTicket.ticket);
      setCurrentTicket(null);
    } catch (e) {
      alert("Error completing ticket.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 border-b border-slate-800">
          <h2 className="text-3xl font-black text-indigo-400 mb-2">Counter {id}</h2>
          <p className="text-slate-400 text-sm font-medium">Fast-Track Terminal</p>
        </div>
        
        <div className="p-8">
          <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-inner flex flex-col items-center">
            <div className="text-xs text-indigo-300 uppercase tracking-[0.2em] mb-4 font-bold">Assigned Tickets</div>
            <div className="text-[6rem] leading-none font-black text-amber-400 mb-2">{queueCount}</div>
            <div className="text-sm text-slate-400 mt-2 font-medium">Waiting Directly For You</div>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="flex justify-center items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 transition m-8 mt-auto p-4 rounded-xl border border-slate-800"
        >
          <LogOut size={20} /> <span className="font-bold tracking-widest uppercase text-sm">Exit Terminal</span>
        </button>
      </div>

      {/* Main Administrative Control Area */}
      <div className="flex-1 p-16 flex flex-col items-center justify-center bg-slate-100">
        <div className="max-w-3xl w-full">
          {currentTicket ? (
            <div className="bg-white p-12 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-200 animate-in zoom-in duration-300 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-8 bg-indigo-500" />
              
              <div className="mt-8 mb-4 inline-flex items-center gap-3 bg-indigo-50 text-indigo-600 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm border border-indigo-100">
                <Ticket size={18} /> Currently Processing
              </div>
              
              <div className="my-12">
                <div className="text-xl text-slate-400 font-bold uppercase tracking-[0.3em] mb-4">Ticket Number</div>
                <div className="text-[10rem] font-black text-slate-800 tracking-tighter leading-none drop-shadow-sm">{currentTicket.ticket}</div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-16">
                <button 
                  onClick={handleCallNext}
                  className="py-6 bg-slate-100 text-slate-600 font-black tracking-widest uppercase rounded-2xl hover:bg-slate-200 transition flex items-center justify-center gap-3 text-lg"
                >
                  <Megaphone size={24} /> Recall
                </button>
                <button 
                  onClick={handleComplete}
                  className="py-6 bg-green-500 text-white font-black tracking-widest uppercase rounded-2xl hover:bg-green-600 transition shadow-[0_15px_30px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3 text-lg"
                >
                  <CheckCircle2 size={24} /> Complete
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center bg-white p-24 rounded-[3rem] shadow-xl border border-slate-200 space-y-8 animate-in fade-in duration-500">
              <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-8 border-indigo-50 mb-8 shadow-inner">
                <Megaphone className="w-20 h-20 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-5xl font-black text-slate-800 tracking-tight mb-4">You are Idle</h2>
                <p className="text-slate-500 text-xl font-medium">Call the next ticket routed to you.</p>
              </div>
              <button 
                onClick={handleCallNext}
                disabled={calling || queueCount === 0}
                className="w-full mt-12 py-8 text-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] transition shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:-translate-y-2 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
              >
                {calling ? 'Processing...' : 'Call Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Counter;
