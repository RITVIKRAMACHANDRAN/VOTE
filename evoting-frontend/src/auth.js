// auth.js - WebAuthn + MongoDB Authentication
import axios from "axios";

const SERVER_URL = ""; // ✅ Update with your Railway backend URL

// ✅ Function to Register Fingerprint
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
            pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ✅ Supports ES256
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000,
        };

        const credential = await navigator.credentials.create({ publicKey });

        if (credential) {
            const fingerprintID = btoa(String.fromCharCode(...new Uint8Array(credential.rawId))); 
            setFingerprintID(fingerprintID);

            await axios.post(`${SERVER_URL}/registerFingerprint`, { voterName, fingerprint: fingerprintID });
            setMessage("✅ Fingerprint registered successfully!");
        } else {
            setMessage("❌ Fingerprint registration failed!");
        }
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        setMessage("❌ Error registering fingerprint!");
    }
};

// ✅ Function to Vote with Fingerprint (Uses MongoDB for Verification)
export const voteWithFingerprint = async (voterName, candidateName, setMessage) => {
    try {
        if (!voterName || !candidateName) {
            setMessage("❌ Enter your name and candidate name!");
            return;
        }

        // ✅ Get Voter Fingerprint from MongoDB
        const voterData = await axios.get(`${SERVER_URL}/getVoterFingerprint/${voterName}`);
        if (!voterData.data.fingerprint) {
            setMessage("❌ Voter fingerprint not found!");
            return;
        }

        const fingerprintID = voterData.data.fingerprint;

        const publicKey = {
            challenge: new Uint8Array(32),
            allowCredentials: [{
                id: Uint8Array.from(atob(fingerprintID), c => c.charCodeAt(0)), 
                type: "public-key",
            }],
            timeout: 60000,
        };

        const assertion = await navigator.credentials.get({ publicKey });

        if (assertion) {
            const response = await axios.post(`${SERVER_URL}/voteWithFingerprint`, {
                voterName,
                fingerprint: fingerprintID,
                candidateName
            });
            setMessage(response.data.message);
        } else {
            setMessage("❌ Fingerprint verification failed!");
        }
    } catch (error) {
        console.error("Error voting with fingerprint:", error);
        setMessage("❌ Error voting!");
    }
};
