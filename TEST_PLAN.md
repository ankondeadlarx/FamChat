# FamChat Test Suite

## 🧪 Comprehensive Testing Guide

This document outlines thorough testing procedures for FamChat to ensure all features work correctly and securely.

---

## 📋 Test Categories

### 1. **Authentication Tests**
### 2. **Contact Management Tests**
### 3. **Messaging Tests**
### 4. **Security Tests**
### 5. **Real-time Features Tests**
### 6. **Error Handling Tests**

---

## 1. Authentication Tests

### Test 1.1: User Registration
**Steps:**
1. Open http://localhost:5173
2. Click "Register here"
3. Fill in:
   - Username: `testuser1`
   - Email: `testuser1@test.com`
   - Display Name: `Test User 1`
   - Password: `password123`
   - Confirm Password: `password123`
4. Click "Register"

**Expected Result:**
- ✅ Registration successful
- ✅ Redirected to chat dashboard
- ✅ httpOnly cookie set (check DevTools > Application > Cookies)
- ✅ User info displayed

**Edge Cases to Test:**
- ❌ Username < 3 characters → Error message
- ❌ Password < 6 characters → Error message
- ❌ Invalid email format → Error message
- ❌ Passwords don't match → Error message
- ❌ Duplicate username → Error message
- ❌ Duplicate email → Error message

### Test 1.2: User Login
**Steps:**
1. Logout from previous session
2. Click "Login"
3. Enter username: `testuser1`
4. Enter password: `password123`
5. Click "Login"

**Expected Result:**
- ✅ Login successful
- ✅ Dashboard displayed
- ✅ Cookie set with proper flags

**Edge Cases:**
- ❌ Wrong password → "Invalid credentials"
- ❌ Non-existent user → "Invalid credentials"
- ❌ Missing fields → Error message
- ✅ Login with email instead of username → Success

### Test 1.3: Session Persistence
**Steps:**
1. Login successfully
2. Refresh the page (F5)

**Expected Result:**
- ✅ Still logged in
- ✅ No redirect to login page

### Test 1.4: Logout
**Steps:**
1. While logged in, click "Logout"

**Expected Result:**
- ✅ Redirected to login page
- ✅ Cookie cleared (check DevTools)
- ✅ Cannot access chat without logging in again

---

## 2. Contact Management Tests

### Test 2.1: Add Contact
**Setup:** Have 2 accounts registered (User A and User B)

**Steps (as User A):**
1. Click "+ Add" button
2. Enter User B's username
3. Click "Send Request"

**Expected Result:**
- ✅ Success message displayed
- ✅ Request appears in User B's "Pending Requests"

**Edge Cases:**
- ❌ Non-existent username → "User not found"
- ❌ Add yourself → Error message
- ❌ Duplicate request → "Already exists"

### Test 2.2: Accept Contact Request
**Steps (as User B):**
1. See pending request from User A
2. Click ✓ (checkmark) button

**Expected Result:**
- ✅ Request disappears from pending
- ✅ User A appears in contacts list
- ✅ User B appears in User A's contacts list
- ✅ Can now chat with each other

### Test 2.3: Reject Contact Request
**Steps:**
1. User C sends request to User A
2. User A clicks ✕ (reject) button

**Expected Result:**
- ✅ Request disappears
- ✅ User C not added to contacts
- ✅ User C can send new request later

---

## 3. Messaging Tests

### Test 3.1: Send Message
**Setup:** User A and User B are connected

**Steps (as User A):**
1. Click on User B in contacts list
2. Type message: "Hello, this is a test"
3. Click "Send 🔐"

**Expected Result:**
- ✅ Message appears in chat window
- ✅ Message shown as sent (green bubble on right)
- ✅ Timestamp displayed
- ✅ Message stored encrypted in database

### Test 3.2: Receive Message (Real-time)
**Setup:** Both users online in different browsers

**Steps:**
1. User A sends message to User B
2. Check User B's browser (don't refresh)

**Expected Result:**
- ✅ Message appears instantly (WebSocket)
- ✅ Shown as received (white bubble on left)
- ✅ Timestamp correct

### Test 3.3: Message History
**Steps:**
1. Send 5 messages between users
2. Refresh the page
3. Click on contact

**Expected Result:**
- ✅ All messages loaded
- ✅ Messages in correct order (oldest first)
- ✅ All messages decrypted properly

### Test 3.4: Typing Indicator
**Steps:**
1. User A opens chat with User B
2. User B starts typing

**Expected Result:**
- ✅ User A sees "User B is typing..." (appears within 3 seconds)
- ✅ Indicator disappears when User B stops

---

## 4. Security Tests

