import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { logCrowdData } from './api';
import { Users, Activity, Loader2 } from 'lucide-react';

const CrowdCamera = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [category, setCategory] = useState('Analyzing...');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    
    const analyzeCrowd = async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const detections = await faceapi.detectAllFaces(
          video, 
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
        );
        
        const count = detections.length;
        setFaceCount(count);
        
        try {
          // Push to backend Load Balancers to categorize
          const res = await logCrowdData(count);
          setCategory(res.data.category);
        } catch (e) {
          console.error("Failed to sync crowd data", e);
        }
      }
    };

    const interval = setInterval(analyzeCrowd, 3000); // Check crowd every 3 seconds
    return () => clearInterval(interval);
  }, [modelsLoaded]);

  const getTheme = (cat) => {
    switch(cat) {
      case 'Easy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Critical': return 'bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center font-sans tracking-tight">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-200">Crowd Density Scanner</h1>
            <p className="text-slate-500 mt-2">Running Real-Time AI Face Analytics</p>
          </div>
          <div className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-4 ${getTheme(category)} transition-colors duration-500`}>
            <Activity className={category === 'Critical' ? 'animate-pulse' : ''} />
            <div>
              <div className="text-xs uppercase font-bold tracking-widest opacity-80">Security Level</div>
              <div className="text-2xl font-black uppercase tracking-wider">{category}</div>
            </div>
          </div>
        </div>

        <div className="relative aspect-[21/9] rounded-[2rem] overflow-hidden bg-black border-4 border-slate-800 shadow-2xl">
          {!modelsLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p>Initializing AI Neural Networks...</p>
            </div>
          )}
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover opacity-80"
          />
          {/* HUD Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-8 flex justify-between items-end">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
              <span className="font-mono text-sm tracking-widest text-red-400">REC / SCANNING</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-slate-400 text-sm tracking-widest mb-1">UNIQUE FACES DETECTED</div>
              <div className="text-6xl font-black flex items-center justify-end gap-4 text-white drop-shadow-lg">
                <Users size={48} className="text-indigo-400" />
                {faceCount}
              </div>
            </div>
          </div>
        </div>
        <p className="text-center mt-6 text-slate-600 text-sm">Mount this device facing the active waiting area.</p>
      </div>
    </div>
  );
};

export default CrowdCamera;
