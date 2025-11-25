const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

/**
 * Compiles and runs C++ code directly on the host (Render container).
 * @param {string} sourceDir - Directory containing source files.
 * @param {string} stdinInput - Input string to be piped to the program.
 * @returns {Promise<{success: boolean, output: string, error: string}>}
 */
async function compileAndRun(sourceDir, stdinInput = '') {
    return new Promise(async (resolve) => {
        try {
            // 1. Smart Build: Find all .cpp files
            // 파일명에 공백이 있을 수 있으므로 따옴표("")로 감싸줍니다.
            const files = await fs.readdir(sourceDir);
            const cppFiles = files
                .filter(f => f.endsWith('.cpp'))
                .map(f => `"${f}"`)
                .join(' ');

            if (!cppFiles) {
                return resolve({ success: false, output: '', error: 'No .cpp files found.' });
            }

            // 2. Prepare Commands (Direct Execution)
            const outputFile = 'output_prog';

            // Compile Command: g++ -std=c++17 -o output_prog main.cpp util.cpp ...
            // 현재 디렉토리(sourceDir)로 이동한 후 컴파일합니다.
            const compileCmd = `g++ -std=c++17 -o ${outputFile} ${cppFiles}`;

            // Run Command: ./output_prog
            // 'timeout' 명령어를 사용하여 무한 루프 방지 (5초 제한)
            const runCmd = `./${outputFile}`;

            // Combine: cd to directory -> compile -> (echo input | run)
            // 사용자 입력값(Stdin)에 있는 쌍따옴표 이스케이프 처리
            const safeInput = stdinInput.replace(/"/g, '\\"');

            // 최종 쉘 명령어 조합
            // 1. 해당 폴더로 이동 (cd)
            // 2. 컴파일 실행 (&& g++ ...)
            // 3. 성공 시 입력값 주입하여 실행 (&& echo ... | timeout ...)
            const shellCommand = `cd "${sourceDir}" && ${compileCmd} && echo "${safeInput}" | timeout 5s ${runCmd}`;

            // 3. Execute
            exec(shellCommand, (error, stdout, stderr) => {
                // Cleanup: 실행 후 생성된 바이너리 파일 삭제 (공간 절약)
                try {
                    fs.unlinkSync(path.join(sourceDir, outputFile));
                } catch (e) { /* 파일이 없을 수도 있음 (컴파일 실패 시) */ }

                if (error) {
                    // 타임아웃 발생 시 (Exit code 124는 리눅스 timeout 표준 코드)
                    if (error.code === 124) {
                        return resolve({ success: false, output: stdout, error: 'Error: Execution Timed Out (5s limit)' });
                    }

                    // 컴파일 에러 또는 런타임 에러 반환
                    // stderr에 컴파일러의 에러 메시지가 담깁니다.
                    return resolve({
                        success: false,
                        output: stdout,
                        error: stderr || error.message
                    });
                }

                // 성공 시
                resolve({ success: true, output: stdout, error: '' });
            });

        } catch (e) {
            resolve({ success: false, output: '', error: e.message });
        }
    });
}

module.exports = { compileAndRun };