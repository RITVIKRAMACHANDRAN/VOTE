require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ethers } = require("ethers");
const Voter = require("./model/Voter");
const Candidate = require("./model/Candidate");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");



const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Ethereum Setup
const provider = new ethers.getDefaultProvider(process.env.ETHEREUM_RPC_URL);
const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contractJSON = require("./artifacts/contracts/EVoting.sol/EVoting.json"); // ✅ Load JSON
const contractABI = contractJSON.abi; // ✅ Extract ABI

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractABI, // ✅ Pass only the ABI
    signer
);

app.post("/addCandidate", async (req, res) => {
    try {
        const { name, walletAddress } = req.body;
        if (!name) return res.status(400).json({ error: "Candidate name is required" });

        const existingCandidate = await Candidate.findOne({ candidateName: name });
        if (existingCandidate) return res.status(400).json({ error: "Candidate already exists" });

        const newCandidate = new Candidate({ candidateName: name, voteCount: 0 });
        await newCandidate.save();

        res.json({ message: "✅ Candidate added successfully!" });
    } catch (error) {
        console.error("❌ Error adding candidate:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/registerVoter", async (req, res) => {
    try {
        const { voterName, deviceID } = req.body;
        if (!voterName || !deviceID) return res.status(400).json({ error: "Voter name and device ID are required" });

        // ✅ Check if deviceID has already been used
        const existingVoter = await Voter.findOne({ deviceID });
        if (existingVoter) return res.status(400).json({ error: "Device already registered" });

        // ✅ Connect to blockchain
        const provider = new ethers.getDefaultProvider(process.env.ETHEREUM_RPC_URL);
        const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);

        // ✅ Register voter on blockchain
        const tx = await contract.registerVoter(voterName, deviceID);
        const receipt = await tx.wait();

        // ✅ Extract UUID from contract event logs
        const event = receipt.logs.find(log => log.topics[0] === contract.interface.getEventTopic("VoterRegistered"));
        const uuid = contract.interface.decodeEventLog("VoterRegistered", event.data).uuid;

        console.log("✅ UUID Generated On-Chain:", uuid);

        // ✅ Save voter in MongoDB
        const newVoter = new Voter({ voterName, deviceID, uuid, hasVoted: false });
        await newVoter.save();

        res.json({ message: "✅ Voter registered successfully!", uuid });
    } catch (error) {
        console.error("❌ Error registering voter:", error);
        res.status(500).json({ error: "Server error" });
    }
});
let votingStartTime = null;
let votingEndTime = null;

app.post("/startVoting", async (req, res) => {
    try {
        const { duration } = req.body;
        if (!duration) return res.status(400).json({ error: "Duration required" });

        votingStartTime = Math.floor(Date.now() / 1000);
        votingEndTime = votingStartTime + duration;

        console.log("🚀 Voting started successfully:", { votingStartTime, votingEndTime });
        res.json({ message: "✅ Voting started successfully!", votingStartTime, votingEndTime });
    } catch (error) {
        console.error("❌ Error starting voting:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.get("/votingTime", async (req, res) => {
    console.log("📡 Fetching Voting Time:", { startTime: votingStartTime, endTime: votingEndTime });

    if (!votingStartTime || !votingEndTime) {
        return res.json({ startTime: null, endTime: null });
    }
    res.json({ startTime: votingStartTime, endTime: votingEndTime });
});


// ✅ Stop Voting API
app.post("/stopVoting", async (req, res) => {
    try {
        votingStartTime = null;
        votingEndTime = null;

        console.log("🚨 Voting stopped!");
        res.json({ message: "✅ Voting stopped successfully!" });
    } catch (error) {
        console.error("❌ Error stopping voting:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/vote", async (req, res) => {
    try {
        const { uuid, candidate } = req.body;
        if (!uuid || !candidate) return res.status(400).json({ error: "UUID and candidate name required" });

        // ✅ Fetch voter using UUID from MongoDB
        const voter = await Voter.findOne({ uuid });
        if (!voter) return res.status(400).json({ error: "Voter not registered" });

        // ✅ Ensure voter hasn't already voted
        if (voter.hasVoted) return res.status(400).json({ error: "Voter has already voted" });

        // ✅ Check voting time from backend (not blockchain)
        const currentTime = Math.floor(Date.now() / 1000);
        if (!votingStartTime || !votingEndTime || currentTime < votingStartTime || currentTime > votingEndTime) {
            return res.status(400).json({ error: "❌ Voting is not active!" });
        }

        // ✅ Fetch candidate and update vote count
        const candidateDoc = await Candidate.findOne({ name: candidate });
        if (!candidateDoc) return res.status(400).json({ error: "Candidate not found" });

        candidateDoc.voteCount += 1; // ✅ Increment vote count
        await candidateDoc.save();

        // ✅ Mark voter as having voted
        voter.hasVoted = true;
        await voter.save();

        res.json({ message: "✅ Vote cast successfully!" });
    } catch (error) {
        console.error("❌ Error casting vote:", error);
        res.status(500).json({ error: "Server error" });
    }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
