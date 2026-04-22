import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCb3NHGU4chPBjPAReO_flGn142d2YtDjU",
  authDomain: "la-vecindad-50b3d.firebaseapp.com",
  projectId: "la-vecindad-50b3d",
  storageBucket: "la-vecindad-50b3d.firebasestorage.app",
  messagingSenderId: "686809899112",
  appId: "1:686809899112:web:f0092cb1d239b55b865bdd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);