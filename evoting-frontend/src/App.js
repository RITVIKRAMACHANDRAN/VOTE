import React, { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import FingerprintJS from "@fingerprintjs/fingerprintjs";


const SERVER_URL = ""; // Replace with Railway backend URL
const ADMIN_ADDRESS ="0x0ea217414c1fac69e4cbf49f3d8277df69a76b7d"; 
const contractJSON = require("./artifacts/contracts/EVoting.sol/EVoting.json"); // ✅ Load JSON
const contractABI = contractJSON.abi;


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
    
                setVotingStarted(currentTime >= startTime && currentTime <= endTime);
            } catch (error) {
                console.error("❌ Error fetching voting time:", error);
            }
        };
    
        checkVotingTime();
        const interval = setInterval(checkVotingTime, 10000); // ✅ Auto-refresh every 10 sec
    
        return () => clearInterval(interval); // ✅ Cleanup on unmount
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

const getDeviceID = async () => {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId; // ✅ Returns a unique device ID
};
const registerVoter = async () => {
    if (votingStarted) {
        alert("Voter registration is closed!");
        return;
    }

    try {
        console.log("🚀 Starting WebAuthn Registration Without Challenge...");

        // ✅ Manually create credentials (Avoids `startRegistration()` challenge error)
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: new Uint8Array(32).fill(0), // ✅ Dummy challenge (ignored)
                rp: { name: "E-Voting System" },
                user: {
                    id: new Uint8Array(16), // ✅ Unique user ID
                    name: voterName || "Anonymous Voter",
                    displayName: voterName || "Anonymous Voter"
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { userVerification: "preferred" },
                timeout: 60000
            }
        });

        console.log("✅ WebAuthn Registration Successful:", credential);

        // ✅ Generate device ID
        const deviceID = await getDeviceID();
        console.log("🔍 Device ID:", deviceID);

        // ✅ Send voter data to backend
        const response = await axios.post(`${SERVER_URL}/registerVoter`, { voterName, deviceID });

        if (response.data.uuid) {
            localStorage.setItem("voterUUID", response.data.uuid); // ✅ Store UUID for future voting
            console.log("✅ Voter Registered with UUID:", response.data.uuid);
            setMessage("✅ Voter registered successfully!");
        } else {
            console.error("❌ Error: UUID not received");
            setMessage("❌ Registration failed. Please try again.");
        }
    } catch (error) {
        console.error("❌ Error registering voter:", error);
        setMessage("❌ Error registering voter");
    }
};

const startVoting = async () => {
    try {
        const duration = 7 * 24 * 60 * 60; // ⏳ 7 days in seconds
        const response = await axios.post(`${SERVER_URL}/startVoting`, { duration });

        if (response.data.message) {
            alert("✅ Voting time started successfully!");
            setVotingStarted(true); // ✅ Update UI state
        }
    } catch (error) {
        console.error("❌ Error starting voting time:", error);
        alert("❌ Failed to start voting time.");
    }
};
const vote = async () => {
    if (!votingStarted) {
        alert("❌ Voting is not active!");
        return;
    }

    try {
        if (!candidateName) return alert("Enter a candidate's name first!");

        const voterUUID = localStorage.getItem("voterUUID");
        if (!voterUUID) return alert("❌ UUID not found. Please register first.");

        console.log("🚀 Casting vote...");

        await axios.post(`${SERVER_URL}/vote`, { uuid: voterUUID, candidate: candidateName });

        alert("✅ Vote cast successfully!");
    } catch (error) {
        alert("❌ Error casting vote.");
    }
};

const stopVoting = async () => {
    try {
        const response = await axios.post(`${SERVER_URL}/stopVoting`);

        if (response.data.message) {
            alert("🚨 Voting stopped successfully!");
            setVotingStarted(false);
        }
    } catch (error) {
        console.error("❌ Error stopping voting:", error);
        alert("❌ Failed to stop voting.");
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
                    <button onClick={startVoting}>Start Voting</button>
                    <button onClick={stopVoting} style={{ backgroundColor: "red", color: "white" }}>
        Stop Voting
    </button>
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