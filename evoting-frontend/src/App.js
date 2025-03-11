import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";

const SERVER_URL = "";  


function App() {
    const [candidates, setCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState("");
    const [fingerprint, setFingerprint] = useState("");
    const [selectedCandidate, setSelectedCandidate] = useState("");
    const [walletAddress, setWalletAddress] = useState(null);
    const [voteMethod, setVoteMethod] = useState("fingerprint"); // "fingerprint" or "metamask"
    const [adminAddress, setAdminAddress] = useState(""); // Admin's MetaMask address

    useEffect(() => {
        fetchCandidates();
        fetchAdminAddress();
    }, []);

    // 🔹 **Fetch Admin Address from Backend**
    const fetchAdminAddress = async () => {
        try {
            const response = await axios.get("${SERVER_URL}/getAdminAddress"); // API to get admin's wallet address
            setAdminAddress(response.data.admin);
        } catch (error) {
            console.error("Error fetching admin address:", error);
        }
    };

    // 🔹 **Fetch Candidates from Backend**
    const fetchCandidates = async () => {
        try {
            const response = await axios.get("${SERVER_URL}/getCandidates"); // API to get stored candidates
            setCandidates(response.data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };

    // 🔹 **Connect MetaMask**
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

    // 🔹 **Admin - Add Candidate**
    const addCandidate = async () => {
        if (!newCandidate) return alert("Enter candidate name");
        if (walletAddress !== adminAddress) {
            return alert("Only the admin can add candidates.");
        }
        try {
            await axios.post("${SERVER_URL}/addCandidate", { name: newCandidate, adminAddress: walletAddress });
            setNewCandidate("");
            fetchCandidates();
            alert("Candidate added successfully");
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    };

    // 🔹 **Register Voter with Fingerprint**
    const registerVoter = async () => {
        if (!fingerprint) return alert("Enter fingerprint data");
        try {
            await axios.post("${SERVER_URL}/registerVoter", { fingerprint });
            setFingerprint("");
            alert("Voter registered successfully");
        } catch (error) {
            console.error("Error registering voter:", error);
        }
    };

    // 🔹 **Vote using Fingerprint or MetaMask**
    const vote = async () => {
        if (!selectedCandidate) return alert("Select a candidate to vote");

        if (voteMethod === "fingerprint") {
            if (!fingerprint) return alert("Enter your fingerprint");
            try {
                await axios.post("${SERVER_URL}/vote", { fingerprint, candidateId: selectedCandidate });
                alert("Vote cast successfully");
                fetchCandidates();
            } catch (error) {
                console.error("Error casting vote:", error);
            }
        } else if (voteMethod === "metamask") {
            if (!walletAddress) return alert("Connect MetaMask first");
            try {
                await axios.post("${SERVER_URL}/voteWithMetaMask", { walletAddress, candidateId: selectedCandidate });
                alert("Vote cast successfully using MetaMask!");
                fetchCandidates();
            } catch (error) {
                console.error("Error casting vote with MetaMask:", error);
            }
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
            {walletAddress === adminAddress && (
                <div>
                    <h2>Admin Panel</h2>
                    <input
                        type="text"
                        value={newCandidate}
                        onChange={(e) => setNewCandidate(e.target.value)}
                        placeholder="Candidate Name"
                    />
                    <button onClick={addCandidate}>Add Candidate</button>
                </div>
            )}

            {/* 🔹 Voter Registration - Fingerprint */}
            <div>
                <h2>Voter Registration</h2>
                <input
                    type="text"
                    value={fingerprint}
                    onChange={(e) => setFingerprint(e.target.value)}
                    placeholder="Your Fingerprint"
                />
                <button onClick={registerVoter}>Register as Voter</button>
            </div>

            {/* 🔹 Candidate List & Voting */}
            <div>
                <h2>Candidate List & Voting</h2>
                Array.isArray(candidates) ? {candidates.map((candidate) => (
                    <div key={candidate._id}>
                        <p>{candidate.name} - Votes: {candidate.voteCount}</p>
                        <button onClick={() => setSelectedCandidate(candidate._id)}>Select</button>
                    </div>
                ))} : []
                
                {/* 🔹 Voting Options */}
                <div>
                    <h3>Vote Using:</h3>
                    <select value={voteMethod} onChange={(e) => setVoteMethod(e.target.value)}>
                        <option value="fingerprint">Fingerprint</option>
                        <option value="metamask">MetaMask</option>
                    </select>
                </div>

                {/* 🔹 Vote Button */}
                <input
                    type="text"
                    value={fingerprint}
                    onChange={(e) => setFingerprint(e.target.value)}
                    placeholder="Your Fingerprint (if using)"
                    disabled={voteMethod === "metamask"} // Disable if using MetaMask
                />
                <button onClick={vote}>Vote</button>
            </div>
        </div>
    );
}

export default App;
