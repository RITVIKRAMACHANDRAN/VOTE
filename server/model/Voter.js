const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    voterName: { type: String, required: true },
    fingerprintId: { type: String, required: true, unique: true }, // Ensure each fingerprintId is unique
    hasVoted: { type: Boolean, default: false },
});

module.exports = mongoose.model("Voter", VoterSchema);