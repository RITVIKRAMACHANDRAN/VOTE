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
const router = express.Router();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(router);
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
const isAdmin = (req, res, next) => {
    const { privateKey } = req.body;
    if (privateKey !== 0x0EA217414c1FaC69E4CBf49F3d8277dF69a76b7D){
        return res.status(403).json({ error: "Unauthorized: You are not the admin" });
    }
    next();
};
// 🔹 Add Candidate (Admin only)

router.post("/addCandidate", async (req, res) => {
    try {
        const { name, privateKey } = req.body;

        if (!name || !privateKey) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Get the wallet address from the private key
        let wallet;
        try {
            wallet = new ethers.Wallet(privateKey);
        } catch (error) {
            return res.status(400).json({ message: "Invalid private key." });
        }

        const derivedAddress = wallet.address;

        // Check if the derived address matches the admin address
        if (derivedAddress.toLowerCase() !== privatekey.toLowerCase()) {
            return res.status(403).json({ message: "Unauthorized: You are not the admin." });
        }

        // Save candidate in MongoDB
        const newCandidate = new Candidate({ name, voteCount: 0 });
        await newCandidate.save();

        res.status(201).json({ message: "Candidate added successfully!" });
    } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

module.exports = router;

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
app.post("/registerVoterWithFingerprint", async (req, res) => {
    try {
        const { fingerprint } = req.body;
        const newVoter = new Voter({ fingerprint, hasVoted: false });
        await newVoter.save();
        res.json({ message: "Fingerprint registered successfully!" });
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        res.status(500).json({ error: "Fingerprint registration failed." });
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

        if (!voter) {
            return res.status(400).json({ error: "Fingerprint not found. Please register first." });
        }
        if (voter.hasVoted) {
            return res.status(400).json({ error: "You have already voted!" });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(400).json({ error: "Invalid candidate." });
        }

        // Mark voter as voted
        voter.hasVoted = true;
        await voter.save();

        // Increase candidate vote count
        candidate.voteCount += 1;
        await candidate.save();

        res.json({ message: "Vote cast successfully with fingerprint!" });
    } catch (error) {
        console.error("Error voting with fingerprint:", error);
        res.status(500).json({ error: "Fingerprint voting failed." });
    }
});

app.post("/voteWithMetaMask", async (req, res) => {
    try {
        const { walletAddress, candidateId } = req.body;
        const voter = await Voter.findOne({ walletAddress });

        if (!voter) {
            return res.status(400).json({ error: "Wallet address not registered. Please register first." });
        }
        if (voter.hasVoted) {
            return res.status(400).json({ error: "You have already voted!" });
        }

        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(400).json({ error: "Invalid candidate." });
        }

        // Mark voter as voted
        voter.hasVoted = true;
        await voter.save();

        // Increase candidate vote count
        candidate.voteCount += 1;
        await candidate.save();

        res.json({ message: "Vote cast successfully using MetaMask!" });
    } catch (error) {
        console.error("Error voting with MetaMask:", error);
        res.status(500).json({ error: "MetaMask voting failed." });
    }
});


app.listen(port, () => console.log(`✅ Server running on port ${port}`));
