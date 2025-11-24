import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ArrowUp, ArrowDown, CheckCircle, XCircle } from 'lucide-react';

export default function HigherLowerGame({ teamId, onFinish }) {
  const [gameData, setGameData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [status, setStatus] = useState('loading'); // loading, playing, correct, wrong, finished
  const [scoreSession, setScoreSession] = useState(0);

  // Carica i dati della catena
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = await getDoc(doc(db, "games", "hl_state"));
        if (docRef.exists() && docRef.data().isActive) {
          setGameData(docRef.data());
          setStatus('playing');
        } else {
          setStatus('error');
        }
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };
    fetchData();
  }, []);

  const handleGuess = async (direction) => {
    if (status !== 'playing') return;

    const items = gameData.chainItems;
    const currentItem = items[currentIndex];
    const nextItem = items[currentIndex + 1];

    // Logica di confronto
    const isHigher = nextItem.value >= currentItem.value;
    const isCorrect = (direction === 'higher' && isHigher) || (direction === 'lower' && !isHigher);

    if (isCorrect) {
      setStatus('correct');
      // +10 Punti
      await updateDoc(doc(db, "teams", teamId), { score: increment(10) });
      setScoreSession(prev => prev + 10);

      // Attesa e passaggio al prossimo
      setTimeout(() => {
        if (currentIndex + 2 < items.length) {
          setCurrentIndex(prev => prev + 1);
          setStatus('playing');
        } else {
          // Catena finita (Vittoria)
          setStatus('finished');
          setTimeout(() => { if(onFinish) onFinish(); }, 3000);
        }
      }, 1500);
    } else {
      // Errore (Sconfitta -> Lobby)
      setStatus('wrong');
      setTimeout(() => { if(onFinish) onFinish(); }, 3000);
    }
  };

  if (status === 'loading') return <div className="animate-pulse text-center">Caricamento Catena...</div>;
  if (status === 'error') return <div className="text-center text-red-400">Errore caricamento dati.</div>;

  const items = gameData?.chainItems || [];
  const leftItem = items[currentIndex];
  const rightItem = items[currentIndex + 1];

  if(!leftItem || !rightItem) return <div className="text-center">Catena completata.</div>;

  return (
    <div className="w-full max-w-md mx-auto text-center animate-in fade-in">
      <h2 className="text-xl font-black text-blue-400 mb-2 uppercase tracking-widest">{gameData.label}</h2>
      <p className="text-sm text-slate-400 mb-6">Punti Sessione: <span className="text-yellow-400 font-bold">+{scoreSession}</span></p>

      {status === 'wrong' ? (
        <div className="bg-red-600 p-8 rounded-2xl shadow-lg animate-bounce">
          <XCircle size={64} className="mx-auto mb-4 text-white"/>
          <h3 className="text-3xl font-black text-white">SBAGLIATO!</h3>
          <p className="mt-2 font-bold">Era {rightItem.value.toLocaleString()}</p>
          <p className="text-sm opacity-80 mt-4">Torno alla lobby...</p>
        </div>
      ) : status === 'finished' ? (
        <div className="bg-green-600 p-8 rounded-2xl shadow-lg animate-bounce">
          <CheckCircle size={64} className="mx-auto mb-4 text-white"/>
          <h3 className="text-3xl font-black text-white">COMPLETATO!</h3>
          <p className="mt-2 font-bold">Hai indovinato tutto!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* CARD SINISTRA (RIFERIMENTO) */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 opacity-80 transform scale-95">
            <div className="text-lg font-bold text-slate-300">{leftItem.name}</div>
            <div className="text-2xl font-black text-white">{leftItem.value.toLocaleString()}</div>
            <div className="text-xs uppercase text-slate-500">{gameData.unit}</div>
          </div>

          <div className="text-xl font-black text-blue-500 my-[-10px] z-10">VS</div>

          {/* CARD DESTRA (DA INDOVINARE) */}
          <div className={`bg-slate-800 p-6 rounded-2xl border-2 border-blue-500 shadow-xl transition-all ${status === 'correct' ? 'bg-green-900/50 border-green-500' : ''}`}>
            <div className="text-2xl font-black text-white mb-4">{rightItem.name}</div>
            
            {status === 'correct' ? (
               <div className="animate-in zoom-in">
                  <div className="text-4xl font-black text-green-400">{rightItem.value.toLocaleString()}</div>
                  <div className="text-sm uppercase text-green-600 font-bold mt-2">CORRETTO! (+10pt)</div>
               </div>
            ) : (
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleGuess('higher')} className="bg-slate-700 hover:bg-blue-600 py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-95">
                      <ArrowUp size={32} className="text-green-400"/>
                      <span className="font-bold text-sm uppercase">Più Alto</span>
                  </button>
                  <button onClick={() => handleGuess('lower')} className="bg-slate-700 hover:bg-blue-600 py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors active:scale-95">
                      <ArrowDown size={32} className="text-red-400"/>
                      <span className="font-bold text-sm uppercase">Più Basso</span>
                  </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}