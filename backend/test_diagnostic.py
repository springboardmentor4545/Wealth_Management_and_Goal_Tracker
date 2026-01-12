import sys
sys.path.insert(0, '.')

print("=== Authentication Module Diagnostic ===")

# Test imports
try:
    from app.api.v1.auth.auth import router, get_password_hash, verify_password
    print("? auth module imports successful")
except Exception as e:
    print(f"? auth module import failed: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing Password Hashing ===")
try:
    # Test password hashing
    test_password = "test123"
    hashed = get_password_hash(test_password)
    print(f"? Password hashing successful")
    print(f"  Original: {test_password}")
    print(f"  Hashed: {hashed[:30]}...")
    
    # Test verification
    verified = verify_password(test_password, hashed)
    print(f"? Password verification: {verified}")
except Exception as e:
    print(f"? Password hashing failed: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing Model Creation ===")
try:
    from app.api.v1.auth.auth import UserCreate
    
    # Create a user model
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "test123"
    }
    
    user = UserCreate(**user_data)
    print(f"? User model creation successful")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
except Exception as e:
    print(f"? Model creation failed: {e}")
    import traceback
    traceback.print_exc()
