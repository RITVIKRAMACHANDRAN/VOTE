const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Contract, Wallet, ethers } = require("ethers");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const Candidate = require("./model/Candidate");
const Voter = require("./model/Voter");

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
const mongoURI = process.env.MONGO_URI || "mongodb://mongo:zSkzIGphXSZiujybRiQLDPUWZkKAMeid@yamanote.proxy.rlwy.net:47373"
mongoose.connect(mongoURI, {})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));


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


// ✅ Add Candidate (Only Admin)
app.post("/addCandidate", isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Candidate name is required." });

        const existingCandidate = await Candidate.findOne({ name });
        if (existingCandidate) return res.status(400).json({ message: "Candidate already exists." });

        const newCandidate = new Candidate({ name, voteCount: 0 });
        await newCandidate.save();

        res.status(201).json({ message: "Candidate added successfully!" });
    } catch (error) {
        console.error("Error adding candidate:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});
app.post("/registerFingerprint", async (req, res) => {
    try {
      const { voterName, fingerprintId, candidateName } = req.body;
  
      if (!fingerprintId) {
        return res.status(400).json({ message: "Fingerprint is required" });
      }
  
      // Check if voter is already registered
      let voter = await Voter.findOne({ fingerprintId });
  
      if (voter) {
        if (voter.hasVoted) {
          return res.status(400).json({ message: "Voter has already voted" });
        } else {
          return res.status(200).json({ message: "Voter already registered. Proceed to vote." });
        }
      }
  
      // Register new voter
      const newVoter = new Voter({ voterName, fingerprintId, hasVoted: false });
      await newVoter.save();
  
      // Update candidate vote count
      const candidate = await Candidate.findOne({ name: candidateName });
      if (!candidate) {
        return res.status(400).json({ message: "Candidate not found" });
      }
      candidate.voteCount += 1;
      await candidate.save();
  
      res.status(201).json({ message: "Voter registered & vote cast successfully!" });
  
    } catch (error) {
      console.error("❌ Server error:", error);
      res.status(500).json({ message: "Server error during fingerprint registration" });
    }
  });
  

app.listen(port, () => console.log(`✅ Server running on port ${port}`));