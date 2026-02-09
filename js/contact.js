// Contact page iMessage-like AI chat functionality

const chatState = {
    currentStep: 'initial',
    userData: {
        name: '',
        topic: '',
        whatsapp: '',
        email: ''
    },
    hiCount: 0,
    forwardedToMom: false,
    gibberishCount: 0,
    vulgarCount: 0,
    isProcessing: false
};

// Vulgar/bad words list
const vulgarWords = ['fuck', 'shit', 'bitch', 'damn', 'crap', 'bastard', 'idiot', 'stupid', 'dumb', 'hate'];

// Gibberish detection
const isGibberish = (text) => {
    const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, '');
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);

    if (words.length === 0) return true;

    const commonWords = ['hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'sure', 'thanks', 'thank', 'you', 'i', 'me', 'my', 'we', 'us', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'need', 'want', 'like', 'love', 'work', 'help', 'project', 'design', 'app', 'website', 'job', 'hire', 'collaborate', 'question', 'ask', 'talk', 'chat', 'please', 'just', 'looking', 'interested', 'about', 'for', 'with', 'and', 'or', 'but', 'not', 'this', 'that', 'what', 'how', 'why', 'when', 'where', 'who', 'your', 'name', 'email', 'phone', 'number', 'contact', 'message', 'great', 'good', 'nice', 'awesome', 'cool', 'amazing', 'get', 'let', 'make', 'take', 'give', 'see', 'know', 'think', 'feel', 'new', 'old', 'big', 'small', 'first', 'last', 'one', 'two', 'time', 'way', 'day', 'thing', 'person', 'people', 'world', 'life', 'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'point', 'home', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city', 'community', 'team', 'minute', 'idea', 'body', 'information', 'back', 'face', 'level', 'office', 'door', 'health', 'art', 'history', 'party', 'result', 'change', 'morning', 'reason', 'research', 'moment', 'teacher', 'force', 'education'];

    let recognizedCount = 0;
    for (const word of words) {
        if (commonWords.includes(word) || word.length <= 2) {
            recognizedCount++;
        }
    }

    const recognizedRatio = recognizedCount / words.length;
    const keyboardMash = /^[asdfghjklqwertyuiopzxcvbnm]{4,}$/i.test(cleaned.replace(/\s/g, ''));
    const repeatingChars = /(.)\1{3,}/.test(cleaned);

    if (keyboardMash || repeatingChars) return true;
    if (words.length === 1 && !commonWords.includes(words[0]) && words[0].length > 3) return true;
    if (recognizedRatio < 0.3 && words.length > 2) return true;

    return false;
};

// Check for vulgar language
const containsVulgar = (text) => {
    const lower = text.toLowerCase();
    return vulgarWords.some(word => lower.includes(word));
};

// Detect work/project/contact intent
const hasWorkIntent = (text) => {
    const lower = text.toLowerCase();
    const patterns = [
        /let'?s\s+(work|collaborate|connect|build|talk|chat)/i,
        /work\s+(together|with you)/i,
        /i\s+(have|got|need)\s+(a\s+)?(project|job|work|task|gig|idea|proposal)/i,
        /i\s+(want|need|would like|wanna|looking)\s+(to\s+)?(hire|contact|reach|talk|collaborate|discuss|connect|work)/i,
        /(hire|hiring)\s+(you|asith)/i,
        /(need|want|looking for)\s+(a\s+)?(designer|ux|ui|help)/i,
        /(project|collaboration|job|freelance|contract|opportunity)/i,
        /interested\s+in\s+(working|collaborating|your)/i,
        /reach\s+(out|you)/i,
        /get\s+in\s+touch/i,
        /contact\s+(you|asith)/i,
        /can\s+(you|we)\s+(help|work|design|build)/i,
        /i('?m|\s+am)\s+(looking|interested|reaching)/i,
    ];
    return patterns.some(p => p.test(lower));
};

// Validate email
const isValidEmail = (email) => {
    // More comprehensive email validation that accepts most real-world formats
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = email.trim();
    
    // Basic sanity checks
    if (!trimmedEmail || trimmedEmail.length < 5 || trimmedEmail.length > 254) {
        return false;
    }
    
    // Check for @ symbol count (should be exactly 1)
    const atCount = (trimmedEmail.match(/@/g) || []).length;
    if (atCount !== 1) return false;
    
    // Check for consecutive dots
    if (trimmedEmail.includes('..')) return false;
    
    // Check for dot at start or end, or @ at start or end
    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.') || 
        trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@')) {
        return false;
    }
    
    return emailRegex.test(trimmedEmail);
};

