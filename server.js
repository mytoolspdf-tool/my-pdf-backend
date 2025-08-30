const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Configure multer to save files with their original extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        // Use a unique name but keep the original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- File Conversion Handler ---
const handleConversion = async (req, res, next, outputExtension) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const outputDir = os.tmpdir();
    const originalName = path.parse(req.file.originalname).name;

    const command = `libreoffice --headless --convert-to ${outputExtension} --outdir \"${outputDir}\" \"${inputPath}\"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec Error: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            fs.unlink(inputPath, () => {});
            return next(new Error('File conversion failed on the server.'));
        }

        // LibreOffice creates the output file with the same base name as the input
        const outputFileName = `${path.parse(req.file.filename).name}.${outputExtension}`;
        const outputPath = path.join(outputDir, outputFileName);

        if (fs.existsSync(outputPath)) {
            res.download(outputPath, `${originalName}.${outputExtension}`, (downloadErr) => {
                if (downloadErr) {
                    console.error("Download Error:", downloadErr);
                }
                // Clean up both temporary files
                fs.unlink(inputPath, () => {});
                fs.unlink(outputPath, () => {});
            });
        } else {
            console.error('Conversion succeeded but output file was not found.');
            console.error(`Expected path: ${outputPath}`);
            console.error(`Input path was: ${inputPath}`);
            fs.unlink(inputPath, () => {});
            return next(new Error('Conversion failed: Output file not created.'));
        }
    });
};

// --- API ROUTES ---
app.post('/pdf-to-word', upload.single('file'), (req, res, next) => handleConversion(req, res, next, 'docx'));
app.post('/word-to-pdf', upload.single('file'), (req, res, next) => handleConversion(req, res, next, 'pdf'));
app.post('/pdf-to-powerpoint', upload.single('file'), (req, res, next) => handleConversion(req, res, next, 'pptx'));
app.post('/powerpoint-to-pdf', upload.single('file'), (req, res, next) => handleConversion(req, res, next, 'pdf'));
app.post('/pdf-to-excel', upload.single('file'), (req, res, next) => handleConversion(req, res, next, 'xlsx'));
app.post('/excel-to-pdf', upload.single('file'), (req, res, next) => handleConversion(req, res, next, 'pdf'));


app.post('/compress-pdf', upload.single('file'), (req, res, next) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    
    const qualityLevel = req.body.level || 'medium';
    const options = { low: 'screen', medium: 'ebook', high: 'printer' };
    const pdfSetting = options[qualityLevel] || options.medium;
    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);
    const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${pdfSetting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile=\"${outputPath}\" \"${inputPath}\"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Ghostscript Error: ${error.message}`);
            fs.unlink(inputPath, () => {});
            return next(new Error('Error during PDF compression.'));
        }
        res.download(outputPath, `compressed-${req.file.originalname}`, () => {
            fs.unlink(inputPath, () => {});
            fs.unlink(outputPath, () => {});
        });
    });
});

app.post('/compress-image', upload.single('file'), async (req, res, next) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    
    const inputPath = req.file.path;
    const outputPath = path.join(os.tmpdir(), `compressed-${req.file.originalname}`);
    
    try {
        await sharp(inputPath).jpeg({ quality: 80 }).png({ quality: 80 }).toFile(outputPath);
        res.download(outputPath, `compressed-${req.file.originalname}`, () => {
            fs.unlink(inputPath, () => {});
            fs.unlink(outputPath, () => {});
        });
    } catch (error) {
        fs.unlink(inputPath, () => {});
        return next(error); // Pass error to middleware
    }
});

app.get('/', (req, res) => res.send('PDF Tools Backend is running!'));

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error('An unhandled error occurred:', err.stack);
    res.status(500).send('An unexpected error occurred on the server. Please try again later.');
});

app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});
