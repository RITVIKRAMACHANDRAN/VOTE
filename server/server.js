require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Voter = require("./model/Voter");
const Candidate = require("./model/Candidate");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const app = express();
app.use(express.json());
app.use(cors());

const ADMIN_ADDRESS = "0x0EA217414c1FaC69E4CBf49F3d8277dF69a76b7D" ; // Replace with actual admin wallet address

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Middleware to Check Admin Authentication (MetaMask Address)
const checkAdmin = (req, res, next) => {
    const { walletAddress } = req.body;
    if (!walletAddress || walletAddress.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
        return res.status(403).json({ error: "❌ Unauthorized: Only Admin Allowed" });
    }
    next();
};

// ✅ Add Candidate (Admin Only)
app.post("/addCandidate", checkAdmin, async (req, res) => {
    try {
        const { name } = req.body;
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
        if (!voterName || !deviceID) return res.status(400).json({ error: "Voter name and device ID required" });

        // ✅ Check if this device has already registered
        const existingVoter = await Voter.findOne({ deviceID });
        if (existingVoter) return res.status(400).json({ error: "This device has already registered a voter" });

        // ✅ Generate a stable UUID based on device ID
        const uuid = crypto.createHash("sha256").update(deviceID).digest("hex");

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
        const { uuid, deviceID, candidate } = req.body;
        if (!uuid || !deviceID || !candidate) return res.status(400).json({ error: "UUID, Device ID, and candidate required" });

        // ✅ Check if this device has already voted
        const voter = await Voter.findOne({ deviceID });
        if (!voter) return res.status(400).json({ error: "Voter not registered" });

        if (voter.hasVoted) return res.status(400).json({ error: "This device has already voted" });

        // ✅ Proceed with voting
        const candidateDoc = await Candidate.findOne({ candidateName: candidate });
        if (!candidateDoc) return res.status(400).json({ error: "Candidate not found" });

        candidateDoc.voteCount += 1;
        await candidateDoc.save();

        voter.hasVoted = true;
        await voter.save();

        res.json({ message: "✅ Vote cast successfully!" });
    } catch (error) {
        console.error("❌ Error casting vote:", error);
        res.status(500).json({ error: "Server error" });
    }
});
// ✅ Generate SHA-256 Hash of Votes (For Verification)
const generateVoteHash = async () => {
    const votes = await Candidate.find();
    const voteData = JSON.stringify(votes);

    return crypto.createHash("sha256").update(voteData).digest("hex");
};

// ✅ Store Vote Hash After Election (Admin Only)
app.post("/storeVoteHash", checkAdmin, async (req, res) => {
    try {
        const voteHash = await generateVoteHash();
        await HashStore.create({ hash: voteHash, timestamp: new Date() });

        res.json({ message: "✅ Vote hash stored!", hash: voteHash });
    } catch (error) {
        console.error("❌ Error storing vote hash:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Verify Election Results
app.get("/verifyVotes", async (req, res) => {
    try {
        const storedHashEntry = await HashStore.findOne().sort({ timestamp: -1 });
        if (!storedHashEntry) return res.status(400).json({ error: "No hash found!" });

        const computedHash = await generateVoteHash();
        res.json({ verified: storedHashEntry.hash === computedHash, storedHash: storedHashEntry.hash, computedHash });
    } catch (error) {
        console.error("❌ Error verifying votes:", error);
        res.status(500).json({ error: "Server error" });
    }
});

const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
