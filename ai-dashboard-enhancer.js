/**
 * AI Dashboard Enhancer
 * Integrates AI features into the existing dashboard
 */

class AIDashboardEnhancer {
    constructor() {
        this.aiEngine = null;
        this.isEnhanced = false;
        this.widgets = new Map();
    }

    async initialize() {
        if (this.isEnhanced) return;

        // Initialize AI Engine
        this.aiEngine = window.financialAI;
        await this.aiEngine.initialize();

        // Enhance existing dashboard
        this.enhanceDashboard();
        
        // Add AI widgets
        this.addAIWidgets();
        
        // Setup event listeners
        this.setupEventListeners();

        this.isEnhanced = true;
        console.log('AI Dashboard Enhancer initialized');
    }

    enhanceDashboard() {
        // Add AI indicators to existing elements
        this.addAIIndicators();
        
        // Enhance transaction list with AI insights
        this.enhanceTransactionList();
        
        // Add predictive elements to charts
        this.enhanceCharts();
    }

    addAIIndicators() {
        // Add AI status indicator
        const header = document.querySelector('.dashboard-header');
        if (header) {
            const aiStatus = this.createAIStatusIndicator();
            header.appendChild(aiStatus);
        }

        // Add AI insights toggle
        const controls = document.querySelector('.dashboard-controls');
        if (controls) {
            const toggle = this.createAIInsightsToggle();
            controls.appendChild(toggle);
        }
    }

    createAIStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'ai-status-indicator';
        indicator.innerHTML = `
            <div class="ai-status-dot"></div>
            <span class="ai-status-text">AI Active</span>
        `;
        
        // Update status based on model readiness
        const updateStatus = () => {
            const status = this.aiEngine.getModelStatus();
            const allReady = Object.values(status).every(s => s);
            indicator.classList.toggle('ai-ready', allReady);
        };

        updateStatus();
        setInterval(updateStatus, 5000);