### Test 4.1: Password Hashing
**Steps:**
1. Register a new user
2. Check database: `backend/data/famchat.db`
3. Open with SQLite viewer
4. Look at `users` table

**Expected Result:**
- ✅ Password NOT stored in plain text
- ✅ `password_hash` field contains bcrypt hash
- ✅ Hash starts with `$2b$10$`

### Test 4.2: httpOnly Cookie
**Steps:**
1. Login successfully
2. Open DevTools > Application > Cookies
3. Find the `token` cookie
4. Open Console tab
5. Type: `document.cookie`

**Expected Result:**
- ✅ Cookie has `HttpOnly` flag checked
- ✅ Cookie has `SameSite: Strict`
- ✅ `document.cookie` does NOT show the token
- ✅ JavaScript cannot access the token

### Test 4.3: Message Encryption
**Steps:**
1. Send message: "Secret message"
2. Check database: `messages` table
3. Look at `encrypted_content` field

**Expected Result:**
- ✅ Content is NOT "Secret message"
- ✅ Content is base64 encoded gibberish
- ✅ `iv` field has different value for each message
- ✅ Same message encrypted twice has different ciphertext

### Test 4.4: Authorization
**Steps:**
1. Logout
2. Try accessing: http://localhost:3000/api/contacts/list

**Expected Result:**
- ❌ 401 Unauthorized error
- ❌ Cannot access protected routes without login

### Test 4.5: CORS Protection
**Steps:**
1. Open browser console on a random website
2. Try to fetch: `fetch('http://localhost:3000/api/auth/profile', {credentials: 'include'})`

**Expected Result:**
- ❌ CORS error
- ❌ Cannot access API from different origin

---

## 5. Real-time Features Tests

### Test 5.1: Multiple Connections
**Setup:** User A logged in on 2 different devices/browsers

**Steps:**
1. User B sends message to User A
2. Check both User A's windows

**Expected Result:**
- ✅ Message appears on both devices
- ✅ Real-time sync works

### Test 5.2: Online/Offline Status
**Steps:**
1. User A logs in
2. User B sees User A in contacts
3. User A closes browser
4. Wait 30 seconds

**Expected Result:**
- ✅ Last seen time updates
- ✅ Status indicator changes (if implemented)

---

## 6. Error Handling Tests

### Test 6.1: Network Error
**Steps:**
1. Stop backend server
2. Try to send message
3. Try to add contact

**Expected Result:**
- ❌ Error message displayed
- ❌ Graceful failure (no crash)

### Test 6.2: Invalid Data
**Steps:**
1. Try to send empty message
2. Try to add contact with special characters
3. Try SQL injection: `'; DROP TABLE users; --`

**Expected Result:**
- ❌ Empty message not sent
- ❌ Special characters handled safely
- ❌ SQL injection prevented (parameterized queries)

### Test 6.3: Concurrent Requests
**Steps:**
1. Open 2 browser tabs with same user
2. Send messages simultaneously
3. Add contacts simultaneously

**Expected Result:**
- ✅ All operations complete successfully
- ✅ No race conditions
- ✅ Database integrity maintained

---

## 🎯 Test Checklist

### Before Each Release

- [ ] All authentication tests pass
- [ ] Contact management works
- [ ] Messages send and receive
- [ ] Encryption verified in database
- [ ] httpOnly cookies working
- [ ] No XSS vulnerabilities
- [ ] CORS configured correctly
- [ ] Real-time features work
- [ ] Error handling graceful
- [ ] Database constraints enforced

### Performance Tests

- [ ] App loads in < 3 seconds
- [ ] Messages send in < 500ms
- [ ] Can handle 10+ concurrent users
- [ ] No memory leaks after 30 minutes
- [ ] Database queries optimized

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if on Mac)
- [ ] Mobile browsers

---

## 🐛 Bug Reporting Template

When you find a bug, document it:

```
**Bug Title:** Brief description

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach if applicable]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Date: YYYY-MM-DD
```

---

## 📊 Test Results Template

```
**Test Date:** YYYY-MM-DD
**Tested By:** Your Name
**Version:** 1.0.0

| Test Category | Passed | Failed | Notes |
|--------------|--------|--------|-------|
| Authentication | 10/10 | 0/10 | All working |
| Contacts | 8/10 | 2/10 | See bug #123 |
| Messaging | 15/15 | 0/15 | Perfect |
| Security | 12/12 | 0/12 | All secure |
| Real-time | 4/5 | 1/5 | Typing indicator lag |

**Overall:** 49/52 (94%)

**Critical Issues:** None
**Known Issues:** Typing indicator has 2s delay
**Ready for Production:** Yes/No
```

---

**Last Updated:** December 20, 2025
