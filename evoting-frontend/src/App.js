import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";

const SERVER_URL = ""; // Replace with Railway backend URL
const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69A76B7D"; // Admin MetaMask Address

function App() {
    const [walletAddress, setWalletAddress] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [voteMethod, setVoteMethod] = useState("");
    const [fingerprintData, setFingerprintData] = useState(null);
    const [adminMode, setAdminMode] = useState(false);

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

    // ✅ Register Fingerprint Before Voting
    const registerFingerprint = async () => {
        try {
            const assertion = await navigator.credentials.create({
                publicKey: { challenge: new Uint8Array(32) }
            });

            setFingerprintData(JSON.stringify(assertion));

            await axios.post(`${SERVER_URL}/registerVoterWithFingerprint`, {
                fingerprint: JSON.stringify(assertion),
                walletAddress
            });

            alert("Fingerprint registered successfully!");
        } catch (error) {
            alert("Fingerprint registration failed.");
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

    // ✅ Vote with Fingerprint or MetaMask
    const vote = async () => {
        try {
            if (!candidateName) return alert("Enter a candidate's name first!");

            const data = { candidateName, method: voteMethod };

            if (voteMethod === "fingerprint") {
                data.fingerprint = fingerprintData;
            } else if (voteMethod === "metamask") {
                data.walletAddress = walletAddress;
            }

            await axios.post(`${SERVER_URL}/vote`, data);
            alert("Vote cast successfully!");
        } catch (error) {
            alert("Voting failed.");
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

            {/* ✅ Voting Section */}
            <h2>Vote</h2>
            <button onClick={registerFingerprint}>Register Fingerprint</button>
            <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter Candidate Name"
            />
            <button onClick={() => setVoteMethod("fingerprint")}>Vote with Fingerprint</button>
            <button onClick={() => setVoteMethod("metamask")}>Vote with MetaMask</button>
        </div>
    );
}

export default App;
