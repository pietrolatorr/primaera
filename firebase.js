// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⚠️ SOSTITUISCI QUESTO OGGETTO CON IL TUO COPIATO DA FIREBASE CONSOLE
const firebaseConfig = {
 apiKey: "AIzaSyBGFQeju_qcGpeV5TsUjXf4ceHRqh0nrMw",
 authDomain: "platform-prima.firebaseapp.com",
 projectId: "platform-prima",
 storageBucket: "platform-prima.firebasestorage.app",
 messagingSenderId: "113273371322",
 appId: "1:113273371322:web:5fdb5ec5a66f1cf0c1a083",
 measurementId: "G-SGX2S32S35"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);