import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { Budget } from '@/lib/models/Budget'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('finora')
    const budgets = await db
      .collection<Budget>('budgets')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    // Return empty array if database is not available
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('Database not available, returning empty array')
      return NextResponse.json([])
    }
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received budget data:', body)
    
    const client = await clientPromise
    const db = client.db('finora')

    // Check if budget already exists for this category and month
    const existingBudget = await db
      .collection<Budget>('budgets')
      .findOne({ category: body.category, month: body.month })

    if (existingBudget) {
      // Update existing budget
      const result = await db
        .collection<Budget>('budgets')
        .updateOne(
          { _id: existingBudget._id },
          { 
            $set: { 
              amount: body.amount, 
              updatedAt: new Date().toISOString() 
            } 
          }
        )
      
      console.log('Budget updated:', result)
      
      return NextResponse.json({ 
        ...existingBudget, 
        amount: body.amount,
        updatedAt: new Date().toISOString()
      })
    } else {
      // Create new budget
      const budget: Budget = {
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await db.collection<Budget>('budgets').insertOne(budget)
      console.log('Budget created with ID:', result.insertedId)
      
      return NextResponse.json({ 
        ...budget, 
        _id: result.insertedId.toString() 
      })
    }
  } catch (error) {
    console.error('Error creating/updating budget:', error)
    
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
          { error: 'Invalid budget data provided.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create/update budget' },
      { status: 500 }
    )
  }
}