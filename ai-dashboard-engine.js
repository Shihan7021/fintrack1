/**
 * AI Dashboard Engine
 * Core engine for AI-powered financial dashboard features
 */

class AIDashboardEngine {
    constructor() {
        this.data = null;
        this.predictions = null;
        this.anomalies = null;
        this.recommendations = null;
        this.patterns = null;
        this.isInitialized = false;
        this.updateInterval = null;
        this.performanceMetrics = {
            lastUpdate: null,
            processingTime: 0,
            accuracy: 0,
            confidence: 0
        };
    }

    /**
     * Initialize the AI engine
     */
    async initialize() {
        try {
            console.log('🤖 Initializing AI Dashboard Engine...');
            
            // Load initial data
            await this.loadData();
            
            // Generate initial insights
            await this.generateInsights();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ AI Dashboard Engine initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize AI engine:', error);
            return false;
        }
    }

    /**
     * Load financial data
     */
    async loadData() {
        try {
            // In real implementation, this would fetch from API
            this.data = await this.getDemoData();
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    /**
     * Generate AI insights
     */
    async generateInsights() {
        const startTime = Date.now();
        
        try {
            // Generate predictions
            this.predictions = await this.generatePredictions();
            
            // Detect anomalies
            this.anomalies = await this.detectAnomalies();
            
            // Generate recommendations
            this.recommendations = await this.generateRecommendations();
            
            // Analyze patterns
            this.patterns = await this.analyzePatterns();
            
            // Update performance metrics
            this.performanceMetrics.processingTime = Date.now() - startTime;
            this.performanceMetrics.lastUpdate = new Date();
            this.performanceMetrics.accuracy = this.calculateAccuracy();
            this.performanceMetrics.confidence = this.calculateConfidence();
            
            // Update UI
            this.updateUI();
            
        } catch (error) {
            console.error('Error generating insights:', error);
        }
    }

    /**
     * Generate spending predictions
     */
    async generatePredictions() {
        const transactions = this.data?.transactions || [];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Calculate monthly averages
        const monthlyData = this.groupByMonth(transactions);
        const avgSpending = this.calculateAverageSpending(monthlyData);
        
        // Predict next month
        const predictedAmount = this.predictNextMonth(monthlyData, avgSpending);
        
        // Break down by category
        const categoryBreakdown = this.predictCategoryBreakdown(transactions);
        
        return {
            predictedAmount,
            confidence: 0.85,
            categoryBreakdown,
            trend: this.calculateTrend(monthlyData),
            lastUpdated: new Date()
        };
    }

    /**
     * Detect anomalies in transactions
     */
    async detectAnomalies() {
        const transactions = this.data?.transactions || [];
        const anomalies = [];
        
        // Statistical anomaly detection
        const stats = this.calculateTransactionStats(transactions);
        
        transactions.forEach(transaction => {
            const anomalyScore = this.calculateAnomalyScore(transaction, stats);
            
            if (anomalyScore > 0.7) {
                anomalies.push({
                    ...transaction,
                    anomalyScore,
                    reason: this.getAnomalyReason(transaction, stats),
                    severity: this.getSeverity(anomalyScore)
                });
            }
        });
        
        return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
    }

    /**
     * Generate financial recommendations
     */
    async generateRecommendations() {
        const recommendations = [];
        const transactions = this.data?.transactions || [];
        const categories = this.groupByCategory(transactions);
        
        // Budget recommendations
        const budgetRecommendations = this.generateBudgetRecommendations(categories);
        recommendations.push(...budgetRecommendations);
        
        // Savings recommendations
        const savingsRecommendations = this.generateSavingsRecommendations(transactions);
        recommendations.push(...savingsRecommendations);
        
        // Investment recommendations
        const investmentRecommendations = this.generateInvestmentRecommendations();
        recommendations.push(...investmentRecommendations);
        
        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Analyze spending patterns
     */
    async analyzePatterns() {
        const transactions = this.data?.transactions || [];
        
        return {
            weeklyPattern: this.analyzeWeeklyPattern(transactions),
            monthlyPattern: this.analyzeMonthlyPattern(transactions),
            categoryPattern: this.analyzeCategoryPattern(transactions),
            timePattern: this.analyzeTimePattern(transactions),
            seasonalPattern: this.analyzeSeasonalPattern(transactions)
        };
    }

    /**
     * Helper methods
     */
    groupByMonth(transactions) {
        const grouped = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(t);
        });
        return grouped;
    }

    groupByCategory(transactions) {
        const grouped = {};
        transactions.forEach(t => {
            if (!grouped[t.category]) grouped[t.category] = [];
            grouped[t.category].push(t);
        });
        return grouped;
    }

    calculateAverageSpending(monthlyData) {
        const amounts = Object.values(monthlyData).map(month => 
            month.reduce((sum, t) => sum + t.amount, 0)
        );
        return amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length || 0;
    }

    predictNextMonth(monthlyData, avgSpending) {
        const recentMonths = Object.keys(monthlyData)
            .sort()
            .slice(-3)
            .map(key => monthlyData[key]);
        
        if (recentMonths.length === 0) return avgSpending;
        
        const recentAvg = recentMonths.reduce((sum, month) => 
            sum + month.reduce((s, t) => s + t.amount, 0), 0
        ) / recentMonths.length;
        
        // Simple trend adjustment
        const trend = (recentAvg - avgSpending) * 0.3;
        return Math.max(0, recentAvg + trend);
    }

    predictCategoryBreakdown(transactions) {
        const categories = this.groupByCategory(transactions);
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        const breakdown = {};
        Object.keys(categories).forEach(category => {
            const categoryTotal = categories[category].reduce((sum, t) => sum + t.amount, 0);
            breakdown[category] = {
                amount: categoryTotal,
                percentage: (categoryTotal / total * 100).toFixed(1)
            };
        });
        
        return breakdown;
    }

    calculateTransactionStats(transactions) {
        const amounts = transactions.map(t => t.amount);
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const stdDev = Math.sqrt(
            amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
        );
        
        return { mean, stdDev, min: Math.min(...amounts), max: Math.max(...amounts) };
    }

    calculateAnomalyScore(transaction, stats) {
        const zScore = Math.abs((transaction.amount - stats.mean) / stats.stdDev);
        return Math.min(1, zScore / 3); // Normalize to 0-1
    }

    getAnomalyReason(transaction, stats) {
        if (transaction.amount > stats.mean + 2 * stats.stdDev) {
            return 'Unusually high amount';
        } else if (transaction.amount < stats.mean - 2 * stats.stdDev) {
            return 'Unusually low amount';
        } else if (transaction.amount > stats.max) {
            return 'New maximum amount';
        }
        return 'Statistical anomaly';
    }

    getSeverity(score) {
        if (score > 0.9) return 'high';
        if (score > 0.7) return 'medium';
        return 'low';
    }

    generateBudgetRecommendations(categories) {
        const recommendations = [];
        
        Object.keys(categories).forEach(category => {
            const total = categories[category].reduce((sum, t) => sum + t.amount, 0);
            const avg = total / categories[category].length;
            
            if (avg > 1000) {
                recommendations.push({
                    type: 'budget',
                    title: `Reduce ${category} spending`,
                    message: `Your average ${category} spending is $${avg.toFixed(2)}. Consider setting a budget limit.`,
                    priority: 8,
                    savings: avg * 0.2,
                    action: 'Set Budget'
                });
            }
        });
        
        return recommendations;
    }

    generateSavingsRecommendations(transactions) {
        const monthlySpending = this.groupByMonth(transactions);
        const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
        const currentMonthSpending = monthlySpending[currentMonthKey] || [];
        
        const totalSpent = currentMonthSpending.reduce((sum, t) => sum + t.amount, 0);
        
        return [{
            type: 'savings',
            title: 'Increase savings rate',
            message: `You've spent $${totalSpent.toFixed(2)} this month. Consider saving 20% of your income.`,
            priority: 7,
            savings: totalSpent * 0.2,
            action: 'Set Savings Goal'
        }];
    }

    generateInvestmentRecommendations() {
        return [{
            type: 'investment',
            title: 'Start investing',
            message: 'Based on your spending patterns, you could start investing $200/month.',
            priority: 6,
            savings: 0,
            action: 'Explore Investments'
        }];
    }

    calculateTrend(monthlyData) {
        const months = Object.keys(monthlyData).sort();
        if (months.length < 2) return 'stable';
        
        const recent = months.slice(-2);
        const lastMonth = monthlyData[recent[0]].reduce((sum, t) => sum + t.amount, 0);
        const prevMonth = monthlyData[recent[1]].reduce((sum, t) => sum + t.amount, 0);
        
        const change = ((lastMonth - prevMonth) / prevMonth) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    analyzeWeeklyPattern(transactions) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const pattern = {};
        
        days.forEach(day => pattern[day] = 0);
        
        transactions.forEach(t => {
            const day = days[new Date(t.date).getDay()];
            pattern[day] += t.amount;
        });
        
        return pattern;
    }

    analyzeMonthlyPattern(transactions) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const pattern = {};
        
        months.forEach(month => pattern[month] = 0);
        
        transactions.forEach(t => {
            const month = months[new Date(t.date).getMonth()];
            pattern[month] += t.amount;
        });
        
        return pattern;
    }

