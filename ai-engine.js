/**
 * Core AI Engine for Financial Dashboard
 * Handles all AI-powered features and predictions
 */

class FinancialAIEngine {
    constructor() {
        this.models = {
            categorization: new TransactionCategorizer(),
            prediction: new SpendingPredictor(),
            anomaly: new AnomalyDetector(),
            recommendation: new RecommendationEngine(),
            nlp: new NLPProcessor()
        };
        
        this.cache = new Map();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log('Initializing Financial AI Engine...');
        
        // Load pre-trained models
        await this.loadModels();
        
        // Setup event listeners
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('Financial AI Engine initialized successfully');
    }

    async loadModels() {
        // Load TensorFlow.js models or use built-in algorithms
        try {
            // For now, use rule-based and statistical models
            // In production, load actual ML models
            this.models.categorization.initialize();
            this.models.prediction.initialize();
            this.models.anomaly.initialize();
            this.models.recommendation.initialize();
            this.models.nlp.initialize();
        } catch (error) {
            console.error('Error loading AI models:', error);
        }
    }

    setupEventListeners() {
        // Listen for transaction updates
        document.addEventListener('transactionAdded', (e) => {
            this.processNewTransaction(e.detail);
        });

        document.addEventListener('transactionUpdated', (e) => {
            this.processTransactionUpdate(e.detail);
        });
    }

    async processNewTransaction(transaction) {
        try {
            // Categorize transaction
            const category = await this.models.categorization.predict(transaction);
            transaction.category = category;

            // Check for anomalies
            const isAnomaly = await this.models.anomaly.detect(transaction);
            if (isAnomaly) {
                this.triggerAnomalyAlert(transaction);
            }

            // Update predictions
            await this.models.prediction.update(transaction);

            // Generate recommendations
            const recommendations = await this.models.recommendation.generate(transaction);
            
            return {
                transaction,
                category,
                isAnomaly,
                recommendations
            };
        } catch (error) {
            console.error('Error processing transaction:', error);
            return { transaction, error: error.message };
        }
    }

    async processTransactionUpdate(transaction) {
        // Re-categorize if needed
        if (!transaction.category || transaction.category === 'Uncategorized') {
            const category = await this.models.categorization.predict(transaction);
            transaction.category = category;
        }

        // Update all models
        await Promise.all([
            this.models.prediction.update(transaction),
            this.models.anomaly.update(transaction),
            this.models.recommendation.update(transaction)
        ]);
    }

    triggerAnomalyAlert(transaction) {
        const alert = {
            type: 'anomaly',
            title: 'Unusual Transaction Detected',
            message: `A transaction of $${transaction.amount} at ${transaction.merchant} seems unusual.`,
            transaction: transaction,
            timestamp: new Date().toISOString()
        };

        // Store alert
        this.storeAlert(alert);
        
        // Show notification
        this.showNotification(alert);
    }

    storeAlert(alert) {
        const alerts = JSON.parse(localStorage.getItem('aiAlerts') || '[]');
        alerts.unshift(alert);
        localStorage.setItem('aiAlerts', JSON.stringify(alerts.slice(0, 100))); // Keep last 100
    }

