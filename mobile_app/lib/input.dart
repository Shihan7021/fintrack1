import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';

// Note: Camera and ML Kit require platform-specific setup (Info.plist, build.gradle)
// import 'package:camera/camera.dart';
// import 'package:google_ml_kit_text_recognition/google_ml_kit_text_recognition.dart';

// Data model (can be moved to a separate file)
class TransactionModel {
  final String type;
  final String category;
  final double amount;
  final DateTime date;
  final String? comment;
  final bool isTemplate;
  final bool isRecurring;
  // Add other fields as needed for recurring transactions

  TransactionModel({
    required this.type,
    required this.category,
    required this.amount,
    required this.date,
    this.comment,
    this.isTemplate = false,
    this.isRecurring = false,
  });

  Map<String, dynamic> toFirestore() {
    return {
      'type': type,
      'category': category,
      'amount': amount,
      'date': Timestamp.fromDate(date),
      'comment': comment,
      'isTemplate': isTemplate,
      'isRecurring': isRecurring,
    };
  }
}

class InputScreen extends StatefulWidget {
  // Used for pre-filling the form from a template
  final String? initialType;
  final String? initialCategory;
  final double? initialAmount;

  const InputScreen({
    super.key,
    this.initialType,
    this.initialCategory,
    this.initialAmount,
  });

  @override
  State<InputScreen> createState() => _InputScreenState();
}

