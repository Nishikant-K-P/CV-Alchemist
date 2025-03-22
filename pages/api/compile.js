// File: pages/api/compile.js
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const mkdirPromise = promisify(fs.mkdir);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { latex } = req.body;
    
    if (!latex) {
      return res.status(400).json({ message: 'LaTeX content is required' });
    }

    // Create a unique folder for this compilation
    const id = uuidv4();
    const tempDir = path.join(process.cwd(), 'temp', id);
    const publicOutputDir = path.join(process.cwd(), 'public', 'outputs');
    
    // Ensure directories exist
    await mkdirPromise(tempDir, { recursive: true });
    await mkdirPromise(publicOutputDir, { recursive: true });
    
    // Write LaTeX content to file
    const texFilePath = path.join(tempDir, 'document.tex');
    await writeFilePromise(texFilePath, latex);
    
    // Compile LaTeX to PDF
    await execPromise(`cd ${tempDir} && xelatex -interaction=nonstopmode document.tex`);
    
    // Move the generated PDF to public directory
    const outputPdfPath = path.join(publicOutputDir, `${id}.pdf`);
    fs.copyFileSync(path.join(tempDir, 'document.pdf'), outputPdfPath);
    
    // Return the URL to the PDF
    const pdfUrl = `/outputs/${id}.pdf`;
    res.status(200).json({ pdfUrl });
    
    // Clean up temporary files (optional, can be done by a cron job later)
    // This is commented out to ensure the PDF remains available for immediate viewing
    // exec(`rm -rf ${tempDir}`);
    
  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({ 
      message: 'Failed to compile LaTeX',
      error: error.message 
    });
  }
}

// Configure Next.js to handle large requests
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};