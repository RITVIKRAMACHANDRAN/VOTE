const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
  voterName: { type: String, required: true },
  fingerprintId: { type: String, required: true },
  hasVoted: { type: Boolean, default: false },
  candidateName: { type: String, default: null },
});

module.exports = mongoose.model("Voter", voterSchema);
