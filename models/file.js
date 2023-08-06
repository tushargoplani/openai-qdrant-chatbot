const { model, Schema, default: mongoose } = require("mongoose");
const fileSchema = Schema(
  {
    appId: { type: mongoose.Schema.Types.ObjectId, ref: 'apps' },
    originalFile: { type: String, default: '' },
    embeddings: { type: Object, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model("files", fileSchema);
