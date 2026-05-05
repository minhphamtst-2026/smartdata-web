import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync, writeFileSync } from 'fs';

const cfg = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function run() {
  const pSnap = await getDocs(collection(db, 'packages'));
  const pkgs = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const d199g = pkgs.filter(p => (p.name || '').includes('D199'));

  const cSnap = await getDocs(collection(db, 'categories'));
  const cats = cSnap.docs.map(d => ({id: d.id, ...d.data()}));

  const result = "Found D199G: " + JSON.stringify(d199g, null, 2) + "\n" +
                 "Categories: " + JSON.stringify(cats.map(c => c.name + " (" + c.slug + ") (ID: " + c.id + ")"), null, 2);
  
  writeFileSync('./db-output.txt', result);
  process.exit(0);
}
run().catch(err => {
  writeFileSync('./db-output.txt', "Error: " + err);
  process.exit(1);
});
