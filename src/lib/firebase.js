const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.join(__dirname, '../../the-symbiotic-protocol-firebase-adminsdk-fbsvc-0effdcdda6.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
