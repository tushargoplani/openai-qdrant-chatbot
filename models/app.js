const { model, Schema, default: mongoose } = require("mongoose");
const appSchema = Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    fileIds: { type: Array, default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("apps", appSchema);
