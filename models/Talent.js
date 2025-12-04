const mongoose = require('mongoose');

const TalentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    organization: { type: String },
    skills: { type: [String], default: [] },
    passions: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    availability: { type: String },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Talent', TalentSchema);
