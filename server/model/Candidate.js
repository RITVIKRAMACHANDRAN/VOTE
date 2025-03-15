const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
    candidateName: { type: String, required: true, unique: true },
    voteCount: { type: Number, default: 0 } // Stores vote count
});

const Candidate = mongoose.model("Candidate", CandidateSchema);
module.exports = Candidate;
