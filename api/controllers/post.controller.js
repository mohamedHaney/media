import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';

// Helper function to generate unique slug
const createUniqueSlug = async (title) => {
  if (!title || typeof title !== "string") {
    return `post-${Date.now()}`;
  }

  let slug = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

  if (!slug) {
    slug = `post-${Date.now()}`;
  }

  let uniqueSlug = slug;
  let counter = 1;

  while (await Post.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};

// Create Post
export const create = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'غير مسموح لك بإنشاء موضوع'));
  }

  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, 'العنوان والمحتوى مطلوبان'));
  }

  try {
    // Validate media if exists
    if (req.body.media) {
      if (!Array.isArray(req.body.media)) {
        return next(errorHandler(400, 'يجب أن تكون الوسائط مصفوفة'));
      }

      // Validate each media item
      for (const media of req.body.media) {
        if (!media.url || !media.type) {
          return next(errorHandler(400, 'كل وسائط يجب أن تحتوي على رابط ونوع'));
        }
        if (!['image', 'video'].includes(media.type)) {
          return next(errorHandler(400, 'نوع الوسائط غير صحيح (يجب أن يكون image أو video)'));
        }
      }
    }

    const slug = await createUniqueSlug(req.body.title);

    const newPost = new Post({
      ...req.body,
      slug,
      userId: req.user.id,
      media: req.body.media || [],
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

// Get Posts
export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order === 'asc' ? 1 : -1;

    // Build query
    const query = {
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
    };

    // Execute query
    const posts = await Post.find(query)
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    // Get counts for analytics
    const totalPosts = await Post.countDocuments();
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthPosts = await Post.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    // Filter sensitive data
    const filteredPosts = posts.map(post => {
      const { __v, updatedAt, ...rest } = post._doc;
      return rest;
    });

    res.status(200).json({
      posts: filteredPosts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Post
export const deletepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'غير مسموح لك بمسح هذا الموضوع'));
  }

  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json('تم حذف الموضوع بنجاح');
  } catch (error) {
    next(error);
  }
};

// Update Post
export const updatepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'غير مسموح لك بتعديل هذا الموضوع'));
  }

  try {
    // Validate media if exists
    if (req.body.media) {
      if (!Array.isArray(req.body.media)) {
        return next(errorHandler(400, 'يجب أن تكون الوسائط مصفوفة'));
      }

      for (const media of req.body.media) {
        if (!media.url || !media.type) {
          return next(errorHandler(400, 'كل وسائط يجب أن تحتوي على رابط ونوع'));
        }
        if (!['image', 'video'].includes(media.type)) {
          return next(errorHandler(400, 'نوع الوسائط غير صحيح (يجب أن يكون image أو video)'));
        }
      }
    }

    // Generate new slug if title changed
    let updatedFields = { ...req.body };
    if (req.body.title) {
      updatedFields.slug = await createUniqueSlug(req.body.title);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: updatedFields,
      },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// Get Posts by Category
export const getPostsByCategory = async (req, res, next) => {
  try {
    const posts = await Post.find({ category: req.params.category })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// Get Recent Posts
export const getRecentPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};
