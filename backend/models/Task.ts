import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'REORDER_REMINDER' | 'ACTIVATION_REMINDER' | 'INACTIVITY_ALERT';
    title: string;
    description: string;
    relatedUserId?: mongoose.Types.ObjectId; // For follow-up with specific person
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
    createdAt: Date;
    dueDate?: Date;
}

const taskSchema = new Schema<ITask>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['REORDER_REMINDER', 'ACTIVATION_REMINDER', 'INACTIVITY_ALERT'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    relatedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'DISMISSED'], default: 'PENDING' },
    dueDate: { type: Date }
}, { timestamps: true });

// Index for fast retrieval of user's pending tasks
taskSchema.index({ userId: 1, status: 1 });

export default mongoose.model<ITask>('Task', taskSchema);
