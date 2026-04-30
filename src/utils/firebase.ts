import admin from "firebase-admin";
import serviceAccount from "../../config/mytest-project-a0bc5-firebase-adminsdk-fbsvc-195a2665e2.json";

// Initialize only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

export default admin;
