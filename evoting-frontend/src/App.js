import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers"; // ✅ Correct for ethers v6
import { web3 } from "web3";


const SERVER_URL = ""; // Change to Railway URL if deployed
const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69a76b7D"; // Replace with actual admin address

const App = () => {
    const [voterName, setVoterName] = useState("");
    const [deviceID, setDeviceID] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [newCandidate, setNewCandidate] = useState("");
    const [uuid, setUUID] = useState(localStorage.getItem("voterUUID") || null);
    const [message, setMessage] = useState("");
    const [adminMode, setAdminMode] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");

    // ✅ Check if user is Admin
    useEffect(() => {
        if (walletAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            setAdminMode(true);
        } else {
            setAdminMode(false);
        }
    }, [walletAddress]);
    
    const connectMetaMask = async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setWalletAddress(accounts[0]);
          } else {
            alert("Please install Metamask!");
          }
        };
    
    // ✅ WebAuthn Device ID
    const getDeviceID = async () => {
        try {
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: "eVoting System" },
                    user: {
                        id: new Uint8Array(16),
                        name: voterName,
                        displayName: voterName
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }]
                }
            });
            return btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        } catch (error) {
            console.error("❌ WebAuthn Error:", error);
            return null;
        }
    };

    // ✅ Register Voter
    const registerVoter = async () => {
        try {
            if (!voterName) return alert("Enter voter name first!");
            const deviceID = await getDeviceID();
            if (!deviceID) return alert("❌ WebAuthn failed!");

            const response = await axios.post(`${SERVER_URL}/registerVoter`, { voterName, deviceID });

            if (response.data.uuid) {
                localStorage.setItem("voterUUID", response.data.uuid);
                setUUID(response.data.uuid);
                setMessage("✅ Voter registered successfully!");
            }
        } catch (error) {
            console.error("❌ Error registering voter:", error);
            setMessage("❌ Error registering voter.");
        }
    };

    // ✅ Cast Vote (Manual Candidate Entry)
    const vote = async () => {
        try {
            if (!candidateName) return alert("Enter a candidate's name first!");
            if (!uuid) return alert("❌ UUID not found. Please register first.");

            await axios.post(`${SERVER_URL}/vote`, { uuid, candidate: candidateName });

            alert("✅ Vote cast successfully!");
        } catch (error) {
            alert("❌ Error casting vote.");
        }
    };

    // ✅ Verify Votes
    const verifyVotes = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/verifyVotes`);
            if (response.data.verified) {
                alert("✅ Election results are valid!");
            } else {
                alert("⚠️ Election results have been tampered with!");
            }
        } catch (error) {
            alert("❌ Error verifying votes.");
        }
    };

    // ✅ Add Candidate (Admin Only)
    const addCandidate = async () => {
        try {
            if (!newCandidate) return alert("Enter candidate name first!");
            await axios.post(`${SERVER_URL}/addCandidate`, { name: newCandidate });
            alert("✅ Candidate added successfully!");
            setNewCandidate("");
        } catch (error) {
            alert("❌ Error adding candidate.");
        }
    };

    return (
        <div>
            <h1>🗳 eVoting System</h1>

            <button onClick={connectMetaMask}>
                {walletAddress ? `Connected: ${walletAddress}` : "Connect MetaMask"}
            </button>

            {adminMode && (
                <div>
                    <h2>🔑 Admin Panel</h2>
                    <input
                        type="text"
                        placeholder="Enter Candidate Name"
                        value={newCandidate}
                        onChange={(e) => setNewCandidate(e.target.value)}
                    />
                    <button onClick={addCandidate}>Add Candidate</button>
                    <br />
                    <button onClick={verifyVotes}>Verify Election Results</button>
                </div>
            )}

            <h2>📝 Register as a Voter</h2>
            <input type="text" placeholder="Enter Name" value={voterName} onChange={(e) => setVoterName(e.target.value)} />
            <button onClick={registerVoter}>Register</button>
            <p>{message}</p>

            <h2>🗳 Vote for a Candidate</h2>
            <input
                type="text"
                placeholder="Enter Candidate Name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
            />
            <button onClick={vote}>Vote</button>
        </div>
    );
};

export default App;