    showNotification(alert) {
        // Use browser notifications if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(alert.title, {
                body: alert.message,
                icon: '/assets/icons/ai-alert.png'
            });
        }

        // Dispatch custom event for UI updates
        document.dispatchEvent(new CustomEvent('aiAlert', { detail: alert }));
    }

    async getInsights(timeframe = 'month') {
        const cacheKey = `insights_${timeframe}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const insights = await this.generateInsights(timeframe);
        this.cache.set(cacheKey, insights);
        
        // Cache expires after 5 minutes
        setTimeout(() => this.cache.delete(cacheKey), 300000);
        
        return insights;
    }

    async generateInsights(timeframe) {
        const transactions = await this.getTransactions(timeframe);
        
        const insights = {
            spending: await this.models.prediction.getSpendingInsights(transactions),
            anomalies: await this.models.anomaly.getAnomalyInsights(transactions),
            recommendations: await this.models.recommendation.getRecommendations(transactions),
            patterns: await this.models.categorization.getPatternInsights(transactions)
        };

        return insights;
    }

    async getTransactions(timeframe) {
        // Get transactions from local storage or API
        const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        // Filter by timeframe
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (timeframe) {
            case 'week':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                cutoffDate.setMonth(now.getMonth() - 1);
        }

        return allTransactions.filter(t => new Date(t.date) >= cutoffDate);
    }

    async processNaturalLanguage(query) {
        return await this.models.nlp.processQuery(query);
    }

    // Utility methods
    clearCache() {
        this.cache.clear();
    }

    getModelStatus() {
        return {
            categorization: this.models.categorization.isReady(),
            prediction: this.models.prediction.isReady(),
            anomaly: this.models.anomaly.isReady(),
            recommendation: this.models.recommendation.isReady(),
            nlp: this.models.nlp.isReady()
        };
    }
}

// Individual AI models
class TransactionCategorizer {
    constructor() {
        this.categories = [
            'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
            'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
            'Investment', 'Income', 'Other'
        ];
        this.rules = new Map();
        this.isReady = false;
    }

    initialize() {
        this.loadRules();
        this.isReady = true;
    }

    loadRules() {
        // Load categorization rules from local storage
        const savedRules = JSON.parse(localStorage.getItem('categorizationRules') || '{}');
        this.rules = new Map(Object.entries(savedRules));
    }

    async predict(transaction) {
        // Check for exact merchant match
        if (this.rules.has(transaction.merchant)) {
            return this.rules.get(transaction.merchant);
        }

        // Check for keyword matches
        const merchantLower = transaction.merchant.toLowerCase();
        const descriptionLower = (transaction.description || '').toLowerCase();

        // Food & Dining
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower, 
            ['restaurant', 'food', 'grocery', 'cafe', 'pizza', 'coffee', 'mcdonald', 'starbucks'])) {
            return 'Food & Dining';
        }

        // Transportation
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['uber', 'lyft', 'gas', 'fuel', 'parking', 'transit', 'airline', 'taxi'])) {
            return 'Transportation';
        }

        // Shopping
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['amazon', 'walmart', 'target', 'store', 'shop', 'retail'])) {
            return 'Shopping';
        }

        // Entertainment
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['netflix', 'spotify', 'movie', 'game', 'entertainment', 'concert'])) {
            return 'Entertainment';
        }

        // Bills & Utilities
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['electric', 'water', 'gas', 'internet', 'phone', 'insurance', 'rent'])) {
            return 'Bills & Utilities';
        }

        // Healthcare
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'drugstore'])) {
            return 'Healthcare';
        }

        // Education
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['school', 'university', 'course', 'education', 'book', 'training'])) {
            return 'Education';
        }

        // Travel
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['hotel', 'airbnb', 'travel', 'vacation', 'booking', 'resort'])) {
            return 'Travel';
        }

        // Investment
        if (this.containsKeywords(merchantLower + ' ' + descriptionLower,
            ['investment', 'stock', 'crypto', 'trading', 'brokerage'])) {
            return 'Investment';
        }

        // Income
        if (transaction.amount > 0) {
            return 'Income';
        }

        return 'Other';
    }

    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    learnRule(merchant, category) {
        this.rules.set(merchant, category);
        this.saveRules();
    }

    saveRules() {
        const rulesObj = Object.fromEntries(this.rules);
        localStorage.setItem('categorizationRules', JSON.stringify(rulesObj));
    }

    isReady() {
        return this.isReady;
    }
}

class SpendingPredictor {
    constructor() {
        this.isReady = false;
        this.models = new Map();
    }

    initialize() {
        this.isReady = true;
    }

    async predictSpending(category, days = 30) {
        const transactions = await this.getTransactionsForCategory(category);
        if (transactions.length === 0) return 0;

        // Simple moving average prediction
        const dailySpending = this.calculateDailySpending(transactions);
        const average = dailySpending.reduce((a, b) => a + b, 0) / dailySpending.length;
        
        return average * days;
    }

    calculateDailySpending(transactions) {
        const dailyTotals = new Map();
        
        transactions.forEach(t => {
            const date = new Date(t.date).toDateString();
            const current = dailyTotals.get(date) || 0;
            dailyTotals.set(date, current + Math.abs(t.amount));
        });

        return Array.from(dailyTotals.values());
    }

    async getTransactionsForCategory(category) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        return transactions.filter(t => t.category === category && t.amount < 0);
    }

    isReady() {
        return this.isReady;
    }
}

class AnomalyDetector {
    constructor() {
        this.isReady = false;
        this.threshold = 2.5; // Standard deviations
    }

    initialize() {
        this.isReady = true;
    }

    async detect(transaction) {
        const categoryTransactions = await this.getCategoryTransactions(transaction.category);
        if (categoryTransactions.length < 10) return false;

        const amounts = categoryTransactions.map(t => Math.abs(t.amount));
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length);

        const zScore = Math.abs(Math.abs(transaction.amount) - mean) / stdDev;
        return zScore > this.threshold;
    }

    async getCategoryTransactions(category) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        return transactions.filter(t => t.category === category);
    }

    isReady() {
        return this.isReady;
    }
}

class RecommendationEngine {
    constructor() {
        this.isReady = false;
    }

    initialize() {
        this.isReady = true;
    }

    async generate(transaction) {
        const recommendations = [];

        // Budget recommendations
        const budgetStatus = await this.checkBudgetStatus(transaction.category);
        if (budgetStatus.overBudget) {
            recommendations.push({
                type: 'budget',
                title: 'Budget Alert',
                message: `You've exceeded your ${transaction.category} budget by $${budgetStatus.overAmount}`,
                action: 'review-budget'
            });
        }

        // Spending pattern recommendations
        const pattern = await this.analyzeSpendingPattern(transaction.category);
        if (pattern.trend === 'increasing') {
            recommendations.push({
                type: 'pattern',
                title: 'Spending Trend',
                message: `Your ${transaction.category} spending has increased by ${pattern.increase}%`,
                action: 'view-details'
            });
        }

        return recommendations;
    }

    async checkBudgetStatus(category) {
        // Implementation depends on budget system
        return { overBudget: false, overAmount: 0 };
    }

    async analyzeSpendingPattern(category) {
        // Implementation depends on historical data
        return { trend: 'stable', increase: 0 };
    }

    isReady() {
        return this.isReady;
    }
}

