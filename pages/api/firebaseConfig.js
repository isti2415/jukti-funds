import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyB3osbJoolbu1MHgBI3KNzVJUD9G3XzvO0",
  authDomain: "jukti-funds.firebaseapp.com",
  databaseURL: "https://jukti-funds-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jukti-funds",
  storageBucket: "jukti-funds.appspot.com",
  messagingSenderId: "692915994068",
  appId: "1:692915994068:web:8533a886e43b61d4b96a41",
  measurementId: "G-KQK0368N55"
};
const app = initializeApp(firebaseConfig);

export default app;