
import axios from "axios";

const SERVER_URL = ""; // ✅ Replace with your Railway backend URL

// ✅ Function to Register Fingerprint (Stores in MongoDB)
export const registerFingerprint = async (voterName, setFingerprintID, setMessage) => {
    try {
        if (!voterName) {
            setMessage("❌ Please enter your name!");
            return;
        }

        const publicKey = {
            challenge: new Uint8Array(32),
            rp: { name: "E-Voting System" },
            user: {
                id: new Uint8Array(16),
                name: voterName,
                displayName: voterName,
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },   // ✅ ES256 (Fixes error)
                { type: "public-key", alg: -257 }  // ✅ RS256 (Ensures broad compatibility)
            ],
            authenticatorSelection: {
                userVerification: "required",
                authenticatorAttachment: "platform",  // ✅ Ensures Mobile Fingerprint
            },
            timeout: 120000, // ✅ Extended timeout to avoid `NotAllowedError`
        };

        console.log("⏳ Starting fingerprint registration...");

        const credential = await navigator.credentials.create({ publicKey });

        if (credential) {
            const fingerprintID = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            setFingerprintID(fingerprintID);

            console.log("✅ Fingerprint registered");

            // ✅ Store fingerprint in MongoDB
            await axios.post(`${SERVER_URL}/registerFingerprint`, { voterName, fingerprint: fingerprintID });
            setMessage("✅ Fingerprint registered successfully!");
        } else {
            setMessage("❌ Fingerprint registration failed!");
        }
    } catch (error) {
        console.error("❌ Error registering fingerprint:", error);
        setMessage("❌ Error registering fingerprint. Try again.");
    }
};

// ✅ Function to Vote with Fingerprint
export const voteWithFingerprint = async (voterName, candidateName, setMessage) => {
    try {
        if (!voterName || !candidateName) {
            setMessage("❌ Please enter your name and candidate name!");
            return;
        }

        const publicKey = {
            challenge: new Uint8Array(32),
            rpId: window.location.hostname,
            userVerification: "required",
            timeout: 120000,
        };

        console.log("⏳ Waiting for fingerprint authentication...");

        const credential = await navigator.credentials.get({ publicKey });

        if (credential) {
            const fingerprintID = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

            console.log(`✅ Fingerprint scanned: ${fingerprintID}`);
            setMessage("✅ Fingerprint scanned, verifying...");

            // ✅ Check if fingerprint exists in MongoDB
            const response = await axios.post(`${SERVER_URL}/voteWithFingerprint`, { voterName, fingerprint: fingerprintID, candidateName });

            if (response.data.success) {
                setMessage("✅ Vote cast successfully!");
            } else {
                setMessage("❌ " + response.data.message);
            }
        } else {
            setMessage("❌ Fingerprint authentication failed!");
        }
    } catch (error) {
        console.error("❌ Error voting with fingerprint:", error);
        setMessage("❌ Voting failed. Try again.");
    }
};
