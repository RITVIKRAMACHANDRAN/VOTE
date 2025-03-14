const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    voterName: { type: String, required: true },
    fingerprintId: { type: String, required: true }, // No unique constraint
    hasVoted: { type: Boolean, default: false },
});

module.exports = mongoose.model("Voter", VoterSchema);