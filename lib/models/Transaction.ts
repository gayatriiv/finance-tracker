export interface Transaction {
  _id?: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  date: string
  createdAt: string
  updatedAt?: string
}