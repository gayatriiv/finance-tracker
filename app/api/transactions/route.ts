import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Transaction } from '@/lib/models/Transaction'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('finora')
    const transactions = await db
      .collection<Transaction>('transactions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    // Return empty array if database is not available
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('Database not available, returning empty array')
      return NextResponse.json([])
    }
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received transaction data:', body)
    
    const client = await clientPromise
    const db = client.db('finora')

    const transaction: Transaction = {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await db.collection<Transaction>('transactions').insertOne(transaction)
    console.log('Transaction inserted with ID:', result.insertedId)
    
    return NextResponse.json({ 
      ...transaction, 
      _id: result.insertedId.toString() 
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Database connection failed. Please ensure MongoDB is running.' },
          { status: 503 }
        )
      }
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Invalid transaction data provided.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}