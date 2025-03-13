const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
  voterName: { type: String, required: true },
  fingerprintId: { type: String, required: true }, // ✅ Ensure this matches the frontend
  hasVoted: { type: Boolean, default: false },
  candidateName: { type: String },
});

const Voter = mongoose.model("Voter", VoterSchema);
module.exports = Voter;
