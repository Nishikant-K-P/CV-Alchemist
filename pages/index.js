// File: pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { tags } from '@lezer/highlight';

// Import CodeMirror dynamically to avoid SSR issues
const CodeMirror = dynamic(
  () => {
    return Promise.all([
      import('@uiw/react-codemirror'),
      import('@codemirror/language'),
      import('@codemirror/commands'),
      import('@codemirror/search'),
      // import('@codemirror/language-data'),
      import('@codemirror/autocomplete')
    ]).then(([mod, language, commands, search, langData, autocomplete]) => {
      // Return the CodeMirror component
      return mod.default;
    });
  },
  { ssr: false }
);

export default function Home() {
  const [latex, setLatex] = useState(`\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\title{My LaTeX Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a simple LaTeX document. You can edit it and generate a PDF.

\\section{Math Example}
$$E = mc^2$$

\\section{Conclusion}
Edit this template and click "Generate PDF" to see your document.

\\end{document}`);
  
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  // Add keyboard shortcut for PDF generation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's save dialog
        generatePDF();
      }
    };

    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [/* No dependencies needed for this effect */]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latex, jobDetails: inputValue }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid response: ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      
      // Insert the generated LaTeX code into the editor
      setLatex(data.latexCode);
      setInputValue(''); // Clear the input after successful insertion
      
    } catch (err) {
      setError(`Resume generation failed: ${err.message}`);
      console.error('Resume generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Keep only Ctrl+Enter handler, remove Cmd+S handler
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const handleEditorChange = (value) => {
    setLatex(value);
  };

  // VS Code-like highlighting theme
  const vsCodeHighlightStyle = EditorView.theme({
    '.cm-content': {
      fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.5'
    },
    '.cm-line': {
      padding: '0 4px'
    },
    // LaTeX syntax highlighting
    '.cm-keyword': { color: darkMode ? '#C586C0' : '#AF00DB' }, // \commands
    '.cm-operator': { color: darkMode ? '#D4D4D4' : '#000000' },
    '.cm-number': { color: darkMode ? '#B5CEA8' : '#098658' },
    '.cm-string': { color: darkMode ? '#CE9178' : '#A31515' },
    '.cm-comment': { color: darkMode ? '#6A9955' : '#008000' },
    '.cm-math': { color: darkMode ? '#DCDCAA' : '#795E26' },
    '.cm-bracket': { color: darkMode ? '#D4D4D4' : '#000000' },
    '.cm-variable': { color: darkMode ? '#9CDCFE' : '#001080' },
    '.cm-property': { color: darkMode ? '#9CDCFE' : '#001080' }
  });

  // Dark theme for CodeMirror (VS Code Dark+)
  const darkTheme = EditorView.theme({
    '&': {
      backgroundColor: '#1E1E1E',
      color: '#D4D4D4',
      height: '100%',
      maxHeight: '100%'
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      lineHeight: '1.5'
    },
    '.cm-content': {
      color: '#D4D4D4',
      caretColor: '#D4D4D4',
      minHeight: '100%'
    },
    '.cm-cursor': {
      borderLeftColor: '#D4D4D4',
      borderLeftWidth: '2px'
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#D4D4D4'
    },
    '.cm-activeLine': {
      backgroundColor: '#2C323C'
    },
    '.cm-gutters': {
      backgroundColor: '#1E1E1E',
      color: '#858585',
      border: 'none',
      paddingRight: '8px'
    },
    '.cm-lineNumbers': {
      minWidth: '3em'
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#2C323C',
      color: '#C6C6C6'
    },
    '.cm-selectionBackground': {
      backgroundColor: '#264F78'
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#264F78'
    },
    '.cm-matchingBracket': {
      backgroundColor: '#3B514D',
      outline: '1px solid #4B7B74'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#252526',
      border: 'none',
      color: '#838383'
    }
  });

  // Light theme for CodeMirror (VS Code Light+)
  const lightTheme = EditorView.theme({
    '&': {
      backgroundColor: '#FFFFFF',
      color: '#000000',
      height: '100%',
      maxHeight: '100%'
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      lineHeight: '1.5'
    },
    '.cm-content': {
      color: '#000000',
      caretColor: '#000000',
      minHeight: '100%'
    },
    '.cm-cursor': {
      borderLeftColor: '#000000',
      borderLeftWidth: '2px'
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#000000'
    },
    '.cm-activeLine': {
      backgroundColor: '#F3F9FF'
    },
    '.cm-gutters': {
      backgroundColor: '#F8F8F8',
      color: '#929292',
      border: 'none',
      paddingRight: '8px'
    },
    '.cm-lineNumbers': {
      minWidth: '3em'
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#E5EBF1',
      color: '#4B4B4B'
    },
    '.cm-selectionBackground': {
      backgroundColor: '#ADD6FF'
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#ADD6FF'
    },
    '.cm-matchingBracket': {
      backgroundColor: '#C9E0C9',
      outline: '1px solid #95C595'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#F0F0F0',
      border: 'none',
      color: '#747474'
    }
  });

  // Combine both themes
  const editorTheme = [
    darkMode ? darkTheme : lightTheme,
    vsCodeHighlightStyle
  ];

  // Toggle theme function
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleInputAction = async () => {
    if (inputValue.trim()) {
      try {
        setIsGeneratingResume(true);
        setError(null);
        
        // Call the resume generation API with the job details from the textarea
        const response = await fetch('/api/generate-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobDetails: inputValue }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate resume');
        }
        
        const data = await response.json();
        
        // Insert the generated LaTeX code into the editor
        setLatex(data.latexCode);
        setInputValue(''); // Clear the input after successful insertion
        
      } catch (err) {
        setError(`Resume generation failed: ${err.message}`);
        console.error('Resume generation error:', err);
      } finally {
        setIsGeneratingResume(false);
      }
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to compile LaTeX');
      }

      const data = await response.json();
      setPdfUrl(data.pdfUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Head>
        <title>CV Alchemist</title>
        <meta name="description" content="CV Alchemist - AI Resume Generator" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <main className="container mx-auto py-4 px-4 flex flex-col h-screen max-h-screen">
        <h1 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-black'}`}>
          CV Alchemist
        </h1>

        {/* Side-by-side container */}
        <div className="flex flex-col lg:flex-row gap-4 flex-grow h-full max-h-[calc(100vh-6rem)] overflow-hidden">
          {/* Editor Panel */}
          <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden flex flex-col min-h-0`}>
            <div className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} border-b flex flex-col space-y-2`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>Editor</h2>
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'}`}>LaTeX</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={toggleTheme}
                    className={`${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} text-sm py-1 px-3 rounded-md flex items-center`}
                  >
                    {darkMode ? '☀️ Light' : '🌙 Dark'}
                  </button>
                  <button
                    onClick={generatePDF}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md disabled:opacity-50 text-sm flex items-center"
                    title="Generate PDF (Cmd+S or Ctrl+S)"
                  >
                    {loading ? 'Compiling...' : 'Generate PDF'}
                  </button>
                </div>
              </div>
              
              {/* Replaced input field with textarea for larger text input */}
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col w-full space-y-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter job description to generate a targeted resume..."
                    className={`w-full px-3 py-2 rounded-md text-sm ${
                      darkMode 
                        ? 'bg-gray-600 text-white border border-gray-500 focus:border-blue-400' 
                        : 'bg-white text-black border border-gray-300 focus:border-blue-500'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    rows="4"
                    style={{ resize: 'vertical', minHeight: '80px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isGeneratingResume 
                        ? 'Generating resume from job description...'
                        : 'Enter job description and press "Generate Resume"'}
                    </span>
                    <button
                      type="submit"
                      disabled={isGeneratingResume || !inputValue.trim()}
                      className={`${
                        isGeneratingResume 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white py-1 px-4 rounded-md text-sm disabled:opacity-50`}
                    >
                      {isGeneratingResume ? 'Generating Resume...' : 'Generate Resume'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="flex-grow overflow-hidden">
              <div className="h-full w-full">
                <CodeMirror
                  value={latex}
                  height="100%"
                  onChange={handleEditorChange}
                  theme={editorTheme}
                  style={{ height: '100%' }}
                  extensions={[]}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    highlightSpecialChars: true,
                    foldGutter: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    highlightSelectionMatches: true,
                    tabSize: 2,
                  }}
                />
              </div>
            </div>
            {error && (
              <div className={`p-2 ${darkMode ? 'bg-red-900 border-red-700 text-red-300' : 'bg-red-100 border-red-300 text-red-700'} border-t text-sm`}>
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* PDF Preview Panel */}
          <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md rounded-lg overflow-hidden flex flex-col min-h-0`}>
            <div className={`p-2 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} border-b flex justify-between items-center`}>
              <div className="flex items-center">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>PDF Preview</h2>
                {loading && <span className={`ml-2 text-xs px-2 py-1 rounded bg-yellow-500 text-black`}>Compiling...</span>}
              </div>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download="document.pdf"
                  className="bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-md text-sm inline-block"
                >
                  Download PDF
                </a>
              )}
            </div>
            <div className={`flex-grow overflow-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-none"
                  title="PDF Output"
                />
              ) : (
                <div className={`text-center p-4 h-full flex items-center justify-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  <div>
                    <p className="text-lg mb-2">No PDF generated yet</p>
                    <p className="text-sm">Edit your LaTeX code and click "Generate PDF" to see the result</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* VS Code-like status bar */}
      <div className={`${darkMode ? 'bg-[#007ACC] text-white' : 'bg-[#007ACC] text-white'} px-4 py-1 text-xs flex justify-between`}>
        <div className="flex space-x-4">
          <span>LaTeX</span>
          <span>UTF-8</span>
        </div>
        <div className="flex space-x-4">
          <span>Ln {latex.split('\n').length}, Col {latex.split('\n')[0]?.length || 0}</span>
          <span>{darkMode ? 'Dark+' : 'Light+'}</span>
        </div>
      </div>
    </div>
  );
}