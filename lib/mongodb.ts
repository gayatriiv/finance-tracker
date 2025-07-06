import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      console.error('MongoDB connection failed:', error.message)
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error(
          'Cannot connect to MongoDB. Please ensure you have:\n' +
          '1. A MongoDB Atlas cluster set up, or\n' +
          '2. A local MongoDB instance running on port 27017\n' +
          '3. The correct MONGODB_URI in your .env.local file'
        )
      }
      throw error
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect().catch((error) => {
    console.error('MongoDB connection failed:', error.message)
    if (error.message.includes('ECONNREFUSED')) {
      throw new Error(
        'Cannot connect to MongoDB. Please check your MONGODB_URI configuration.'
      )
    }
    throw error
  })
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise