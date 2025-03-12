const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    fingerprint: { type: String, required: true, unique: true }, // Unique fingerprint
    walletAddress: { type: String, unique: true }, // Optional MetaMask Address
    hasVoted: { type: Boolean, default: false }, // Prevents double voting
});

module.exports = mongoose.model("Voter", VoterSchema);
