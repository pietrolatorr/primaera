import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

export default function WordleGame({ teamId, gameId, completedGames }) {
  const [guess, setGuess] = useState('');
  const [history, setHistory] = useState([]); 
  const [gameStatus, setGameStatus] = useState('playing'); 
  const [secretWord, setSecretWord] = useState('');

  // ID UNIVIOCO DEL GIOCO (es: "wordle_5")
  const uniqueId = `wordle_${gameId}`;
  const isAlreadySolved = completedGames && completedGames.includes(uniqueId);

  useEffect(() => {
    getDoc(doc(db, "games", "wordle")).then(d => {
      if(d.exists()) setSecretWord(d.data().secretWord);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(isAlreadySolved || gameStatus !== 'playing') return;
    if(guess.length !== 5) return;
    
    const currentGuess = guess.toUpperCase();
    const newHistory = [...history, currentGuess];
    setHistory(newHistory);
    setGuess('');

    let result = "";
    let points = 0;

    if (currentGuess === secretWord) {
      setGameStatus('won');
      result = `Indovinato in ${newHistory.length}`;
      points = 50 - ((newHistory.length - 1) * 5);
      if(points < 10) points = 10;

      // SALVA SU FIREBASE + AGGIUNGI AI GIOCHI COMPLETATI
      await updateDoc(doc(db, "teams", teamId), { 
        last_wordle_result: result,
        score: increment(points),
        completedGames: arrayUnion(uniqueId)
      });
    } else if (newHistory.length >= 6) {
      setGameStatus('lost');
      await updateDoc(doc(db, "teams", teamId), { 
          last_wordle_result: "Fallito",
          completedGames: arrayUnion(uniqueId) // Blocchiamo anche se fallisce? (Opzionale)
      });
    } else {
        await updateDoc(doc(db, "teams", teamId), { last_wordle_result: `Tentativo ${newHistory.length}/6` });
    }
  };

  const getLetterColor = (letter, index, word) => {
    if (secretWord[index] === letter) return 'bg-green-600 border-green-500';
    if (secretWord.includes(letter)) return 'bg-yellow-600 border-yellow-500';
    return 'bg-slate-700 border-slate-600';
  };

  // SCHERMATA BLOCCATA SE GIOCO GIÀ FATTO
  if (isAlreadySolved) {
      return (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-800 rounded-2xl border border-green-500/50 shadow-2xl">
              <div className="bg-green-500/20 p-4 rounded-full mb-4"><span className="text-4xl">✅</span></div>
              <h2 className="text-2xl font-black text-green-400 mb-2">COMPLETATO!</h2>
              <p className="text-slate-400 text-center text-sm">Hai già inviato il risultato per questa parola.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      <h2 className="text-2xl font-black text-green-500 tracking-widest uppercase">Indovina la parola</h2>
      <div className="grid grid-rows-6 gap-2 w-full mb-4">
        {[...Array(6)].map((_, i) => {
          const word = history[i] || "";
          return (
            <div key={i} className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className={`aspect-square flex items-center justify-center font-bold text-xl border rounded uppercase text-white transition-all ${word ? getLetterColor(word[j], j, word) : 'bg-slate-800 border-slate-700'}`}>{word[j]}</div>
              ))}
            </div>
          )
        })}
      </div>
      {gameStatus === 'playing' ? (
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <input value={guess} onChange={(e) => setGuess(e.target.value.toUpperCase().slice(0, 5))} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-4 text-center font-bold text-white tracking-[0.5em] text-xl outline-none focus:border-green-500" placeholder="PAROLA" autoFocus />
          <button className="bg-green-600 hover:bg-green-500 text-white px-6 rounded-xl font-bold">INVIA</button>
        </form>
      ) : (
        <div className={`text-2xl font-black p-4 rounded-xl w-full text-center ${gameStatus === 'won' ? 'bg-green-600' : 'bg-red-600'}`}>{gameStatus === 'won' ? 'HAI VINTO!' : 'HAI PERSO'}</div>
      )}
    </div>
  );
}