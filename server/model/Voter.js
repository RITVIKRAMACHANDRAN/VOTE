const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    voterName: { type: String, required: true },
    uuid: { type: String, required: true, unique: true }, // Prevents duplicate registration
    hasVoted: { type: Boolean, default: false } // Tracks if the voter has voted
});

const Voter = mongoose.model("Voter", VoterSchema);
module.exports = Voter;
