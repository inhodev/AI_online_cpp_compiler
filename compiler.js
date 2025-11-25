const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

/**
 * Compiles and runs C++ code in a Docker container.
 * @param {string} sourceDir - Host path to the directory containing source files.
 * @param {string} stdinInput - Input string to be piped to the program.
 * @returns {Promise<{success: boolean, output: string, error: string}>}
 */
async function compileAndRun(sourceDir, stdinInput = '') {
    return new Promise(async (resolve) => {
        try {
            // 1. Smart Build: Find all .cpp files
            const files = await fs.readdir(sourceDir);
            const cppFiles = files.filter(f => f.endsWith('.cpp')).join(' ');

            if (!cppFiles) {
                return resolve({ success: false, output: '', error: 'No .cpp files found.' });
            }

            // 2. Construct Docker Command
            // We mount sourceDir to /app
            // We use a shell script inside to compile and run
            // Relaxed security for compatibility
            const dockerImage = 'cpp-compiler';
            const compileCmd = `g++ -std=c++17 -o output ${cppFiles}`;
            const runCmd = `./output`;

            // Combine commands: Compile && (Echo input | Run)
            // We use 'timeout' to enforce time limit (10s)
            const shellCommand = `${compileCmd} && echo "${stdinInput.replace(/"/g, '\\"')}" | timeout 10s ${runCmd}`;

            const dockerCmd = `docker run --rm \
                --memory=512m \
                --security-opt seccomp=unconfined \
                -v "${sourceDir}:/app" \
                ${dockerImage} \
                /bin/bash -c '${shellCommand}'`;

            // 3. Execute
            exec(dockerCmd, (error, stdout, stderr) => {
                if (error) {
                    // Distinguish between compile error and runtime error/timeout
                    // If output file doesn't exist, it's likely a compile error (or g++ failed)
                    // But stderr usually contains the compile errors.

                    // If timeout occurred, exit code is usually 124
                    if (error.code === 124) {
                        return resolve({ success: false, output: stdout, error: 'Error: Execution Timed Out (10s)' });
                    }

                    return resolve({
                        success: false,
                        output: stdout,
                        error: stderr || error.message
                    });
                }

                resolve({ success: true, output: stdout, error: '' });
            });

        } catch (e) {
            resolve({ success: false, output: '', error: e.message });
        }
    });
}

module.exports = { compileAndRun };