// Validate WhatsApp number (10 digits min, or with country code +XX)
const isValidPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('+')) {
        return /^\+[0-9]{10,15}$/.test(cleaned);
    }
    return /^[0-9]{10}$/.test(cleaned);
};

// Scroll to bottom
const scrollToBottom = () => {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
};

// Add message to chat
const addMessage = (text, type = 'received', showAvatar = true, showNameLabel = true) => {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-new ' + type;

    if (type === 'received') {
        const avatarHTML = showAvatar ? '<img src="https://unavatar.io/twitter/asithc" alt="Asith" class="message-avatar-new">' : '<div class="message-avatar-spacer"></div>';
        const nameLabelHTML = showNameLabel ? '<div class="message-name-label">Asith</div>' : '';
        messageDiv.innerHTML =
            nameLabelHTML +
            avatarHTML +
            '<div class="message-bubble-new"><p>' + text + '</p></div>';
    } else {
        messageDiv.innerHTML =
            '<div class="message-bubble-new"><p>' + text + '</p></div>';
    }

    container.appendChild(messageDiv);
    scrollToBottom();
};

// Show typing indicator
const showTyping = () => {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-new received';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML =
        '<img src="https://unavatar.io/twitter/asithc" alt="Asith" class="message-avatar-new">' +
        '<div class="message-bubble-new typing">' +
        '<span class="dot"></span><span class="dot"></span><span class="dot"></span>' +
        '</div>';

    container.appendChild(typingDiv);
    scrollToBottom();
};

// Hide typing indicator
const hideTyping = () => {
    const typing = document.getElementById('typing-indicator');
    if (typing) {
        typing.remove();
    }
};

// Human-like delay calculation
const humanDelay = (text) => {
    // Base "reading" pause before typing starts
    const readPause = 400 + Math.random() * 600; // 400-1000ms

    // Typing speed: ~35-55ms per character
    const charDelay = text.length * (35 + Math.random() * 20);

    // Thinking jitter
    const jitter = Math.random() * 800; // 0-800ms

    // Clamp total typing time between 1.2s and 4s
    const typingTime = Math.min(Math.max(charDelay + jitter, 1200), 4000);

    return { readPause, typingTime };
};

// Send bot reply with human-like typing delay
const botReply = (text, isLastInSequence = true, isFirstInSequence = true) => {
    return new Promise((resolve) => {
        const { readPause, typingTime } = humanDelay(text);

        // First pause - "reading" the user's message
        setTimeout(() => {
            showTyping();

            // Then "type" the message
            setTimeout(() => {
                hideTyping();
                addMessage(text, 'received', isLastInSequence, isFirstInSequence);
                resolve();
            }, typingTime);
        }, readPause);
    });
};

