import axios from "axios";

const SERVER_URL = ""; // ✅ Replace with your Railway backend URL
export const registerWithFingerprint = async () => {
    try {
        const voterName = prompt("Enter your name for fingerprint registration:");
        if (!voterName) {
            alert("❌ Please enter a valid name.");
            return;
        }

        // 1️⃣ WebAuthn Registration Options
         const publicKeyOptions = {
            challenge: new Uint8Array(32), // Random challenge
            rp: { name: "E-Voting System", id: window.location.hostname }, // Relying Party (your site)
            user: {
                id: new Uint8Array(16), // Random User ID
                name: voterName,
                displayName: voterName,
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 }, // ES256
                { type: "public-key", alg: -257 }, // RS256
            ],
            authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
            timeout: 60000,
            attestation: "direct",
        };

        // 2️⃣ Create WebAuthn Credential
        const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId))); // Convert to base64

        // 3️⃣ Send to Backend for Storage
        const response = await fetch(`${SERVER_URL}/registerFingerprint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voterName, credentialId }),
        });

        const result = await response.json();
        if (result.success) {
            alert("✅ Fingerprint registered successfully!");
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        alert("❌ Registration failed. Ensure your device supports WebAuthn.");
    }
};

export const voteWithFingerprint = async () => {
    try {
        const candidateName = document.getElementById("candidateInput").value; // Get candidate name
        if (!candidateName) {
            alert("❌ Please enter a candidate name.");
            return;
        }

        // 1️⃣ WebAuthn Authentication (Fingerprint Scan)
        const publicKeyOptions = {
            challenge: new Uint8Array(32), // Random challenge
            rpId: window.location.hostname,
            userVerification: "required",
            allowCredentials: [{ type: "public-key", transports: ["internal"] }], // Mobile Fingerprint
            timeout: 60000,
        };

        const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))); // Convert to base64

        // 2️⃣ Send Credential ID & Candidate Name to Backend
        const response = await fetch(`${SERVER_URL}/voteWithFingerprint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credentialId, candidateName }),
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
