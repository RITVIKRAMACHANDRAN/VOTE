const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    voterName: { type: String, required: true },
    fingerprintId: { type: String }, // Optional: Store the WebAuthn fingerprint ID
    voterId: { type: String, required: true, unique: true }, // Unique identifier for each voter
    hasVoted: { type: Boolean, default: false },
    candidateName: { type: String, required: true }, // Store the candidate the voter voted for
});

module.exports = mongoose.model("Voter", VoterSchema);