const { model, Schema, default: mongoose } = require("mongoose");
const querySchema = Schema(
  {
    question: { type: String, default: '' },
    answer: { type: String, required: '' },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: 'apps' },
    context: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = model("queries", querySchema);
