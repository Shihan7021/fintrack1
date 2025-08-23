// AI-Powered Financial Intelligence Module
class FinancialIntelligence {
    constructor(transactions) {
        this.transactions = transactions;
        this.models = {
            spending: null,
            income: null,
            anomaly: null
        };
    }

    // Predict next month's spending by category
    predictSpendingByCategory() {
        const monthlyData = this.getMonthlySpendingData();
        const predictions = {};
        
        Object.keys(monthlyData).forEach(category => {
            const data = monthlyData[category];
            if (data.length >= 3) {
                // Simple linear regression for prediction
                const trend = this.calculateTrend(data);
                const lastAmount = data[data.length - 1].amount;
                predictions[category] = Math.max(0, lastAmount + trend);
            }
        });
        
        return predictions;
    }

    // Detect anomalous transactions
    detectAnomalies() {
        const stats = this.calculateTransactionStats();
        const anomalies = [];
        
        this.transactions.forEach(transaction => {
            const categoryStats = stats.byCategory[transaction.category];
            if (categoryStats) {
                const zScore = Math.abs((transaction.amount - categoryStats.mean) / categoryStats.stdDev);
                if (zScore > 2.5) {
                    anomalies.push({
                        transaction,
                        severity: zScore,
                        reason: `${transaction.category} amount is ${zScore.toFixed(1)} standard deviations from mean`
                    });
                }
            }
        });
        
        return anomalies;
    }

    // Generate smart budget recommendations
    generateBudgetRecommendations() {
        const spending = this.getSpendingByCategory();
        const income = this.getTotalIncome();
        const recommendations = [];
        
        Object.keys(spending).forEach(category => {
            const currentSpending = spending[category];
            const recommended = this.calculateOptimalBudget(category, currentSpending, income);
            
            if (Math.abs(currentSpending - recommended) > income * 0.05) {
                recommendations.push({
                    category,
                    current: currentSpending,
                    recommended,
                    savings: currentSpending - recommended,
                    percentage: ((currentSpending - recommended) / currentSpending * 100).toFixed(1)
                });
            }
        });
        
        return recommendations;
    }

    // Calculate savings potential
    calculateSavingsPotential() {
        const spending = this.getSpendingByCategory();
        const income = this.getTotalIncome();
        let totalSavings = 0;
        
        Object.keys(spending).forEach(category => {
            const optimal = this.calculateOptimalBudget(category, spending[category], income);
            totalSavings += Math.max(0, spending[category] - optimal);
        });
        
        return {
            totalPotential: totalSavings,
            percentage: (totalSavings / income * 100).toFixed(1),
            monthlyImpact: totalSavings / 12
        };
    }

    // Helper methods
    getMonthlySpendingData() {
        const data = {};
        this.transactions
            .filter(t => t.type === 'Expense')
            .forEach(t => {
                const month = t.date.substring(0, 7);
                if (!data[t.category]) data[t.category] = [];
                data[t.category].push({ month, amount: parseFloat(t.amount) });
            });
        return data;
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;
        const recent = data.slice(-3);
        const changes = [];
        for (let i = 1; i < recent.length; i++) {
            changes.push(recent[i].amount - recent[i-1].amount);
        }
        return changes.reduce((a, b) => a + b, 0) / changes.length;
    }

    calculateTransactionStats() {
        const stats = { byCategory: {} };
        
        this.transactions.forEach(t => {
            if (!stats.byCategory[t.category]) {
                stats.byCategory[t.category] = { amounts: [] };
            }
            stats.byCategory[t.category].amounts.push(parseFloat(t.amount));
        });
        
        Object.keys(stats.byCategory).forEach(category => {
            const amounts = stats.byCategory[category].amounts;
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
            stats.byCategory[category] = { mean, stdDev: Math.sqrt(variance) };
        });
        
        return stats;
    }

    getSpendingByCategory() {
        const spending = {};
        this.transactions
            .filter(t => t.type === 'Expense')
            .forEach(t => {
                spending[t.category] = (spending[t.category] || 0) + parseFloat(t.amount);
            });
        return spending;
    }

