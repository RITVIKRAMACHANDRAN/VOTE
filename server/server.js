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
const adminMetaMask = "0x0EA217414c1FaC69E4CBf49F3d8277dF69a76b7D";

// ✅ Ensure Admin is Authorized
const isAdmin = (req, res, next) => {
    const { walletAddress } = req.body;
    if (walletAddress.toLowerCase() !== adminMetaMask.toLowerCase()) {
        return res.status(403).json({ error: "Unauthorized: Only admin can perform this action." });
    }
    next();
};
// ✅ Add Candidate
app.post("/addCandidate", isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Candidate name is required." });

        const newCandidate = new Candidate({ name, voteCount: 0 });
        await newCandidate.save();

        res.status(201).json({ message: "Candidate added successfully!" });
    } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// ✅ Get Candidates
app.get("/getCandidates", async (req, res) => {
    try {
        const candidates = await Candidate.find();
        res.json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Register Voter with Fingerprint
app.post("/registerVoterWithFingerprint", async (req, res) => {
    try {
        const { fingerprint, walletAddress } = req.body;
        if (!fingerprint) return res.status(400).json({ error: "Fingerprint is required." });

        const newVoter = new Voter({ fingerprint, walletAddress, hasVoted: false });
        await newVoter.save();

        res.json({ message: "Fingerprint registered successfully!" });
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        res.status(500).json({ error: "Fingerprint registration failed." });
    }
});

// ✅ Vote Using Fingerprint
app.post("/voteWithFingerprint", async (req, res) => {
    try {
        const { fingerprint, candidateId } = req.body;
        const voter = await Voter.findOne({ fingerprint });

        if (!voter) return res.status(400).json({ error: "Fingerprint not registered." });
        if (voter.hasVoted) return res.status(400).json({ error: "You have already voted!" });

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) return res.status(400).json({ error: "Invalid candidate." });

        voter.hasVoted = true;
        await voter.save();

        candidate.voteCount += 1;
        await candidate.save();

        res.json({ message: "Vote cast successfully with fingerprint!" });
    } catch (error) {
        console.error("Error voting:", error);
        res.status(500).json({ error: "Voting failed." });
    }
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));