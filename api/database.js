import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.MONGODB_URI || `mongodb+srv://tstone4:${process.env.databasePassword}@cluster0.ntuqn.mongodb.net/tobyStone?appName=Cluster0`;

let cachedConnection = null;

export async function connectToDatabase() {
    if (cachedConnection) {
        return cachedConnection;
    }

    if (!connectionString || connectionString.includes('undefined')) {
        throw new Error('MongoDB connection string or databasePassword is not defined');
    }

    try {
        const opts = {
            bufferCommands: false,
        };

        const connection = await mongoose.connect(connectionString, opts);
        cachedConnection = connection;
        console.log('Connected to MongoDB');
        return connection;
    } catch (e) {
        console.error('MongoDB connection error:', e);
        throw e;
    }
}
