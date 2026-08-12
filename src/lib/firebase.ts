import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const config = {
  ...firebaseConfig,
  authDomain: 'animem.uz',
};

const app = initializeApp(config);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: 'popup',
});
export const db = getFirestore(app);

