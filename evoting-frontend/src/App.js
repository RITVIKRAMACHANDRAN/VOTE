import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";


const SERVER_URL = ""; // Replace with Railway backend URL
const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69A76B7D"; // Admin MetaMask Address

function App() {
    const [walletAddress, setWalletAddress] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [adminMode, setAdminMode] = useState(false);
    const [message, setMessage] = useState("");
    const [voterName, setVoterName] = useState("");
    
 

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
    const registerAndVote = async () => {
        if (!voterName || !candidateName) {
          alert("Voter name and candidate name are required");
          return;
        }
      
        try {
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge: new Uint8Array(32),
              rp: { name: "E-Voting System" },
              user: {
                id: new Uint8Array(16),
                name: voterName,
                displayName: voterName,
              },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }],
              authenticatorSelection: { authenticatorAttachment: "platform" },
              timeout: 60000,
              attestation: "none",
            },
          });
      
          const fingerprintId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      
          const response = await axios.post(`${SERVER_URL}/registerAndVote`, {
            voterName,
            fingerprintId,
            candidateName,
          });
      
          alert(response.data.message);
        } catch (error) {
          console.error("❌ Error registering fingerprint & voting:", error);
          alert("Error registering fingerprint or casting vote");
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

        {/* Voter Registration and Voting */}
        <div>
            <input
                type="text"
                placeholder="Enter Voter Name"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
            />
        </div>

        <div>
            <input
                type="text"
                placeholder="Enter Candidate Name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
            />
        </div>

        <button onClick={registerAndVote}>Register & Vote with Fingerprint</button>

        {message && <p>{message}</p>}
    </div>
);
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

            {/* Voter Registration and Voting */}
            <div>
                <input
                    type="text"
                    placeholder="Enter Voter Name"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                />
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Enter Candidate Name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                />
            </div>

            <button onClick={registerAndVote}>Register & Vote with Fingerprint</button>

            {message && <p>{message}</p>}
        </div>
    );
}

export default App;