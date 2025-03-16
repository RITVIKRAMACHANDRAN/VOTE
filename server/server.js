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
app.get("/votingTime", async (req, res) => {
    try {
        // ✅ Connect to blockchain
        const provider = new ethers.getDefaultProvider(process.env.ETHEREUM_RPC_URL);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

        // ✅ Fetch voting times from the blockchain
        const [startTime, endTime] = await contract.getVotingTimes();

        res.json({ startTime: Number(startTime), endTime: Number(endTime) });
    } catch (error) {
        console.error("❌ Error fetching voting time:", error);
        res.status(500).json({ error: "Server error" });
    }
});

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

app.post("/vote", async (req, res) => {
    try {
        const { uuid, candidate } = req.body;
        if (!uuid || !candidate) return res.status(400).json({ error: "UUID and candidate name required" });

        // ✅ Fetch voter using UUID from MongoDB
        const voter = await Voter.findOne({ uuid });
        if (!voter) return res.status(400).json({ error: "Voter not registered" });

        // ✅ Ensure voter hasn't already voted
        if (voter.hasVoted) return res.status(400).json({ error: "Voter has already voted" });

        // ✅ Connect to blockchain
        const provider = new ethers.getDefaultProvider(process.env.ETHEREUM_RPC_URL);
        const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);

        // ✅ Submit vote to blockchain
        const tx = await contract.vote(uuid, candidate);
        await tx.wait();

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
