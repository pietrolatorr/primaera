import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("score", "desc"));
    return onSnapshot(q, (snap) => {
      setTeams(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  return (
    <div className="h-full w-full bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
        <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
        <h1 className="text-6xl font-black text-white mb-10 uppercase tracking-widest">Classifica</h1>
        
        <div className="w-full max-w-4xl space-y-4">
            {teams.slice(0, 5).map((team, index) => (
                <div key={team.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 shadow-2xl transform transition-all hover:scale-105 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-600/40 to-yellow-900/40 border-yellow-500' : 
                    index === 1 ? 'bg-slate-700/50 border-slate-400' :
                    index === 2 ? 'bg-orange-900/40 border-orange-700' :
                    'bg-slate-800 border-slate-700'
                }`}>
                    <div className="flex items-center gap-6">
                        <div className={`font-black text-4xl w-16 h-16 flex items-center justify-center rounded-full border-4 ${
                            index === 0 ? 'bg-yellow-500 text-black border-yellow-300' : 'bg-slate-900 text-white border-slate-600'
                        }`}>
                            {index + 1}
                        </div>
                        <div className="text-4xl font-bold text-white uppercase">{team.name}</div>
                    </div>
                    <div className="text-5xl font-black text-yellow-400 drop-shadow-lg">{team.score}</div>
                </div>
            ))}
        </div>
    </div>
  );
}