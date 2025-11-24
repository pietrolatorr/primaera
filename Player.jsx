import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, query, where, getDocs, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { Users, AlertTriangle, Eye, Type, Send } from 'lucide-react';
import WordleGame from '../components/WordleGame';
import GameTimer from '../components/GameTimer';
import LogoSVG from '../assets/Logo Platform.svg';

export default function Player() {
  const [teamName, setTeamName] = useState('');
  const [teamId, setTeamId] = useState(localStorage.getItem('teamId') || null);
  const [status, setStatus] = useState('login'); 
  const [score, setScore] = useState(0);
  // NUOVO STATO PER ANTI-CHEATING
  const [completedGames, setCompletedGames] = useState([]);
  
  const [activeModule, setActiveModule] = useState('LOBBY');
  const [gameData, setGameData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [anagramInput, setAnagramInput] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [zipHints, setZipHints] = useState([]);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_uuid');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('device_uuid', deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    if (teamId) {
      const unsubTeam = onSnapshot(doc(db, "teams", teamId), (d) => {
        if (d.exists()) {
          const data = d.data();
          const myDeviceId = getDeviceId();
          if (data.deviceId && data.deviceId !== myDeviceId) {
             setErrorMsg("Account in uso su un altro telefono!");
             localStorage.removeItem('teamId'); setTeamId(null); setStatus('login'); return;
          }
          setScore(data.score);
          setTeamName(data.name);
          setCompletedGames(data.completedGames || []); // CARICA LISTA GIOCHI COMPLETATI
          if (data.status === 'pending') setStatus('pending'); else setStatus('active');
        } else {
          localStorage.removeItem('teamId'); setTeamId(null); setStatus('login');
        }
      });
      const unsubState = onSnapshot(doc(db, "state", "current"), (d) => { if (d.exists()) setActiveModule(d.data().game || 'LOBBY'); });
      return () => { unsubTeam(); unsubState(); };
    }
  }, [teamId]);

  useEffect(() => {
    setAnagramInput(''); setZipInput(''); setZipHints([]); setGameData(null);
    if(activeModule === 'LOBBY') return;
    let col = "";
    if(activeModule === 'WORDLE') col = "wordle"; 
    if(activeModule === 'ANAGRAM') col = "anagram"; 
    if(activeModule === 'ZIP') col = "zip";
    if(col) return onSnapshot(doc(db, "games", col), (d) => { if(d.exists()) setGameData(d.data()); });
  }, [activeModule]);

  const handleJoin = async (e) => {
    e.preventDefault(); setErrorMsg(''); setIsLoading(true);
    const nameClean = teamName.trim().toUpperCase(); 
    if (!nameClean) return; 
    const deviceId = getDeviceId();
    try {
      const q = query(collection(db, "teams"), where("name", "==", nameClean));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        if (existingDoc.data().deviceId === deviceId) {
          localStorage.setItem('teamId', existingDoc.id); setTeamId(existingDoc.id);
        } else {
          setErrorMsg("⛔️ Nome squadra già in uso!"); setIsLoading(false); return;
        }
      } else {
        const docRef = await addDoc(collection(db, "teams"), { name: nameClean, score: 0, joinedAt: new Date(), status: 'pending', deviceId: deviceId, completedGames: [] });
        localStorage.setItem('teamId', docRef.id); setTeamId(docRef.id);
      }
    } catch (error) { setErrorMsg("Errore: " + error.message); setIsLoading(false); }
  };

  const submitAnagram = async () => {
    if(!gameData || !gameData.isActive || gameData.isSolved) return;
    const gameUniqueId = `anagram_${gameData.id}`;
    if (completedGames.includes(gameUniqueId)) return alert("GIOCO GIÀ RISOLTO!"); // ANTI-CHEAT

    if(anagramInput.trim().toUpperCase() === gameData.solution) { 
        await updateDoc(doc(db, "games", "anagram"), { isSolved: true, winner: teamName }); 
        await updateDoc(doc(db, "teams", teamId), { 
            score: increment(50),
            completedGames: arrayUnion(gameUniqueId) // SALVA COMPLETAMENTO
        }); 
    } else { 
        alert("SBAGLIATO! Riprova."); setAnagramInput(''); 
    }
  };

  const buyLetter = async () => { 
    if(score < 5) return alert("Punti insufficienti!"); 
    const sol = gameData.solution; let hidden = []; 
    for(let i=0; i<sol.length; i++) if(!zipHints.includes(i)) hidden.push(i); 
    if(hidden.length===0) return; 
    setZipHints([...zipHints, hidden[Math.floor(Math.random()*hidden.length)]]); 
    await updateDoc(doc(db, "teams", teamId), { score: increment(-5) }); 
  };

  const buyWord = async () => { 
     if(score < 20) return alert("Punti insufficienti!"); 
     if(confirm("Comprare soluzione (-20pt)?")) { 
         setZipInput(gameData.solution); 
         await updateDoc(doc(db, "teams", teamId), { score: increment(-20) }); 
     }
  };

  const submitZip = async () => { 
      const gameUniqueId = `zip_${gameData.id}`;
      if (completedGames.includes(gameUniqueId)) return alert("GIOCO GIÀ RISOLTO! Niente furbate 😉"); // ANTI-CHEAT

      if(zipInput.trim().toUpperCase() === gameData.solution) { 
          await updateDoc(doc(db, "teams", teamId), { 
              score: increment(50),
              completedGames: arrayUnion(gameUniqueId) // SALVA COMPLETAMENTO
          }); 
          alert("ZIP RISOLTA!"); setZipInput(''); 
      } else { alert("Risposta Errata!"); }
  };

  if (status === 'login' || !teamId) return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
          <div className="flex justify-center mb-6"><div className="bg-gradient-to-br from-blue-600 to-purple-600 p-5 rounded-full shadow-lg"><Users size={40} /></div></div>
          <img src={LogoSVG} alt="Logo" className="h-16 w-auto mx-auto mb-6" />
          <form onSubmit={handleJoin} className="space-y-4 mt-8">
            <input type="text" placeholder="NOME SQUADRA" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-4 text-center text-xl font-bold outline-none uppercase" disabled={isLoading} maxLength={15} />
            {errorMsg && (<div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle size={16}/> {errorMsg}</div>)}
            <button disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-all">{isLoading ? 'ACCESSO...' : 'ENTRA IN GIOCO'}</button>
          </form>
        </div>
      </div>
  );

  if (status === 'pending') return (<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center"><h1 className="text-3xl font-black mb-4">RICHIESTA INVIATA</h1><p className="text-xl text-yellow-400 font-black">{teamName}</p><p className="text-slate-400 mt-2">Attendi l'Admin...</p></div>);

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      <div className="bg-slate-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-md border-b border-slate-700">
        <div className="font-bold truncate max-w-[150px] uppercase text-sm tracking-wider">{teamName}</div>
        <div className="bg-yellow-500 text-black font-black px-4 py-1 rounded-full text-lg shadow-lg">{score}</div>
      </div>

      {gameData && gameData.startTime && gameData.duration && (<div className="bg-blue-900/50 p-2 flex justify-center backdrop-blur-sm border-b border-blue-500/30"><GameTimer startTime={gameData.startTime} durationMinutes={gameData.duration} /></div>)}

      <div className="p-4 flex flex-col items-center min-h-[60vh] justify-center w-full max-w-lg mx-auto">
        {activeModule === 'LOBBY' && (<div className="text-center animate-pulse space-y-4 opacity-80"><div className="text-6xl">⏳</div><h2 className="text-2xl font-bold text-slate-400">ATTENDI IL PROSSIMO GIOCO</h2></div>)}

        {/* PASSAGGIO PROPS PER WORDLE ANTI-CHEAT */}
        {activeModule === 'WORDLE' && (<div className="w-full animate-in zoom-in duration-300"><WordleGame teamId={teamId} gameId={gameData?.id} completedGames={completedGames} /></div>)}

        {activeModule === 'ANAGRAM' && gameData && (
            <div className="w-full animate-in slide-in-from-bottom">
                <h2 className="text-center text-purple-400 font-bold mb-4 uppercase tracking-widest text-sm">Risolvi l'Anagramma</h2>
                {completedGames.includes(`anagram_${gameData.id}`) ? (
                     <div className="bg-slate-700 p-6 rounded-xl text-center border border-slate-500"><h3 className="text-xl font-bold text-slate-300">TENTATIVO INVIATO</h3><p>Attendi il risultato...</p></div>
                ) : gameData.isSolved ? (
                    <div className="bg-green-600 p-6 rounded-xl text-center shadow-lg border border-green-400"><h3 className="text-3xl font-black mb-2">RISOLTO!</h3><p className="text-lg font-bold opacity-90">Vincitore: {gameData.winner}</p></div>
                ) : (
                    <div className="bg-slate-800 p-6 rounded-2xl border border-purple-500/30 shadow-2xl">
                        <div className="text-2xl font-black text-center mb-8 text-white uppercase tracking-widest bg-black/20 p-4 rounded-xl border border-white/10">{gameData.phrase}</div>
                        <input value={anagramInput} onChange={e => setAnagramInput(e.target.value)} type="text" placeholder="SCRIVI SOLUZIONE" className="w-full bg-slate-900 p-4 rounded-xl text-center font-bold text-white uppercase mb-4 focus:ring-2 focus:ring-purple-500 outline-none border border-slate-700" />
                        <button onClick={submitAnagram} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><Send size={20} /> INVIA TENTATIVO</button>
                    </div>
                )}
            </div>
        )}

        {activeModule === 'ZIP' && gameData && (
            <div className="w-full animate-in slide-in-from-bottom">
                <h2 className="text-center text-orange-400 font-bold mb-4 uppercase tracking-widest text-sm">La Zip</h2>
                {completedGames.includes(`zip_${gameData.id}`) ? (
                    <div className="bg-green-900/20 border border-green-500 p-8 rounded-xl text-center">
                        <h3 className="text-2xl font-black text-green-400 mb-2">COMPLETATO!</h3>
                        <p className="text-slate-400 text-sm">Hai già inviato la risposta corretta.</p>
                    </div>
                ) : (
                    <>
                    <div className="flex justify-between items-center font-bold text-sm mb-6 px-4 bg-slate-800 py-4 rounded-xl border border-slate-700">
                        <div className="bg-black/30 px-3 py-2 rounded text-slate-300">{gameData.wordA}</div><div className="text-orange-500 animate-pulse">•••</div><div className="bg-black/30 px-3 py-2 rounded text-slate-300">{gameData.wordB}</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-orange-500/30 space-y-6 shadow-2xl">
                        <div className="flex justify-center gap-2 flex-wrap">
                            {gameData.solution.split('').map((char, i) => (<div key={i} className={`w-10 h-12 flex items-center justify-center font-bold rounded-lg text-xl border transition-all ${zipHints.includes(i) ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-900 border-slate-600 text-white'}`}>{zipHints.includes(i) ? char : ((zipInput[i] || '').toUpperCase())}</div>))}
                        </div>
                        <input value={zipInput} onChange={e => setZipInput(e.target.value)} type="text" placeholder="SCRIVI SOLUZIONE" className="w-full bg-slate-900 p-4 rounded-xl text-center font-bold text-white uppercase focus:ring-2 focus:ring-orange-500 outline-none border border-slate-700" />
                        <button onClick={submitZip} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg">CONFERMA RISPOSTA</button>
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                            <button onClick={buyLetter} className="bg-slate-700 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-600"><Type size={16} className="text-orange-400"/> LETTERA (-5)</button>
                            <button onClick={buyWord} className="bg-slate-700 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-600"><Eye size={16} className="text-orange-400"/> SOLUZIONE (-20)</button>
                        </div>
                    </div>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
}