    getTotalIncome() {
        return this.transactions
            .filter(t => t.type === 'Income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }

    calculateOptimalBudget(category, currentSpending, totalIncome) {
        // Industry-standard budget percentages
        const budgetPercentages = {
            'Food': 0.10,
            'Transport': 0.15,
            'Entertainment': 0.05,
            'Shopping': 0.10,
            'Bills': 0.35,
            'Healthcare': 0.05,
            'Education': 0.10,
            'Other': 0.10
        };
        
        const percentage = budgetPercentages[category] || 0.10;
        return totalIncome * percentage;
    }
}

// Advanced Visualization Engine
class VisualizationEngine {
    constructor() {
        this.charts = {};
        this.colorSchemes = {
            modern: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
            warm: ['#f97316', '#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'],
            cool: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc']
        };
    }

    createHeatMap(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        const width = container.offsetWidth;
        const height = options.height || 300;
        
        const svg = this.createSVG(container, width, height);
        const cellSize = Math.min(width / data.length, height / 7);
        
        // Create heat map cells
        data.forEach((item, index) => {
            const intensity = this.calculateIntensity(item.value, data);
            const rect = this.createSVGElement('rect', {
                x: index * cellSize,
                y: 0,
                width: cellSize - 1,
                height: height,
                fill: this.getHeatColor(intensity),
                'data-tooltip': `${item.label}: ${item.value}`
            });
            
            rect.addEventListener('mouseenter', (e) => this.showTooltip(e, item));
            rect.addEventListener('mouseleave', () => this.hideTooltip());
            
            svg.appendChild(rect);
        });
        
        return svg;
    }

    createSankeyDiagram(containerId, data) {
        const container = document.getElementById(containerId);
        const width = container.offsetWidth;
        const height = 400;
        
        // Sankey diagram implementation
        const svg = this.createSVG(container, width, height);
        
        // Calculate node positions
        const nodes = this.calculateSankeyNodes(data);
        const links = this.calculateSankeyLinks(data, nodes);
        
        // Draw links
        links.forEach(link => {
            const path = this.createSankeyPath(link);
            svg.appendChild(path);
        });
        
        // Draw nodes
        nodes.forEach(node => {
            const rect = this.createSVGElement('rect', {
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                fill: this.colorSchemes.modern[node.index % this.colorSchemes.modern.length],
                stroke: '#fff',
                'stroke-width': 1
            });
            
            const text = this.createSVGElement('text', {
                x: node.x + node.width / 2,
                y: node.y + node.height / 2,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                fill: '#fff',
                'font-size': '12px'
            });
            text.textContent = node.name;
            
            svg.appendChild(rect);
            svg.appendChild(text);
        });
        
        return svg;
    }

    create3DPieChart(containerId, data) {
        const container = document.getElementById(containerId);
        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth;
        canvas.height = 300;
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        const depth = 20;
        
        let currentAngle = -Math.PI / 2;
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        // Draw 3D effect
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = this.colorSchemes.modern[index % this.colorSchemes.modern.length];
            
            // Draw depth
            ctx.fillStyle = this.darkenColor(color, 0.3);
            ctx.beginPath();
            ctx.arc(centerX, centerY + depth, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY + depth);
            ctx.closePath();
            ctx.fill();
            
            // Draw slice
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
        
        return canvas;
    }

    // Helper methods
    createSVG(container, width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.style.display = 'block';
        container.appendChild(svg);
        return svg;
    }

    createSVGElement(tag, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.keys(attributes).forEach(attr => {
            element.setAttribute(attr, attributes[attr]);
        });
        return element;
    }

    calculateIntensity(value, data) {
        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return (value - min) / (max - min);
    }

    getHeatColor(intensity) {
        const hue = (1 - intensity) * 240; // Red to blue
        return `hsl(${hue}, 70%, 50%)`;
    }

    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
    }

    calculateSankeyNodes(data) {
        // Implementation for calculating node positions
        const nodes = [];
        const nodeMap = new Map();
        
        data.forEach(item => {
            if (!nodeMap.has(item.source)) {
                nodeMap.set(item.source, { name: item.source, value: 0 });
            }
            if (!nodeMap.has(item.target)) {
                nodeMap.set(item.target, { name: item.target, value: 0 });
            }
            
            nodeMap.get(item.source).value += item.value;
            nodeMap.get(item.target).value += item.value;
        });
        
        return Array.from(nodeMap.values()).map((node, index) => ({
            ...node,
            index,
            x: index < nodeMap.size / 2 ? 50 : 350,
            y: 0,
            width: 30,
            height: Math.max(20, node.value / 10)
        }));
    }

    calculateSankeyLinks(data, nodes) {
        return data.map(item => {
            const sourceNode = nodes.find(n => n.name === item.source);
            const targetNode = nodes.find(n => n.name === item.target);
            
            return {
                source: sourceNode,
                target: targetNode,
                value: item.value
            };
        });
    }

    createSankeyPath(link) {
        const path = this.createSVGElement('path', {
            d: `M${link.source.x + link.source.width} ${link.source.y + link.source.height / 2} 
                C${(link.source.x + link.source.width + link.target.x) / 2} ${link.source.y + link.source.height / 2} 
                ${(link.source.x + link.source.width + link.target.x) / 2} ${link.target.y + link.target.height / 2} 
                ${link.target.x} ${link.target.y + link.target.height / 2}`,
            stroke: '#999',
            'stroke-width': Math.max(1, link.value / 10),
            fill: 'none',
            opacity: 0.6
        });
        
        return path;
    }

    showTooltip(event, data) {
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.innerHTML = data.tooltip || `${data.label}: ${data.value}`;
        tooltip.style.position = 'absolute';
        tooltip.style.background = 'rgba(0,0,0,0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px 10px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        
        document.body.appendChild(tooltip);
        
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }
}

// Performance Optimizer
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.virtualScroll = null;
    }

    // Implement virtual scrolling for large datasets
    setupVirtualScroll(containerId, items, itemHeight, renderItem) {
        const container = document.getElementById(containerId);
        const totalHeight = items.length * itemHeight;
        
        const viewport = document.createElement('div');
        viewport.style.height = '400px';
        viewport.style.overflow = 'auto';
        viewport.style.position = 'relative';
        
        const content = document.createElement('div');
        content.style.height = totalHeight + 'px';
        content.style.position = 'relative';
        
        const visibleItems = document.createElement('div');
        visibleItems.style.position = 'absolute';
        visibleItems.style.top = '0';
        visibleItems.style.left = '0';
        visibleItems.style.right = '0';
        
        viewport.appendChild(content);
        content.appendChild(visibleItems);
        container.appendChild(viewport);
        
        const updateVisibleItems = () => {
            const scrollTop = viewport.scrollTop;
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(
                startIndex + Math.ceil(viewport.clientHeight / itemHeight) + 1,
                items.length
            );
            
            visibleItems.innerHTML = '';
            visibleItems.style.top = (startIndex * itemHeight) + 'px';
            
            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(items[i], i);
                item.style.position = 'absolute';
                item.style.top = ((i - startIndex) * itemHeight) + 'px';
                item.style.left = '0';
                item.style.right = '0';
                item.style.height = itemHeight + 'px';
                visibleItems.appendChild(item);
            }
        };
        
        viewport.addEventListener('scroll', () => {
            requestAnimationFrame(updateVisibleItems);
        });
        
        updateVisibleItems();
        
        return {
            update: updateVisibleItems,
            destroy: () => {
                viewport.removeEventListener('scroll', updateVisibleItems);
                container.innerHTML = '';
            }
        };
    }

    // Debounce function calls
    debounce(key, func, delay) {
        return (...args) => {
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.set(key, setTimeout(() => {
                func.apply(this, args);
            }, delay));
        };
    }

    // Cache expensive calculations
    cacheResult(key, calculation) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        const result = calculation();
        this.cache.set(key, result);
        return result;
    }

    // Clear cache periodically
    clearCache() {
        this.cache.clear();
    }

    // Optimize chart rendering
    optimizeCharts(charts) {
        charts.forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.options.animation = false;
                chart.options.responsiveAnimationDuration = 0;
            }
        });
    }

    // Preload critical resources
    preloadResources() {
        const criticalResources = [
            'https://cdn.jsdelivr.net/npm/chart.js',
            'https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/justgage/1.6.1/justgage.min.js'
        ];
        
        criticalResources.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }
}

// Export for use in dashboard
window.FinancialIntelligence = FinancialIntelligence;
window.VisualizationEngine = VisualizationEngine;
window.PerformanceOptimizer = PerformanceOptimizer;
