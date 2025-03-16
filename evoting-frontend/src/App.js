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
        const addCandidate = async () => {
            try {
                if (!newCandidate) return alert("Enter candidate name first!");
                if (!walletAddress) return alert("❌ Connect MetaMask first!");
        
                console.log("🔍 Admin Wallet Address:", walletAddress); // Debugging
        
                const response = await axios.post(`${SERVER_URL}/addCandidate`, 
                    { name: newCandidate, walletAddress }
                );
        
                alert("✅ Candidate added successfully!");
                setNewCandidate("");
            } catch (error) {
                console.error("❌ Add Candidate Error:", error.response?.data || error.message);
                alert("❌ Error adding candidate. Check console for details.");
            }
        };
    // ✅ WebAuthn Device ID
    const getDeviceID = async () => {
        try {
            // ✅ WebAuthn for voting experience
            await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: "eVoting System" },
                    user: {
                        id: new Uint8Array(16),
                        name: "testUser", // Placeholder for WebAuthn
                        displayName: "Test User"
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }]
                }
            });
    
            // ✅ Get User-Agent (Browser + OS)
            const userAgent = navigator.userAgent;
    
            // ✅ Get WebGL Renderer (GPU Info)
            const getWebGLInfo = () => {
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                if (!gl) return "WebGL Not Supported";
                const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown GPU";
            };
    
            const webGLRenderer = getWebGLInfo();
    
            // ✅ Get IP Address (Fetch from API)
            const response = await fetch("https://api64.ipify.org?format=json");
            const data = await response.json();
            const ipAddress = data.ip || "Unknown IP";
    
            // ✅ Combine User-Agent + IP + GPU for a stable device ID
            const rawDeviceData = `${userAgent}-${ipAddress}-${webGLRenderer}`;
            const deviceID = btoa(rawDeviceData); // Encode for uniqueness
    
            localStorage.setItem("deviceID", deviceID); // Store it locally to prevent manipulation
            return deviceID;
        } catch (error) {
            console.error("❌ Device ID Error:", error);
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

    const vote = async () => {
        try {
            if (!candidateName) return alert("❌ Enter a candidate name!");
    
            const voterUUID = localStorage.getItem("voterUUID");
            const deviceID = localStorage.getItem("deviceID");
    
            if (!voterUUID || !deviceID) {
                return alert("❌ UUID or Device ID not found. Please register first.");
            }
    
            console.log("📡 Sending Vote Request:", { uuid: voterUUID, deviceID, candidate: candidateName });
    
            const response = await axios.post(`${SERVER_URL}/vote`, {
                uuid: voterUUID,
                deviceID,
                candidate: candidateName
            });
    
            alert(response.data.message);
        } catch (error) {
            console.error("❌ Error casting vote:", error.response?.data || error.message);
            alert("❌ Error casting vote. Check console for details.");
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
