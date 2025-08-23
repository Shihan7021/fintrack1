// AI Demo Data Generator
class AIDemoData {
    constructor() {
        this.categories = [
            'Food & Dining', 'Shopping', 'Transportation', 'Entertainment',
            'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
        ];
        
        this.merchants = {
            'Food & Dining': ['Starbucks', 'McDonald\'s', 'Chipotle', 'Whole Foods', 'Pizza Hut'],
            'Shopping': ['Amazon', 'Target', 'Walmart', 'Best Buy', 'Costco'],
            'Transportation': ['Uber', 'Lyft', 'Shell', 'Exxon', 'Delta Airlines'],
            'Entertainment': ['Netflix', 'Spotify', 'AMC Theaters', 'Disney+', 'PlayStation Store'],
            'Bills & Utilities': ['Comcast', 'Verizon', 'Electric Company', 'Water Department', 'Gas Company'],
            'Healthcare': ['CVS', 'Walgreens', 'Doctor Visit', 'Dentist', 'Pharmacy'],
            'Education': ['Coursera', 'Udemy', 'Books', 'School Supplies', 'Online Course'],
            'Travel': ['Airbnb', 'Hotels.com', 'Expedia', 'Uber', 'Airlines']
        };
    }

    generateTransactions(count = 100) {
        const transactions = [];
        const now = new Date();
        
        for (let i = 0; i < count; i++) {
            const daysAgo = Math.floor(Math.random() * 90);
            const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            
            const category = this.categories[Math.floor(Math.random() * this.categories.length)];
            const merchants = this.merchants[category];
            const merchant = merchants[Math.floor(Math.random() * merchants.length)];
            
            const amount = -Math.random() * 200 - 5; // Negative for expenses
            const isAnomaly = Math.random() < 0.05; // 5% chance of anomaly
            
            transactions.push({
                id: `txn_${i + 1}`,
                merchant: merchant,
                category: category,
                amount: isAnomaly ? amount * 3 : amount, // Anomalies are 3x larger
                date: date.toISOString(),
                isAnomaly: isAnomaly,
                description: isAnomaly ? 'Unusual spending detected' : 'Regular transaction'
            });
        }
        
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    generateAccounts() {
        return [
            {
                id: 'acc_1',
                type: 'checking',
                name: 'Main Checking',
                balance: 2450.75,
                predictedBalance: 2380.50
            },
            {
                id: 'acc_2',
                type: 'savings',
                name: 'Emergency Fund',
                balance: 8500.00,
                predictedBalance: 8700.00
            },
            {
                id: 'acc_3',
                type: 'credit',
                name: 'Credit Card',
                balance: -1250.30,
                predictedBalance: -980.00
            }
        ];
    }

    generateInsights() {
        return {
            recommendations: [
                {
                    title: 'Reduce Dining Out',
                    message: 'You spent $450 on dining out this month. Consider cooking at home to save $200+ monthly.',
                    priority: 'high',
                    category: 'Food & Dining'
                },
                {
                    title: 'Subscription Audit',
                    message: 'You have 8 active subscriptions totaling $85/month. Review and cancel unused ones.',
                    priority: 'medium',
                    category: 'Entertainment'
                },
                {
                    title: 'Emergency Fund Goal',
                    message: 'You\'re 65% towards your emergency fund goal. Increase monthly savings by $100 to reach it 3 months earlier.',
                    priority: 'medium',
                    category: 'Savings'
                },
                {
                    title: 'Transportation Optimization',
                    message: 'Your transportation costs increased 40% this month. Consider public transit or carpooling.',
                    priority: 'low',
                    category: 'Transportation'
                }
            ],
            spendingPatterns: {
                highestCategory: 'Food & Dining',
                highestAmount: 450,
                lowestCategory: 'Healthcare',
                lowestAmount: 85,
                averageDaily: 35.50
            },
            predictions: {
                next7Days: 248.50,
                next30Days: 1420.00,
                trend: 'increasing'
            }
        };
    }

    generateAnomalies() {
        return [
            {
                id: 'anomaly_1',
                transaction: {
                    merchant: 'Luxury Electronics Store',
                    amount: -899.99,
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    category: 'Shopping'
                },
                severity: 'high',
                reason: 'Amount is 5x higher than average shopping expense'
            },
            {
                id: 'anomaly_2',
                transaction: {
                    merchant: 'Five Star Restaurant',
                    amount: -275.00,
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    category: 'Food & Dining'
                },
                severity: 'medium',
                reason: 'Unusual dining expense for this merchant'
            },
            {
                id: 'anomaly_3',
                transaction: {
                    merchant: 'Online Gaming',
                    amount: -150.00,
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    category: 'Entertainment'
                },
                severity: 'low',
                reason: 'First time using this service'
            }
        ];
    }

    generateNLPResponses() {
        return {
            'how much did I spend on food': 'You spent $450 on food this month, which is 15% higher than last month. The biggest expense was dining out at restaurants.',
            'what are my biggest expenses': 'Your top 3 expense categories are: 1. Food & Dining ($450), 2. Shopping ($320), 3. Transportation ($280).',
            'how can I save money': 'Based on your spending patterns, you could save $200+ monthly by: 1. Cooking at home 3 more days per week, 2. Canceling unused subscriptions, 3. Using public transit twice a week.',
            'am I on track with my budget': 'You\'re slightly over budget this month by $75. Your biggest variance is in the Food & Dining category where you\'ve spent $450 vs your $350 budget.',
            'show me unusual transactions': 'I found 3 unusual transactions: 1. $899.99 at Luxury Electronics Store (5x normal), 2. $275 at Five Star Restaurant (unusual merchant), 3. $150 on Online Gaming (first time).'
        };
    }

    generateDetailedInsights(type) {
        const insights = {
            spending: {
                title: 'Detailed Spending Analysis',
                analysis: 'Your spending has increased by 12% compared to last month. The primary drivers are Food & Dining (+$65) and Shopping (+$45). Your spending pattern shows higher expenses on weekends, particularly Friday and Saturday evenings.',
                recommendations: [
                    'Set a weekly dining budget of $100 to control food expenses',
                    'Use the 24-hour rule for purchases over $50 to reduce impulse buying',
                    'Consider meal prepping on Sundays to reduce weekday dining out'
                ],
                dataPoints: [
                    'Average daily spending: $35.50',
                    'Highest single day: $125 (Saturday)',
                    'Most expensive category: Food & Dining ($450)',
                    'Recurring transactions: 23 (Netflix, Spotify, etc.)',
                    'Cash withdrawals: $200 (consider reducing for better tracking)'
                ]
            },
            savings: {
                title: 'Savings & Investment Insights',
                analysis: 'You\'re saving 18% of your income, which is above the recommended 15%. Your emergency fund is at 65% of your goal ($10,000). However, your savings account interest rate (0.01%) is below inflation, suggesting you should consider high-yield savings or investment options.',
                recommendations: [
                    'Increase emergency fund target to 6 months of expenses',
                    'Open a high-yield savings account (currently earning 4-5% APY)',
                    'Consider investing 10% of income in low-cost index funds',
                    'Set up automatic transfers to savings on payday'
                ],
                dataPoints: [
                    'Current savings rate: 18% of income',
                    'Emergency fund progress: 65% ($6,500 of $10,000)',
                    'Monthly savings: $450',
                    'Interest earned this year: $8.50',
                    'Potential with high-yield account: $260/year'
                ]
            },
            budget: {
                title: 'Budget Performance Analysis',
                analysis: 'You\'re over budget by $75 this month. The biggest variance is in Food & Dining ($450 actual vs $350 budget). Your budget allocation is generally good, but you could benefit from more granular tracking in the Shopping category.',
                recommendations: [
                    'Increase Food & Dining budget to $400 to be more realistic',
                    'Break down Shopping category into sub-categories (clothing, electronics, etc.)',
                    'Use the envelope method for discretionary spending categories',
                    'Review and adjust budget categories quarterly based on actual spending'
                ],
                dataPoints: [
                    'Total budget: $2,500',
                    'Actual spending: $2,575',
                    'Variance: -$75 (3% over)',
                    'Categories on track: 5 out of 8',
                    'Biggest overspend: Food & Dining (+$100)'
                ]
            }
        };

        return insights[type] || insights.spending;
    }

    generatePredictionData() {
        const data = [];
        const now = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
            const baseAmount = 35 + Math.sin(i * 0.2) * 10;
            const weekendMultiplier = (date.getDay() === 0 || date.getDay() === 6) ? 1.5 : 1;
            const amount = baseAmount * weekendMultiplier + (Math.random() - 0.5) * 5;
            
            data.push({
                date: date.toISOString().split('T')[0],
                predicted: Math.max(0, amount)
            });
        }
        
        return data;
    }
}

// Demo data instance
const demoData = new AIDemoData();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIDemoData, demoData };
} else {
    window.demoData = demoData;
}
