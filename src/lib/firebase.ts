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
// Separate Firebase project used only for Facebook authentication
const facebookApp = initializeApp(
  {
    apiKey: 'AIzaSyBPdy3VuZF_5whxL_drqqqtt8b5n5IUxbo',
    authDomain: 'stone-dispatch-477517-k6.firebaseapp.com',
    projectId: 'stone-dispatch-477517-k6',
    storageBucket: 'stone-dispatch-477517-k6.firebasestorage.app',
    messagingSenderId: '4531945421',
    appId: '1:4531945421:web:337b9b989ceff38e8e0e84',
  },
  'facebook'
);
export const facebookAuth = getAuth(facebookApp);
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: 'popup',
});
export const db = getFirestore(app);

