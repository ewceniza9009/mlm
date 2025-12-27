import mongoose from 'mongoose';

/**
 * Executes an operation within a MongoDB transaction.
 * If the MongoDB server does not support transactions (e.g., Standalone),
 * it falls back to executing the operation without a transaction.
 * 
 * @param operation Callback function that receives the session (or undefined).
 */
export const withTransaction = async <T>(
    operation: (session: mongoose.ClientSession | undefined) => Promise<T>
): Promise<T> => {
    // Return direct operation if session creation is not possible (e.g., mock connection)
    if (!mongoose.connection || !mongoose.connection.getClient()) {
        return operation(undefined);
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const result = await operation(session);
        await session.commitTransaction();
        return result;
    } catch (error: any) {
        await session.abortTransaction();

        // Check for "Transaction numbers are only allowed on a replica set member" error
        // Code 20 = IllegalOperation
        if (error.code === 20 || error.message?.includes('Transaction numbers') || error.message?.includes('replica set')) {
            console.warn('[Transaction] MongoDB Replica Set not detected. Retrying operation without transaction.');
            // Retry the operation without a session
            return await operation(undefined);
        }

        // Re-throw other errors
        throw error;
    } finally {
        session.endSession();
    }
};
