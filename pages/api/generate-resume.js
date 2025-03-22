const fs = require('fs');
const path = require('path');
const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { RunnableSequence, RunnableParallel, RunnableMap } = require('@langchain/core/runnables');

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { latex, jobDetails } = req.body;
    
    if (!latex || !jobDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const candidateDetail = fs.readFileSync(
      path.join(process.cwd(), 'data', 'candidate_profile.txt'), 
      'utf-8'
    );

    // Read resume template from local file
    let texTemplate;
    
    try {
      texTemplate = fs.readFileSync(path.join(process.cwd(), 'data', 'resume_template.txt'), 'utf-8');
      texTemplate = texTemplate.replace(/{/g, '{{').replace(/}/g, '}}');
    } catch (error) {
      console.error('Error reading template files:', error);
      return res.status(500).json({ 
        message: 'Error reading template files. Make sure candidate_profile.txt and resume_template.txt exist in the data directory.' 
      });
    }

    // Models - Use Next.js environment variables directly
    const modelPro = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash",
      temperature: 0.5,
      maxRetries: 3,
      apiKey: process.env.GOOGLE_API_KEY
    });

    // Prompts
    const workPrompt = ChatPromptTemplate.fromMessages([
      ["system", `
        You are a resume writing expert. Using only the candidate details provided and the job description, please draft a detailed work experience section for the candidate's resume. Before generating your final output, carefully think through and analyze how the candidate's past roles and achievements align with the job requirements. Then, produce a final work experience section that follows the guidelines below.

        Your work experience bullet points should follow the CAR (Challenge, Action, Result) or STAR (Situation, Task, Action, Result) framework:
        [Action Verb] + [Specific Task or Project] + [How You Did It (Method/Tools)] + [Quantifiable Result/Impact]

        Step-by-Step Guidelines:
        1. **Start with a Strong Action Verb:**
        - Begin each bullet with a powerful action verb (e.g., Developed, Spearheaded, Analyzed, Increased, Optimized, Resolved, Designed) to describe accomplishments.
        2. **Be Specific About the Task or Project:**
        - Clearly mention the project or task to provide enough context and meaning.
        - Example: "Developed a customer-facing web portal…"
        3. **Include How You Achieved It (Method/Tools):**
        - Describe the tools, technologies, or strategies used to showcase technical expertise.
        - Example: "…using React, Redux, and AWS…"
        4. **Quantify the Result (Impact):**
        - Highlight measurable outcomes with percentages, numbers, or time frames.
        - Example: "…increasing customer engagement by 25%." or "…reducing processing time by 30%."
        5. **Tailor the Experience to the Job Description:**
        - Match language and keywords from the job description.
        - Emphasize the most relevant skills and accomplishments (e.g., if the job requires cloud infrastructure experience, highlight work using AWS, GCP, or Azure).
        6. **Keep It Concise and Professional:**
        - Limit each bullet to 1–2 lines (15–30 words) and avoid overly complex sentences or generic statements.
        - Avoid passive language and vague statements such as "responsible for managing projects."
        - Prioritize impact and relevance—aim for 3–5 strong bullet points per role, with at least 70% being quantified.

        Additional Instructions:
        - Use only the candidate details provided; do not introduce any new or external information.
        - Ensure the final work experience section is polished, professional, and precisely tailored to the job description.
        - Ensure that work experiences are ordered chronologically, with the most recent role listed first.
        - Try to include all the companies that the candidate worked in for the final output.

        "EXAMPLE:"
        "Engineered a real-time event stream pipeline using AWS Kinesis and Apache Flink, reducing trespasser detection time from 2 days to 30 minutes."
        "Developed a scalable property risk classification system leveragingAWS Sagemaker and FLAN-T5 XL, achieving 85% accuracy and reducing inference time by 75%."
      `],
      ["human", `Job details: \n{job_details} \n Candidate Profile: \n${candidateDetail}`]
    ]);

    const summaryPrompt = ChatPromptTemplate.fromMessages([
      ["system", `
        You are a resume writing expert. Using only the candidate details provided and the job description, please draft a compelling and tailored summary section for the candidate's resume. Before drafting your final output, think through and analyze how the candidate's experience and skills align with the job requirements. Then, provide a final summary that follows this structure:

        [Your Title/Profession] with [Years of Experience] in [Industry/Field]. Proven success in [Key Skills/Expertise] and [Notable Achievements]. Seeking to leverage expertise in [Relevant Skills/Experience] to drive success at [Company/Role Goal].

        Step-by-Step Guidelines:
        1. Start with your current role/title. Mention your professional identity concisely and ensure it is relevant to the target job title.
        - Example: "Senior Data Scientist with 5+ years of experience…"
        2. Mention your years of experience. State the total relevant years of experience.
        - Example: "…with over 7 years of experience in data analysis and machine learning."
        3. Highlight relevant skills & expertise. Focus on 2–4 core skills that match the job description, including technical or industry-specific skills.
        - Example: "…proficient in Python, TensorFlow, and building predictive models."
        4. Showcase measurable achievements. Quantify accomplishments where possible using metrics like percentage improvements, cost reductions, or time efficiencies.
        - Example: "…increased model accuracy by 15% and reduced processing time by 20%."
        5. State your career goal & how it aligns with the company's needs. Clearly articulate what you aim to achieve in the target role and connect it with the company's objectives.
        - Example: "…seeking to apply my machine learning expertise to enhance customer insights and drive business growth at [Company Name]."

        Additional Instructions:
        - Use only the candidate details provided; do not add any new or external information.
        - Ensure your final summary is concise (3–4 sentences or 4–5 lines max) and free of generic buzzwords.
        - Internally analyze the candidate details and job requirements before generating the final output, but do not show your internal reasoning in the final response.
        - Your output should be polished, professional, and precisely tailored to the provided job description.
      `],
      ["human", `Job details: \n {job_details} \n Candidate Profile: \n${candidateDetail}`]
    ]);

    const skillsPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are a resume writing expert. Using only the candidate details provided and the job description, please draft a detailed technical skills section for the candidate's resume. Your output should:

        1. Align perfectly with the provided job description by emphasizing the technical skills that are most relevant to the role.
        2. Include only technical skills; do not include any soft skills.
        3. Organize the skills into categories. Use the following categories as a guideline:
        - Programming Languages:
        - Web Development:
        - Frameworks and Libraries:
        - Cloud and Infrastructure:
        - Databases:
        - Visualization Tools:
        - Machine Learning & AI:
        - Networking:
        4. Note that the above list of categories is not exhaustive. You are free to add, remove, or modify categories based on the job description and the candidate details.
        6. Present the technical skills section in a clear, professional, and organized format (e.g., as a bulleted list or comma-separated list for each category).

        Please ensure the technical skills section is comprehensive, targeted, and demonstrates a clear match between the candidate's technical expertise and the job requirements.
        Before drafting your final output, think through and reason about how the candidate's experience aligns with the job requirements and which technical skills are most relevant. Internally analyze the provided information and then present the final output without showing your internal reasoning.`],
      ["human", `Job details: \n {job_details} \n Candidate Profile: \n${candidateDetail}`]
    ]);

    const latexPrompt = ChatPromptTemplate.fromMessages([
      ["system", 
       "You are an expert at drafting latex documents and writing latex code. " +
       "Use the provided content and resume template to draft a latex resume document. " +
       "Return only the latex code for the resume document."
      ],
      ["human", `Summary : {summary}, \n Work Experience: {work} \n Skills: {skills} \n Template:${texTemplate}`]
    ]);

    // Chains
    const workChain = workPrompt.pipe(modelPro);
    const summaryChain = summaryPrompt.pipe(modelPro);
    const skillsChain = skillsPrompt.pipe(modelPro);
    const latexChain = latexPrompt.pipe(modelPro);

    // Create parallel runnable for resume components
    const resumeChain = RunnableMap.from({
      work: workChain,
      summary: summaryChain,
      skills: skillsChain
    });

    console.log("Generating resume components...");
    const result = await resumeChain.invoke({ job_details: jobDetails });
    console.log("Resume components generated successfully");

    console.log("Generating LaTeX code...");
    const latexResult = await latexChain.invoke({
      summary: result.summary.content, 
      work: result.work.content, 
      skills: result.skills.content
    });
    console.log("LaTeX code generated successfully");

    return res.status(200).json({ latexCode: latexResult.content.slice(9,-4) });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
