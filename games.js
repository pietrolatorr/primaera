export const GAMES_DATA = {
  // --- WORDLE (Parole di 5 lettere esatte) ---
  wordle: [
    { id: 1, word: "TIGRE" },
    { id: 2, word: "PIANO" },
    { id: 3, word: "FIORE" },
    { id: 4, word: "AMORE" },
    { id: 5, word: "SOGNO" },
    { id: 6, word: "PASTA" }, // Corretto (era 5)
    { id: 7, word: "COSTA" }, // Corretto (era 6)
    { id: 8, word: "VETRO" }, // Corretto (era 7)
    { id: 9, word: "ZINCO" }, // Corretto (era 8)
    { id: 10, word: "LEGNO" }, // Corretto (era 9)
    { id: 11, word: "SELLA" }  // Corretto (era 10)
  ],

  // --- ANAGRAMMI ---
  anagrams: [
    { id: 1, original: "A NAVE ROM", solution: "A ROMA VEN" },
    { id: 2, original: "IL TOPO", solution: "POLITO" },
    { id: 3, original: "CARNE", solution: "CENAR" }
  ],

  // --- ZIP (Una tira l'altra) ---
  zip: [
    { id: 1, wordA: "CASA", wordB: "MELA", solution: "DOLCE" },
    { id: 2, wordA: "PALLA", wordB: "PIEDE", solution: "CALCIO" }
  ],

  // --- HIGHER OR LOWER ---
  higherLower: [
    { 
      id: 1, 
      label: "Popolazioni",
      subjectA: "Italia", valueA: 59000000, 
      subjectB: "Francia", valueB: 67000000, 
      unit: "Abitanti" 
    },
    { 
      id: 2, 
      label: "Altezza Edifici",
      subjectA: "Torre Eiffel", valueA: 300, 
      subjectB: "Empire State", valueB: 380, 
      unit: "Metri" 
    }
  ]
};