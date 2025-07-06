import { ObjectId } from 'mongodb';

export interface Transaction {
  _id?: ObjectId; // ✅ Allow MongoDB ObjectId type
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}
