# Firebase Setup Guide for FinTrack

## Security Rules Configuration

To fix the "Missing or insufficient permissions" error, you need to update your Firebase Firestore security rules:

### Step 1: Update Firestore Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database > Rules
4. Replace the existing rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions collection - users can only access their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Budgets collection - users can only access their own budgets
    match /budgets/{budgetId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Step 2: Enable Authentication
1. Go to Authentication > Get started
2. Enable Email/Password provider
3. Optionally enable Google Sign-In

### Step 3: Configure Firebase Config
Create a `firebase-config.js` file with your Firebase configuration:

```javascript
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

## Common Issues and Solutions

### 1. "Missing or insufficient permissions"
- **Cause**: Security rules are too restrictive
- **Solution**: Update Firestore rules as shown above

### 2. "Cannot read properties of null"
- **Cause**: DOM elements not found before JavaScript runs
- **Solution**: Ensure elements exist before accessing them (fixed in analyze.html)

### 3. Charts not loading
- **Cause**: Firebase data not accessible
- **Solution**: Check authentication state and security rules

## Testing the Setup

1. **Test Authentication**: Try logging in with a test account
2. **Test Data Access**: Add a test transaction and verify it appears
3. **Test Charts**: Navigate to the analyze page and check if charts load
4. **Test Permissions**: Try accessing data from different user accounts

## Development Tips

- Use Firebase Emulator Suite for local development
- Check browser console for detailed error messages
- Use Firebase Authentication state persistence for better UX
- Implement proper error handling for network issues

## Production Checklist

- [ ] Security rules are properly configured
- [ ] Authentication providers are enabled
- [ ] Firebase config is correct
- [ ] Error handling is implemented
- [ ] Charts load correctly with real data
- [ ] User data is properly isolated
