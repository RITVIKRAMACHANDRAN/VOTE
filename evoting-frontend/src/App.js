import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";
import { registerFingerprint, voteWithFingerprint } from "./auth";

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
            <button onClick={() => registerFingerprint(voterName, setFingerprintID, setMessage)}>Register</button>

            <p>{message}</p>
            </div>


             {/* ✅ Vote with Fingerprint */}
             <h2>Vote with Fingerprint</h2>
            <input type="text" placeholder="Your Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} />
            <input type="text" placeholder="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
            <button onClick={() => voteWithFingerprint(voterName, candidateName, setMessage)}>Vote</button>

            <p>{message}</p>
        </div>
    );
}

export default App;
