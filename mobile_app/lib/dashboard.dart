import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:syncfusion_flutter_gauges/gauges.dart';
import 'package:intl/intl.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'input.dart' show InputScreen;

// Data Models for Firestore documents
class TransactionModel {
  final String id;
  final double amount;
  final String category;
  final DateTime date;
  final String type;
  final String? comment;
  final bool isTemplate;

  TransactionModel({
    required this.id,
    required this.amount,
    required this.category,
    required this.date,
    required this.type,
    this.comment,
    this.isTemplate = false,
  });

  factory TransactionModel.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return TransactionModel(
      id: doc.id,
      amount: (data['amount'] ?? 0.0).toDouble(),
      category: data['category'] ?? 'Uncategorized',
      // Firestore timestamp or string date handling
      date: (data['date'] is Timestamp)
          ? (data['date'] as Timestamp).toDate()
          : DateTime.tryParse(data['date'] ?? '') ?? DateTime.now(),
      type: data['type'] ?? 'Expense',
      comment: data['comment'],
      isTemplate: data['isTemplate'] ?? false,
    );
  }
}

class BudgetModel {
  final String id;
  final String name;
  final double amount;
  final String category;
  final DateTime fromDate;
  final DateTime toDate;

  BudgetModel({
    required this.id,
    required this.name,
    required this.amount,
    required this.category,
    required this.fromDate,
    required this.toDate,
  });

