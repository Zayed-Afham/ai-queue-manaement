import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Kiosk from './Kiosk';
import Display from './Display';
import Counter from './Counter';
import CrowdCamera from './CrowdCamera';
import AdminDashboard from './AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold mb-8">AI Queue Management</h1>
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <a href="/kiosk" className="p-4 bg-indigo-600 rounded-xl text-center font-bold hover:bg-indigo-700">1. Start Terminal (Kiosk)</a>
              <a href="/counter/1" className="p-4 bg-slate-800 rounded-xl text-center font-bold hover:bg-slate-700">2. Staff Counter 1</a>
              <a href="/display" className="p-4 bg-slate-800 rounded-xl text-center font-bold hover:bg-slate-700">3. Waiting Room Display TV</a>
              <hr className="border-slate-700 my-4" />
              <a href="/crowd-camera" className="p-4 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl text-center font-bold hover:bg-green-600/30">4. Run Crowd Camera Node</a>
              <a href="/admin-dashboard" className="p-4 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-center font-bold hover:bg-purple-600/30">5. View Admin Analytics Dashboard</a>
            </div>
          </div>
        } />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/display" element={<Display />} />
        <Route path="/counter/:id" element={<Counter />} />
        <Route path="/crowd-camera" element={<CrowdCamera />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
