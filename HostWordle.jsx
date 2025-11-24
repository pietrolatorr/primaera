// src/pages/Host.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { CheckCircle, Clock } from 'lucide-react';
// IMPORTA IL COMPONENTE SPECIFICO
import HostWordle from '../components/HostWordle'; // O './HostWordle' se è nella stessa cartella, ma meglio spostarlo in components
import GameTimer from '../components/GameTimer'; // Ti fornirò il codice sotto
import Leaderboard from '../components/Leaderboard'; // Ti fornirò il codice sotto

export default function Host() {
  // ... (tutto il codice degli stati rimane uguale) ...
  const [globalState, setGlobalState] = useState({ game: 'LOBBY', showLeaderboard: false });
  const [gameData, setGameData] = useState(null);
  const [teams, setTeams] = useState([]);

  // ... (useEffect 1 e 2 rimangono uguali) ...
  // ... (TeamsStatusGrid rimane uguale) ...

  return (
    <div className="h-screen w-full bg-slate-900 text-white overflow-hidden relative flex flex-col">
      
      {/* ... (Leaderboard e Header rimangono uguali) ... */}

      {/* --- CORPO PRINCIPALE --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">

        {/* LOBBY */}
        {globalState.game === 'LOBBY' && (
             // ... codice lobby esistente ...
             <div className="text-center animate-in zoom-in duration-500">
                 <h1 className="text-7xl font-black mb-4 tracking-tighter">La Primaera Enigmistica</h1>
                 <h2 className="text-4xl font-light text-slate-400 mb-10 tracking-[0.5em] uppercase">x Arnold's</h2>
                 <div className="text-2xl animate-pulse text-yellow-500 font-bold border border-yellow-500/30 p-4 rounded-xl inline-block">
                     IN ATTESA DELLA REGIA...
                 </div>
             </div>
        )}

        {/* WORDLE - FIX: USIAMO IL COMPONENTE DEDICATO */}
        {globalState.game === 'WORDLE' && (
             <div className="w-full h-full">
                 <HostWordle />
             </div>
        )}

        {/* ANAGRAMMA */}
        {globalState.game === 'ANAGRAM' && gameData && (
             // ... codice anagramma esistente ...
             <div className="w-full text-center">
                 <h2 className="text-3xl text-purple-400 font-bold mb-8 uppercase tracking-widest">Anagramma</h2>
                 <div className="text-8xl font-black bg-slate-800 border-2 border-purple-500 px-12 py-8 rounded-3xl inline-block shadow-[0_0_60px_rgba(168,85,247,0.2)] mb-8">
                     {gameData.phrase}
                 </div>
                 {gameData.isSolved ? (
                     <div className="animate-bounce mt-8">
                         <div className="text-green-500 text-2xl font-bold mb-2">RISOLTO DA</div>
                         <div className="text-5xl font-black bg-white text-black px-6 py-2 rounded-xl">{gameData.winner}</div>
                     </div>
                 ) : (
                    <div className="text-slate-500 mt-8 animate-pulse text-xl">In attesa del vincitore...</div>
                 )}
             </div>
        )}

        {/* ZIP */}
        {globalState.game === 'ZIP' && gameData && (
             // ... codice zip esistente ...
             <div className="w-full text-center">
                 <h2 className="text-3xl text-orange-400 font-bold mb-10 uppercase tracking-widest">Una tira l'altra</h2>
                 <div className="flex justify-center items-center gap-6 text-6xl font-black">
                     <div className="bg-slate-800 border border-white/10 px-8 py-6 rounded-2xl">{gameData.wordA}</div>
                     <div className="text-orange-500 animate-pulse">...</div>
                     <div className="bg-orange-600 px-8 py-6 rounded-2xl shadow-[0_0_50px_orange]">?????</div>
                     <div className="text-orange-500 animate-pulse">...</div>
                     <div className="bg-slate-800 border border-white/10 px-8 py-6 rounded-2xl">{gameData.wordB}</div>
                 </div>
                 <TeamsStatusGrid />
             </div>
        )}

        {/* HL */}
        {globalState.game === 'HL' && (
             // ... codice HL esistente ...
             <div className="w-full text-center">
                 <h2 className="text-6xl font-black text-blue-500 mb-8">HIGHER OR LOWER</h2>
                 <div className="bg-blue-900/30 p-10 rounded-xl border border-blue-500 inline-block">
                    <p className="text-2xl font-bold">Guardate le opzioni e decidete!</p>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
}