// Handle user message
const handleMessage = async (text) => {
    if (chatState.isProcessing) return;
    chatState.isProcessing = true;

    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendButton');
    const userText = text.trim();

    if (!userText) {
        chatState.isProcessing = false;
        return;
    }

    // Show user message
    addMessage(userText, 'sent');
    input.value = '';

    // Reset send button to inactive state
    if (sendBtn) {
        sendBtn.classList.remove('active');
    }

    const lowerText = userText.toLowerCase().replace(/[.!?,\s]+$/g, '').trim();

    // SMART DETECTION: Check if user jumped ahead with contact details (only in initial state)
    if (chatState.currentStep === 'initial') {
        // Check if they provided an email
        if (isValidEmail(userText)) {
            chatState.userData.email = userText.trim();
            chatState.currentStep = 'ask_name';
            await botReply("Great! I got your email 📧", false, true);
            await botReply("What's your name?", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Check if they provided a phone number
        if (isValidPhone(userText)) {
            chatState.userData.whatsapp = userText;
            chatState.currentStep = 'ask_name';
            await botReply("Perfect! I got your number 📱", false, true);
            await botReply("What should I call you?", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Check if it looks like a name (2-4 words, letters only, not a common phrase)
        const nameLike = /^[a-z\s]{2,50}$/i.test(userText);
        const wordCount = userText.split(/\s+/).length;
        const isCommonPhrase = /^(just saying hi|saying hi|saying hello|i want|i need|looking for|work together|lets work|help me)/i.test(userText);
        const mentionsOwner = /\basith\b/i.test(userText);
        const isGreetingLike = /^(hi|hello|hey|hiya|hola|yo|heya|sup|how|what|who|where|when|why)/i.test(userText);
        
        if (nameLike && wordCount >= 1 && wordCount <= 4 && !isCommonPhrase && !mentionsOwner && !isGreetingLike && userText.length >= 2 && userText.length <= 50) {
            chatState.userData.name = userText;
            chatState.currentStep = 'ask_topic';
            await botReply("Nice to meet you, " + userText + "! 👋", false, true);
            await botReply("So, what's the main reason you're reaching out today? (Project, collab, or just saying hi?)", true, false);
            chatState.isProcessing = false;
            return;
        }
    }

    // 1. Check for greetings (simple "hi" or "hi asith", "hello there", "hey man", etc.)
    const isGreeting = /^(hi|hello|hey|hiya|hola|yo|heya|sup|what'?s\s*up|whats\s*up)(\s+(there|asith|man|buddy|dude|bro|guys?|everyone|all))?$/i.test(lowerText);

    if (isGreeting && chatState.currentStep === 'initial') {
        chatState.hiCount++;

        if (chatState.hiCount === 1) {
            await botReply("Hey there! 👋", false, true);
            await botReply("Looking to work together or just saying hi?", true, false);
        } else if (chatState.hiCount === 2) {
            await botReply("Hey again! 😄", false, true);
            await botReply("So, what brings you here today?", true, false);
        } else {
            await botReply("Hello from the other side... 🎶", false, true);
            await botReply("Let's get you connected! Can I get your name? 😊", true, false);
            chatState.currentStep = 'ask_name';
        }
        chatState.isProcessing = false;
        return;
    }

    // 2. Check for casual "just saying hi" responses
    const isJustSayingHi = /^(just\s+)?(saying\s+)?(hi|hello|hey|hiya|hola)$/i.test(lowerText);
    
    if (isJustSayingHi && chatState.currentStep === 'initial') {
        await botReply("That's cool! Always nice to meet people 😊", false, true);
        await botReply("Feel free to look around. If you ever need help with a project or want to work together, just hit me up!", false, false);
        await botReply("Otherwise, you can find me on X or email below 👇", true, false);
        completeChat();
        chatState.isProcessing = false;
        return;
    }

    // 3. Check for project/collab keywords or single word project-related responses
    const hasProjectKeyword = /\b(project|collab|collaboration|work|hire|opportunity)\b/i.test(userText);
    const isSingleWord = userText.split(/\s+/).length === 1;
    
    if ((hasProjectKeyword || (isSingleWord && hasWorkIntent(userText))) && chatState.currentStep === 'initial') {
        chatState.currentStep = 'ask_topic';
        await botReply("That's awesome! Thanks for reaching out! 🙌", false, true);
        await botReply("I'd love to hear more about this. What's the main topic or idea? 💡", true, false);
        chatState.isProcessing = false;
        return;
    }

    // 4. Check for work/project/contact intent - trigger contact collection flow
    if (hasWorkIntent(userText) && chatState.currentStep === 'initial') {
        chatState.currentStep = 'ask_name';
        await botReply("That's great to hear! 🎉", false, true);
        await botReply("I'd love to know more. What's your name?", true, false);
        chatState.isProcessing = false;
        return;
    }

    // 5. Check for vulgar language
    if (containsVulgar(userText)) {
        chatState.vulgarCount++;

        if (!chatState.forwardedToMom) {
            chatState.forwardedToMom = true;
            await botReply("Oh wow... hold on, forwarding this to your mom real quick 📱", false, true);
            await botReply("Done! She said hi, by the way 👋😊", false, false);
            await botReply("Anyway, jokes aside - how can I help you?", true, false);
        } else {
            await botReply("Your mom already knows about this one too 😅", false, true);
            await botReply("Let's try something more productive?", true, false);
        }
        chatState.isProcessing = false;
        return;
    }

    // 6. Check for gibberish (except when collecting name/phone/email)
    if (isGibberish(userText) && chatState.currentStep !== 'ask_email' && chatState.currentStep !== 'ask_whatsapp' && chatState.currentStep !== 'ask_name') {
        chatState.gibberishCount++;
        if (chatState.gibberishCount === 1) {
            await botReply("Hmm, I'm not sure I follow 🤔", false, true);
            await botReply("Could you try rephrasing that?", true, false);
        } else if (chatState.gibberishCount === 2) {
            await botReply("Sorry, I'm still not getting it 😅", false, true);
            await botReply("Try keeping it simple, or just drop your contact info and I'll reach out!", true, false);
        } else {
            await botReply("I'm having trouble understanding that one 😅", false, true);
            await botReply("Tell you what - just drop your email and I'll get back to you directly! Or try the links below 👇", true, false);
        }
        chatState.isProcessing = false;
        return;
    }

    // 7. Check for yes/no responses
    const isYes = /^(yes|yeah|yep|sure|ok|okay|yea|yup|definitely|absolutely|of course|why not|let's do it|let's go|y)$/i.test(userText.trim());
    const isNo = /^(no|nope|nah|not really|no thanks|maybe later|n)$/i.test(userText.trim());

    // 8. Main conversation flow
    switch (chatState.currentStep) {
        case 'initial':
            if (isNo) {
                chatState.currentStep = 'declined';
                await botReply("No worries! 👋", false, true);
                await botReply("Feel free to come back anytime. See you around! ✨", true, false);
                completeChat();
            } else if (isYes || hasWorkIntent(userText)) {
                chatState.currentStep = 'ask_name';
                await botReply("That's great to hear! 🎉", false, true);
                await botReply("I'd love to know more. What's your name?", true, false);
            } else {
                // They typed something else - assume they want to proceed
                chatState.currentStep = 'ask_name';
                await botReply("Cool! 🙌", false, true);
                await botReply("Before we go further - can I get your name?", true, false);
            }
            break;

        case 'ask_name':
            chatState.userData.name = userText;
            
            // Smart flow: skip to the first piece of info we don't have
            if (!chatState.userData.topic) {
                chatState.currentStep = 'ask_topic';
                await botReply("Nice to meet you, " + userText + "! 👋", false, true);
                await botReply("So, what's the main reason you're reaching out today? (Project, collab, or just saying hi?)", true, false);
            } else if (!chatState.userData.email) {
                chatState.currentStep = 'ask_email';
                await botReply("Nice to meet you, " + userText + "! 👋", false, true);
                await botReply("What's the best email to reach you at? 📧", true, false);
            } else if (!chatState.userData.whatsapp) {
                chatState.currentStep = 'ask_whatsapp';
                await botReply("Nice to meet you, " + userText + "! 👋", false, true);
                await botReply("Do you have a WhatsApp number for quicker communication? 📱 (Type 'skip' if you prefer email only)", true, false);
            } else {
                // We have everything!
                chatState.currentStep = 'complete';
                await botReply("Nice to meet you, " + userText + "! 👋", false, true);
                await botReply("Thanks for reaching out! I'll get back to you soon ✨", true, false);
                completeChat();
            }
            break;

        case 'ask_topic':
            chatState.userData.topic = userText;
            
            // Smart flow: skip to the first piece of info we don't have
            if (!chatState.userData.email) {
                chatState.currentStep = 'ask_email';
                await botReply("Got it! Sounds interesting 🤔", false, true);
                await botReply("What's the best email to reach you at? 📧", true, false);
            } else if (!chatState.userData.whatsapp) {
                chatState.currentStep = 'ask_whatsapp';
                await botReply("Got it! Sounds interesting 🤔", false, true);
                await botReply("Do you have a WhatsApp number for quicker communication? 📱 (Type 'skip' if you prefer email only)", true, false);
            } else {
                // We have everything!
                chatState.currentStep = 'complete';
                await botReply("Got it! Sounds interesting 🤔", false, true);
                await botReply("Thanks for reaching out! I'll get back to you soon ✨", true, false);
                completeChat();
            }
            break;

        case 'ask_email':
            if (isValidEmail(userText)) {
                chatState.userData.email = userText.trim();
                
                // Smart flow: check if we already have WhatsApp
                if (!chatState.userData.whatsapp) {
                    chatState.currentStep = 'ask_whatsapp';
                    await botReply("Perfect 📧", false, true);
                    await botReply("Do you have a WhatsApp number for quicker communication? 📱 (Type 'skip' if you prefer email only)", true, false);
                } else {
                    // We have everything!
                    chatState.currentStep = 'complete';
                    await botReply("Perfect 📧", false, true);
                    await botReply("Thanks for reaching out, " + chatState.userData.name + "! I'll get back to you soon ✨", true, false);
                    completeChat();
                }
            } else {
                if (userText.toLowerCase().includes('skip') || isNo) {
                    await botReply("I do need an email to get back to you! 😅 What's your email address?");
                } else {
                    await botReply("That doesn't look like a valid email. Could you double-check it? 🙏");
                }
            }
            break;

        case 'ask_whatsapp':
            if (userText.toLowerCase().includes('skip') || isNo) {
                chatState.currentStep = 'complete';
                await botReply("No problem! I'll reach out by email 👍", false, true);
                await botReply("Thanks for reaching out, " + chatState.userData.name + "! I'll get back to you soon ✨", true, false);
                completeChat();
            } else if (isValidPhone(userText)) {
                chatState.userData.whatsapp = userText;
                chatState.currentStep = 'complete';
                await botReply("Got it! 📱", false, true);
                await botReply("Thanks for reaching out, " + chatState.userData.name + "! I'll be in touch very soon ✨", true, false);
                completeChat();
            } else {
                await botReply("That number doesn't look quite right 🤔 Try the format +1234567890 or just 10 digits. Or type 'skip'.");
            }
            break;

        case 'complete':
            await botReply("I've already got your details! I'll be in touch soon 😊");
            break;

        case 'declined':
            await botReply("Changed your mind? Just refresh the page and we can start over! 😊");
            break;
    }

    chatState.isProcessing = false;
};

// Google Sheets API URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzwlhTOiXwMqo9labTW3TIi6JgxxP8zKT52vlM6LakwBryWBjfZqIGxb2G68sNULIA/exec';

// Send data to Google Sheets with security measures
const sendToGoogleSheets = async (data) => {
    try {
        const secureData = {
            ...data,
            origin: window.location.origin,
            website: '', // Honeypot field — should always be empty
            timestamp: Date.now()
        };

        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(secureData)
        });
        console.log('Data sent to Google Sheets');
        return true;
    } catch (error) {
        console.error('Failed to send to Google Sheets:', error);
        return false;
    }
};

// Complete chat
const completeChat = async () => {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendButton');

    // Send data to Google Sheets
    await sendToGoogleSheets(chatState.userData);
    console.log('Contact submitted:', chatState.userData);

    setTimeout(() => {
        if (input) {
            input.placeholder = 'Message sent! ✅';
            input.disabled = true;
            input.style.opacity = '0.6';
        }
        if (sendBtn) {
            sendBtn.classList.remove('active');
            sendBtn.classList.add('complete');
            sendBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#34C759"/><path d="M13 20.17l-3.17-3.17-1.42 1.41L13 23l9-9-1.41-1.41L13 20.17z" fill="white"/></svg>';
            sendBtn.disabled = true;
        }
    }, 2000);
};

// Initialize chat
const initContactChat = () => {
    const container = document.getElementById('messageContainer');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendButton');

    if (!container || !input || !sendBtn) {
        console.log('Contact chat elements not found');
        return;
    }

    console.log('Contact chat initialized');

    // Show initial welcome messages with natural delay
    addMessage("Hey! 👋", 'received', false, true);
    setTimeout(() => {
        addMessage("Looking to work together? Drop your details and I'll get back to you! 💬", 'received', true, false);
    }, 1200 + Math.random() * 600);

    // Handle send
    const handleSend = () => {
        const text = input.value.trim();
        if (text && !chatState.isProcessing) {
            handleMessage(text);
        }
    };

    sendBtn.addEventListener('click', handleSend);

    // Toggle send button active state based on input
    input.addEventListener('input', () => {
        if (input.value.trim().length > 0) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    input.focus();
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initContactChat);

// Also try immediate init if DOM already loaded
if (document.readyState !== 'loading') {
    initContactChat();
}

