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
        if (!newCandidate) return alert("Enter candidate name");
        if (walletAddress !== adminAddress) {
            return alert("Only the admin can add candidates.");
        }
        try {
            await axios.post(`${SERVER_URL}/addCandidate`, { name: newCandidate, adminAddress: walletAddress });
            setNewCandidate("");
            fetchCandidates();
            alert("Candidate added successfully");
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    };

    // 🔹 Register Voter with Fingerprint
    const registerVoterWithFingerprint = async () => {
        try {
            const response = await axios.post(`${SERVER_URL}/registerVoterFingerprint`);
            setFingerprint(response.data.fingerprint);
            setIsRegistered(true);
            alert("Voter registered successfully with fingerprint!");
        } catch (error) {
            console.error("Error registering voter:", error);
            alert("Voter registration failed!");
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
    const vote = async () => {
        if (!selectedCandidate) {
            alert("Please select a candidate first.");
            return;
        }

        try {
            if (voteMethod === "fingerprint") {
                const capturedFingerprint = await captureFingerprint();
                if (!capturedFingerprint) return;

                const response = await axios.post(`${SERVER_URL}/voteUsingFingerprint`, {
                    fingerprint: capturedFingerprint,
                    candidateId: selectedCandidate
                });

                alert(response.data.message);
            } else if (voteMethod === "metamask") {
                if (!walletAddress) {
                    alert("Connect MetaMask first");
                    return;
                }
                await axios.post(`${SERVER_URL}/voteWithMetaMask`, { walletAddress, candidateId: selectedCandidate });
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
