const mongoose = require("mongoose");

const HashStoreSchema = new mongoose.Schema({
    hash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HashStore", HashStoreSchema);
