import requests
import json

BASE_URL = "http://localhost:3000/compile"

def run_test(name, files, stdin="", expected_status="success", check_ai=False):
    print(f"Running Test: {name}...")
    payload = {
        "codeFiles": json.dumps(files),
        "stdin": stdin
    }
    try:
        response = requests.post(BASE_URL, data=payload)
        data = response.json()
        
        if data.get("status") == expected_status:
            print(f"  [PASS] Status matches {expected_status}")
            if expected_status == "success":
                print(f"  Output: {data.get('output').strip()}")
            
            if check_ai:
                if "ai_suggestion" in data:
                    print(f"  [PASS] AI Suggestion received: {data['ai_suggestion']['explanation']}")
                else:
                    print(f"  [FAIL] AI Suggestion missing")
        else:
            print(f"  [FAIL] Expected {expected_status}, got {data.get('status')}")
            print(f"  Response: {data}")

    except Exception as e:
        print(f"  [ERROR] Request failed: {e}")
    print("-" * 30)

# Test 1: Hello World
run_test(
    "Hello World", 
    [{"name": "main.cpp", "content": "#include <iostream>\nint main() { std::cout << \"Hello World\"; return 0; }"}]
)

# Test 2: Input Handling
run_test(
    "Input Handling", 
    [{"name": "main.cpp", "content": "#include <iostream>\n#include <string>\nint main() { std::string s; std::cin >> s; std::cout << \"Hello \" << s; return 0; }"}],
    stdin="User"
)

# Test 3: Compile Error (AI Trigger)
run_test(
    "Compile Error (Missing Semicolon)", 
    [{"name": "main.cpp", "content": "#include <iostream>\nint main() { std::cout << \"Error\" return 0; }"}], # Missing ;
    expected_status="error",
    check_ai=True
)

# Test 4: Missing Header (AI Trigger)
run_test(
    "Compile Error (Missing Header)", 
    [{"name": "main.cpp", "content": "int main() { std::vector<int> v; return 0; }"}], # Missing vector include
    expected_status="error",
    check_ai=True
)
