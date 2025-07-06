# Finora – Personal Finance Tracker
Finora is a sleek, dark-themed personal finance tracker that helps users monitor income, expenses, and budgets.  
Track your spending, get real-time insights with charts, and stay in control of your finances.  
Simple. Visual. Efficient.

---

## core features

### 🔹 Stage 1: Transaction Tracking
- Add, edit, and delete income/expense transactions
- Monthly expenses bar chart
- Transaction history list with validation

### 🔹 Stage 2: Categories
- Categorize your transactions (e.g., Food, Rent, Utilities)
- Pie chart for category breakdown
- Dashboard summary: Income, Expenses, Net Balance, Recent Activity

### 🔹 Stage 3: Budgeting
- Set monthly budgets by category
- Budget vs Actual comparison chart
- Overspending alerts and insights

---

## 🛠 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Backend/Database**: [MongoDB](https://www.mongodb.com/), [Mongoose](https://mongoosejs.com/)
- **Validation**: `react-hook-form`, `zod`


---

## ⚙️ Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/finora.git
cd finora
```

### 2. install dependencies 

```bash
npm install
```

### 3. setting up environment

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/finora?retryWrites=true&w=majority
```
(replace with your MongoDB atlas credentials)

### 4. development server

```bash
npm run dev
```
☁️ Deployment
The app is deployed using Vercel.

🔗 Live App: https://finance-tracker-two-ivory.vercel.app

