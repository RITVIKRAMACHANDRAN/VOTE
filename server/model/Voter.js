const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
    voterName: { type: String, required: true },
    deviceID: { type: String, required: true, unique: true }, // ✅ Prevent duplicate registrations
    uuid: { type: String, required: true, unique: true }, // ✅ Ensure uniqueness
    hasVoted: { type: Boolean, default: false } // ✅ Track voting status
});

module.exports = mongoose.model("Voter", VoterSchema);
