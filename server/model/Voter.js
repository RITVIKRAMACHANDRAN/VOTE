const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    voterName: { type: String, required: true },
    fingerprintIds: [{ type: String, unique: true }], // Array of fingerprintIds
    hasVoted: { type: Boolean, default: false },
});

module.exports = mongoose.model("Voter", VoterSchema);