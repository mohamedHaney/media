import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';

// Function to generate a unique slug for each post
const createUniqueSlug = async (title) => {
  if (!title || typeof title !== "string") {
    return `post-${Date.now()}`; // Fallback for empty or invalid titles
  }

  // Convert title to a slug while preserving Arabic and English text
  let slug = title
    .normalize("NFD") // Normalize Unicode (important for Arabic)
    .replace(/[\u064B-\u065F]/g, "") // Remove Arabic diacritics (optional)
    .replace(/\s+/g, "-") // Convert spaces to dashes
    .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, "") // Keep English, Arabic, numbers, and dashes
    .replace(/-+/g, "-") // Remove multiple consecutive dashes
    .toLowerCase(); // Convert to lowercase

  if (!slug) {
    slug = `post-${Date.now()}`; // Ensure a valid slug if all characters were removed
  }

  let uniqueSlug = slug;
  let counter = 1;

  while (await Post.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

// Create a new post
export const create = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'غير مسموح لك بإنشاء موضوع'));
  }
  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, 'برجاء التأكد من ملئ كل الحقول'));
  }
  
  const slug = await createUniqueSlug(req.body.title);
  const newPost = new Post({
    ...req.body,
    slug,
    userId: req.user.id,
  });

  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

// Get posts with filters and pagination
export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 8;
    const sortDirection = req.query.order === 'asc' ? 1 : -1;

    const posts = await Post.find({
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.slug && { slug: req.query.slug }),
      ...(req.query.postId && { _id: req.query.postId }),
      ...(req.query.searchTerm && {
        $or: [
          { title: { $regex: req.query.searchTerm, $options: 'i' } },
          { content: { $regex: req.query.searchTerm, $options: 'i' } },
        ],
      }),
    })
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const totalPosts = await Post.countDocuments();
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthPosts = await Post.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    res.status(200).json({
      posts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a post
export const deletepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'غير مسموح لك بمسح هذا الموضوع'));
  }
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json('تم مسح هذا الموضوع');
  } catch (error) {
    next(error);
  }
};

// Update a post
export const updatepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'غير مسموح لك بتعديل هذا الموضوع'));
  }

  try {
    let updatedFields = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      image: req.body.image,
      video: req.body.video, // Ensure video updates properly
    };

    // Generate a new slug if the title has changed
    if (req.body.title) {
      updatedFields.slug = await createUniqueSlug(req.body.title);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { $set: updatedFields },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};
