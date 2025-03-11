const mongoose = require("mongoose");

// ✅ Define the Candidate Schema
const CandidateSchema = new mongoose.Schema({
    name: String,
    votes: { type: Number, default: 0 }
});

// ✅ Export the Candidate model
module.exports = mongoose.model("Candidate", CandidateSchema);
