import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";

const SERVER_URL = ""; 

function App() {
    const [candidates, setCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState("");
    const [fingerprint, setFingerprint] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState("");
    const [walletAddress, setWalletAddress] = useState(null);
    const [voteMethod, setVoteMethod] = useState("");
    const [adminAddress, setAdminAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [candidateName, setCandidateName] = useState("");

    const handleAdminLogin = () => {
        localStorage.setItem("adminPrivateKey", privateKey);
        alert("Admin authenticated!");
        window.location.reload();
    };
    
    useEffect(() => {
        fetchCandidates();
        fetchAdminAddress();
    }, []);

    // 🔹 Fetch Admin Address from Backend
    const fetchAdminAddress = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/getAdminAddress`);
            setAdminAddress(response.data.admin);
        } catch (error) {
            console.error("Error fetching admin address:", error);
        }
    };

    // 🔹 Fetch Candidates from Backend
    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/getCandidates`);
            setCandidates(response.data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    // 🔹 Connect MetaMask
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
            alert("MetaMask is not installed. Please install MetaMask and try again.");
        }
    };

    // 🔹 Admin - Add Candidate
    const addCandidate = async () => {
        try {
            const privateKey = localStorage.getItem("adminPrivateKey");
            if (!privateKey) {
                alert("Please authenticate as admin first.");
                return;
            }
            if (!candidateName) {
                alert("Enter candidate name.");
                return;
            }

            const response = await axios.post(`${SERVER_URL}/addCandidate`, { name: candidateName, privateKey });
            alert(response.data.message);
            setCandidateName(""); // ✅ Clear input after adding
        } catch (error) {
            alert("Error adding candidate");
        }
    };
    // 🔹 Register Voter with Fingerprint
    const registerVoterWithFingerprint = async () => {
            try {
                const publicKeyCredentialCreationOptions = {
                    challenge: new Uint8Array(32), // Generate a random challenge
                    rp: { name: "E-Voting System" },
                    user: {
                        id: new Uint8Array(16), // Random user ID
                        name: walletAddress || "anonymous",
                        displayName: "Voter"
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ES256 Algorithm
                    authenticatorSelection: { authenticatorAttachment: "platform" }, // Use built-in sensors
                    timeout: 60000,
                    attestation: "direct"
                };
        
                // Call WebAuthn API for fingerprint registration
                const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
        
                if (!credential) {
                    alert("Fingerprint registration failed.");
                    return;
                }
        
                // Convert fingerprint data to Base64
                const fingerprintData = btoa(JSON.stringify(credential));
        
                // Send fingerprint data to the backend
                await axios.post(`${SERVER_URL}/registerFingerprint`, { fingerprint: fingerprintData });
                alert("Fingerprint registered successfully!");
            } catch (error) {
                console.error("Error registering fingerprint:", error);
                alert("Fingerprint registration failed. Make sure you are using a supported device.");
            }
        };
        
    // 🔹 Capture Fingerprint for Voting
    const captureFingerprint = async () => {
        try {
            const response = await axios.post(`${SERVER_URL}/captureFingerprint`);
            return response.data.fingerprint;
        } catch (error) {
            console.error("Error capturing fingerprint:", error);
            alert("Fingerprint capture failed!");
            return null;
        }
    };

    // 🔹 Vote using Fingerprint or MetaMask
    const vote = async (candidateId) => {
        try {
            if (voteMethod === "fingerprint") {
                const publicKeyCredentialRequestOptions = {
                    challenge: new Uint8Array(32), // Generate a random challenge
                    timeout: 60000,
                    userVerification: "required"
                };
    
                // Call WebAuthn API for authentication
                const credential = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });
    
                if (!credential) {
                    alert("Fingerprint authentication failed.");
                    return;
                }
    
                const fingerprintData = btoa(JSON.stringify(credential));
    
                // Send fingerprint vote to the backend
                const response = await axios.post(`${SERVER_URL}/voteWithFingerprint`, { fingerprint: fingerprintData, candidateId });
                alert(response.data.message);
            } 
            
            else if (voteMethod === "metamask") {
                if (!walletAddress) {
                    alert("Connect MetaMask first");
                    return;
                }
    
                await axios.post(`${SERVER_URL}/voteWithMetaMask`, { walletAddress, candidateId });
                alert("Vote cast successfully using MetaMask!");
            }
        } catch (error) {
            console.error("Error voting:", error);
            alert("Voting failed. Please try again.");
        }
    };
    
    return (
        <div>
            <h1>E-Voting System</h1>

            {/* 🔹 MetaMask Connection */}
            <div>
                <h2>MetaMask Connection</h2>
                <button onClick={connectMetaMask}>
                    {walletAddress ? `Connected: ${walletAddress}` : "Connect MetaMask"}
                </button>
            </div>

            {/* 🔹 Admin Panel - Add Candidates */}
            {walletAddress?.toLowerCase() === adminAddress && (
    <div>
        <h2>Admin Panel</h2>
        <input type="text" value={newCandidate} onChange={(e) => setNewCandidate(e.target.value)} placeholder="Candidate Name" />
        <button onClick={addCandidate}>Add Candidate</button>
    </div>
)}


            {/* 🔹 Voter Registration - Fingerprint */}
            <div>
                <h2>Voter Registration</h2>
                {isRegistered ? (
                    <p>✅ Registered with Fingerprint: {fingerprint}</p>
                ) : (
                    <button onClick={registerVoterWithFingerprint}>Register as Voter (Fingerprint)</button>
                )}
            </div>

            {/* 🔹 Candidate List */}
            <div>
                <h2>Candidate List</h2>
                {Array.isArray(candidates) && candidates.length > 0 ? (
                    candidates.map((candidate) => (
                        <div key={candidate._id} style={{ border: "1px solid black", padding: "10px", margin: "5px" }}>
                            <p><strong>{candidate.name}</strong></p>
                            <button onClick={() => setSelectedCandidate(candidate._id)}>Select</button>
                        </div>
                    ))
                ) : (
                    <p>No candidates available.</p>
                )}
            </div>

            {/* 🔹 Voting Options (Appears only after candidate selection) */}
            {selectedCandidate && (
                <div>
                    <h3>Vote Using:</h3>
                    <select value={voteMethod} onChange={(e) => setVoteMethod(e.target.value)}>
                        <option value="">Select Voting Method</option>
                        <option value="fingerprint">Fingerprint</option>
                        <option value="metamask">MetaMask</option>
                    </select>

                    {/* 🔹 Vote Button (Only appears after selecting a method) */}
                    {voteMethod && <button onClick={vote}>Vote</button>}
                </div>
            )}
        </div>
    );
}

export default App;