    analyzeCategoryPattern(transactions) {
        return this.groupByCategory(transactions);
    }

    analyzeTimePattern(transactions) {
        const hours = Array.from({length: 24}, (_, i) => i);
        const pattern = {};
        
        hours.forEach(hour => pattern[hour] = 0);
        
        transactions.forEach(t => {
            const hour = new Date(t.date).getHours();
            pattern[hour] += 1;
        });
        
        return pattern;
    }

    analyzeSeasonalPattern(transactions) {
        const seasons = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
        
        transactions.forEach(t => {
            const month = new Date(t.date).getMonth();
            const quarter = month < 3 ? 'Q1' : month < 6 ? 'Q2' : month < 9 ? 'Q3' : 'Q4';
            seasons[quarter] += t.amount;
        });
        
        return seasons;
    }

    calculateAccuracy() {
        // Mock accuracy calculation
        return 0.92;
    }

    calculateConfidence() {
        // Mock confidence calculation
        return 0.88;
    }

    /**
     * Update UI with AI insights
     */
    updateUI() {
        this.updatePredictions();
        this.updateAnomalies();
        this.updateRecommendations();
        this.updatePatterns();
        this.updatePerformanceMetrics();
    }

    updatePredictions() {
        if (!this.predictions) return;
        
        const predictionEl = document.getElementById('ai-prediction-amount');
        if (predictionEl) {
            predictionEl.textContent = `$${this.predictions.predictedAmount.toFixed(2)}`;
        }
        
        const confidenceEl = document.getElementById('ai-prediction-confidence');
        if (confidenceEl) {
            confidenceEl.textContent = `${(this.predictions.confidence * 100).toFixed(0)}%`;
        }
    }

