import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: v => v.startsWith('http'),
      message: props => `${props.value} is not a valid URL`
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['image', 'video']
  },
  thumbnail: String, // Optional thumbnail for videos
  altText: String    // Optional alt text for accessibility
}, { _id: false });  // Don't create IDs for subdocuments

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: v => v.length <= 10,
        message: 'Cannot have more than 10 media items'
      }
    },
    category: {
      type: String,
      default: 'غير مصنف',
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
postSchema.virtual('featuredImage').get(function() {
  const img = this.media.find(m => m.type === 'image');
  return img ? img.url : null;
});

postSchema.virtual('featuredVideo').get(function() {
  const vid = this.media.find(m => m.type === 'video');
  return vid ? vid.url : null;
});

postSchema.virtual('hasMedia').get(function() {
  return this.media.length > 0;
});

// Indexes
postSchema.index({ userId: 1, category: 1 });
postSchema.index({ title: 'text', content: 'text' });

const Post = mongoose.model('Post', postSchema);

export default Post;
