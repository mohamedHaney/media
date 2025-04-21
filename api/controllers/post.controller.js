import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';

const createUniqueSlug = async (title) => {
  if (!title || typeof title !== "string") {
    return `post-${Date.now()}`;
  }

  let slug = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // استبدال المسافات بشرطات
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "") // السماح بالحروف العربية والإنجليزية والأرقام والشرطات
    .replace(/-+/g, "-"); // إزالة الشرطات المتكررة

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


export const create = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorHandler(403, 'غير مسموح لك بإنشاء موضوع'));
  }
  if (!req.body.title || !req.body.content) {
    return next(errorHandler(400, 'برجاء التأكد من ملئ كل الحقول'));
  }
  
  const slug = await createUniqueSlug(req.body.title);
  
  // Validate media array
  if (req.body.media && !Array.isArray(req.body.media)) {
    return next(errorHandler(400, 'يجب أن تكون الوسائط مصفوفة'));
  }

  const newPost = new Post({
    ...req.body,
    slug,
    userId: req.user.id,
    media: req.body.media || [],
    coverMedia: req.body.coverMedia || 0, // Add coverMedia with default 0
  });

  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

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

export const updatepost = async (req, res, next) => {
  if (!req.user.isAdmin || req.user.id !== req.params.userId) {
    return next(errorHandler(403, 'غير مسموح لك بتعديل هذا الموضوع'));
  }

  try {
    let updatedFields = {
      ...req.body,
    };

    // Generate a new slug if the title has changed
    if (req.body.title) {
      updatedFields.slug = await createUniqueSlug(req.body.title);
    }

    // Ensure coverMedia is a number and within bounds
    if (req.body.coverMedia !== undefined) {
      updatedFields.coverMedia = parseInt(req.body.coverMedia) || 0;
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