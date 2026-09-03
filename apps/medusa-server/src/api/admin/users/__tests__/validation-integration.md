# Validation Integration Test Guide

## Manual Testing with curl

### Test 1: Missing Required Fields
```bash
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{}'
```

**Expected Response**: 400 Bad Request with errors for missing fields

### Test 2: Invalid Email Format
```bash
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "notanemail",
    "password": "Password123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }'
```

**Expected Response**: 400 Bad Request with "Invalid email format"

### Test 3: Password Too Short
```bash
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "short",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }'
```

**Expected Response**: 400 Bad Request with "Password must be at least 8 characters long"

### Test 4: Invalid Role
```bash
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "invalid-role"
  }'
```

**Expected Response**: 400 Bad Request with "Role must be one of: admin, manager, warehouse-staff, driver"

### Test 5: Valid User Creation
```bash
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "warehouse-staff",
    "phone": "+1234567890"
  }'
```

**Expected Response**: 201 Created with user data

### Test 6: Duplicate Email
```bash
# Run Test 5 again with the same email
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "driver"
  }'
```

**Expected Response**: 409 Conflict with "Email already exists"

### Test 7: Email Case Insensitivity
```bash
curl -X POST http://localhost:9000/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "NEWUSER@EXAMPLE.COM",
    "password": "SecurePass123",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "driver"
  }'
```

**Expected Response**: 409 Conflict (email is normalized to lowercase)

## Validation Checklist

- [ ] Missing email returns 400
- [ ] Missing password returns 400
- [ ] Missing first_name returns 400
- [ ] Missing last_name returns 400
- [ ] Invalid email format returns 400
- [ ] Password < 8 chars returns 400
- [ ] Invalid role returns 400
- [ ] Valid data creates user (201)
- [ ] Duplicate email returns 409
- [ ] Email is case-insensitive
- [ ] Password is hashed (not stored as plaintext)
- [ ] Non-admin cannot create users (403)
