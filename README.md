# CV Alchemist - AI Resume Generator

An online CV/resume editor with real-time PDF preview and AI-powered resume generation.

## Features

- Real-time LaTeX editing with syntax highlighting
- PDF preview and download
- AI-powered resume generation from job descriptions
- Dark/light mode toggle
- Responsive layout

## Prerequisites

Ensure XeLaTeX is installed on your system:

```bash
sudo apt-get install texlive-full
```

Verify installation:
```bash
xelatex --version
```

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create the required data directory structure:
```bash
npm run setup
```
4. Acquire and add your API keys to `.env.local`:

**Google Gemini API Key**:
1. Go to [Google MakerSuite](https://makersuite.google.com)
2. Create a new API key
3. Copy and paste into `.env.local`

**Groq API Key**:
1. Sign up at [Groq Cloud](https://console.groq.com)
2. Create a new API key
3. Copy and paste into `.env.local`

Example `.env.local`:
```
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

## Required Files

Make sure these files exist in the `data` directory:

- `candidate_profile.txt`: Contains your resume information
- `resume_template.txt`: Contains the LaTeX template for the resume
- Enter your candidate profile details in `candidate_profile.txt`
- Enter/modify your resume template in `resume_template.txt`

## Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Dependencies

- Next.js
- React
- CodeMirror
- LangChain
- Google Generative AI
- Groq
- TailwindCSS

## How to Use

1. Edit LaTeX in the editor
2. Click "Generate PDF" to compile and preview
3. To generate a resume:
   - Paste a job description in the textarea
   - Click "Generate Resume"
   - The AI will generate a customized LaTeX resume based on your profile and the job description
   - Click "Generate PDF" to see the final result
