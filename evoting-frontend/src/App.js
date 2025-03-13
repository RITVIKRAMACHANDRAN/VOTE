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

  
    // ✅ Register Fingerprint (WebAuthn)
    const registerFingerprint = async () => {
        try {
            const publicKey = {
                challenge: new Uint8Array(32),
                rp: { name: "E-Voting System" },
                user: { id: new Uint8Array(16), name: voterName, displayName: voterName },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },  // ES256 ✅
                    { type: "public-key", alg: -257 } // RS256 ✅
                ],
                authenticatorSelection: { userVerification: "preferred" }
            };

            const fingerprintData = await navigator.credentials.create({ publicKey });

            const fingerprintID = btoa(String.fromCharCode(...new Uint8Array(fingerprintData.rawId)));
            setFingerprintID(fingerprintID);

            await axios.post(`${SERVER_URL}/registerFingerprint`, { voterName, fingerprint: fingerprintID });
            setMessage("✅ Fingerprint registered successfully!");
        } catch (error) {
            setMessage("❌ Error registering fingerprint");
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
 
    // ✅ WebAuthn: Vote with Fingerprint
    const voteWithFingerprint = async () => {
        try {
            const publicKey = {
                challenge: new Uint8Array(32),
                allowCredentials: [{ id: new Uint8Array(atob(fingerprintID)), type: "public-key" }],
                timeout: 60000,
            };

            const assertion = await navigator.credentials.get({ publicKey });

            if (assertion) {
                const response = await axios.post(`${SERVER_URL}/voteWithFingerprint`, { fingerprint: fingerprintID, candidateName });
                setMessage(response.data.message);
            } else {
                setMessage("❌ Fingerprint verification failed!");
            }
        } catch (error) {
            console.error("Error voting with fingerprint:", error);
            setMessage("❌ Error voting!");
        }
    };

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
                <h3>Register Fingerprint</h3>
                <input type="text" placeholder="Enter Your Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} />
                <button onClick={registerFingerprint}>Register</button>
            </div>


            {/* ✅ Voting Section */}
            <h2>Vote</h2>
            <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter Candidate Name"
            />
            <button onClick={() => setVoteMethod("fingerprint")}>Vote with Fingerprint</button>
        </div>
    );
}

export default App;
