import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";


const SERVER_URL = ""; // Replace with Railway backend URL
const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69A76B7D"; // Admin MetaMask Address

function App() {
    const [walletAddress, setWalletAddress] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [selectedCandidate, setSelectedCandidate] = useState("");
    const [voteMethod, setVoteMethod] = useState("");
    const [fingerprintData, setFingerprintData] = useState(null);
    const [adminMode, setAdminMode] = useState(false);
    const [fingerprintCredential, setFingerprintCredential] = useState(null);
    const [message, setMessage] = useState("");
    const [voterName, setVoterName] = useState("");
    const [fingerprint, setFingerprint] = useState("");
    const [fingerprintID, setFingerprintID] = useState("");

    useEffect(() => {
        if (walletAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            setAdminMode(true);
        } else {
            setAdminMode(false);
        }
    }, [walletAddress]);

    // ✅ Connect MetaMask
    const connectMetaMask = async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await web3.eth.getAccounts();
                setWalletAddress(accounts[0]);
                alert(`Connected: ${accounts[0]}`);
            } catch (error) {
                console.error("MetaMask connection failed:", error);
            }
        } else {
            alert("MetaMask is not installed.");
        }
    };

    // ✅ Add Candidate (Admin Only)
    const addCandidate = async () => {
        try {
            if (!candidateName) return alert("Enter a candidate's name first!");

            await axios.post(`${SERVER_URL}/addCandidate`, {
                name: candidateName,
                walletAddress
            });

            alert("Candidate added successfully!");
        } catch (error) {
            alert("Error adding candidate.");
        }
    };
    const registerWithFingerprint = async () => {
        try {
            const voterName = prompt("Enter your name for fingerprint registration:");
            if (!voterName) {
                alert("❌ Please enter a valid name.");
                return;
            }
    
            // 1️⃣ Setup WebAuthn for Registration
            const publicKeyOptions = {
                challenge: new Uint8Array(32),
                rp: { name: "E-Voting System", id: window.location.hostname },
                user: {
                    id: new Uint8Array(16),
                    name: voterName,
                    displayName: voterName,
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256
                authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "preferred" },
                timeout: 60000,
                attestation: "direct",
            };
    
            // 2️⃣ Request Fingerprint Registration
            const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    
            // 3️⃣ Send Fingerprint Data to Backend
            const response = await fetch(`${SERVER_URL}/registerFingerprint`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ voterName, credentialId }),
            });
    
            const result = await response.json();
            if (result.success) {
                alert(result.message);
    
                // 4️⃣ Check voter status
                checkVoterStatus(credentialId);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error registering fingerprint:", error);
            alert("❌ Registration failed. Ensure your device supports WebAuthn.");
        }
    };
    
    // Function to check voter status and allow voting if not voted
    const checkVoterStatus = async (credentialId) => {
        try {
            const response = await fetch(`${SERVER_URL}/checkVoterStatus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credentialId }),
            });
    
            const result = await response.json();
            if (result.success) {
                if (result.hasVoted) {
                    alert("❌ You have already voted!");
                } else {
                    voteWithFingerprint(credentialId);
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error checking voter status:", error);
            alert("❌ Server error while checking voter status.");
        }
    };
    
    // Function to vote using fingerprint
    const voteWithFingerprint = async (credentialId) => {
        try {
            const candidateName = prompt("Enter the candidate name to vote for:");
            if (!candidateName) {
                alert("❌ Please enter a valid candidate name.");
                return;
            }
    
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
    
    // UI Button
    <button onClick={registerWithFingerprint}>Register Fingerprint (or Vote if already registered)</button>
    

return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>E-Voting System</h1>
            <button onClick={connectMetaMask}>Connect MetaMask</button>
            <p>Connected Wallet: {walletAddress || "Not Connected"}</p>

            {/* ✅ Admin Panel for Adding Candidates */}
            {adminMode && (
                <div>
                    <h2>Admin Panel</h2>
                    <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Enter Candidate Name"
                    />
                    <button onClick={addCandidate}>Add Candidate</button>
                </div>
            )}
            
            {/* ✅ Voter Fingerprint Registration */}
            <div>
            <h2>Register Fingerprint</h2>
            <input type="text" placeholder="Your Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} />
            <button onClick={() => registerWithFingerprint(voterName, setFingerprintID, setMessage)}>Register</button>

            <p>{message}</p>
            </div>


             {/* ✅ Vote with Fingerprint */}
             <h3>Vote with Fingerprint</h3>
    <input type="text" id="candidateInput" placeholder="Enter Candidate Name" />
    <button onClick={voteWithFingerprint}>Vote with Fingerprint</button>

            <p>{message}</p>
        </div>
    );
}

export default App;
