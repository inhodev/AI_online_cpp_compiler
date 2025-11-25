require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { compileAndRun } = require('./compiler');
const { analyzeAndFixCode } = require('./ai_service');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload setup (store in 'uploads' temp dir)
const upload = multer({ dest: 'uploads/' });

// Endpoint: Compile C++ Code
app.post('/compile', upload.array('files'), async (req, res) => {
    const runId = uuidv4();
    const tempDir = path.join(__dirname, 'sandbox', runId);

    try {
        // 1. Prepare Sandbox
        await fs.ensureDir(tempDir);

        // Move uploaded files to sandbox with original names
        const fileMap = []; // Keep track of files for AI
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const destPath = path.join(tempDir, file.originalname);
                await fs.move(file.path, destPath);
                fileMap.push({ name: file.originalname, path: destPath });
            }
        } else if (req.body.codeFiles) {
            // Support JSON-based file content (for direct API usage)
            const files = JSON.parse(req.body.codeFiles);
            for (const file of files) {
                await fs.writeFile(path.join(tempDir, file.name), file.content);
                fileMap.push({ name: file.name, path: path.join(tempDir, file.name) });
            }
        } else {
            return res.status(400).json({ error: 'No source files provided.' });
        }

        // 2. Compile and Run
        const { stdin } = req.body;
        const result = await compileAndRun(tempDir, stdin);

        // 3. Handle Result
        if (result.success) {
            res.json({
                status: 'success',
                output: result.output
            });
        } else {
            // 4. AI Auto-Correction on Failure
            console.log('Compilation/Runtime failed. Triggering AI analysis...');

            // Read file contents for AI
            const filesContent = [];
            for (const f of fileMap) {
                const content = await fs.readFile(f.path, 'utf8');
                filesContent.push({ name: f.name, content });
            }

            const aiSuggestion = await analyzeAndFixCode(filesContent, result.error);

            res.json({
                status: 'error',
                error: result.error,
                ai_suggestion: aiSuggestion
            });
        }

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    } finally {
        // Cleanup Sandbox
        try {
            await fs.remove(tempDir);
        } catch (e) {
            console.error('Cleanup failed:', e);
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
