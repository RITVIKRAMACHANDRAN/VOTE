const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  voterName: { type: String, required: true, unique: true }, // ✅ Ensure only one vote per voterName
  fingerprintId: { type: String, required: true }, 
  hasVoted: { type: Boolean, default: false }, // ✅ Prevents multiple votes
  candidateName: { type: String, default: null },
});

module.exports = mongoose.model("Voter", voterSchema);

