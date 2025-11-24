import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, getDocs, writeBatch, deleteDoc, arrayUnion } from 'firebase/firestore';
import { GAMES_DATA } from '../games';
import { Play, StopCircle, Users, Eye, EyeOff, Trash2, AlertTriangle, Lock, Check, X, Radio, CheckCircle2 } from 'lucide-react';
import LogoSVG from '../assets/Logo Platform.svg'; 

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState('wordle');
  const [loading, setLoading] = useState(null); 
  const [teams, setTeams] = useState([]); 
  const [globalState, setGlobalState] = useState({ game: 'LOBBY', activeId: null, showLeaderboard: false });
  const [history, setHistory] = useState({}); 
  const [resetStep, setResetStep] = useState(0); 
  const [teamTab, setTeamTab] = useState('pending'); 
  const [isTeamDrawerOpen, setIsTeamDrawerOpen] = useState(false);

  useEffect(() => {
    const unsubState = onSnapshot(doc(db, "state", "current"), (d) => { if(d.exists()) setGlobalState(d.data()); });
    const unsubHistory = onSnapshot(doc(db, "state", "history"), (d) => { if(d.exists()) setHistory(d.data()); else setDoc(doc(db, "state", "history"), {}); });
    const qTeams = query(collection(db, "teams"), orderBy("joinedAt", "asc"));
    const unsubTeams = onSnapshot(qTeams, (s) => { setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { unsubState(); unsubHistory(); unsubTeams(); };
  }, []);

  const handleLogin = (e) => { e.preventDefault(); if (pinInput === "8394") setIsAuthenticated(true); else { alert("PIN Errato!"); setPinInput(''); } };
  const approveTeam = async (teamId) => { try { await updateDoc(doc(db, "teams", teamId), { status: 'active' }); } catch (e) { alert("Errore approvazione"); } };
  const rejectTeam = async (teamId) => { if(!confirm("Rifiutare squadra?")) return; try { await deleteDoc(doc(db, "teams", teamId)); } catch (e) { alert("Errore cancellazione"); } };
  const toggleLeaderboard = async () => { await updateDoc(doc(db, "state", "current"), { showLeaderboard: !globalState.showLeaderboard }); };

  const launchGame = async (type, gameData) => {
    setLoading(gameData.id);
    const now = Date.now();
    try {
      await setDoc(doc(db, "state", "current"), { game: type.toUpperCase(), activeId: gameData.id, showLeaderboard: false });
      await setDoc(doc(db, "state", "history"), { [type]: arrayUnion(gameData.id) }, { merge: true });

      // AGGIUNTO IL CAMPO 'id: gameData.id' IN TUTTI I GIOCHI
      if (type === 'wordle') await setDoc(doc(db, "games", "wordle"), { 
          id: gameData.id, 
          secretWord: gameData.word.toUpperCase(), 
          label: gameData.label || '', 
          isActive: true, 
          startTime: now, 
          duration: 4 
      });
      else if (type === 'anagram') await setDoc(doc(db, "games", "anagram"), { 
          id: gameData.id, 
          phrase: gameData.original, 
          solution: gameData.solution.toUpperCase(), 
          isActive: true, 
          startTime: now, 
          isSolved: false, 
          winner: null 
      });
      else if (type === 'zip') await setDoc(doc(db, "games", "zip"), { 
          id: gameData.id, 
          wordA: gameData.wordA.toUpperCase(), 
          wordB: gameData.wordB.toUpperCase(), 
          solution: gameData.solution.toUpperCase(), 
          isActive: true, 
          startTime: now, 
          duration: 5 
      });
      else if (type === 'hl') await setDoc(doc(db, "games", "hl_state"), { 
          id: gameData.id, 
          subjectA: gameData.subjectA, valueA: gameData.valueA, 
          subjectB: gameData.subjectB, valueB: gameData.valueB, 
          unit: gameData.unit, 
          isActive: true, 
          startTime: now 
      });
      
      if (type === 'LOBBY') await setDoc(doc(db, "state", "current"), { game: 'LOBBY', activeId: null, showLeaderboard: false });

    } catch (error) { alert("Errore: " + error.message); }
    setLoading(null);
  };

  const handleFullReset = async () => {
    if (resetStep === 0) { setResetStep(1); return; }
    if (resetStep === 1) { setResetStep(2); return; }
    setLoading('RESET');
    try {
        const teamsSnapshot = await getDocs(collection(db, "teams"));
        const batch = writeBatch(db); 
        teamsSnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        await setDoc(doc(db, "state", "current"), { game: 'LOBBY', activeId: null, showLeaderboard: false });
        await setDoc(doc(db, "state", "history"), {}); 
        alert("✅ SERATA RESETTATA!");
        setResetStep(0);
    } catch (error) { alert("Errore reset: " + error.message); }
    setLoading(null);
  };

  const pendingTeams = teams.filter(t => t.status === 'pending');
  const activeTeams = teams.filter(t => t.status === 'active');

  const getCardStyle = (type, id) => {
      const isLive = globalState.game === type.toUpperCase() && globalState.activeId === id;
      const isDone = history[type]?.includes(id);
      if (isLive) return "border-green-500 bg-green-900/20 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-[1.02] ring-2 ring-green-500";
      if (isDone) return "border-slate-700 bg-slate-800/50 opacity-60 grayscale";
      return "border-slate-700 bg-slate-800 hover:border-blue-500";
  };

  if (!isAuthenticated) return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md text-center">
          <div className="flex justify-center mb-6"><div className="bg-red-600 p-4 rounded-full shadow-lg shadow-red-500/50"><Lock size={40} className="text-white"/></div></div>
          <h1 className="text-2xl font-black text-white mb-6">AREA RISERVATA</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" className="bg-slate-900 text-white text-center text-3xl font-black p-4 rounded-xl border border-slate-600 focus:border-blue-500 outline-none tracking-[0.5em]" value={pinInput} onChange={(e) => setPinInput(e.target.value)} maxLength={4} autoFocus />
            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg">SBLOCCA</button>
          </form>
        </div>
      </div>
  );

  const TeamManagerContent = () => (
    <div className="flex flex-col h-full">
        <div className="p-4 bg-slate-900 border-b border-slate-700">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Users size={18}/> SQUADRE</h2>
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setTeamTab('pending')} className={`flex-1 py-2 rounded-md text-xs font-bold ${teamTab === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Richieste {pendingTeams.length > 0 && <span className="bg-red-500 text-white px-2 rounded-full ml-2">{pendingTeams.length}</span>}</button>
                <button onClick={() => setTeamTab('active')} className={`flex-1 py-2 rounded-md text-xs font-bold ${teamTab === 'active' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>In Gioco ({activeTeams.length})</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-800">
            {teamTab === 'pending' && pendingTeams.map(team => (
                <div key={team.id} className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl flex flex-col gap-3">
                    <div className="font-black text-white text-lg">{team.name}</div>
                    <div className="flex gap-2">
                        <button onClick={() => approveTeam(team.id)} className="flex-1 bg-green-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><Check size={18}/> SÌ</button>
                        <button onClick={() => rejectTeam(team.id)} className="flex-1 bg-red-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"><X size={18}/> NO</button>
                    </div>
                </div>
            ))}
            {teamTab === 'active' && activeTeams.map(team => (
                <div key={team.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700 flex justify-between items-center text-sm">
                    <div className="font-bold truncate text-white">{team.name}</div>
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded font-mono font-bold">{team.score}</div>
                        <button onClick={() => rejectTeam(team.id)} className="text-slate-500 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                </div>
            ))}
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-700">
             <div className="bg-red-900/10 border border-red-900/50 rounded-xl p-4">
                <h3 className="text-red-500 font-bold mb-3 text-xs uppercase flex gap-2"><AlertTriangle size={14}/> DANGER ZONE</h3>
                <button onClick={handleFullReset} className={`w-full py-3 rounded-lg font-bold text-sm ${resetStep === 0 ? 'bg-red-900/80 text-red-100' : 'bg-red-600 text-white animate-pulse'}`}>{resetStep === 0 ? 'RESETTA SERATA' : resetStep === 1 ? 'CONFERMI?' : 'CANCELLA TUTTO!'}</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex lg:p-6 p-0 overflow-hidden relative">
      <div className="flex-1 flex flex-col h-screen lg:h-auto lg:mr-6 overflow-hidden">
        <div className="bg-slate-800 p-4 lg:rounded-2xl border-b lg:border border-slate-700 shadow-xl z-10 flex flex-col gap-4 shrink-0">
           <div className="flex justify-between items-center">
               <div className="flex items-center gap-3"><img src={LogoSVG} alt="Logo" className="h-8 lg:h-10 w-auto" /><div className="hidden lg:block text-xs font-bold text-slate-500 tracking-widest">ADMIN</div></div>
               <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border ${globalState.game === 'LOBBY' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' : 'bg-red-500/10 border-red-500 text-red-500 animate-pulse'}`}>
                   <div className={`w-2 h-2 rounded-full ${globalState.game === 'LOBBY' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>{globalState.game === 'LOBBY' ? 'LOBBY' : 'LIVE'}
               </div>
           </div>
           <div className="flex gap-2">
               <button onClick={toggleLeaderboard} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs ${globalState.showLeaderboard ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{globalState.showLeaderboard ? <><Eye size={16}/> ON</> : <><EyeOff size={16}/> OFF</>}</button>
               <button onClick={() => launchGame('LOBBY', {id: 'reset'})} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"><StopCircle size={16} /> STOP</button>
           </div>
        </div>
        <div className="bg-slate-900 p-2 border-b border-slate-800 shrink-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['wordle', 'anagram', 'zip', 'hl'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap text-xs transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{tab}</button>
                ))}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {['wordle', 'anagram', 'zip', 'hl'].includes(activeTab) && (activeTab === 'wordle' ? GAMES_DATA.wordle : activeTab === 'anagram' ? GAMES_DATA.anagrams : activeTab === 'zip' ? GAMES_DATA.zip : GAMES_DATA.higherLower).map(game => {
                    const cardStyle = getCardStyle(activeTab, game.id);
                    const isLive = globalState.game === activeTab.toUpperCase() && globalState.activeId === game.id;
                    const isDone = history[activeTab]?.includes(game.id);
                    return (
                        <div key={game.id} className={`p-5 rounded-2xl border-2 flex flex-col gap-3 relative transition-all duration-300 ${cardStyle}`}>
                            <div className="absolute top-3 right-3 flex gap-2">
                                {isLive && <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1"><Radio size={10}/> LIVE</span>}
                                {isDone && !isLive && <span className="bg-slate-600 text-slate-300 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 size={10}/> FATTO</span>}
                                <span className="text-[10px] font-bold text-slate-500 bg-black/20 px-2 py-1 rounded">#{game.id}</span>
                            </div>
                            <div className="mt-4">
                                {activeTab === 'wordle' && (<><div className="text-3xl font-black text-white tracking-[0.2em] text-center">{game.word}</div><div className="text-slate-400 text-xs text-center italic mt-1">{game.label}</div></>)}
                                {activeTab === 'anagram' && (<><div className="text-lg font-bold text-white text-center">{game.original}</div><div className="text-slate-400 text-xs text-center mt-1 bg-black/20 p-1 rounded">Sol: {game.solution}</div></>)}
                                {activeTab === 'zip' && (<div className="text-center font-bold mb-2 text-sm">{game.wordA} ... {game.solution} ... {game.wordB}</div>)}
                                {activeTab === 'hl' && (<div className="text-center font-bold mb-2 text-sm">{game.subjectA} vs {game.subjectB}</div>)}
                            </div>
                            <button onClick={() => launchGame(activeTab, game)} className={`mt-auto w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm ${isLive ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-blue-600 text-white'}`}>{loading === game.id ? '...' : isLive ? 'AGGIORNA' : <><Play size={16}/> ONDA</>}</button>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
      <div className="hidden lg:flex w-96 border-l border-slate-700 bg-slate-800 shadow-2xl z-20"><TeamManagerContent /></div>
      {isTeamDrawerOpen && (<div className="lg:hidden fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm animate-in fade-in"><div className="absolute inset-x-0 bottom-0 h-[85vh] bg-slate-800 rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom flex flex-col"><div className="p-4 text-right"><button onClick={() => setIsTeamDrawerOpen(false)}><X size={24}/></button></div><TeamManagerContent /></div></div>)}
      <button onClick={() => setIsTeamDrawerOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center"><Users size={28} />{pendingTeams.length > 0 && (<span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">{pendingTeams.length}</span>)}</button>
    </div>
  );
}