    updateAnomalies() {
        if (!this.anomalies) return;
        
        const anomaliesList = document.getElementById('ai-anomalies-list');
        if (anomaliesList) {
            anomaliesList.innerHTML = this.anomalies.slice(0, 5).map(anomaly => `
                <div class="ai-anomaly-item ${anomaly.severity}">
                    <div class="ai-anomaly-header">
                        <span class="ai-anomaly-merchant">${anomaly.merchant}</span>
                        <span class="ai-anomaly-amount">$${anomaly.amount.toFixed(2)}</span>
                    </div>
                    <div class="ai-anomaly-reason">${anomaly.reason}</div>
                    <div class="ai-anomaly-date">${new Date(anomaly.date).toLocaleDateString()}</div>
                </div>
            `).join('');
        }
    }

    updateRecommendations() {
        if (!this.recommendations) return;
        
        const recommendationsList = document.getElementById('ai-recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = this.recommendations.slice(0, 5).map(rec => `
                <div class="ai-recommendation-item ${rec.priority > 7 ? 'high' : rec.priority > 4 ? 'medium' : 'low'}">
                    <div class="ai-recommendation-header">
                        <span class="ai-recommendation-title">${rec.title}</span>
                        <span class="ai-recommendation-priority">${rec.priority}</span>
                    </div>
                    <div class="ai-recommendation-message">${rec.message}</div>
                    <div class="ai-recommendation-savings">Potential savings: $${rec.savings.toFixed(2)}</div>
                    <button class="ai-recommendation-action" onclick="aiEngine.handleRecommendation('${rec.action}')">${rec.action}</button>
                </div>
            `).join('');
        }
    }

    updatePatterns() {
        if (!this.patterns) return;
        
        // Update patterns chart would go here
        console.log('Patterns updated:', this.patterns);
    }

    updatePerformanceMetrics() {
        const metrics = document.getElementById('ai-performance-metrics');
        if (metrics) {
            metrics.innerHTML = `
                <span>Processing: ${this.performanceMetrics.processingTime}ms</span>
                <span>Accuracy: ${(this.performanceMetrics.accuracy * 100).toFixed(0)}%</span>
                <span>Confidence: ${(this.performanceMetrics.confidence * 100).toFixed(0)}%</span>
            `;
        }
    }

    /**
     * Event handlers
     */
    setupEventListeners() {
        // Chat functionality
        const chatInput = document.getElementById('ai-chat-input');
        const chatSend = document.getElementById('ai-chat-send');
        
        if (chatInput && chatSend) {
            chatSend.addEventListener('click', () => this.handleChat());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleChat();
            });
        }
        
        // Toggle assistant
        const toggleBtn = document.getElementById('ai-chat-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAssistant());
        }
    }

    handleChat() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage('user', message);
        input.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const response = this.generateAIResponse(message);
            this.addChatMessage('ai', response);
        }, 1000);
    }

    addChatMessage(sender, message) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!messagesContainer) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ai-${sender}`;
        messageEl.innerHTML = `
            <div class="ai-avatar">${sender === 'ai' ? '🤖' : '👤'}</div>
            <div class="ai-content">
                <p>${message}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    generateAIResponse(message) {
        // Simple response generation
        const responses = [
            "Based on your spending patterns, I recommend reviewing your entertainment budget.",
            "I've detected some unusual transactions this week. Would you like me to show them?",
            "Your savings rate could be improved by 15% with some small adjustments.",
            "Consider setting up automatic transfers to your savings account.",
            "Your grocery spending is 20% above average this month."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    toggleAssistant() {
        const body = document.getElementById('ai-chat-body');
        const toggle = document.getElementById('ai-chat-toggle');
        
        if (body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            toggle.innerHTML = '−';
        } else {
            body.classList.add('collapsed');
            toggle.innerHTML = '+';
        }
    }

    handleRecommendation(action) {
        console.log('Handling recommendation:', action);
        // Implement recommendation handling
    }

    /**
     * Real-time updates
     */
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.generateInsights();
        }, 30000); // Update every 30 seconds
    }

    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Demo data
     */
    async getDemoData() {
        return {
            transactions: [
                { id: 1, amount: 45.67, merchant: 'Starbucks', category: 'Food', date: '2024-01-15' },
                { id: 2, amount: 1200.00, merchant: 'Rent', category: 'Housing', date: '2024-01-01' },
                { id: 3, amount: 89.99, merchant: 'Netflix', category: 'Entertainment', date: '2024-01-10' },
                { id: 4, amount: 234.56, merchant: 'Whole Foods', category: 'Groceries', date: '2024-01-12' },
                { id: 5, amount: 67.89, merchant: 'Uber', category: 'Transportation', date: '2024-01-14' },
                { id: 6, amount: 15.99, merchant: 'Spotify', category: 'Entertainment', date: '2024-01-08' },
                { id: 7, amount: 45.00, merchant: 'Gym', category: 'Health', date: '2024-01-05' },
                { id: 8, amount: 78.50, merchant: 'Amazon', category: 'Shopping', date: '2024-01-13' },
                { id: 9, amount: 12.99, merchant: 'Coffee Shop', category: 'Food', date: '2024-01-16' },
                { id: 10, amount: 2000.00, merchant: 'Salary', category: 'Income', date: '2024-01-01' }
            ]
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopRealTimeUpdates();
        this.isInitialized = false;
    }
}

// Global instance
let aiEngine = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    aiEngine = new AIDashboardEngine();
    await aiEngine.initialize();
});

// Export for use in other modules
window.AIDashboardEngine = AIDashboardEngine;