        return indicator;
    }

    createAIInsightsToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'ai-insights-toggle';
        toggle.innerHTML = `
            <span class="toggle-icon">🤖</span>
            <span class="toggle-text">AI Insights</span>
        `;
        
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            document.body.classList.toggle('ai-insights-enabled');
            this.toggleAIInsights();
        });

        return toggle;
    }

    enhanceTransactionList() {
        const transactionList = document.querySelector('.transaction-list');
        if (!transactionList) return;

        // Add AI insights to each transaction
        const transactions = transactionList.querySelectorAll('.transaction-item');
        transactions.forEach(transaction => {
            this.addTransactionAIInsights(transaction);
        });
    }

    addTransactionAIInsights(transactionElement) {
        const transactionId = transactionElement.dataset.id;
        const transaction = this.getTransactionById(transactionId);
        
        if (!transaction) return;

        // Add AI category confidence
        const categoryElement = transactionElement.querySelector('.transaction-category');
        if (categoryElement) {
            const confidence = this.calculateCategoryConfidence(transaction);
            categoryElement.innerHTML += `
                <span class="ai-confidence" title="AI Confidence: ${confidence}%">
                    ${confidence > 80 ? '✅' : confidence > 60 ? '⚠️' : '❓'}
                </span>
            `;
        }

        // Add anomaly indicator
        if (transaction.isAnomaly) {
            transactionElement.classList.add('anomaly-transaction');
            transactionElement.innerHTML += `
                <div class="anomaly-indicator" title="Unusual transaction detected">
                    ⚠️
                </div>
            `;
        }
    }

    enhanceCharts() {
        // Add predictive overlays to existing charts
        this.addPredictiveOverlay();
        this.addAnomalyMarkers();
    }

    addPredictiveOverlay() {
        const spendingChart = document.querySelector('#spending-chart');
        if (spendingChart) {
            this.createPredictiveChart(spendingChart);
        }
    }

    createPredictiveChart(container) {
        const canvas = document.createElement('canvas');
        canvas.id = 'predictive-chart';
        canvas.className = 'ai-chart-overlay';
        
        container.appendChild(canvas);
        
        // Draw predictive line
        this.drawPredictiveLine(canvas);
    }

    drawPredictiveLine(canvas) {
        const ctx = canvas.getContext('2d');
        const predictions = this.getSpendingPredictions();
        
        // Implementation depends on charting library
        // This is a placeholder for actual chart integration
    }

    addAIWidgets() {
        this.addSpendingPredictorWidget();
        this.addAnomalyDetectorWidget();
        this.addSmartRecommendationsWidget();
        this.addNaturalLanguageQueryWidget();
    }

    addSpendingPredictorWidget() {
        const widget = document.createElement('div');
        widget.className = 'ai-widget spending-predictor';
        widget.innerHTML = `
            <h3>💰 Spending Predictions</h3>
            <div class="prediction-content">
                <div class="prediction-item">
                    <span class="prediction-label">Next 7 days:</span>
                    <span class="prediction-value" id="prediction-7days">$0</span>
                </div>
                <div class="prediction-item">
                    <span class="prediction-label">Next 30 days:</span>
                    <span class="prediction-value" id="prediction-30days">$0</span>
                </div>
                <div class="prediction-chart" id="prediction-chart"></div>
            </div>
        `;

        this.addWidgetToDashboard(widget, 'top-right');
        this.updatePredictions();
    }

    addAnomalyDetectorWidget() {
        const widget = document.createElement('div');
        widget.className = 'ai-widget anomaly-detector';
        widget.innerHTML = `
            <h3>🔍 Anomaly Detection</h3>
            <div class="anomaly-content">
                <div class="anomaly-summary">
                    <span class="anomaly-count" id="anomaly-count">0</span>
                    <span class="anomaly-label">unusual transactions</span>
                </div>
                <div class="anomaly-list" id="anomaly-list"></div>
            </div>
        `;

        this.addWidgetToDashboard(widget, 'bottom-left');
        this.updateAnomalies();
    }

    addSmartRecommendationsWidget() {
        const widget = document.createElement('div');
        widget.className = 'ai-widget smart-recommendations';
        widget.innerHTML = `
            <h3>🎯 Smart Recommendations</h3>
            <div class="recommendations-content">
                <div class="recommendations-list" id="recommendations-list">
                    <div class="recommendation-item loading">
                        Loading recommendations...
                    </div>
                </div>
            </div>
        `;

        this.addWidgetToDashboard(widget, 'bottom-right');
        this.updateRecommendations();
    }

    addNaturalLanguageQueryWidget() {
        const widget = document.createElement('div');
        widget.className = 'ai-widget nlp-query';
        widget.innerHTML = `
            <h3>🗣️ Ask AI</h3>
            <div class="nlp-content">
                <input type="text" 
                       id="nlp-input" 
                       placeholder="Ask about your spending..." 
                       class="nlp-input">
                <button id="nlp-submit" class="nlp-submit">Ask</button>
                <div class="nlp-response" id="nlp-response"></div>
            </div>
        `;

        this.addWidgetToDashboard(widget, 'center');
        this.setupNLPHandlers();
    }

    addWidgetToDashboard(widget, position) {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            widget.dataset.position = position;
            container.appendChild(widget);
            this.widgets.set(position, widget);
        }
    }

    setupEventListeners() {
        // Listen for new transactions
        document.addEventListener('transactionAdded', (e) => {
            this.handleNewTransaction(e.detail);
        });

        // Listen for AI alerts
        document.addEventListener('aiAlert', (e) => {
            this.handleAIAlert(e.detail);
        });

        // Listen for real-time updates
        setInterval(() => {
            this.updateAllWidgets();
        }, 30000); // Update every 30 seconds
    }

    async handleNewTransaction(transaction) {
        const result = await this.aiEngine.processNewTransaction(transaction);
        
        if (result.isAnomaly) {
            this.showAnomalyNotification(result.transaction);
        }

        this.updateAllWidgets();
    }

    handleAIAlert(alert) {
        this.showNotification(alert);
    }

    showAnomalyNotification(transaction) {
        const notification = document.createElement('div');
        notification.className = 'ai-notification anomaly-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>Unusual Transaction Detected</h4>
                <p>${transaction.merchant}: $${Math.abs(transaction.amount)}</p>
                <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showNotification(alert) {
        const notification = document.createElement('div');
        notification.className = 'ai-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
                <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    async updatePredictions() {
        const predictions = await this.aiEngine.getInsights('month');
        
        // Update prediction widgets
        const prediction7Days = document.getElementById('prediction-7days');
        const prediction30Days = document.getElementById('prediction-30days');
        
        if (prediction7Days) {
            prediction7Days.textContent = `$${predictions.spending?.next7Days || 0}`;
        }
        
        if (prediction30Days) {
            prediction30Days.textContent = `$${predictions.spending?.next30Days || 0}`;
        }
    }

    async updateAnomalies() {
        const anomalies = await this.aiEngine.getInsights('month');
        const anomalyCount = document.getElementById('anomaly-count');
        const anomalyList = document.getElementById('anomaly-list');
        
        if (anomalyCount) {
            anomalyCount.textContent = anomalies.anomalies?.length || 0;
        }
        
        if (anomalyList) {
            anomalyList.innerHTML = anomalies.anomalies?.slice(0, 3).map(anomaly => `
                <div class="anomaly-item">
                    <span class="anomaly-merchant">${anomaly.merchant}</span>
                    <span class="anomaly-amount">$${Math.abs(anomaly.amount)}</span>
                </div>
            `).join('') || '<div class="no-anomalies">No anomalies detected</div>';
        }
    }

    async updateRecommendations() {
        const recommendations = await this.aiEngine.getInsights('month');
        const recommendationsList = document.getElementById('recommendations-list');
        
        if (recommendationsList) {
            recommendationsList.innerHTML = recommendations.recommendations?.map(rec => `
                <div class="recommendation-item ${rec.type}">
                    <div class="recommendation-icon">${this.getRecommendationIcon(rec.type)}</div>
                    <div class="recommendation-content">
                        <h4>${rec.title}</h4>
                        <p>${rec.message}</p>
                        <button onclick="this.handleRecommendation('${rec.action}')">View Details</button>
                    </div>
                </div>
            `).join('') || '<div class="no-recommendations">No recommendations at this time</div>';
        }
    }

    getRecommendationIcon(type) {
        const icons = {
            budget: '💰',
            pattern: '📊',
            anomaly: '⚠️',
            savings: '🏦',
            investment: '📈'
        };
        return icons[type] || '💡';
    }

    setupNLPHandlers() {
        const nlpInput = document.getElementById('nlp-input');
        const nlpSubmit = document.getElementById('nlp-submit');
        const nlpResponse = document.getElementById('nlp-response');

        if (!nlpInput || !nlpSubmit || !nlpResponse) return;

        const handleQuery = async () => {
            const query = nlpInput.value.trim();
            if (!query) return;

            nlpResponse.innerHTML = '<div class="nlp-loading">Processing...</div>';
            
            try {
                const result = await this.aiEngine.processNaturalLanguage(query);
                this.displayNLPResult(result, nlpResponse);
            } catch (error) {
                nlpResponse.innerHTML = `<div class="nlp-error">Error: ${error.message}</div>`;
            }
        };

        nlpSubmit.addEventListener('click', handleQuery);
        nlpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleQuery();
        });
    }

    displayNLPResult(result, container) {
        container.innerHTML = `
            <div class="nlp-result ${result.type}">
                <div class="result-content">
                    ${this.formatNLPResult(result)}
                </div>
            </div>
        `;
    }

    formatNLPResult(result) {
        switch (result.type) {
            case 'spending_result':
                return `
                    <h4>Spending for ${result.category}</h4>
                    <p>Total: $${result.amount}</p>
                    <p>Period: ${result.timeframe}</p>
                `;
            case 'category_breakdown':
                return `
                    <h4>Category Breakdown</h4>
                    <ul>
                        ${result.categories.map(cat => `
                            <li>${cat.name}: $${cat.amount}</li>
                        `).join('')}
                    </ul>
                `;
            case 'anomaly_list':
                return `
                    <h4>Detected Anomalies</h4>
                    <ul>
                        ${result.anomalies.map(anomaly => `
                            <li>${anomaly.merchant}: $${Math.abs(anomaly.amount)}</li>
                        `).join('')}
                    </ul>
                `;
            default:
                return `<p>${result.message}</p>`;
        }
    }

    updateAllWidgets() {
        this.updatePredictions();
        this.updateAnomalies();
        this.updateRecommendations();
    }

    toggleAIInsights() {
        document.body.classList.toggle('ai-insights-visible');
    }

    getTransactionById(id) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        return transactions.find(t => t.id === id);
    }

    handleRecommendation(action) {
        switch (action) {
            case 'review-budget':
                // Navigate to budget page
                window.location.href = 'budget.html';
                break;
            case 'view-details':
                // Show detailed view
                this.showDetailedInsights();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    showDetailedInsights() {
        // Create modal with detailed insights
        const modal = document.createElement('div');
        modal.className = 'ai-insights-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Detailed AI Insights</h2>
                <div class="insights-content">
                    <!-- Detailed insights will be populated here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }
}

// Initialize AI Dashboard Enhancer
document.addEventListener('DOMContentLoaded', async () => {
    const enhancer = new AIDashboardEnhancer();
    await enhancer.initialize();
});
