const questionInput = document.getElementById('questionInput');
        const askButton = document.getElementById('askButton');
        const outputArea = document.getElementById('outputArea');
        const loadingIndicator = document.getElementById('loadingIndicator');

       
        const GEMINI_API_KEY = "..............."; // YOUR ACTUAL API KEY
        const MODEL_NAME = "gemini-1.5-flash"; // Or your preferred model

        const systemInstructionText = " You are a Data Structure and Algorithm Instructor. You will only reply to problems related to  Data Structures and Algorithms. You must solve user queries in the simplest way possible. If the user asks any question not related to Data Structures and Algorithms, reply rudely.Example: If the user asks, \"How are you?\" You will reply: \"You dumb ask me some sensible question.\" (Feel free to be even ruder).Be rude to unrelated questions. Otherwise, reply politely with a simple explanation.";

        askButton.addEventListener('click', async () => {
            const question = questionInput.value.trim();

            if (!question) {
                outputArea.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-circle"></i> Please enter a coding question first!</div>';
                return;
            }
                       
            outputArea.innerHTML = '';
            loadingIndicator.style.display = 'block';
            askButton.disabled = true;

            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

            const requestBody = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: question }
                        ]
                    }
                ],
                systemInstruction: {
                    parts: [
                        { text: systemInstructionText }
                    ]
                }
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    let errorMsg = `API Error: ${response.status}`;
                    let errorDetails = "Could not retrieve error details.";
                    try {
                        const errorData = await response.json();
                        if (errorData.error && errorData.error.message) {
                           errorDetails = errorData.error.message;
                        }
                        errorMsg = `${errorMsg} - ${errorDetails}`;
                        if (errorData.error && errorData.error.status) {
                            errorMsg += ` (Status: ${errorData.error.status})`;
                        }
                        // Check for API key specific issues
                        if (errorDetails.toLowerCase().includes("api key not valid") || errorDetails.toLowerCase().includes("permission denied")) {
                            errorMsg += "<br><strong>Please double-check your API key and ensure it's correctly enabled for the Gemini API in your Google Cloud Console or AI Studio.</strong>";
                        }

                    } catch (parseError) {
                        errorMsg = `${errorMsg} (Could not parse error response: ${response.statusText})`;
                    }
                    throw new Error(errorMsg);
                }

                const data = await response.json();

                if (data.candidates && data.candidates.length > 0 &&
                    data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                    const answerText = data.candidates[0].content.parts[0].text;
                    
                    // Format the response with code highlighting
                    let formattedText = answerText;

                    formattedText = formattedText.replace(/(```[\s\S]*?```)|(`[^`]+`)/g, (match) => {
                        if (match.startsWith('```')) {
                            return `<pre><code>${match.replace(/```/g, '')}</code></pre>`;
                        } else {
                            return `<code>${match.replace(/`/g, '')}</code>`;
                        }
                    });
                    
                    const paragraphs = formattedText.split('\n\n');
                    let htmlOutput = '';
                    
                    for (const paragraph of paragraphs) {
                        if (paragraph.trim() !== '') {
                            htmlOutput += `<p>${paragraph}</p>`;
                        }
                    }
                    
                    outputArea.innerHTML = htmlOutput;
                } else if (data.promptFeedback && data.promptFeedback.blockReason) {
                     outputArea.innerHTML = `<div class="error-message"><i class="fas fa-ban"></i> Blocked due to: ${data.promptFeedback.blockReason}. Details: ${data.promptFeedback.blockReasonMessage || ''}</div>`;
                } else {
                    console.warn("Unexpected response structure:", data);
                    outputArea.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Received an unexpected response structure from the AI.</div>';
                }

            } catch (error) {
                console.error('Frontend Error:', error);
                outputArea.innerHTML = `<div class="error-message"><i class="fas fa-bug"></i> Failed to get answer: ${error.message}</div>`;
            } finally {
                askButton.disabled = false;
                loadingIndicator.style.display = 'none';
            }
        });

        // Allow Enter key (but not Shift+Enter) in textarea to submit
        questionInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                askButton.click();
            }
        });
        setTimeout(() => {
            outputArea.innerHTML = `
                <p><strong>Welcome to Coding Instructor AI!</strong> I'm here to help you with any programming questions you have.</p>
                <p>Here's an example of how I can help:</p>
                <p><strong>Question:</strong> What is a closure in JavaScript?</p>
                <p><strong>Answer:</strong> A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has finished executing. This happens because the inner function maintains a reference to its lexical environment.</p>
            `;
        }, 2000);
