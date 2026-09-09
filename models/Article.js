const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' }) }
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  author: { type: String, required: true },
  image: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric', year: 'numeric' }) },
  likes: { type: Number, default: 0 },
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);