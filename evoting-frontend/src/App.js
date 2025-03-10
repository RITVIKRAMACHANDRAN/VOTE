import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

const SERVER_URL = "/api"; 

function App() {
    const [candidates, setCandidates] = useState([]);
    const [voteCounts, setVoteCounts] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState("");
    const [account, setAccount] = useState(null);
    const [fingerprintData, setFingerprintData] = useState(null);
    const [adminPanel, setAdminPanel] = useState(false);

    // ✅ Metamask Connection
    const connectMetamask = async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            setAccount(accounts[0]);
        } else {
            alert("Please install MetaMask.");
        }
    };

    // ✅ Fetch Candidates
    const fetchCandidates = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/getCandidates`);
            setCandidates(response.data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    // ✅ Fetch Vote Counts
    const fetchVoteCounts = async () => {
        try {
            const response = await axios.get(`${SERVER_URL}/getVoteCounts`);
            setVoteCounts(response.data);
        } catch (error) {
            console.error("Error fetching vote counts:", error);
        }
    };

    // ✅ Admin: Add Candidate
    const addCandidate = async (name) => {
        try {
            await axios.post(`${SERVER_URL}/addCandidate`, { name });
            alert("Candidate added successfully!");
            fetchCandidates();
        } catch (error) {
            console.error("Error adding candidate:", error);
            alert("Failed to add candidate.");
        }
    };

    // ✅ Admin: Register Voter with Fingerprint
    const registerVoterWithFingerprint = async () => {
        try {
            const publicKey = await navigator.credentials.create({ publicKey: {/* WebAuthn Config */} });
            setFingerprintData(publicKey);
            await axios.post(`${SERVER_URL}/registerVoter`, { publicKey, account });
            alert("Voter registered successfully!");
        } catch (error) {
            console.error("Error registering voter:", error);
            alert("Fingerprint registration failed.");
        }
    };

    // ✅ Voter: Authenticate Fingerprint & Vote
    const authenticateAndVote = async () => {
        if (!selectedCandidate) {
            alert("Please select a candidate.");
            return;
        }
        try {
            const assertion = await navigator.credentials.get({ publicKey: {/* WebAuthn Config */} });
            await axios.post(`${SERVER_URL}/verifyFingerprintVote`, { assertion, candidateIndex: selectedCandidate });
            alert("Vote cast successfully!");
            fetchVoteCounts();
        } catch (error) {
            console.error("Error voting:", error);
            alert("Fingerprint authentication failed.");
        }
    };

    useEffect(() => {
        fetchCandidates();
        fetchVoteCounts();
    }, []);

    return (
        <div>
            <h1>E-Voting System</h1>

            {/* ✅ Metamask Connection */}
            <button onClick={connectMetamask}>
                {account ? `Connected: ${account}` : "Connect Metamask"}
            </button>

            {/* ✅ Admin Panel */}
            {adminPanel && (
                <div>
                    <h2>Admin Panel</h2>
                    <input type="text" placeholder="Candidate Name" id="candidateName" />
                    <button onClick={() => addCandidate(document.getElementById("candidateName").value)}>Add Candidate</button>
                    
                    <h3>Register Voter</h3>
                    <button onClick={registerVoterWithFingerprint}>Register Voter (Fingerprint)</button>
                </div>
            )}

            {/* ✅ Voter Panel */}
            <h2>Voting Panel</h2>
            <select onChange={(e) => setSelectedCandidate(e.target.value)}>
                <option value="">Select Candidate</option>
                {candidates.map((candidate, index) => (
                    <option key={index} value={index}>{candidate}</option>
                ))}
            </select>
            <button onClick={authenticateAndVote}>Vote with Fingerprint</button>

            {/* ✅ Vote Count */}
            <h2>Vote Counts</h2>
            <ul>
                {voteCounts.map((entry, index) => (
                    <li key={index}>{entry.candidate}: {entry.votes} votes</li>
                ))}
            </ul>
        </div>
    );
}

export default App;
