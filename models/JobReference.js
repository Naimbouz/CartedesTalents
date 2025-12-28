const mongoose = require('mongoose');

const JobReferenceSchema = new mongoose.Schema({
    filename: String,
    text: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('JobReference', JobReferenceSchema);
