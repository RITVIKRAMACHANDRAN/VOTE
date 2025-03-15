require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ethers } = require("ethers");
const Voter = require("./model/Voter");
const Candidate = require("./model/Candidate");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Ethereum Setup
const provider = new ethers.getDefaultProvider(process.env.ETHEREUM_RPC_URL);
const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, require("./artifacts/contracts/EVoting.sol/EVoting.json"), signer);

app.get("/votingTime", async (req, res) => {
    try {
        const [startTime, endTime] = await contract.getVotingTimes();
        res.json({ startTime: Number(startTime), endTime: Number(endTime) });
    } catch (error) {
        console.error("❌ Error fetching voting time:", error);
        res.status(500).json({ error: "Server error" });
    }
});
app.post("/registerVoter", async (req, res) => {
    try {
        const { voterName, uuid } = req.body;
        if (!voterName || !uuid) return res.status(400).json({ error: "Voter name and UUID required" });

        const existingVoter = await Voter.findOne({ uuid });
        if (existingVoter) return res.status(400).json({ error: "Voter already registered" });

        const newVoter = new Voter({ voterName, uuid, hasVoted: false });
        await newVoter.save();
        res.json({ message: "✅ Voter registered successfully", uuid });
    } catch (error) {
        console.error("❌ Error registering voter:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/vote", async (req, res) => {
    try {
        const { uuid, candidateName } = req.body;
        if (!uuid || !candidateName) return res.status(400).json({ error: "UUID and Candidate Name required" });

        const voter = await Voter.findOne({ uuid });
        if (!voter) return res.status(400).json({ error: "Voter not registered" });

        if (voter.hasVoted) return res.status(400).json({ error: "Voter has already voted" });

        const candidate = await Candidate.findOne({ candidateName });
        if (!candidate) return res.status(400).json({ error: "Candidate not found" });

        // Update vote count in MongoDB
        candidate.voteCount += 1;
        await candidate.save();

        // Mark voter as voted
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
