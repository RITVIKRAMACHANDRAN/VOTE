import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";

const SERVER_URL = ""; // ✅ Replace with deployed backend URL
const CONTRACT_ADDRESS = "0xcC9B2454F7bcC009b2696Af9De6D745307aB3A49"; // ✅ Replace with deployed contract
const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69a76b7D"; // ✅ Replace with Admin's MetaMask Address

function App() {
    const [candidates, setCandidates] = useState([]);
    const [candidateName, setCandidateName] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [selectedCandidate, setSelectedCandidate] = useState("");
    const [voteMethod, setVoteMethod] = useState("");
    const [fingerprintCredential, setFingerprintCredential] = useState(null);

    useEffect(() => {
        fetchCandidates();
    }, []);

    // ✅ Fetch Candidates (Fixes e.map error by ensuring candidates is an array)
    const fetchCandidates = async () => {
        try {
            const response = await axios.get("/getCandidates", { headers: { "Cache-Control": "no-cache" } });
            setCandidates(response.data);
        } catch (error) {
            console.error("Error fetching candidates:", error);
        }
    };
    
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
            alert("MetaMask is not installed. Please install MetaMask.");
        }
    };

    // ✅ Register Fingerprint using WebAuthn API
    const registerFingerprint = async () => {
        try {
            if (!window.PublicKeyCredential) {
                alert("WebAuthn is not supported in this browser.");
                return;
            }

            const publicKey = {
                challenge: new Uint8Array(32),
                rp: { name: "E-Voting System" },
                user: {
                    id: new Uint8Array(16),
                    name: walletAddress || "anonymous",
                    displayName: walletAddress || "anonymous",
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000,
                attestation: "direct",
            };

            const credential = await navigator.credentials.create({ publicKey });
            setFingerprintCredential(credential);

            await axios.post(`${SERVER_URL}/registerVoterWithFingerprint`, {
                fingerprintCredential: JSON.stringify(credential),
                walletAddress
            });

            alert("Fingerprint registered successfully!");
        } catch (error) {
            console.error("Error registering fingerprint:", error);
            alert("Fingerprint registration failed.");
        }
    };

    // ✅ Authenticate & Vote Using Fingerprint
    const voteWithFingerprint = async () => {
        try {
            if (!window.PublicKeyCredential) {
                alert("WebAuthn is not supported in this browser.");
                return;
            }

            if (!selectedCandidate) {
                alert("Select a candidate first!");
                return;
            }

            const publicKey = {
                challenge: new Uint8Array(32),
                allowCredentials: [{ id: fingerprintCredential.rawId, type: "public-key" }],
                timeout: 60000,
            };

            const assertion = await navigator.credentials.get({ publicKey });

            await axios.post(`${SERVER_URL}/voteWithFingerprint`, {
                fingerprintCredential: JSON.stringify(assertion),
                candidateId: selectedCandidate
            });

            alert("Vote cast successfully with fingerprint!");
        } catch (error) {
            console.error("Error voting with fingerprint:", error);
            alert("Fingerprint authentication failed.");
        }
    };

    // ✅ Vote Using MetaMask
    const voteWithMetaMask = async () => {
        try {
            if (!selectedCandidate) {
                alert("Select a candidate first!");
                return;
            }

            if (!walletAddress) {
                alert("Connect MetaMask first");
                return;
            }

            await axios.post(`${SERVER_URL}/voteWithMetaMask`, { walletAddress, candidateId: selectedCandidate });
            alert("Vote cast successfully using MetaMask!");
        } catch (error) {
            console.error("Error voting with MetaMask:", error);
            alert("Voting failed.");
        }
    };

    return (
        <div>
            <h1>E-Voting System</h1>
            <button onClick={connectMetaMask}>Connect MetaMask</button>

            {/* ✅ Admin Panel (Only for Admin) */}
            {walletAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase() && (
                <div>
                    <h2>Admin Panel</h2>
                    <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Candidate Name" />
                    <button onClick={async () => {
                        try {
                            await axios.post(`${SERVER_URL}/addCandidate`, { name: candidateName, walletAddress });
                            alert("Candidate added successfully!");
                            setCandidateName("");
                            fetchCandidates();
                        } catch (error) {
                            console.error("Error adding candidate:", error);
                        }
                    }}>Add Candidate</button>
                </div>
            )}

            {/* ✅ Voter Registration */}
            <div>
                <h2>Voter Registration</h2>
                <button onClick={registerFingerprint}>Register Fingerprint</button>
            </div>

            {/* ✅ Voting Section */}
            <div>
                <h2>Vote</h2>
                <label>Select Voting Method:</label>
                <select value={voteMethod} onChange={(e) => setVoteMethod(e.target.value)}>
                    <option value="">Choose</option>
                    <option value="fingerprint">Fingerprint</option>
                    <option value="metamask">MetaMask</option>
                </select>

                {/* ✅ Display Candidates */}
                <h3>Choose Candidate:</h3>
                {candidates.length > 0 ? (
                    <ul>
                        {candidates.map((candidate) => (
                            <li key={candidate._id}>
                                <input
                                    type="radio"
                                    name="candidate"
                                    value={candidate._id}
                                    onChange={(e) => setSelectedCandidate(e.target.value)}
                                />
                                {candidate.name} - Votes: {candidate.voteCount}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No candidates available.</p>
                )}

                {/* ✅ Vote Buttons */}
                <button onClick={voteMethod === "fingerprint" ? voteWithFingerprint : voteWithMetaMask} disabled={!selectedCandidate || !voteMethod}>
                    Vote
                </button>
            </div>
        </div>
    );
}

export default App;