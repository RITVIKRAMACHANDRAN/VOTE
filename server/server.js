const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Contract, Wallet, ethers } = require("ethers");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path")

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
const mongoURI = "mongodb+srv://ritviksreesai:MonkeyDluffy1@evoting.pfp3d.mongodb.net/";
mongoose.connect(mongoURI, {})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Define Mongoose schemas
const CandidateSchema = new mongoose.Schema({ name: String, voteCount: Number });
const VoterSchema = new mongoose.Schema({ fingerprint: String, hasVoted: Boolean });

const Candidate = mongoose.model("Candidate", CandidateSchema);
const Voter = mongoose.model("Voter", VoterSchema);

app.use(cors());
app.use(bodyParser.json());

// ✅ Ethereum Provider & Contract
const provider = new ethers.getDefaultProvider(process.env.RPC_URL);
const wallet = new Wallet("0x1024cf6d29d6011dd7d7b05532ecc58e96249d6e85776de70dc7f89fe723daac", provider);
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts", "contracts", "EVoting.sol", "EVoting.json"), "utf-8")).abi;
const contract = new Contract("0xcC9B2454F7bcC009b2696Af9De6D745307aB3A49", contractABI, wallet);
// Add a new candidate (Backend storage)
app.post("/addCandidate", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Candidate name is required" });

    try {
        const newCandidate = new Candidate({ name, voteCount: 0 });
        await newCandidate.save();
        res.status(201).json({ message: "Candidate added successfully" });
    } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get candidate list
app.get("/getCandidates", async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Register voter with fingerprint
app.post("/registerVoter", async (req, res) => {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.status(400).json({ error: "Fingerprint is required" });

    try {
        const existingVoter = await Voter.findOne({ fingerprint });
        if (existingVoter) return res.status(400).json({ error: "Voter already registered" });

        const newVoter = new Voter({ fingerprint, hasVoted: false });
        await newVoter.save();
        res.status(201).json({ message: "Voter registered successfully" });
    } catch (error) {
        console.error("Error registering voter:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Authenticate fingerprint
app.post("/authenticateVoter", async (req, res) => {
    const { fingerprint } = req.body;
    if (!fingerprint) return res.status(400).json({ error: "Fingerprint is required" });

    try {
        const voter = await Voter.findOne({ fingerprint });
        if (!voter) return res.status(404).json({ error: "Voter not found" });

        res.json({ message: "Fingerprint authenticated successfully" });
    } catch (error) {
        console.error("Error authenticating voter:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Vote function with fingerprint authentication
app.post("/vote", async (req, res) => {
    const { fingerprint, candidateId } = req.body;
    if (!fingerprint || !candidateId) return res.status(400).json({ error: "Fingerprint and Candidate ID are required" });

    try {
        const voter = await Voter.findOne({ fingerprint });
        if (!voter) return res.status(404).json({ error: "Voter not found" });
        if (voter.hasVoted) return res.status(400).json({ error: "Voter has already voted" });

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(404).json({ error: "Candidate not found" });

        // Update vote count in database
        candidate.voteCount += 1;
        await candidate.save();

        // Mark voter as voted
        voter.hasVoted = true;
        await voter.save();

        res.json({ message: "Vote cast successfully" });

    } catch (error) {
        console.error("Error casting vote:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});