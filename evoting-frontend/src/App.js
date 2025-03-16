import React, { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import { startRegistration } from "@simplewebauthn/browser";

const SERVER_URL = ""; // Replace with Railway backend URL
const ADMIN_ADDRESS ="0x0ea217414c1fac69e4cbf49f3d8277df69a76b7d"; 

function App() {
    const [walletAddress, setWalletAddress] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [adminMode, setAdminMode] = useState(false);
    const [message, setMessage] = useState("");
    const [voterName, setVoterName] = useState("");
    const [votingStarted, setVotingStarted] = useState(false);

    
 
    useEffect(() => {
        const checkVotingTime = async () => {
            try {
                const response = await axios.get(`${SERVER_URL}/votingTime`);
                const { startTime, endTime } = response.data;
                const currentTime = Math.floor(Date.now() / 1000);
                setVotingStarted(currentTime >= startTime);
            } catch (error) {
                console.error("❌ Error fetching voting time:", error);
            }
        };
        checkVotingTime();
    }, []);
    useEffect(() => {
        console.log("🔍 Wallet Address:", `"${walletAddress}"`);
        console.log("🔍 Admin Address (from env):", `"${ADMIN_ADDRESS}"`);
    
        if (walletAddress && ADMIN_ADDRESS && walletAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            console.log("✅ Admin Mode Activated");
            setAdminMode(true);
        } else {
            console.log("❌ Not Admin");
            setAdminMode(false);
        }
    }, [walletAddress]);
    
    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                console.log("✅ MetaMask Connected:", accounts[0]); // Debugging log
                setWalletAddress(accounts[0]); // ✅ Update state
            } catch (error) {
                console.error("❌ MetaMask connection failed:", error);
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
    const registerVoter = async () => {
        if (votingStarted) {
            alert("Voter registration is closed!");
            return;
        }
    
        try {
            console.log("🚀 Starting WebAuthn Registration...");
    
            // ✅ Generate a proper challenge
            const challengeBuffer = new Uint8Array(32);
            window.crypto.getRandomValues(challengeBuffer);
    
            // ✅ Generate a unique user ID
            const userIdBuffer = new Uint8Array(16);
            window.crypto.getRandomValues(userIdBuffer);
    
            const credential = await startRegistration({
                publicKey: {
                    challenge: challengeBuffer.buffer, // ✅ Ensure challenge is passed correctly
                    rp: { name: "E-Voting System" },
                    user: {
                        id: userIdBuffer.buffer, // ✅ Unique user ID in ArrayBuffer format
                        name: voterName || "Anonymous Voter",
                        displayName: voterName || "Anonymous Voter"
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: { userVerification: "preferred" },
                    timeout: 60000 // 60 seconds timeout
                }
            });
    
            console.log("✅ WebAuthn Registration Successful:", credential);
    
            const uuid = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    
            console.log("🔍 Generated UUID:", uuid);
    
            const response = await axios.post(`/registerVoter`, { voterName, uuid });
    
            console.log("✅ Voter Registered Successfully:", response.data);
            setMessage(response.data.message);
        } catch (error) {
            console.error("❌ WebAuthn Error:", error);
            setMessage("❌ Error registering voter");
        }
    };
    

    const vote = async () => {
        try {
            const credential = await startRegistration({ publicKey: { challenge: new Uint8Array(32) } });
            const uuid = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));

            const response = await axios.post(`${SERVER_URL}/vote`, { uuid, candidateName });
            setMessage(response.data.message);
        } catch (error) {
            setMessage("❌ Error casting vote");
        }
    };


 return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h1>E-Voting System</h1>
            <button onClick={connectMetaMask}>Connect MetaMask</button>
            <p>Connected Wallet: {walletAddress || "Not Connected"}</p>

            {/* Admin Panel for Adding Candidates */}
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

            
<div>
                <h2>Register as Voter</h2>
                <input type="text" placeholder="Voter Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} />
                <button onClick={registerVoter}>Register with Fingerprint</button>
            </div>

            <div>
                <h2>Vote</h2>
                <input type="text" placeholder="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
                <button onClick={vote}>Vote</button>
            </div>

            <h3>{message}</h3>
        </div>
    );
};
export default App;