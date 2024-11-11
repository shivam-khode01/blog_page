const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/blogDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Post model
const postSchema = new mongoose.Schema({
  content: String,
  author: String,
  approved: { type: Boolean, default: false }, 
});

const Post = mongoose.model('Post', postSchema);

// Routes
app.get('/', async (req, res) => {
  try {
    const approvedPosts = await Post.find({ approved: true });
    res.render('index', { posts: approvedPosts });
  } catch (error) {
    res.status(500).render('error', { message: 'Error fetching posts', error });
  }
});

// 1. Post a new blog/quote (User)
app.get('/post', (req, res) => {
  res.render('newPost');
});

app.post('/post', async (req, res) => {
  try {
    const { content, author } = req.body;
    const newPost = new Post({ content, author });
    await newPost.save();
    res.redirect('/');
    console.log("Data saved to DB");
  } catch (error) {
    res.status(500).render('error', { message: 'Error creating post', error });
  }
});

// 2. Get all posts (Admin only)
app.get('/admin/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.render('adminPosts', { posts });
  } catch (error) {
    res.status(500).render('error', { message: 'Error fetching posts', error });
  }
});

// 3. Approve/Disapprove a post (Admin)
app.post('/admin/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const approved = req.body.approved === 'true';
    
    if (approved) {
      // Approve post
      await Post.findByIdAndUpdate(postId, { approved: true });
    } else {
      // Disapprove and delete post
      await Post.findByIdAndDelete(postId);
    }
    
    res.redirect('/admin/posts');
  } catch (error) {
    res.status(500).render('error', { message: 'Error updating post', error });
  }
});

// 4. Get only approved posts for main site
app.get('/posts', async (req, res) => {
  try {
    const approvedPosts = await Post.find({ approved: true });
    res.json(approvedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching approved posts', error });
  }
});

// Server setup
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
