const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Contract, Wallet, ethers } = require("ethers");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "build")));  // Serve frontend

// Serve frontend for all unknown routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Connect to MongoDB
const mongoURI = "mongodb+srv://ritviksreesai:MonkeyDluffy1@evoting.pfp3d.mongodb.net/";
mongoose.connect(mongoURI, {})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Define Mongoose schemas
const CandidateSchema = new mongoose.Schema({ name: String, voteCount: Number });
const VoterSchema = new mongoose.Schema({ fingerprint: String, hasVoted: Boolean, walletAddress: String });

const Candidate = mongoose.model("Candidate", CandidateSchema);
const Voter = mongoose.model("Voter", VoterSchema);

// ✅ Ethereum Provider & Contract
const provider = new ethers.getDefaultProvider(process.env.RPC_URL);
const wallet = new Wallet("0x1024cf6d29d6011dd7d7b05532ecc58e96249d6e85776de70dc7f89fe723daac", provider);
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, "artifacts", "contracts", "EVoting.sol", "EVoting.json"), "utf-8")).abi;
const contract = new Contract("0xcC9B2454F7bcC009b2696Af9De6D745307aB3A49", contractABI, wallet);

// 🔹 Get Admin Address
app.get("/getAdminAddress", async (req, res) => {
    try {
        const admin = await contract.admin();
        res.json({ admin });
    } catch (error) {
        res.status(500).json({ error: "Error fetching admin address" });
    }
});

// 🔹 Add Candidate (Admin only)
app.post("/addCandidate", async (req, res) => {
    try {
        const { name, adminAddress } = req.body;

        const contractAdmin = await contract.admin();
        if (adminAddress.toLowerCase() !== contractAdmin.toLowerCase()) {
            return res.status(403).json({ error: "Only the admin can add candidates" });
        }

        const candidate = new Candidate({ name, voteCount: 0 });
        await candidate.save();
        res.json({ message: "Candidate added successfully" });
    } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Get Candidates List
app.get("/getCandidates", async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Register Voter with Fingerprint
app.post("/registerVoterFingerprint", async (req, res) => {
    try {
        const fingerprintData = "fingerprint_" + Date.now();
        const voter = new Voter({ fingerprint: fingerprintData, hasVoted: false });
        await voter.save();
        res.json({ fingerprint: fingerprintData });
    } catch (error) {
        console.error("Error registering voter:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Authenticate Fingerprint
app.post("/authenticateVoter", async (req, res) => {
    try {
        const { fingerprint } = req.body;
        const voter = await Voter.findOne({ fingerprint });

        if (!voter) return res.status(404).json({ error: "Voter not found" });

        res.json({ message: "Fingerprint authenticated successfully" });
    } catch (error) {
        console.error("Error authenticating voter:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Vote with Fingerprint
app.post("/voteUsingFingerprint", async (req, res) => {
    try {
        const { fingerprint, candidateId } = req.body;
        const voter = await Voter.findOne({ fingerprint });

        if (!voter || voter.hasVoted) {
            return res.status(400).json({ error: "Voter not registered or already voted!" });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(400).json({ error: "Candidate not found!" });

        candidate.voteCount += 1;
        await candidate.save();
        voter.hasVoted = true;
        await voter.save();

        res.json({ message: "Vote cast successfully!" });
    } catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));
