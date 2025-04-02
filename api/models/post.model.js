import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    validate: {
      validator: v => v.startsWith('http') || v.startsWith('https'),
      message: props => `${props.value} is not a valid URL`
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['image', 'video']
  },
  thumbnail: {
    type: String,
    validate: {
      validator: v => !v || v.startsWith('http') || v.startsWith('https'),
      message: props => `${props.value} is not a valid thumbnail URL`
    }
  },
  altText: {
    type: String,
    maxlength: 200
  }
}, { _id: false });

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
      minlength: 100
    },
    title: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 200
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
      index: true,
      enum: ['غير مصنف', 'قصص وتجارب شخصية', 'التقارير والدراسات', 'أخبار', 'مقالات']
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