class NLPProcessor {
    constructor() {
        this.isReady = false;
        this.intents = new Map();
    }

    initialize() {
        this.setupIntents();
        this.isReady = true;
    }

    setupIntents() {
        this.intents.set('spending_query', {
            patterns: [
                /how much did i spend on (.+?) (?:last|this) (\w+)/i,
                /what did i spend on (.+?) (?:last|this) (\w+)/i,
                /show me (.+?) expenses (?:last|this) (\w+)/i
            ],
            handler: this.handleSpendingQuery.bind(this)
        });

        this.intents.set('category_query', {
            patterns: [
                /what categories did i spend money on/i,
                /show me my spending by category/i,
                /break down my expenses/i
            ],
            handler: this.handleCategoryQuery.bind(this)
        });

        this.intents.set('anomaly_query', {
            patterns: [
                /show me unusual transactions/i,
                /any suspicious activity/i,
                /anomalies in my spending/i
            ],
            handler: this.handleAnomalyQuery.bind(this)
        });
    }

    async processQuery(query) {
        query = query.toLowerCase().trim();

        for (const [intentName, intent] of this.intents) {
            for (const pattern of intent.patterns) {
                const match = query.match(pattern);
                if (match) {
                    return await intent.handler(match);
                }
            }
        }

        return {
            type: 'unknown',
            message: "I didn't understand that query. Try asking about your spending in specific categories or time periods."
        };
    }

    async handleSpendingQuery(match) {
        const category = match[1];
        const timeframe = match[2];
        
        // Implementation depends on data structure
        return {
            type: 'spending_result',
            category,
            timeframe,
            amount: 0, // Calculate actual amount
            transactions: [] // Get relevant transactions
        };
    }

    async handleCategoryQuery(match) {
        return {
            type: 'category_breakdown',
            categories: [] // Calculate category breakdown
        };
    }

    async handleAnomalyQuery(match) {
        return {
            type: 'anomaly_list',
            anomalies: [] // Get detected anomalies
        };
    }

    isReady() {
        return this.isReady;
    }
}

// Initialize AI Engine
window.financialAI = new FinancialAIEngine();
