const Voter = require("./model/Voter");

async function registerFingerprint(voterName, fingerprint) {
    if (!voterName || !fingerprint) {
        throw new Error("Voter name and fingerprint required!");
    }

    const existingVoter = await Voter.findOne({ fingerprint });
    if (existingVoter) {
        throw new Error("Fingerprint already registered!");
    }

    const newVoter = new Voter({ voterName, fingerprint, hasVoted: false });
    await newVoter.save();
    return "Fingerprint registered successfully!";
}

async function authenticateFingerprint(fingerprint) {
    if (!fingerprint) {
        throw new Error("Fingerprint is required for authentication!");
    }

    const voter = await Voter.findOne({ fingerprint });
    if (!voter) {
        throw new Error("Fingerprint not registered!");
    }

    if (voter.hasVoted) {
        throw new Error("You have already voted!");
    }

    return voter; // Return voter object if authentication succeeds
}

module.exports = { registerFingerprint, authenticateFingerprint };
