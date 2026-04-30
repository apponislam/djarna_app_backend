import admin from "firebase-admin";
import path from "path";

// Path to the service account file
const serviceAccountPath = path.join(process.cwd(), "config", "mytest-project-a0bc5-firebase-adminsdk-fbsvc-195a2665e2.json");

// Initialize only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
    });
}

export default admin;
