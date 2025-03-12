import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";

const SERVER_URL = ""; // ✅ Replace with your Railway backend URL
const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69A76B7D"; // ✅ Set Admin MetaMask Address

function App() {
    const [walletAddress, setWalletAddress] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [voteMethod, setVoteMethod] = useState("");
    const [fingerprintCredential, setFingerprintCredential] = useState(null);
    const [adminMode, setAdminMode] = useState(false);

    // ✅ Check if Admin
    useEffect(() => {
        if (walletAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
            setAdminMode(true);
        } else {
            setAdminMode(false);
        }
    }, [walletAddress]);

    // ✅ Connect to MetaMask
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

    // ✅ Register Fingerprint
    const registerFingerprint = async () => {
        try {
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    user: { id: new Uint8Array(16), name: walletAddress },
                },
            });

            setFingerprintCredential(credential);

            await axios.post(`${SERVER_URL}/registerVoterWithFingerprint`, {
                fingerprint: JSON.stringify(credential),
                walletAddress,
            });

            alert("Fingerprint registered successfully!");
        } catch (error) {
            alert("Fingerprint registration failed.");
        }
    };

    // ✅ Add Candidate (Admin Only)
    const addCandidate = async () => {
        if (!candidateName) return alert("Enter a candidate's name first!");
        try {
            const response = await axios.post(`${SERVER_URL}/addCandidate`, {
                name: candidateName,
                walletAddress,
            });
            alert(response.data.message);
            setCandidateName(""); // Clear input
        } catch (error) {
            alert("Error adding candidate.");
        }
    };

    // ✅ Vote
    const vote = async () => {
        try {
            if (!candidateName) return alert("Enter a candidate's name first!");

            const data = { candidateName, method: voteMethod };

            if (voteMethod === "fingerprint") {
                const assertion = await navigator.credentials.get({ publicKey: { challenge: new Uint8Array(32) } });
                data.fingerprint = JSON.stringify(assertion);
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

            {/* ✅ Admin Panel - Only Visible to Admin */}
            {adminMode && (
                <div style={{ border: "1px solid black", padding: "10px", marginTop: "20px" }}>
                    <h2>Admin Panel</h2>
                    <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Enter Candidate Name" />
                    <button onClick={addCandidate}>Add Candidate</button>
                </div>
            )}

            {/* ✅ Voter Panel */}
            <div style={{ border: "1px solid black", padding: "10px", marginTop: "20px" }}>
                <h2>Vote</h2>
                <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Enter Candidate Name" />
                <div>
                    <button onClick={() => setVoteMethod("fingerprint")}>Vote with Fingerprint</button>
                    <button onClick={() => setVoteMethod("metamask")}>Vote with MetaMask</button>
                </div>
                <button onClick={vote} style={{ marginTop: "10px" }}>Submit Vote</button>
            </div>

            {/* ✅ Fingerprint Registration */}
            <div style={{ marginTop: "20px" }}>
                <h2>Register Fingerprint</h2>
                <button onClick={registerFingerprint}>Register Fingerprint</button>
            </div>
        </div>
    );
}

export default App;
