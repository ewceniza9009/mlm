import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemLog extends Document {
  action: string;
  details: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  timestamp: Date;
}

const systemLogSchema = new Schema<ISystemLog>({
  action: { type: String, required: true },
  details: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'], default: 'INFO' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<ISystemLog>('SystemLog', systemLogSchema);