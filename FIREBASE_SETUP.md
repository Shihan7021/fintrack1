# Firebase Setup Guide for FinTrack

## Security Rules Configuration

To fix the "Missing or insufficient permissions" error, you need to update your Firebase Firestore security rules.

### Step 1: Update Firestore Security Rules
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database > Rules
4. Replace the existing rules with the following corrected rules:

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
      allow read, list: if request.auth != null && 
                        (resource.data.userId == request.auth.uid || 
                         request.query.where.userId == request.auth.uid);
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                           resource.data.userId == request.auth.uid && 
                           request.resource.data.userId == request.auth.uid;
    }
    
    // Budgets collection - users can only access their own budgets
    match /budgets/{budgetId} {
      allow read, list: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                           resource.data.userId == request.auth.uid && 
                           request.resource.data.userId == request.auth.uid;
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
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
```

## Common Issues and Solutions

### 1. "Missing or insufficient permissions"
- **Cause**: Security rules are too restrictive or have syntax errors
- **Solution**: Use the corrected Firestore rules provided above

### 2. "Cannot read properties of null"
- **Cause**: DOM elements not found before JavaScript runs
- **Solution**: Ensure elements exist before accessing them (fixed in analyze.html)

### 3. Charts not loading
- **Cause**: Firebase data not accessible due to authentication or rules issues
- **Solution**: Check authentication state and security rules

### 4. Duplicate rules causing conflicts
- **Cause**: Multiple conflicting rules for the same collection
- **Solution**: Consolidate rules into single match statements (fixed in firestore.rules)

## Testing the Setup

1. **Test Authentication**: Try logging in with a test account
2. **Test Data Access**: Add a test transaction and verify it appears
3. **Test Charts**: Navigate to the analyze page and check if charts load
4. **Test Permissions**: Try accessing data from different user accounts
5. **Test Queries**: Verify that list operations work correctly

## Development Tips

- Use Firebase Emulator Suite for local development
- Check browser console for detailed error messages
- Use Firebase Authentication state persistence for better UX
- Implement proper error handling for network issues
- Test rules using the Firebase Rules Playground

## Production Checklist

- [ ] Security rules are properly configured and tested
- [ ] Authentication providers are enabled
- [ ] Firebase config is correct and secure
- [ ] Error handling is implemented
- [ ] Charts load correctly with real data
- [ ] User data is properly isolated
- [ ] Rules allow necessary queries (list, read, create, update, delete)
- [ ] No duplicate or conflicting rules exist
