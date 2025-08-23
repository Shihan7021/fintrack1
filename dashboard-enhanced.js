// Enhanced Dashboard Analytics Module
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

class DashboardAnalytics {
    constructor() {
        this.currentUserId = null;
        this.transactions = [];
        this.budgets = [];
        this.analytics = {
            monthlyTrends: {},
            categoryInsights: {},
            financialHealth: {},
            predictions: {}
        };
    }

    async initialize(userId) {
        this.currentUserId = userId;
        await this.loadData();
        this.calculateAnalytics();
    }

    async loadData() {
        // Load transactions
        const transactionsRef = collection(db, "users", this.currentUserId, "transactions");
        const transactionsSnapshot = await getDocs(transactionsRef);
        this.transactions = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: new Date(doc.data().date)
        }));

        // Load budgets
        const budgetsRef = collection(db, "users", this.currentUserId, "budgets");
        const budgetsSnapshot = await getDocs(budgetsRef);
        this.budgets = budgetsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    calculateAnalytics() {
        this.calculateMonthlyTrends();
        this.calculateCategoryInsights();
        this.calculateFinancialHealth();
        this.generatePredictions();
    }

    calculateMonthlyTrends() {
        const monthlyData = {};
        
        this.transactions.forEach(transaction => {
            const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    income: 0,
                    expenses: 0,
                    count: 0,
                    categories: {}
                };
            }
            
            if (transaction.type === 'Income') {
                monthlyData[monthKey].income += parseFloat(transaction.amount);
            } else {
                monthlyData[monthKey].expenses += parseFloat(transaction.amount);
                monthlyData[monthKey].categories[transaction.category] = 
                    (monthlyData[monthKey].categories[transaction.category] || 0) + parseFloat(transaction.amount);
            }
            
            monthlyData[monthKey].count++;
        });

        this.analytics.monthlyTrends = monthlyData;
    }

    calculateCategoryInsights() {
        const categoryData = {};
        
        this.transactions.filter(t => t.type === 'Expense').forEach(transaction => {
            const category = transaction.category;
            if (!categoryData[category]) {
                categoryData[category] = {
                    total: 0,
                    count: 0,
                    average: 0,
                    trend: []
                };
            }
            
            categoryData[category].total += parseFloat(transaction.amount);
            categoryData[category].count++;
            categoryData[category].average = categoryData[category].total / categoryData[category].count;
        });

        // Calculate budget vs actual for each category
        this.budgets.forEach(budget => {
            const category = budget.category;
            if (categoryData[category]) {
                categoryData[category].budget = parseFloat(budget.amount);
                categoryData[category].budgetUtilization = 
                    (categoryData[category].total / parseFloat(budget.amount)) * 100;
            }
        });

        this.analytics.categoryInsights = categoryData;
    }

    calculateFinancialHealth() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const totalExpenses = this.transactions
            .filter(t => t.type === 'Expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
        
        // Calculate emergency fund adequacy (assuming 3-6 months expenses)
        const monthlyAverageExpense = totalExpenses / Math.max(this.getMonthDifference(), 1);
        const emergencyFundNeeded = monthlyAverageExpense * 3;
        
        // Calculate debt-to-income ratio
        const debtExpenses = this.transactions
            .filter(t => t.type === 'Expense' && t.category === 'Loans')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const debtToIncomeRatio = totalIncome > 0 ? (debtExpenses / totalIncome) * 100 : 0;

        this.analytics.financialHealth = {
            savingsRate,
            debtToIncomeRatio,
            emergencyFundNeeded,
            monthlyAverageExpense,
            totalIncome,
            totalExpenses,
            netWorth: totalIncome - totalExpenses
        };
    }

    generatePredictions() {
        const monthlyTrends = this.analytics.monthlyTrends;
        const months = Object.keys(monthlyTrends).sort();
        
        if (months.length < 3) {
            this.analytics.predictions = {
                nextMonthExpense: null,
                nextMonthIncome: null,
                confidence: 0
            };
            return;
        }

        // Simple linear regression for predictions
        const expenseData = months.map(month => monthlyTrends[month].expenses);
        const incomeData = months.map(month => monthlyTrends[month].income);
        
        const nextMonthExpense = this.linearRegression(expenseData);
        const nextMonthIncome = this.linearRegression(incomeData);
        
        // Calculate confidence based on data stability
        const expenseVariance = this.calculateVariance(expenseData);
        const incomeVariance = this.calculateVariance(incomeData);
        const confidence = Math.max(0, 100 - (expenseVariance + incomeVariance) / 2);

        this.analytics.predictions = {
            nextMonthExpense: Math.max(0, nextMonthExpense),
            nextMonthIncome: Math.max(0, nextMonthIncome),
            confidence: Math.min(100, confidence)
        };
    }

    linearRegression(data) {
        if (data.length < 2) return data[0] || 0;
        
        const n = data.length;
        const sumX = data.reduce((sum, _, index) => sum + index, 0);
        const sumY = data.reduce((sum, value) => sum + value, 0);
        const sumXY = data.reduce((sum, value, index) => sum + index * value, 0);
        const sumXX = data.reduce((sum, _, index) => sum + index * index, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return intercept + slope * n;
    }

    calculateVariance(data) {
        const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
        const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
        return Math.sqrt(variance);
    }

    getMonthDifference() {
        if (this.transactions.length === 0) return 0;
        
        const dates = this.transactions.map(t => t.date);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        return (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
               (maxDate.getMonth() - minDate.getMonth()) + 1;
    }

    getInsights() {
        return {
            overspendingCategories: Object.entries(this.analytics.categoryInsights)
                .filter(([_, data]) => data.budgetUtilization > 100)
                .map(([category, data]) => ({
                    category,
                    overspent: data.total - data.budget,
                    percentage: data.budgetUtilization
                })),
            
            topSpendingCategories: Object.entries(this.analytics.categoryInsights)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 5),
                
            savingsOpportunities: this.identifySavingsOpportunities(),
            
            alerts: this.generateAlerts()
        };
    }

    identifySavingsOpportunities() {
        const opportunities = [];
        const categoryInsights = this.analytics.categoryInsights;
        
        Object.entries(categoryInsights).forEach(([category, data]) => {
            if (data.budgetUtilization > 80 && data.budgetUtilization < 100) {
                opportunities.push({
                    category,
                    message: `You're using ${data.budgetUtilization.toFixed(1)}% of your ${category} budget`,
                    potentialSavings: data.budget - data.total
                });
            }
        });
        
        return opportunities;
    }

    generateAlerts() {
        const alerts = [];
        const health = this.analytics.financialHealth;
        
        if (health.savingsRate < 10) {
            alerts.push({
                type: 'warning',
                message: 'Your savings rate is below 10%. Consider reducing expenses.',
                priority: 'high'
            });
        }
        
        if (health.debtToIncomeRatio > 30) {
            alerts.push({
                type: 'danger',
                message: 'Your debt-to-income ratio is above 30%. This may impact financial health.',
                priority: 'high'
            });
        }
        
        const overspending = this.getInsights().overspendingCategories;
        overspending.forEach(item => {
            alerts.push({
                type: 'danger',
                message: `You've overspent your ${item.category} budget by Rs.${item.overspent.toFixed(2)}`,
                priority: 'medium'
            });
        });
        
        return alerts;
    }
}

// Enhanced chart configurations
export const EnhancedCharts = {
    createTrendChart: function(containerId, data) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        const months = Object.keys(data).sort();
        const incomeData = months.map(month => data[month].income);
        const expenseData = months.map(month => data[month].expenses);
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(m => {
                    const [year, month] = m.split('-');
                    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Income vs Expenses Trend'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs.' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    },

    createCategoryComparisonChart: function(containerId, categoryData) {
        const ctx = document.getElementById(containerId).getContext('2d');
        
        const categories = Object.keys(categoryData);
        const actualSpending = categories.map(cat => categoryData[cat].total || 0);
        const budgetedAmounts = categories.map(cat => categoryData[cat].budget || 0);
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Actual Spending',
                    data: actualSpending,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                }, {
                    label: 'Budgeted Amount',
                    data: budgetedAmounts,
                    backgroundColor: 'rgba(25, 135, 84, 0.8)',
                    borderColor: '#198754',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Budget vs Actual Spending by Category'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rs.' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
};

export default DashboardAnalytics;