class _InputScreenState extends State<InputScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _commentController = TextEditingController();
  final _instancesController =
      TextEditingController(text: '12'); // Default instances

  String _selectedType = 'Expense';
  String? _selectedCategory;
  DateTime _selectedDate = DateTime.now();
  bool _isRecurring = false;
  bool _isTemplate = false;
  String _selectedFrequency = 'Monthly';
  bool _isLoading = false;

  final List<String> _incomeCategories = [
    "Salary",
    "Gift",
    "Bonus",
    "Interest",
    "Business Income",
    "Others"
  ];
  final List<String> _expenseCategories = [
    "Food",
    "Transport",
    "Utilities",
    "Health",
    "Clothing",
    "Household",
    "Entertainment",
    "Others"
  ];
  List<String> _currentCategories = [];

  @override
  void initState() {
    super.initState();
    _updateCategoryList();

    // Pre-fill form if initial data is provided (from templates)
    if (widget.initialType != null) {
      _selectedType = widget.initialType!;
      _updateCategoryList(); // Update categories based on the type
    }
    if (widget.initialCategory != null &&
        _currentCategories.contains(widget.initialCategory)) {
      _selectedCategory = widget.initialCategory!;
    }
    if (widget.initialAmount != null) {
      _amountController.text = widget.initialAmount!.toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _commentController.dispose();
    _instancesController.dispose();
    super.dispose();
  }

  void _updateCategoryList() {
    setState(() {
      _currentCategories =
          _selectedType == 'Income' ? _incomeCategories : _expenseCategories;
      // If the selected category is not in the new list, reset it
      if (!_currentCategories.contains(_selectedCategory)) {
        _selectedCategory = null;
      }
    });
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submitTransaction() async {
    if (!_formKey.currentState!.validate()) {
      return; // Invalid form
    }
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please select a category.'),
            backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('You must be logged in.'),
            backgroundColor: Colors.red),
      );
      setState(() => _isLoading = false);
      return;
    }

    final transactionsRef = FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('transactions');

    try {
      if (_isRecurring) {
        // Handle recurring transactions with a batch write
        final instances = int.tryParse(_instancesController.text) ?? 0;
        if (instances <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Instances must be a positive number.'),
                backgroundColor: Colors.red),
          );
          return;
        }

        final batch = FirebaseFirestore.instance.batch();
        for (int i = 0; i < instances; i++) {
          DateTime transactionDate = _selectedDate;
          if (_selectedFrequency == 'Daily')
            transactionDate = _selectedDate.add(Duration(days: i));
          if (_selectedFrequency == 'Weekly')
            transactionDate = _selectedDate.add(Duration(days: i * 7));
          if (_selectedFrequency == 'Monthly')
            transactionDate = DateTime(
                _selectedDate.year, _selectedDate.month + i, _selectedDate.day);

          final transaction = TransactionModel(
            type: _selectedType,
            category: _selectedCategory!,
            amount: double.parse(_amountController.text),
            date: transactionDate,
            comment: _commentController.text,
            isTemplate: _isTemplate,
            isRecurring: true,
          );
          batch.set(transactionsRef.doc(), transaction.toFirestore());
        }
        await batch.commit();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Successfully added $instances recurring transactions!'),
              backgroundColor: Colors.green),
        );
      } else {
        // Handle single transaction
        final transaction = TransactionModel(
          type: _selectedType,
          category: _selectedCategory!,
          amount: double.parse(_amountController.text),
          date: _selectedDate,
          comment: _commentController.text,
          isTemplate: _isTemplate,
        );
        await transactionsRef.add(transaction.toFirestore());
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Transaction added successfully!'),
              backgroundColor: Colors.green),
        );
      }

      // Reset form and navigate back
      _formKey.currentState!.reset();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Failed to add transaction: $e'),
            backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Placeholder for OCR logic
  void _scanReceipt() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('OCR feature coming soon!')),
    );
    // 1. Navigate to a new screen with the camera preview.
    // 2. Capture image.
    // 3. Process with google_ml_kit_text_recognition.
    // 4. Extract amount, date, category with Regex.
    // 5. Return data to this screen and pre-fill controllers.
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Transaction'),
        backgroundColor: Theme.of(context).primaryColor,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Add Transaction',
                        style: Theme.of(context).textTheme.headlineSmall),
                    const Spacer(),
                    ElevatedButton.icon(
                      onPressed: _scanReceipt,
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Scan'),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Type
                DropdownButtonFormField<String>(
                  value: _selectedType,
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedType = value;
                        _updateCategoryList();
                      });
                    }
                  },
                  items: ['Expense', 'Income']
                      .map((type) =>
                          DropdownMenuItem(value: type, child: Text(type)))
                      .toList(),
                  decoration: const InputDecoration(
                      labelText: 'Type', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                // Category
                DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  hint: const Text('Select a category'),
                  onChanged: (value) {
                    if (value != null)
                      setState(() => _selectedCategory = value);
                  },
                  items: _currentCategories
                      .map((cat) =>
                          DropdownMenuItem(value: cat, child: Text(cat)))
                      .toList(),
                  decoration: const InputDecoration(
                      labelText: 'Category', border: OutlineInputBorder()),
                  validator: (value) =>
                      value == null ? 'Please select a category' : null,
                ),
                const SizedBox(height: 16),
                // Amount
                TextFormField(
                  controller: _amountController,
                  decoration: const InputDecoration(
                      labelText: 'Amount',
                      border: OutlineInputBorder(),
                      prefixText: "\$ "),
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  validator: (value) {
                    if (value == null ||
                        value.isEmpty ||
                        double.tryParse(value) == null ||
                        double.parse(value) <= 0) {
                      return 'Please enter a valid amount';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                // Date
                TextFormField(
                  readOnly: true,
                  controller: TextEditingController(
                      text: DateFormat('MMMM d, yyyy').format(_selectedDate)),
                  decoration: const InputDecoration(
                    labelText: 'Date',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                  onTap: () => _selectDate(context),
                ),
                const SizedBox(height: 16),
                // Comment
                TextFormField(
                  controller: _commentController,
                  decoration: const InputDecoration(
                      labelText: 'Comment (Optional)',
                      border: OutlineInputBorder()),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                // Checkboxes
                CheckboxListTile(
                  title: const Text('Recurring Transaction'),
                  value: _isRecurring,
                  onChanged: (value) => setState(() => _isRecurring = value!),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                ),
                CheckboxListTile(
                  title: const Text('Save as Template'),
                  value: _isTemplate,
                  onChanged: (value) => setState(() => _isTemplate = value!),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                ),
                // Recurring Options
                if (_isRecurring)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade400),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _selectedFrequency,
                            items: ['Daily', 'Weekly', 'Monthly']
                                .map((f) =>
                                    DropdownMenuItem(value: f, child: Text(f)))
                                .toList(),
                            onChanged: (value) =>
                                setState(() => _selectedFrequency = value!),
                            decoration:
                                const InputDecoration(labelText: 'Frequency'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _instancesController,
                            decoration:
                                const InputDecoration(labelText: 'Instances'),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 24),
                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitTransaction,
                    style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16)),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Add Transaction'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