  factory BudgetModel.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return BudgetModel(
      id: doc.id,
      name: data['name'] ?? 'Untitled Budget',
      amount: (data['amount'] ?? 0.0).toDouble(),
      category: data['category'] ?? '',
      fromDate: (data['fromDate'] as Timestamp).toDate(),
      toDate: (data['toDate'] as Timestamp).toDate(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<TransactionModel> _allTransactions = [];
  List<TransactionModel> _filteredTransactions = [];

  // Filter controllers
  DateTime? _fromDate;
  DateTime? _toDate;
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _auth.authStateChanges().listen((user) {
      if (user == null) {
        // Handle user being logged out, e.g., navigate to login screen
        // Navigator.of(context).pushReplacement(...);
      } else {
        // Set initial date range for the current billing cycle (example: 10th to 9th)
        _resetToCurrentCycle();
      }
    });
  }

  // Resets the date filter to the user's current billing cycle
  void _resetToCurrentCycle() {
    // This logic can be enhanced by fetching a cycle day from user preferences
    final now = DateTime.now();
    const cycleDay = 10;

    DateTime start;
    DateTime end;

    if (now.day >= cycleDay) {
      start = DateTime(now.year, now.month, cycleDay);
      end = DateTime(now.year, now.month + 1, cycleDay - 1);
    } else {
      start = DateTime(now.year, now.month - 1, cycleDay);
      end = DateTime(now.year, now.month, cycleDay - 1);
    }

    setState(() {
      _fromDate = start;
      _toDate = end;
    });
  }

  // Applies filters to the transaction list
  void _applyFilters() {
    List<TransactionModel> filtered = _allTransactions.where((tx) {
      final txDate = tx.date;
      if (_fromDate != null && txDate.isBefore(_fromDate!)) return false;
      // Add 1 day to _toDate to include the whole day
      if (_toDate != null &&
          txDate.isAfter(_toDate!.add(const Duration(days: 1)))) {
        return false;
      }
      if (_selectedCategory != null && tx.category != _selectedCategory) {
        return false;
      }
      return true;
    }).toList();

    setState(() {
      _filteredTransactions = filtered;
    });
  }

  // Method to show a date picker
  Future<void> _selectDate(BuildContext context, bool isFromDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: (isFromDate ? _fromDate : _toDate) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isFromDate) {
          _fromDate = picked;
        } else {
          _toDate = picked;
        }
        _applyFilters();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    if (user == null) {
      return const Scaffold(body: Center(child: Text("Please log in.")));
    }

    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/logo-head.png',
            height: 40), // Make sure to add this asset
        backgroundColor: Theme.of(context).primaryColor,
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {/* Navigate to Profile */},
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await _auth.signOut();
            },
          ),
        ],
      ),
      // A Drawer can be used for the navigation items from the HTML
      drawer: _buildAppDrawer(),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore
            .collection('users')
            .doc(user.uid)
            .collection('transactions')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text("No transactions yet. Add one!"));
          }

          _allTransactions = snapshot.data!.docs
              .map((doc) => TransactionModel.fromFirestore(doc))
              .toList();

          // Apply filters whenever data changes
          _applyFilters();

          return _buildDashboardContent(user.uid);
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to Add Transaction screen
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const InputScreen()),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildDashboardContent(String userId) {
    // Calculate summaries
    double totalIncome = _filteredTransactions
        .where((tx) => tx.type == 'Income')
        .fold(0.0, (sum, item) => sum + item.amount);
    double totalExpense = _filteredTransactions
        .where((tx) => tx.type == 'Expense')
        .fold(0.0, (sum, item) => sum + item.amount);

    return RefreshIndicator(
      onRefresh: () async {/* Can be used to manually refresh data */},
      child: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildFilterSection(),
          const SizedBox(height: 24),
          const Text("Budgets Overview",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          _buildBudgetsOverview(userId),
          const SizedBox(height: 24),
          const Text("Quick Add",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          _buildQuickAddTemplates(userId),
          const SizedBox(height: 24),
          _buildSummaryCards(totalIncome, totalExpense),
          const SizedBox(height: 24),
          _buildCharts(),
          const SizedBox(height: 24),
          const Text("Recent Transactions",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          _buildRecentTransactions(),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    final categories =
        _allTransactions.map((tx) => tx.category).toSet().toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(child: _buildDateFilterChip("From", _fromDate, true)),
                const SizedBox(width: 10),
                Expanded(child: _buildDateFilterChip("To", _toDate, false)),
              ],
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              hint: const Text("All Categories"),
              onChanged: (value) {
                setState(() {
                  _selectedCategory = value;
                  _applyFilters();
                });
              },
              items: categories
                  .map((cat) => DropdownMenuItem(value: cat, child: Text(cat)))
                  .toList(),
              decoration: const InputDecoration(border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8.0,
              runSpacing: 4.0,
              children: [
                ElevatedButton(
                    onPressed: _applyFilters, child: const Text("Apply")),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _fromDate = null;
                      _toDate = null;
                      _selectedCategory = null;
                    });
                    _applyFilters();
                  },
                  child: const Text("Clear"),
                ),
                TextButton(
                    onPressed: _resetToCurrentCycle,
                    child: const Text("Current Cycle")),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDateFilterChip(String label, DateTime? date, bool isFrom) {
    return ActionChip(
      avatar: const Icon(Icons.calendar_today),
      label:
          Text(date != null ? DateFormat('MMM d, yyyy').format(date) : label),
      onPressed: () => _selectDate(context, isFrom),
    );
  }

  Widget _buildBudgetsOverview(String userId) {
    return StreamBuilder<QuerySnapshot>(
      stream: _firestore
          .collection('users')
          .doc(userId)
          .collection('budgets')
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());
        if (snapshot.data!.docs.isEmpty) {
          return const Center(child: Text("No budgets set."));
        }

        final budgets = snapshot.data!.docs
            .map((doc) => BudgetModel.fromFirestore(doc))
            .toList();

        return SizedBox(
          height: 150,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: budgets.length,
            itemBuilder: (context, index) {
              final budget = budgets[index];
              final spent = _allTransactions
                  .where((tx) =>
                      tx.category == budget.category && tx.type == 'Expense')
                  .fold(0.0, (sum, item) => sum + item.amount);

              double pointerValue =
                  (spent > budget.amount) ? budget.amount : spent;

              return Container(
                width: 150,
                margin: const EdgeInsets.only(right: 16),
                child: Column(
                  children: [
                    Expanded(
                      child: SfRadialGauge(
                        axes: <RadialAxis>[
                          RadialAxis(
                            minimum: 0,
                            maximum: budget.amount,
                            showLabels: false,
                            showTicks: false,
                            axisLineStyle: const AxisLineStyle(
                                thickness: 0.2,
                                thicknessUnit: GaugeSizeUnit.factor),
                            pointers: <GaugePointer>[
                              RangePointer(
                                value: pointerValue,
                                width: 0.2,
                                sizeUnit: GaugeSizeUnit.factor,
                                color: spent > budget.amount
                                    ? Colors.red
                                    : Colors.green,
                              )
                            ],
                            annotations: <GaugeAnnotation>[
                              GaugeAnnotation(
                                widget: Text(
                                  '${((spent / budget.amount) * 100).toStringAsFixed(0)}%',
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold),
                                ),
                                angle: 90,
                                positionFactor: 0.5,
                              )
                            ],
                          ),
                        ],
                      ),
                    ),
                    Text(budget.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildQuickAddTemplates(String userId) {
    // In a real app, templates would be transactions marked with 'isTemplate: true'
    // This is a placeholder for the UI.
    return SizedBox(
      height: 70,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildTemplateCard("Salary", 50000, true),
          _buildTemplateCard("Groceries", 2500, false),
          _buildTemplateCard("Rent", 15000, false),
          _buildTemplateCard("Fuel", 2000, false),
        ],
      ),
    );
  }

  Widget _buildTemplateCard(String category, double amount, bool isIncome) {
    return InkWell(
      onTap: () {
        // Prefill and navigate to Add Transaction screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => InputScreen(
              initialType: isIncome ? 'Income' : 'Expense',
              initialCategory: category,
              initialAmount: amount,
            ),
          ),
        );
      },
      child: Container(
        width: 140,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: isIncome
                ? [Colors.green.shade600, Colors.green.shade800]
                : [Colors.grey.shade700, Colors.grey.shade800],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(category,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.white)),
              Text(NumberFormat.simpleCurrency(locale: 'en_IN').format(amount),
                  style: const TextStyle(color: Colors.white70)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCards(double income, double expense) {
    double balance = income - expense;
    return Row(
      children: [
        Expanded(child: _summaryCard("Income", income, Colors.green)),
        const SizedBox(width: 12),
        Expanded(child: _summaryCard("Expense", expense, Colors.red)),
        const SizedBox(width: 12),
        Expanded(
            child: _summaryCard("Balance", balance,
                balance >= 0 ? Colors.blue : Colors.orange)),
      ],
    );
  }

  Widget _summaryCard(String title, double amount, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(title,
                style: const TextStyle(fontSize: 14, color: Colors.grey)),
            const SizedBox(height: 4),
            Text(
              NumberFormat.simpleCurrency(locale: 'en_IN', decimalDigits: 2)
                  .format(amount),
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCharts() {
    Map<String, double> incomeData = {};
    _filteredTransactions.where((tx) => tx.type == 'Income').forEach((tx) {
      incomeData[tx.category] = (incomeData[tx.category] ?? 0) + tx.amount;
    });

    Map<String, double> expenseData = {};
    _filteredTransactions.where((tx) => tx.type == 'Expense').forEach((tx) {
      expenseData[tx.category] = (expenseData[tx.category] ?? 0) + tx.amount;
    });

    return Row(
      children: [
        Expanded(child: _pieChartCard("Income", incomeData)),
        const SizedBox(width: 16),
        Expanded(child: _pieChartCard("Expense", expenseData)),
      ],
    );
  }

  Widget _pieChartCard(String title, Map<String, double> data) {
    final List<Color> colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal
    ];
    int colorIndex = 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 150,
              child: data.isEmpty
                  ? const Center(child: Text("No data"))
                  : PieChart(
                      PieChartData(
                        sections: data.entries.map((entry) {
                          final color = colors[colorIndex++ % colors.length];
                          return PieChartSectionData(
                            color: color,
                            value: entry.value,
                            title:
                                '${(entry.value / data.values.fold(0.0, (a, b) => a + b) * 100).toStringAsFixed(0)}%',
                            radius: 50,
                            titleStyle: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.white),
                          );
                        }).toList(),
                        sectionsSpace: 2,
                        centerSpaceRadius: 40,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentTransactions() {
    // Sort all transactions by date and take the last 10
    _allTransactions.sort((a, b) => b.date.compareTo(a.date));
    final recent = _allTransactions.take(10).toList();

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: recent.length,
      itemBuilder: (context, index) {
        final tx = recent[index];
        final isIncome = tx.type == 'Income';
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(
            side: BorderSide(
                color: isIncome ? Colors.green : Colors.red, width: 2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: ListTile(
            leading: Icon(
              isIncome ? FontAwesomeIcons.arrowUp : FontAwesomeIcons.arrowDown,
              color: isIncome ? Colors.green : Colors.red,
            ),
            title: Text(tx.category),
            subtitle: Text(DateFormat('MMM d, yyyy').format(tx.date)),
            trailing: Text(
              '${isIncome ? '+' : '-'} ${NumberFormat.simpleCurrency(locale: 'en_IN').format(tx.amount)}',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isIncome ? Colors.green : Colors.red,
              ),
            ),
          ),
        );
      },
    );
  }

  Drawer _buildAppDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Colors.deepPurple),
            child: Text('MindPay',
                style: TextStyle(color: Colors.white, fontSize: 24)),
          ),
          ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Home'),
              onTap: () => Navigator.pop(context)),
          ListTile(
              leading: const Icon(Icons.add_circle),
              title: const Text('Add Transaction'),
              onTap: () {
                Navigator.pop(context); // Close the drawer first
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const InputScreen()),
                );
              }),
          ListTile(
              leading: const Icon(Icons.list),
              title: const Text('All Transactions'),
              onTap: () {/* Nav */}),
          ListTile(
              leading: const Icon(Icons.insert_drive_file),
              title: const Text('Templates'),
              onTap: () {/* Nav */}),
          ListTile(
              leading: const Icon(Icons.pie_chart),
              title: const Text('Budget'),
              onTap: () {/* Nav */}),
          ListTile(
              leading: const Icon(Icons.show_chart),
              title: const Text('Analyze'),
              onTap: () {/* Nav */}),
        ],
      ),
    );
  }
}
