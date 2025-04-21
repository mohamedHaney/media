import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v) => v.startsWith('http') || v.startsWith('https'),
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    type: {
      type: String,
      required: true,
      enum: ['image', 'video'],
    },
    thumbnail: {
      type: String,
      validate: {
        validator: (v) => !v || v.startsWith('http') || v.startsWith('https'),
        message: (props) => `${props.value} is not a valid thumbnail URL`,
      },
    },
    duration: {
      type: Number,
      min: 0,
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    altText: {
      type: String,
      maxlength: 200,
    },
    fileName: {
      type: String,
    },
    originalName: {
      type: String,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 100,
    },
    title: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 200,
    },
    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Cannot have more than 10 media items',
      },
    },
    coverMedia: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function(v) {
          return v < (this.media?.length || 0);
        },
        message: 'Cover media index out of bounds'
      }
    },
    category: {
      type: String,
      required: true,
      index: true,
      enum: ['قصص وتجارب', 'التقارير والدراسات', 'أخبار', 'مقالات'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
postSchema.virtual('featuredImage').get(function () {
  // First try to get the cover media if it's an image
  if (this.media?.[this.coverMedia]?.type === 'image') {
    return this.media[this.coverMedia].url;
  }
  // Fallback to first image
  const img = this.media?.find((m) => m.type === 'image');
  return img ? img.url : null;
});

postSchema.virtual('featuredVideo').get(function () {
  // First try to get the cover media if it's a video
  if (this.media?.[this.coverMedia]?.type === 'video') {
    return this.media[this.coverMedia].url;
  }
  // Fallback to first video
  const vid = this.media?.find((m) => m.type === 'video');
  return vid ? vid.url : null;
});

postSchema.virtual('hasMedia').get(function () {
  return this.media?.length > 0;
});

postSchema.virtual('coverMediaUrl').get(function () {
  if (this.media?.[this.coverMedia]) {
    return this.media[this.coverMedia].url;
  }
  return this.featuredImage || this.featuredVideo || null;
});

postSchema.virtual('coverMediaType').get(function () {
  if (this.media?.[this.coverMedia]) {
    return this.media[this.coverMedia].type;
  }
  return this.featuredVideo ? 'video' : this.featuredImage ? 'image' : null;
});

// Indexes
postSchema.index({ userId: 1, category: 1 });
postSchema.index({ title: 'text', content: 'text' });

// Middleware to validate coverMedia before saving
postSchema.pre('save', function(next) {
  if (this.coverMedia >= (this.media?.length || 0)) {
    this.coverMedia = 0; // Reset to default if out of bounds
  }
  next();
});

const Post = mongoose.model('Post', postSchema);

export default Post;