import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  // Personal Info
  firstName?: string;
  middleName?: string;
  lastName?: string;
  occupation?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  profileImage?: string;
  enrollmentPackage?: mongoose.Types.ObjectId;
  isActive: boolean;
  status: 'pending_payment' | 'active' | 'suspended';
  role: 'admin' | 'distributor';
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycDocs?: string[];
  kycComment?: string;
  twoFactorSecret?: {
    temp?: string;
    secret?: string;
    enabled: boolean;
  };
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
  enableHoldingTank: 'system' | 'enabled' | 'disabled';
  multiCenter: boolean;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  isPlaced: boolean;
}

const userSchema = new Schema<IUser>({
  username: { type: String, unique: true, index: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  // Personal Info
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  occupation: { type: String },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String }
  },

  profileImage: { type: String },
  enrollmentPackage: { type: Schema.Types.ObjectId, ref: 'Package' },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['pending_payment', 'active', 'suspended'], default: 'active' },
  role: { type: String, enum: ['admin', 'distributor'], default: 'distributor' },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocs: [{ type: String }], // Array of file paths
  kycComment: { type: String }, // Rejection reason

  twoFactorSecret: {
    temp: { type: String },
    secret: { type: String },
    enabled: { type: Boolean, default: false }
  },

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
  enableHoldingTank: { type: String, enum: ['system', 'enabled', 'disabled'], default: 'system' },
  multiCenter: { type: Boolean, default: false },
  rank: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Diamond'], default: 'Bronze' }
});

// Pre-save hook for path/level updates
userSchema.pre('save', async function (next) {
  const doc = this as any;
  if (doc.isNew && doc.parentId) {
    try {
      // Need to cast constructor to Model to access findById
      const User = doc.constructor as mongoose.Model<IUser>;
      const parent = await User.findById(doc.parentId);
      if (parent) {
        doc.path = `${parent.path || ','}${doc._id},`;
        doc.level = (parent.level || 0) + 1;
      }
    } catch (error) {
      return next(error as Error);
    }
  } else if (doc.isNew && !doc.parentId) {
    // Root node handling
    doc.path = `,${doc._id},`;
    doc.level = 0;
  }
  next();
});

export default mongoose.model<IUser>('User', userSchema);
