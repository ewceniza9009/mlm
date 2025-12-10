import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  profileImage?: string;
  enrollmentPackage?: mongoose.Types.ObjectId;
  isActive: boolean;
  role: 'admin' | 'distributor';
  kycStatus: 'pending' | 'approved' | 'rejected';
  currentLeftPV: number;
  currentRightPV: number;
  enrollmentDate: Date;

  // Genealogy Pointers
  sponsorId?: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  position?: 'left' | 'right';

  // Optimization
  path?: string;
  level: number;
  leftChildId?: mongoose.Types.ObjectId;
  rightChildId?: mongoose.Types.ObjectId;

  // Features
  spilloverPreference: 'extreme_left' | 'extreme_right' | 'weaker_leg' | 'balanced';
  multiCenter: boolean;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  isPlaced: boolean;
}

const userSchema = new Schema<IUser>({
  username: { type: String, unique: true, index: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  profileImage: { type: String },
  enrollmentPackage: { type: Schema.Types.ObjectId, ref: 'Package' },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['admin', 'distributor'], default: 'distributor' },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isPlaced: { type: Boolean, default: true }, // Default true for legacy/immediate placement
  currentLeftPV: { type: Number, default: 0 },
  currentRightPV: { type: Number, default: 0 },
  enrollmentDate: { type: Date, default: Date.now },

  // Genealogy Pointers
  sponsorId: { type: Schema.Types.ObjectId, ref: 'User' },
  parentId: { type: Schema.Types.ObjectId, ref: 'User' },
  position: { type: String, enum: ['left', 'right'] },

  // Optimization for Queries
  path: { type: String, index: true }, // e.g., ",rootId,parentId,thisId,"
  level: { type: Number, default: 0 },
  leftChildId: { type: Schema.Types.ObjectId, ref: 'User' },
  rightChildId: { type: Schema.Types.ObjectId, ref: 'User' },

  // Advanced Features
  spilloverPreference: {
    type: String,
    enum: ['extreme_left', 'extreme_right', 'weaker_leg', 'balanced'],
    default: 'weaker_leg'
  },
  multiCenter: { type: Boolean, default: false },
  rank: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Diamond'], default: 'Bronze' }
});

// Pre-save hook for path/level updates
userSchema.pre('save', async function (next) {
  if (this.isNew && this.parentId) {
    try {
      // Need to cast constructor to Model to access findById
      const User = this.constructor as mongoose.Model<IUser>;
      const parent = await User.findById(this.parentId);
      if (parent) {
        this.path = `${parent.path || ','}${this._id},`;
        this.level = (parent.level || 0) + 1;
      }
    } catch (error) {
      return next(error as Error);
    }
  } else if (this.isNew && !this.parentId) {
    // Root node handling
    this.path = `,${this._id},`;
    this.level = 0;
  }
  next();
});

export default mongoose.model<IUser>('User', userSchema);
