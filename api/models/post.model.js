import mongoose from 'mongoose';

// Validation function for images array
const validateImagesArray = (images) => {
  if (!Array.isArray(images)) return false;
  if (images.length > 10) return false; // Max 10 images per post
  return images.every(img => typeof img === 'string' && img.startsWith('http'));
};

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true // Added index for faster queries by userId
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
      index: true // Added index for faster title searches
    },
    images: {
      type: [String],
      default: [
        'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png'
      ],
      validate: {
        validator: validateImagesArray,
        message: props => `Invalid images array: ${props.value}`
      }
    },
    video: {
      type: String,
      default: null,
      validate: {
        validator: v => v === null || v.startsWith('http'),
        message: props => `${props.value} is not a valid video URL`
      }
    },
    category: {
      type: String,
      default: 'غير مصنف',
      index: true // Added index for faster category filtering
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true // Added index for faster slug lookups
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true } // Include virtuals when converting to objects
  }
);

// Virtual for featured image (first image in array)
postSchema.virtual('featuredImage').get(function() {
  return this.images.length > 0 ? this.images[0] : null;
});

// Virtual for hasMedia (check if post has images or video)
postSchema.virtual('hasMedia').get(function() {
  return this.images.length > 0 || this.video !== null;
});

// Compound index for frequently queried together fields
postSchema.index({ userId: 1, category: 1 });
postSchema.index({ title: 'text', content: 'text' }); // Text index for search

const Post = mongoose.model('Post', postSchema);

export default Post;
