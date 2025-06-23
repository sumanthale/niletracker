import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyB4VkSNy9EjSboqk2l4TWxtihCz6w7c0pk",
  authDomain: "croud-funding.firebaseapp.com",
  projectId: "croud-funding",
  storageBucket: "croud-funding.firebasestorage.app",
  messagingSenderId: "227266900318",
  appId: "1:227266900318:web:8f5f39c842c2c5ec855fcf",
};
initializeApp(firebaseConfig);
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
