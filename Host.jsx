import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import GameTimer from '../components/GameTimer';
import Leaderboard from '../components/Leaderboard';
import HostWordle from '../components/HostWordle'; // Assicurati di aver spostato HostWordle in components
import { CheckCircle, Clock } from 'lucide-react';

export default function Host() {
  const [globalState, setGlobalState] = useState({ game: 'LOBBY', showLeaderboard: false });
  const [gameData, setGameData] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "state", "current"), (d) => { if(d.exists()) setGlobalState(d.data()); });
    const q = query(collection(db, "teams"), orderBy("score", "desc"));
    const unsubTeams = onSnapshot(q, (s) => setTeams(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsub(); unsubTeams(); };
  }, []);

  useEffect(() => {
    if (globalState.game === 'LOBBY') return;
    let col = "";
    if (globalState.game === 'WORDLE') col = "wordle";
    if (globalState.game === 'ANAGRAM') col = "anagram";
    if (globalState.game === 'ZIP') col = "zip";
    if (globalState.game === 'HL') col = "hl_state";
    if (col) return onSnapshot(doc(db, "games", col), (d) => { if (d.exists()) setGameData(d.data()); });
  }, [globalState.game]);

  const TeamsStatusGrid = () => (
    <div className="mt-10 w-full max-w-6xl mx-auto">
        <h3 className="text-center text-slate-500 mb-4 uppercase tracking-widest text-sm font-bold">Stato Consegne</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {teams.map(team => {
                let isDone = false;
                // Logica completamento
                if(team.completedGames && gameData?.id) {
                     const checkId = `${globalState.game.toLowerCase()}_${gameData.id}`;
                     if(team.completedGames.includes(checkId)) isDone = true;
                }
                return (
                    <div key={team.id} className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isDone ? 'bg-green-600 border-green-400 shadow-lg scale-105' : 'bg-slate-800 border-slate-700 opacity-70'}`}>
                        <span className="font-bold truncate text-sm">{team.name}</span>
                        {isDone ? <CheckCircle size={16}/> : <Clock size={16} className="animate-pulse"/>}
                    </div>
                )
            })}
        </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-900 text-white overflow-hidden relative flex flex-col">
      {globalState.showLeaderboard && (<div className="absolute inset-0 z-[100]"><Leaderboard /></div>)}
      <div className="bg-slate-800/80 backdrop-blur-md p-4 border-b border-slate-700 flex justify-between items-center z-50 shadow-lg">
         <div className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">La Primaera Enigmistica <span className="text-white text-xs opacity-50">x Arnold's</span></div>
         {globalState.game !== 'LOBBY' && gameData?.startTime && (<div className="absolute left-1/2 transform -translate-x-1/2"><GameTimer startTime={gameData.startTime} durationMinutes={gameData.duration} /></div>)}
         <div className="text-sm font-bold text-slate-400 uppercase">{globalState.game}</div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {globalState.game === 'LOBBY' && (<div className="text-center animate-in zoom-in duration-500"><h1 className="text-7xl font-black mb-4 tracking-tighter">La Primaera Enigmistica</h1><h2 className="text-4xl font-light text-slate-400 mb-10 tracking-[0.5em] uppercase">x Arnold's</h2><div className="text-2xl animate-pulse text-yellow-500 font-bold border border-yellow-500/30 p-4 rounded-xl inline-block">IN ATTESA DELLA REGIA...</div></div>)}
        
        {/* WORDLE: Usa il componente specifico */}
        {globalState.game === 'WORDLE' && (<div className="w-full h-full"><HostWordle /></div>)}

        {globalState.game === 'ANAGRAM' && gameData && (<div className="w-full text-center"><h2 className="text-3xl text-purple-400 font-bold mb-8 uppercase tracking-widest">Anagramma</h2><div className="text-8xl font-black bg-slate-800 border-2 border-purple-500 px-12 py-8 rounded-3xl inline-block shadow-[0_0_60px_rgba(168,85,247,0.2)] mb-8">{gameData.phrase}</div>{gameData.isSolved ? (<div className="animate-bounce mt-8"><div className="text-green-500 text-2xl font-bold mb-2">RISOLTO DA</div><div className="text-5xl font-black bg-white text-black px-6 py-2 rounded-xl">{gameData.winner}</div></div>) : (<div className="text-slate-500 mt-8 animate-pulse text-xl">In attesa del vincitore...</div>)}</div>)}
        
        {globalState.game === 'ZIP' && gameData && (<div className="w-full text-center"><h2 className="text-3xl text-orange-400 font-bold mb-10 uppercase tracking-widest">Una tira l'altra</h2><div className="flex justify-center items-center gap-6 text-6xl font-black"><div className="bg-slate-800 border border-white/10 px-8 py-6 rounded-2xl">{gameData.wordA}</div><div className="text-orange-500 animate-pulse">...</div><div className="bg-orange-600 px-8 py-6 rounded-2xl shadow-[0_0_50px_orange]">?????</div><div className="text-orange-500 animate-pulse">...</div><div className="bg-slate-800 border border-white/10 px-8 py-6 rounded-2xl">{gameData.wordB}</div></div><TeamsStatusGrid /></div>)}
      </div>
    </div>
  );
}