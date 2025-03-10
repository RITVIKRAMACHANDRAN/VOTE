const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { ethers, Contract, Wallet } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));

// ✅ Ethereum Provider & Contract
const provider = new ethers.getDefaultProvider(process.env.RPC_URL);
const wallet = new Wallet("0x1024cf6d29d6011dd7d7b05532ecc58e96249d6e85776de70dc7f89fe723daac", provider);
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts", "contracts", "EVoting.sol", "EVoting.json"), "utf-8")).abi;
const contract = new Contract("0xcC9B2454F7bcC009b2696Af9De6D745307aB3A49", contractABI, wallet);

// ✅ Storage for Fingerprints
const fingerprintStorage = {};

// ✅ API Test Route
app.get("/api", (req, res) => {
    res.json({ message: "API is working" });
});

// ✅ Register Fingerprint for Voter
// ✅ Register Voter with Fingerprint
app.post("/api/registerVoter", async (req, res) => {
    const { voterId, fingerprint } = req.body;
    if (!voterId || !fingerprint) {
      return res.status(400).json({ error: "Voter ID and Fingerprint are required." });
    }
  
    fingerprintDB[voterId] = fingerprint;
    return res.json({ message: "Voter registered successfully with fingerprint." });
  });

// ✅ Authenticate Voter with Fingerprint
app.post("/authenticateFingerprint", async (req, res) => {
    const { voterId, fingerprint } = req.body;
    if (!voterId || !fingerprint) {
      return res.status(400).json({ error: "Voter ID and Fingerprint are required." });
    }
  
    if (fingerprintDB[voterId] === fingerprint) {
      return res.json({ message: "Authentication successful." });
    } else {
      return res.status(401).json({ error: "Invalid fingerprint." });
    }
  });
  
// ✅ Add Candidate
app.post("/addCandidate", async (req, res) => {
    try {
        const { candidateName } = req.body;
        if (!candidateName) {
          return res.status(400).json({ error: "Candidate name is required." });
        }
    
        const tx = await contract.addCandidate(candidateName);
        await tx.wait();
    
        res.json({ message: "Candidate added successfully." });
      } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ error: "Failed to add candidate." });
      }
    });
// ✅ Fetch Candidate List
app.get("/getCandidates", async (req, res) => {
    try {
        const candidateCount = await contract.getCandidateCount();
        let candidates = [];

        for (let i = 0; i < candidateCount; i++) {
            const candidate = await contract.getCandidate(i);
            candidates.push(candidate);
        }

        res.json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
});

// ✅ Vote for a Candidate
// ✅ Vote with Fingerprint Authentication
app.post("/vote", async (req, res) => {
    try {
        const { voterId, fingerprint, candidateIndex } = req.body;
    
        if (!voterId || !fingerprint || candidateIndex === undefined) {
          return res.status(400).json({ error: "Voter ID, fingerprint, and candidate index are required." });
        }
    
        if (fingerprintDB[voterId] !== fingerprint) {
          return res.status(401).json({ error: "Fingerprint authentication failed." });
        }
    
        const tx = await contract.vote(candidateIndex);
        await tx.wait();
    
        res.json({ message: "Vote cast successfully." });
      } catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ error: "Failed to cast vote." });
      }
    });
// ✅ API: Get Vote Count for Each Candidate
app.get("/getVoteCounts", async (req, res) => {
    try {
      const candidates = await contract.getCandidate();
      const voteCounts = [];
  
      for (let i = 0; i < candidates.length; i++) {
        const votes = await contract.getVoteCount(i);
        voteCounts.push({ candidate: candidates[i], votes: votes.toString() });
      }
  
      res.json(voteCounts);
    } catch (error) {
      console.error("Error fetching vote counts:", error);
      res.status(500).json({ error: "Failed to retrieve vote counts." });
    }
  });
  


// ✅ Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
