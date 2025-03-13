
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
export const voteWithFingerprint = async () => {
    try {
        const candidateName = document.getElementById("candidateInput").value; // Get candidate name from input

        if (!candidateName) {
            alert("❌ Please enter a candidate name.");
            return;
        }

        const publicKeyOptions = {
            challenge: new Uint8Array(32),
            rpId: window.location.hostname,
            userVerification: "required",
            allowCredentials: [{ type: "public-key", transports: ["internal"] }],
            timeout: 60000,
        };

        // 1️⃣ Prompt fingerprint authentication
        const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });

        // 2️⃣ Send authentication data to backend
        const response = await fetch(`${SERVER_URL}/voteWithFingerprint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                credentialId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
                candidateName: candidateName,
            }),
        });

        const result = await response.json();
        if (result.success) {
            alert("✅ Vote cast successfully!");
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error voting with fingerprint:", error);
        alert("❌ Voting failed. Ensure fingerprint authentication is enabled.");
    }
};
