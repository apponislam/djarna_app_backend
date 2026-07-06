import admin from "firebase-admin";
import path from "path";

// Path to the service account file
const serviceAccountPath = path.join(process.cwd(), "config", "djarna-b212e-firebase-adminsdk-fbsvc-ed19886f3e.json");

// Initialize only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
    });
}

export default admin;
