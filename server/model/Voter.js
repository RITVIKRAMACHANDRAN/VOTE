const mongoose = require("mongoose");

const VoterSchema = new mongoose.Schema({
  voterName: { type: String, required: true },
  fingerprintId: { type: String, required: true, unique: true },
  hasVoted: { type: Boolean, default: false },
});

// Ensure fingerprintId cannot be null before saving
VoterSchema.pre("save", function (next) {
  if (!this.fingerprintId) {
    return next(new Error("Fingerprint ID is required"));
  }
  next();
});

module.exports = mongoose.model("Voter", VoterSchema);
