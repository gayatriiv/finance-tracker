'use client'

import { useState, useEffect } from 'react'
import { Diamond, TrendingUp, TrendingDown, DollarSign, Plus, Settings, BarChart3, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts'
import { format, parseISO, startOfMonth, endOfMonth, isSameMonth } from 'date-fns'

interface Transaction {
  _id?: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  date: string
  createdAt: string
}

interface Budget {
  _id?: string
  category: string
  amount: number
  month: string
}

const CATEGORIES = {
  income: [
    { id: 'salary', name: 'Salary', icon: '💼' },
    { id: 'freelance', name: 'Freelance', icon: '💻' },
    { id: 'investment', name: 'Investment', icon: '📈' },
    { id: 'business', name: 'Business', icon: '🏢' },
    { id: 'other-income', name: 'Other Income', icon: '💰' }
  ],
  expense: [
    { id: 'food', name: 'Food & Dining', icon: '🍽️' },
    { id: 'transportation', name: 'Transportation', icon: '🚗' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'bills', name: 'Bills & Utilities', icon: '💡' },
    { id: 'healthcare', name: 'Healthcare', icon: '⚕️' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'other', name: 'Other', icon: '💸' }
  ]
}

const CHART_COLORS = ['#3B82F6', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#84CC16']

export default function FinoraTracker() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showBudgetSuccess, setShowBudgetSuccess] = useState(false)
  const [budgetSuccessMessage, setBudgetSuccessMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Form states
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: format(new Date(), 'yyyy-MM-dd')
  })

  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: ''
  })

  // Fetch data from API
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTransactions(), fetchBudgets()])
      setLoading(false)
    }
    loadData()
  }, [])

  const currentMonth = new Date()
  const currentMonthTransactions = transactions.filter(t => 
    isSameMonth(parseISO(t.date), currentMonth)
  )

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const netBalance = monthlyIncome - monthlyExpenses

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const getCategoryName = (categoryId: string) => {
    const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense]
    return allCategories.find(cat => cat.id === categoryId)?.name || categoryId
  }

  const getCategoryIcon = (categoryId: string) => {
    const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense]
    return allCategories.find(cat => cat.id === categoryId)?.icon || '💰'
  }

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.description || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    const newTransaction = {
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      type: formData.type,
      date: formData.date,
      createdAt: new Date().toISOString()
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Transaction added successfully:', result)
        await fetchTransactions()
        setFormData({
          amount: '',
          description: '',
          category: '',
          type: 'expense',
          date: format(new Date(), 'yyyy-MM-dd')
        })
        setIsAddTransactionOpen(false)
        alert('Transaction added successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to add transaction:', errorData)
        alert(`Failed to add transaction: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Network error: Could not add transaction. Please check your connection.')
    }
  }

  const handleEditTransaction = async () => {
    if (!editingTransaction || !formData.amount || !formData.description || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    const updatedTransaction = {
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      type: formData.type,
      date: formData.date
    }

    try {
      const response = await fetch(`/api/transactions/${editingTransaction._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTransaction)
      })

      if (response.ok) {
        console.log('Transaction updated successfully')
        await fetchTransactions()
        setEditingTransaction(null)
        setIsEditTransactionOpen(false)
        alert('Transaction updated successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to update transaction:', errorData)
        alert(`Failed to update transaction: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('Network error: Could not update transaction. Please check your connection.')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        console.log('Transaction deleted successfully')
        await fetchTransactions()
        alert('Transaction deleted successfully!')
      } else {
        const errorData = await response.json()
        console.error('Failed to delete transaction:', errorData)
        alert(`Failed to delete transaction: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Network error: Could not delete transaction. Please check your connection.')
    }
  }

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: transaction.date
    })
    setIsEditTransactionOpen(true)
  }

  const handleSetBudget = async () => {
    if (!budgetForm.category || !budgetForm.amount) {
      alert('Please select a category and enter an amount')
      return
    }

    const currentMonthStr = format(currentMonth, 'yyyy-MM')
    const newBudget = {
      category: budgetForm.category,
      amount: parseFloat(budgetForm.amount),
      month: currentMonthStr
    }

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudget)
      })

      if (response.ok) {
        console.log('Budget set successfully')
        await fetchBudgets()
        setBudgetSuccessMessage(`Budget for ${getCategoryName(budgetForm.category)} set to ${formatCurrency(parseFloat(budgetForm.amount))}`)
        setShowBudgetSuccess(true)
        setTimeout(() => setShowBudgetSuccess(false), 3000)
        setBudgetForm({ category: '', amount: '' })
      } else {
        const errorData = await response.json()
        console.error('Failed to set budget:', errorData)
        alert(`Failed to set budget: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error setting budget:', error)
      alert('Network error: Could not set budget. Please check your connection.')
    }
  }

  // Chart 1: Monthly expenses bar chart
  const monthlyExpensesChartData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentMonth.getFullYear(), i, 1)
    const monthTransactions = transactions.filter(t => 
      isSameMonth(parseISO(t.date), month)
    )
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    
    return {
      month: format(month, 'MMM'),
      expenses
    }
  })

  // Chart 2: Category-wise pie chart
  const categoryChartData = CATEGORIES.expense.map(category => {
    const categoryExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category === category.id)
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      name: category.name,
      value: categoryExpenses,
      icon: category.icon
    }
  }).filter(item => item.value > 0)

  // Chart 3: Budget vs actual comparison chart
  const currentMonthStr = format(currentMonth, 'yyyy-MM')
  const currentBudgets = budgets.filter(b => b.month === currentMonthStr)
  const budgetComparisonData = currentBudgets.map(budget => {
    const spent = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      category: getCategoryName(budget.category),
      budget: budget.amount,
      spent,
      percentage: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
      isOverBudget: spent > budget.amount
    }
  })

  const recentTransactions = transactions.slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Finora...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Diamond className="h-8 w-8 text-primary neon-glow" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">Finora</h1>
                  <p className="text-sm text-muted-foreground">Personal Finance Tracker</p>
                </div>
              </div>
            </div>
            
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary hover-scale">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-foreground">Type</Label>
                      <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value, category: ''})}>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border">
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount" className="text-foreground">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="bg-input border-border"
                        placeholder="Enter amount"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-foreground">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border">
                        {CATEGORIES[formData.type].map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-foreground">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-input border-border"
                      placeholder="Enter transaction description"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date" className="text-foreground">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="bg-input border-border"
                    />
                  </div>
                  
                  <Button onClick={handleAddTransaction} className="w-full btn-primary">
                    {formData.amount && formData.description && formData.category ? 'Add Transaction' : 'Please fill all fields'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-card/30 sticky top-[89px] z-40">
        <div className="container mx-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-secondary border-border h-12">
              <TabsTrigger value="dashboard" className="nav-link data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="transactions" className="nav-link data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
                Transactions
              </TabsTrigger>
              <TabsTrigger value="budgets" className="nav-link data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">
                Budgets
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="space-y-8 slide-in-up">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-l-4 border-l-green-500 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(monthlyIncome)}</p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-l-4 border-l-red-500 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Monthly Expenses</p>
                      <p className="text-2xl font-bold text-red-400">{formatCurrency(monthlyExpenses)}</p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-l-4 border-l-primary hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Net Balance</p>
                      <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-primary' : 'text-red-400'}`}>
                        {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
                      </p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Insights */}
            <div className="space-y-4">
              {budgetComparisonData.map((item, index) => (
                <Card key={index} className={`glass-card ${item.isOverBudget ? 'border-red-500' : 'border-border'} hover-scale`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{item.category}</p>
                        <div className="flex items-center space-x-3">
                          <p className="text-2xl font-bold">
                            {formatCurrency(item.spent)}
                          </p>
                          <Progress
                            value={item.percentage}
                            className={`w-32 ${item.isOverBudget ? 'bg-red-500/20' : 'bg-primary/20'}`}
                          />
                          <p className={`text-sm ${item.isOverBudget ? 'text-red-400' : 'text-primary'}`}>
                            {item.percentage}%
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Budget: {formatCurrency(item.budget)}
                        </p>
                        {item.isOverBudget && (
                          <Alert className="mt-2">
                            <AlertDescription>
                              <span className="text-red-400">Warning:</span> You've exceeded your budget for {item.category} by {formatCurrency(item.spent - item.budget)}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Monthly Expenses Bar Chart */}
              <Card className="chart-container hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Monthly Expenses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyExpensesChartData.some(d => d.expenses > 0) ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyExpensesChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => formatCurrency(value as number)}
                          />
                          <Bar dataKey="expenses" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">No expense data to display</p>
                        <p className="text-sm text-muted-foreground">Add some expenses to see your monthly trends!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart 2: Category-wise Pie Chart */}
              <Card className="chart-container hover-scale">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-accent" />
                    <span>Category Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart data={categoryChartData}>
                          <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => formatCurrency(value as number)}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">No expenses this month</p>
                        <p className="text-sm text-muted-foreground">Add some expenses to see category breakdown!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="glass-card hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full pulse-blue"></div>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{getCategoryName(transaction.category)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(transaction.date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Start tracking your finances by adding your first transaction!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6 slide-in-right">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>All Transactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{getCategoryName(transaction.category)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(transaction.date), 'MMM dd, yyyy')}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(transaction)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteTransaction(transaction._id!)}>
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">No transactions yet</p>
                    <p className="text-sm text-muted-foreground">Start tracking your finances by adding your first transaction!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6 slide-in-up">
            {/* Budget Success Alert */}
            {showBudgetSuccess && (
              <Alert className="bg-green-900/20 border-green-500/50">
                <AlertDescription className="text-green-400">
                  {budgetSuccessMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Set Budget Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Set Category Budget</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-foreground">Category</Label>
                    <Select value={budgetForm.category} onValueChange={(value) => setBudgetForm({...budgetForm, category: value})}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border">
                        {CATEGORIES.expense.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Monthly Budget</Label>
                    <Input
                      type="number"
                      value={budgetForm.amount}
                      onChange={(e) => setBudgetForm({...budgetForm, amount: e.target.value})}
                      className="bg-input border-border"
                      placeholder="Enter budget amount"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <Button onClick={handleSetBudget} className="w-full btn-primary">
                  {budgetForm.category && budgetForm.amount ? 'Set Budget' : 'Please fill all fields'}
                </Button>
              </CardContent>
            </Card>

            {/* Chart 3: Budget vs Actual Comparison */}
            <Card className="chart-container hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  <span>Budget vs Actual</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetComparisonData.length > 0 ? (
                  <div className="space-y-4">
                    {budgetComparisonData.map((insight) => (
                      <div key={insight.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{insight.category}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(insight.spent)} / {formatCurrency(insight.budget)}
                            </span>
                            <Badge variant={insight.isOverBudget ? "destructive" : "secondary"}>
                              {insight.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(insight.percentage, 100)} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No budgets set</p>
                    <p className="text-sm text-muted-foreground">Set your first budget to track your spending!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spending Insights */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                  <span>Spending Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetComparisonData.some(insight => insight.isOverBudget) ? (
                  <div className="space-y-3">
                    {budgetComparisonData.filter(insight => insight.isOverBudget).map((insight) => (
                      <Alert key={insight.category} className="bg-red-900/20 border-red-500/50">
                        <AlertDescription className="text-red-400">
                          You've exceeded your budget in {insight.category} by {formatCurrency(insight.spent - insight.budget)}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">All budgets are on track</p>
                    <p className="text-sm text-muted-foreground">Keep up the good work!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type" className="text-foreground">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value})}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border">
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-amount" className="text-foreground">Amount (₹)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-input border-border"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-category" className="text-foreground">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-border">
                  {CATEGORIES[formData.type].map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="text-foreground">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-input border-border"
                placeholder="Enter transaction description"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-date" className="text-foreground">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="bg-input border-border"
              />
            </div>
            
            <Button onClick={handleEditTransaction} className="w-full btn-primary">
              {formData.amount && formData.description && formData.category ? 'Update Transaction' : 'Please fill all fields'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}