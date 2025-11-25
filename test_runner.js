const http = require('http');

function runTest(name, files, stdin = "", expectedStatus = "success", checkAi = false) {
    console.log(`Running Test: ${name}...`);

    const payload = JSON.stringify({
        codeFiles: JSON.stringify(files),
        stdin: stdin
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/compile',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.status === expectedStatus) {
                    console.log(`  [PASS] Status matches ${expectedStatus}`);
                    if (expectedStatus === "success") {
                        console.log(`  Output: ${response.output.trim()}`);
                    }
                    if (checkAi) {
                        if (response.ai_suggestion) {
                            console.log(`  [PASS] AI Suggestion received: ${response.ai_suggestion.explanation}`);
                        } else {
                            console.log(`  [FAIL] AI Suggestion missing`);
                        }
                    }
                } else {
                    console.log(`  [FAIL] Expected ${expectedStatus}, got ${response.status}`);
                    console.log(`  Response:`, response);
                }
            } catch (e) {
                console.log(`  [ERROR] Failed to parse response: ${e.message}`);
                console.log(`  Raw Data: ${data}`);
            }
            console.log("-".repeat(30));
        });
    });

    req.on('error', (e) => {
        console.error(`  [ERROR] Request failed: ${e.message}`);
    });

    req.write(payload);
    req.end();
}

// Test 1: Hello World
runTest(
    "Hello World",
    [{ name: "main.cpp", content: "#include <iostream>\nint main() { std::cout << \"Hello World\"; return 0; }" }]
);

// Test 2: Input Handling
// Wait a bit to ensure sequential logging (async nature)
setTimeout(() => {
    runTest(
        "Input Handling",
        [{ name: "main.cpp", content: "#include <iostream>\n#include <string>\nint main() { std::string s; std::cin >> s; std::cout << \"Hello \" << s; return 0; }" }],
        "User"
    );
}, 1000);

// Test 3: Compile Error (AI Trigger)
setTimeout(() => {
    runTest(
        "Compile Error (Missing Semicolon)",
        [{ name: "main.cpp", content: "#include <iostream>\nint main() { std::cout << \"Error\" return 0; }" }],
        "",
        "error",
        true
    );
}, 2000);

// Test 4: Missing Header (AI Trigger)
setTimeout(() => {
    runTest(
        "Compile Error (Missing Header)",
        [{ name: "main.cpp", content: "int main() { std::vector<int> v; return 0; }" }],
        "",
        "error",
        true
    );
}, 4000); // Give enough time for AI mock delay
