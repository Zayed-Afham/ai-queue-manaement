import React, { useState, useEffect } from 'react';
import { getDashboardAnalytics } from './api';
import { Activity, Server, Users, ArrowRightLeft, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState({
    crowd_status: { count: 0, category: 'Loading...' },
    counters: [],
    routing_logs: [],
    total_waiting: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardAnalytics();
        setData(response.data);
      } catch (err) {
        console.error("Dashboard offline", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const { crowd_status, counters, routing_logs, total_waiting } = data;

  const getTheme = (cat) => {
    switch(cat) {
      case 'Easy': return 'text-green-500 bg-green-500/10 border-green-500';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
      case 'Hard': return 'text-orange-500 bg-orange-500/10 border-orange-500';
      case 'Critical': return 'text-red-500 bg-red-500/20 border-red-500 animate-pulse';
      default: return 'text-slate-500 border-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 p-8 font-sans">
      <header className="mb-10 flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">Admin Operations Center</h1>
          <p className="text-slate-500 font-mono mt-1">Intelligent Load Balancing Status Reporting</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 flex items-center gap-4">
            <Users className="text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Wait Pool</div>
              <div className="text-2xl font-black text-white">{total_waiting}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Crowd Classification Block */}
        <div className={`col-span-1 rounded-[2rem] p-8 border-2 ${getTheme(crowd_status.category)}`}>
          <div className="flex items-center gap-4 mb-6 opacity-80">
            <ShieldAlert size={24} />
            <h2 className="text-lg font-bold uppercase tracking-widest">Active Crowd Density</h2>
          </div>
          <div className="space-y-6">
             <div className="text-6xl font-black">{crowd_status.category}</div>
             <div>
                <span className="text-8xl font-black">{crowd_status.count}</span>
                <span className="text-xl ml-2 font-medium opacity-80 uppercase tracking-wider">Unique Faces</span>
             </div>
             <p className="opacity-70 text-sm">System categorizes thresholds automatically (Easy: &lt;=3, Medium: 4-5, Hard: 6-7, Critical: &gt;7). Camera feed updates every 3s.</p>
          </div>
        </div>

        {/* Dynamic Load Balancing Counters */}
        <div className="col-span-2 bg-slate-800 rounded-[2rem] p-8 border border-slate-700">
           <div className="flex items-center gap-4 mb-8 text-slate-400">
            <Server size={24} />
            <h2 className="text-lg font-bold uppercase tracking-widest">Counter Queue Load Balancing Matrix</h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {counters.map((c) => (
               <div key={c.number} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition">
                  <div className="text-indigo-400 font-bold uppercase tracking-widest mb-4">Counter {c.number}</div>
                  <div className="text-5xl font-black text-white">{c.queue_size}</div>
                  <div className="text-xs text-slate-500 mt-2 uppercase font-medium">Pre-Assigned Tickets Waiting</div>
                  <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${Math.min((c.queue_size / (total_waiting || 1)) * 100, 100)}%` }} />
                  </div>
               </div>
            ))}
          </div>
        </div>

        {/* Detailed Routing Logs Table */}
        <div className="col-span-3 bg-slate-800 rounded-[2rem] p-8 border border-slate-700 shadow-2xl">
          <div className="flex items-center gap-4 mb-6 text-slate-400 border-b border-slate-700 pb-4">
            <ArrowRightLeft size={24} />
            <h2 className="text-lg font-bold uppercase tracking-widest">Algorithmic Routing Log Trail</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-700">
                  <th className="pb-4">Timestamp</th>
                  <th className="pb-4">Ticket Issued</th>
                  <th className="pb-4">Assigned To</th>
                  <th className="pb-4 w-1/2">Algorithmic Routing Logic Used</th>
                </tr>
              </thead>
              <tbody>
                {routing_logs.map((log, i) => (
                   <tr key={i} className="hover:bg-slate-700/30 transition border-b border-slate-700/50">
                      <td className="py-4 text-sm text-slate-400">{new Date(log.time).toLocaleTimeString()}</td>
                      <td className="py-4 font-bold text-indigo-400">{log.ticket}</td>
                      <td className="py-4 font-bold">{log.assigned_to}</td>
                      <td className="py-4 text-sm text-slate-300 font-mono bg-slate-900/50 px-4 rounded border-l-2 border-indigo-500">{log.reason}</td>
                   </tr>
                ))}
                {routing_logs.length === 0 && (
                   <tr><td colSpan="4" className="py-8 text-center text-slate-500">No routing logic recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
