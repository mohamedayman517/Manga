const admin = require("firebase-admin");

if (!admin.apps.length) {
  // Load credentials from env, never from repository files
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(svc);
    } catch (e) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it's valid JSON.");
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Points to a local JSON file path outside the repo
    credential = admin.credential.applicationDefault();
  } else {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  admin.initializeApp({
    credential,
    databaseURL: "https://manga-store-2d86a-default-rtdb.firebaseio.com",
  });
}

module.exports = admin;

