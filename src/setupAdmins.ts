import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

export const setupAdminsBackground = async () => {
  try {
    let app2;
    try {
      app2 = initializeApp(firebaseConfig, 'InitAdminsApp');
    } catch (e) {
      app2 = getApp('InitAdminsApp');
    }
    const auth2 = getAuth(app2);

    const admins = [
      { email: 'admin@smartdata.vn', pass: 'Admin@2026' },
      { email: 'minhpham.tst+admin@gmail.com', pass: 'Admin@2026' },
      { email: 'hongquannguyen.1206+admin@gmail.com', pass: 'Admin@2026' }
    ];

    for (const a of admins) {
      try {
        await createUserWithEmailAndPassword(auth2, a.email, a.pass);
        await auth2.signOut();
        console.log(`Created admin: ${a.email}`);
      } catch (e: any) {
        // Ignore if exists
      }
    }
  } catch (error) {
    console.error('Setup admins error', error);
  }
};
