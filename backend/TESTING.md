# Testing Guide for FamChat

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
backend/
  __tests__/
    setup/              # Test setup and utilities
      testDatabase.js   # Test database configuration
    unit/               # Unit tests for models
      User.test.js
      Contact.test.js
      Message.test.js
    integration/        # Integration tests for APIs
      auth.test.js
      contacts.test.js
      messages.test.js
```

## 📋 Test Coverage

### Unit Tests (Models)

#### User Model Tests
- ✅ User creation with password hashing
- ✅ Duplicate username/email validation
- ✅ Find user by username/email
- ✅ Password verification
- ✅ User data sanitization

#### Contact Model Tests
- ✅ Add contact request
- ✅ Accept/reject contact requests
- ✅ Get contacts list
- ✅ Get pending requests
- ✅ Check connection status
- ✅ Remove contacts

#### Message Model Tests
- ✅ Create encrypted message
- ✅ Get conversation history
- ✅ Mark messages as read
- ✅ Get unread count
- ✅ Message limit functionality

### Integration Tests (APIs)

#### Authentication API
- ✅ User registration
  - Valid registration
  - Missing fields validation
  - Password strength validation
  - Email format validation
  - Duplicate prevention
- ✅ User login
  - Correct credentials
  - Login with email
  - Wrong password handling
  - Non-existent user handling
- ✅ Get profile (protected route)
- ✅ Logout functionality
- ✅ httpOnly cookie handling

#### Contact API (To be added)
- Add contact endpoint
- Accept/reject endpoints
- List contacts endpoint
- Remove contact endpoint

#### Message API (To be added)
- Send message endpoint
- Get conversation endpoint
- Mark as read endpoint

## 🔍 What Each Test Verifies

### Security Tests
- Password hashing (bcrypt)
- Token sanitization
- httpOnly cookie attributes
- Authentication middleware
- Input validation

### Data Integrity Tests
- Database constraints
- Unique constraints
- Foreign key relationships
- Data sanitization

### Business Logic Tests
- Contact relationship rules
- Message encryption handling
- User authentication flow
- Authorization checks

## 📊 Expected Test Results

When you run `npm test`, you should see:

```
PASS  __tests__/unit/User.test.js
PASS  __tests__/unit/Contact.test.js
PASS  __tests__/unit/Message.test.js
PASS  __tests__/integration/auth.test.js

Test Suites: 4 passed, 4 total
Tests:       30+ passed, 30+ total
Snapshots:   0 total
Time:        X.XXXs
```

## 🛠️ Adding New Tests

### Unit Test Template

```javascript
import db from '../setup/testDatabase.js';
import YourModel from '../../src/models/YourModel.js';

describe('YourModel', () => {
  beforeEach(() => {
    // Clean up before each test
    db.prepare('DELETE FROM your_table').run();
  });

  afterAll(() => {
    db.close();
  });

  test('should do something', () => {
    // Arrange
    const data = { /* test data */ };
    
    // Act
    const result = YourModel.someMethod(data);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

### Integration Test Template

```javascript
import request from 'supertest';
import express from 'express';
import yourRoutes from '../../src/routes/yourRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/your-route', yourRoutes);

describe('Your API', () => {
  test('should handle request', async () => {
    const response = await request(app)
      .post('/api/your-route')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
  });
});
```

## 🎯 Best Practices

1. **Isolation**: Each test should be independent
2. **Clean Up**: Always clean test data before/after tests
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Edge Cases**: Test both happy and sad paths
6. **Mock External Dependencies**: Use test database

## 🐛 Debugging Tests

```bash
# Run specific test file
npm test User.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm run test:coverage
```

## 📈 Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

**Last Updated:** December 20, 2025
