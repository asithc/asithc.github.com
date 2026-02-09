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

// --- Vulgar language detection ---
const vulgarWords = ['fuck', 'shit', 'bitch', 'damn', 'crap', 'bastard', 'idiot', 'stupid', 'dumb', 'hate'];
const containsVulgar = (text) => vulgarWords.some(w => text.toLowerCase().includes(w));

// --- Gibberish detection (Set for O(1) lookup) ---
const commonWords = new Set([
    'hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'sure', 'thanks', 'thank',
    'you', 'i', 'me', 'my', 'we', 'us', 'the', 'a', 'an', 'is', 'are', 'was',
    'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'can', 'may', 'might', 'must', 'need', 'want',
    'like', 'love', 'work', 'help', 'project', 'design', 'app', 'website', 'job',
    'hire', 'collaborate', 'question', 'ask', 'talk', 'chat', 'please', 'just',
    'looking', 'interested', 'about', 'for', 'with', 'and', 'or', 'but', 'not',
    'this', 'that', 'what', 'how', 'why', 'when', 'where', 'who', 'your', 'name',
    'email', 'phone', 'number', 'contact', 'message', 'great', 'good', 'nice',
    'awesome', 'cool', 'amazing', 'get', 'let', 'make', 'take', 'give', 'see',
    'know', 'think', 'feel', 'new', 'old', 'big', 'small', 'first', 'last', 'one',
    'two', 'time', 'way', 'day', 'thing', 'person', 'people', 'world', 'life',
    'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program',
    'point', 'home', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right',
    'study', 'book', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house',
    'service', 'friend', 'power', 'hour', 'game', 'line', 'end', 'member', 'law',
    'car', 'city', 'community', 'team', 'minute', 'idea', 'body', 'information',
    'back', 'face', 'level', 'office', 'door', 'health', 'art', 'history', 'party',
    'result', 'change', 'morning', 'reason', 'research', 'moment', 'teacher',
    'force', 'education',
    // UX/Design vocabulary so these aren't flagged as gibberish
    'ux', 'ui', 'product', 'mentor', 'mentorship', 'portfolio', 'brand', 'branding',
    'mobile', 'desktop', 'user', 'experience', 'interface', 'wireframe', 'prototype',
    'figma', 'sketch', 'audit', 'consultation', 'saas', 'startup', 'mvp', 'feature',
    'roadmap', 'strategy', 'dashboard', 'platform', 'landing', 'page', 'review',
    'feedback', 'critique', 'redesign', 'usability', 'heuristic', 'interaction',
    'visual', 'graphic', 'logo', 'identity', 'ios', 'android', 'web', 'freelance',
    'contract', 'opportunity', 'collaboration', 'guide', 'career', 'grow', 'growth',
    'learn', 'teach', 'position', 'role', 'opening', 'call', 'reach', 'text',
    'whatsapp', 'some', 'also', 'much', 'many', 'very', 'too', 'more', 'then',
    'than', 'here', 'there', 'now', 'well', 'still', 'already', 'any', 'each',
    'every', 'other', 'such', 'most', 'same', 'own', 'only', 'both', 'few',
    'after', 'before', 'above', 'below', 'between', 'through', 'during', 'without',
    'again', 'further', 'been', 'being', 'having', 'doing', 'going', 'coming',
    'looking', 'trying', 'wanting', 'needing', 'working', 'helping', 'using',
    'making', 'building', 'creating', 'designing', 'developing'
]);

const isGibberish = (text) => {
    const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, '');
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return true;

    let recognized = 0;
    for (const word of words) {
        if (commonWords.has(word) || word.length <= 2) recognized++;
    }

    const ratio = recognized / words.length;
    if (/^[asdfghjklqwertyuiopzxcvbnm]{4,}$/i.test(cleaned.replace(/\s/g, ''))) return true;
    if (/(.)\1{3,}/.test(cleaned)) return true;
    if (words.length === 1 && !commonWords.has(words[0]) && words[0].length > 3) return true;
    if (ratio < 0.3 && words.length > 2) return true;
    return false;
};

// --- Phone number extraction & validation ---
// Extracts a phone number from natural language like:
// "my number - 0771234567", "mynumber-0771234567", "my number is +94771234567",
// "call me at 077 123 4567", "here's my no: 0771234567", or a raw number
const extractPhone = (text) => {
    // Strip common prefixes: "my number is", "mynumber-", "my phone:", "contact -", etc.
    const stripped = text.replace(
        /^(?:(?:my\s*)?(?:number|no|num|phone|mobile|cell|contact)\s*(?:is)?[\s\-:=]*)/i, ''
    ).trim();

    // Try to find a phone pattern in the stripped text, then in the original
    const phonePattern = /(\+?\d[\d\s\-\.\(\)]{6,18}\d)/;
    const match = stripped.match(phonePattern) || text.match(phonePattern);
    if (!match) return null;

    const digits = match[1].replace(/[\s\-\.\(\)]/g, '');

    // +country code format (e.g., +94771234567, +12025551234) - 10 to 15 digits after +
    if (/^\+\d{10,15}$/.test(digits)) return digits;
    // Local format starting with 0 (e.g., 0771234567) - 10 or 11 digits
    if (/^0\d{9,10}$/.test(digits)) return digits;
    // Raw digits without 0 or + prefix, 7-15 digits (covers most countries)
    if (/^\d{7,15}$/.test(digits)) return digits;

    return null;
};

// Checks if text is hinting at sharing a phone number
const hasPhoneMention = (text) => {
    return /(?:my\s*(?:number|no|num|phone|mobile|cell|contact)|call\s*me|reach\s*me|whatsapp|text\s*me)/i.test(text);
};

// Strict validation for the ask_whatsapp step or direct phone input
const isValidPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('+')) return /^\+\d{10,15}$/.test(cleaned);
    if (cleaned.startsWith('0')) return /^0\d{9,10}$/.test(cleaned);
    return /^\d{7,15}$/.test(cleaned);
};

// --- Email validation ---
const isValidEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed || trimmed.length < 5 || trimmed.length > 254) return false;
    if ((trimmed.match(/@/g) || []).length !== 1) return false;
    if (trimmed.includes('..') || /^[.@]|[.@]$/.test(trimmed)) return false;
    return /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

// --- Intent detection (work/project/hire/mentor) ---
const hasWorkIntent = (text) => {
    return [
        /let'?s\s+(work|collaborate|connect|build|talk|chat)/i,
        /work\s+(together|with you)/i,
        /i\s+(have|got|need)\s+(a\s+)?(project|job|work|task|gig|idea|proposal)/i,
        /i\s+(want|need|would like|wanna|looking)\s+(to\s+)?(hire|contact|reach|talk|collaborate|discuss|connect|work)/i,
        /(hire|hiring)\s+(you|asith)/i,
        /(need|want|looking for)\s+(a\s+)?(designer|ux|ui|help|mentor)/i,
        /interested\s+in\s+(working|collaborating|your|mentorship)/i,
        /reach\s+(out|you)/i,
        /get\s+in\s+touch/i,
        /contact\s+(you|asith)/i,
        /can\s+(you|we)\s+(help|work|design|build|mentor)/i,
        /i('?m|\s+am)\s+(looking|interested|reaching)/i,
        /\b(mentor|mentorship|guidance|portfolio\s*review|design\s*review)\b/i,
        /\b(ux|ui|product)\s*(design|designer|redesign|audit|consultation)\b/i,
    ].some(p => p.test(text));
};

// --- Topic categorization for contextual Asith-like responses ---
const categorizeTopic = (text) => {
    const lower = text.toLowerCase();
    if (/\b(mentor|mentorship|guidance|guide|learn|teach|advice|career|grow|growth)\b/.test(lower)) return 'mentorship';
    if (/\b(hire|hiring|freelance|contract|full[\s-]?time|part[\s-]?time|gig|position|role|vacancy|opening)\b/.test(lower)) return 'hiring';
    if (/\b(ux|ui|user\s*experience|user\s*interface|wireframe|prototype|figma|design\s*system|usability|research|heuristic|interaction)\b/.test(lower)) return 'ux_design';
    if (/\b(product|product\s*design|saas|startup|mvp|feature|roadmap|strategy)\b/.test(lower)) return 'product_design';
    if (/\b(brand|branding|logo|identity|visual|graphic)\b/.test(lower)) return 'branding';
    if (/\b(app|mobile|ios|android|web|website|landing\s*page|dashboard|platform)\b/.test(lower)) return 'app_project';
    if (/\b(review|feedback|audit|critique|portfolio|look\s*at)\b/.test(lower)) return 'review';
    if (/\b(collab|collaboration|partner|together|team\s*up)\b/.test(lower)) return 'collaboration';
    return 'general';
};

const getTopicResponse = (category) => {
    const responses = {
        mentorship: "Love that you're reaching out about mentorship! I'm always happy to help people grow in the design space 🌱",
        hiring: "Sounds like an exciting opportunity! I'd love to hear more about the role and what you're looking for 🎯",
        ux_design: "Right up my alley! UX is what I live and breathe. I'd love to dig into the details 🎨",
        product_design: "Product design is my jam! I'd love to know more about what you're building 🚀",
        branding: "Interesting! Branding is such a meaningful process. I'd love to hear more about the vision 🎨",
        app_project: "Nice! I love working on apps and digital products. Tell me more about what you have in mind 📱",
        review: "Sure thing! I enjoy giving design feedback and I'd be happy to take a look 👀",
        collaboration: "Collaboration is where the magic happens! I'm definitely open to that 🤝",
        general: "Sounds interesting! I'd love to hear more about this 💡"
    };
    return responses[category] || responses.general;
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

// --- Helper: advance to the next missing field ---
const advanceToNextStep = () => {
    const { name, topic, email, whatsapp } = chatState.userData;
    if (!name) return 'ask_name';
    if (!topic) return 'ask_topic';
    if (!email) return 'ask_email';
    if (!whatsapp) return 'ask_whatsapp';
    return 'complete';
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

    if (sendBtn) sendBtn.classList.remove('active');

    const lowerText = userText.toLowerCase().replace(/[.!?,\s]+$/g, '').trim();
    const isYes = /^(yes|yeah|yep|sure|ok|okay|yea|yup|definitely|absolutely|of course|why not|let'?s do it|let'?s go|y)$/i.test(lowerText);
    const isNo = /^(no|nope|nah|not really|no thanks|maybe later|n)$/i.test(lowerText);

    // ============================================================
    // GLOBAL INTERCEPTS - checked in every state before main flow
    // ============================================================

    // A) Phone number detection - works in ANY state
    // Catches: "mynumber-0771234567", "my number is +94771234567", raw "0771234567", "+94771234567", etc.
    const extractedPhone = extractPhone(userText);
    const phoneFromMention = hasPhoneMention(userText) && extractedPhone;

    if (extractedPhone && chatState.currentStep !== 'ask_email' && chatState.currentStep !== 'complete') {
        chatState.userData.whatsapp = extractedPhone;

        // If we're in ask_whatsapp step, that's exactly what we expected
        if (chatState.currentStep === 'ask_whatsapp') {
            chatState.currentStep = 'complete';
            await botReply("Got it! 📱", false, true);
            await botReply("Thanks for reaching out" + (chatState.userData.name ? ", " + chatState.userData.name : "") + "! I'll be in touch very soon ✨", true, false);
            completeChat();
            chatState.isProcessing = false;
            return;
        }

        // Otherwise they jumped ahead with their number - figure out what we still need
        const nextStep = advanceToNextStep();
        chatState.currentStep = nextStep;

        if (nextStep === 'ask_name') {
            await botReply("Got your number! 📱", false, true);
            await botReply("What should I call you?", true, false);
        } else if (nextStep === 'ask_topic') {
            await botReply("Got your number! 📱", false, true);
            await botReply("What would you like to chat about? (UX project, mentorship, hiring, or something else?)", true, false);
        } else if (nextStep === 'ask_email') {
            await botReply("Got your number! 📱", false, true);
            await botReply("What's the best email to reach you at? 📧", true, false);
        } else {
            await botReply("Perfect, got everything I need! 📱", false, true);
            await botReply("Thanks" + (chatState.userData.name ? ", " + chatState.userData.name : "") + "! I'll be in touch soon ✨", true, false);
            completeChat();
        }
        chatState.isProcessing = false;
        return;
    }

    // B) Email detection - works in any state except ask_whatsapp/complete
    if (isValidEmail(userText) && chatState.currentStep !== 'ask_whatsapp' && chatState.currentStep !== 'complete') {
        chatState.userData.email = userText.trim();

        if (chatState.currentStep === 'ask_email') {
            const nextStep = advanceToNextStep();
            chatState.currentStep = nextStep;
            if (nextStep === 'ask_whatsapp') {
                await botReply("Perfect 📧", false, true);
                await botReply("Got a WhatsApp number too? Makes it easier to chat 📱 (Type 'skip' if you'd rather stick with email)", true, false);
            } else {
                await botReply("Perfect 📧", false, true);
                await botReply("Thanks" + (chatState.userData.name ? ", " + chatState.userData.name : "") + "! I'll get back to you soon ✨", true, false);
                completeChat();
            }
            chatState.isProcessing = false;
            return;
        }

        // Jumped ahead with email
        const nextStep = advanceToNextStep();
        chatState.currentStep = nextStep;

        if (nextStep === 'ask_name') {
            await botReply("Great, got your email! 📧", false, true);
            await botReply("What's your name?", true, false);
        } else if (nextStep === 'ask_topic') {
            await botReply("Great, got your email! 📧", false, true);
            await botReply("What would you like to chat about? (UX project, mentorship, hiring, or something else?)", true, false);
        } else if (nextStep === 'ask_whatsapp') {
            await botReply("Great, got your email! 📧", false, true);
            await botReply("Got a WhatsApp number too? 📱 (Type 'skip' if email is fine)", true, false);
        } else {
            await botReply("Great, got everything! 📧", false, true);
            await botReply("I'll be in touch soon ✨", true, false);
            completeChat();
        }
        chatState.isProcessing = false;
        return;
    }

    // C) Vulgar language - always checked
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

    // ============================================================
    // INITIAL STATE - greeting/intent detection
    // ============================================================
    if (chatState.currentStep === 'initial') {
        // Greetings
        const isGreeting = /^(hi|hello|hey|hiya|hola|yo|heya|sup|what'?s\s*up|whats\s*up)(\s+(there|asith|man|buddy|dude|bro|guys?|everyone|all))?$/i.test(lowerText);

        if (isGreeting) {
            chatState.hiCount++;
            if (chatState.hiCount === 1) {
                await botReply("Hey there! 👋", false, true);
                await botReply("Looking to work together, need mentorship, or just saying hi?", true, false);
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

        // "Just saying hi"
        if (/^(just\s+)?(saying\s+)?(hi|hello|hey|hiya|hola)$/i.test(lowerText)) {
            await botReply("That's cool! Always nice to meet people 😊", false, true);
            await botReply("Feel free to look around. If you ever want to chat about UX, product design, or anything else - just hit me up!", false, false);
            await botReply("You can also find me on X or email below 👇", true, false);
            completeChat();
            chatState.isProcessing = false;
            return;
        }

        // Testing the bot
        const isTesting = /^(test|testing|test\s*test|just\s*testing|trying\s*this|試し|试试|trying\s*it\s*out|checking|check)$/i.test(lowerText);
        
        if (isTesting) {
            const jokes = [
                "Test successful! ✅ The bot is indeed alive and kinda funny 😄",
                "Beep boop 🤖 Test mode activated... just kidding, I'm Asith (well, a bot version) 😅",
                "Testing, testing, 1-2-3... Mic check passed! 🎤",
                "You've unlocked the secret test response! Achievement: Quality Assurance 🏆",
                "Test? I thought this was a Wendy's... oh wait, it's my portfolio 😄",
                "Test confirmed. Bot is working. Coffee levels: adequate ☕️",
            ];
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            
            await botReply(randomJoke, false, true);
            await botReply("So, are you actually looking for something or just kicking the tires? 😊", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Work/project/hire/mentorship intent (check BEFORE name detection)
        const isWorkKeyword = /^(work|project|hire|hiring|collab|collaboration|mentor|mentorship|freelance|opportunity|job|gig|design|ux|ui|product|review|feedback|consultation|help)$/i.test(lowerText);

        if (isWorkKeyword || hasWorkIntent(userText)) {
            chatState.currentStep = 'ask_name';
            await botReply("Awesome, thanks for reaching out! 🙌", false, true);
            await botReply("Before we dive in - what's your name?", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Name-like input (not a greeting, not a phrase, not "asith", not a keyword)
        const nameLike = /^[a-z\s]{2,50}$/i.test(userText);
        const wordCount = userText.split(/\s+/).length;
        const isCommonPhrase = /^(just saying|saying|i want|i need|looking for|work together|lets work|help me)/i.test(userText);
        const mentionsOwner = /\basith\b/i.test(userText);
        const startsWithGreeting = /^(hi|hello|hey|hiya|hola|yo|heya|sup|how|what|who|where|when|why)/i.test(userText);

        if (nameLike && wordCount >= 1 && wordCount <= 4 && !isCommonPhrase && !mentionsOwner && !startsWithGreeting && userText.length >= 2) {
            chatState.userData.name = userText;
            chatState.currentStep = 'ask_topic';
            await botReply("Nice to meet you, " + userText + "! 👋", false, true);
            await botReply("What brings you here today? Looking for UX/product design help, mentorship, or something else?", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Yes/No to initial welcome
        if (isNo) {
            chatState.currentStep = 'declined';
            await botReply("No worries! 👋", false, true);
            await botReply("Feel free to come back anytime. See you around! ✨", true, false);
            completeChat();
        } else if (isYes) {
            chatState.currentStep = 'ask_topic';
            await botReply("Great! 🎉", false, true);
            await botReply("What are you looking for? UX/product design work, mentorship, portfolio review, or something else?", true, false);
        } else {
            // Gibberish check for initial state
            if (isGibberish(userText)) {
                chatState.gibberishCount++;
                if (chatState.gibberishCount <= 2) {
                    await botReply("Hmm, I'm not sure I follow 🤔", false, true);
                    await botReply("Are you looking for design work, mentorship, or just checking things out?", true, false);
                } else {
                    await botReply("Tell you what - just drop your email and I'll get back to you directly! 📧", true, true);
                    chatState.currentStep = 'ask_email';
                }
            } else {
                // Assume they want to proceed with whatever they said
                chatState.currentStep = 'ask_topic';
                await botReply("Cool! 🙌", false, true);
                await botReply("Tell me a bit more - what kind of help are you looking for?", true, false);
            }
        }
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // ASK_NAME STATE
    // ============================================================
    if (chatState.currentStep === 'ask_name') {
        chatState.userData.name = userText;
        const nextStep = advanceToNextStep();
        chatState.currentStep = nextStep;

        const greeting = "Nice to meet you, " + userText + "! 👋";

        if (nextStep === 'ask_topic') {
            await botReply(greeting, false, true);
            await botReply("What brings you here today? Looking for UX/product design help, mentorship, or something else?", true, false);
        } else if (nextStep === 'ask_email') {
            await botReply(greeting, false, true);
            await botReply("What's the best email to reach you at? 📧", true, false);
        } else if (nextStep === 'ask_whatsapp') {
            await botReply(greeting, false, true);
            await botReply("Got a WhatsApp number? Makes it easier to chat 📱 (Type 'skip' if email is fine)", true, false);
        } else {
            await botReply(greeting, false, true);
            await botReply("Thanks for reaching out! I'll get back to you soon ✨", true, false);
            completeChat();
        }
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // ASK_TOPIC STATE - smart contextual responses
    // ============================================================
    if (chatState.currentStep === 'ask_topic') {
        chatState.userData.topic = userText;
        const category = categorizeTopic(userText);
        const topicResponse = getTopicResponse(category);
        const nextStep = advanceToNextStep();
        chatState.currentStep = nextStep;

        if (nextStep === 'ask_name') {
            await botReply(topicResponse, false, true);
            await botReply("What's your name, by the way?", true, false);
        } else if (nextStep === 'ask_email') {
            await botReply(topicResponse, false, true);
            await botReply("What's the best email to reach you at? 📧", true, false);
        } else if (nextStep === 'ask_whatsapp') {
            await botReply(topicResponse, false, true);
            await botReply("Got a WhatsApp number too? 📱 (Type 'skip' if email is fine)", true, false);
        } else {
            await botReply(topicResponse, false, true);
            await botReply("Thanks" + (chatState.userData.name ? ", " + chatState.userData.name : "") + "! I'll get back to you soon ✨", true, false);
            completeChat();
        }
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // ASK_EMAIL STATE
    // ============================================================
    if (chatState.currentStep === 'ask_email') {
        if (lowerText.includes('skip') || isNo) {
            await botReply("I do need an email to get back to you! 😅 What's your email address?");
        } else if (!isValidEmail(userText)) {
            await botReply("That doesn't look like a valid email. Could you double-check it? 🙏");
        }
        // Valid email is handled by the global email intercept above
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // ASK_WHATSAPP STATE
    // ============================================================
    if (chatState.currentStep === 'ask_whatsapp') {
        if (lowerText.includes('skip') || isNo) {
            chatState.currentStep = 'complete';
            await botReply("No problem! Email works perfectly 👍", false, true);
            await botReply("Thanks for reaching out" + (chatState.userData.name ? ", " + chatState.userData.name : "") + "! I'll get back to you soon ✨", true, false);
            completeChat();
        } else {
            // Try to extract a phone number from what they typed
            const phone = extractPhone(userText);
            if (phone) {
                chatState.userData.whatsapp = phone;
                chatState.currentStep = 'complete';
                await botReply("Got it! 📱", false, true);
                await botReply("Thanks" + (chatState.userData.name ? ", " + chatState.userData.name : "") + "! I'll be in touch very soon ✨", true, false);
                completeChat();
            } else {
                await botReply("That number doesn't look quite right 🤔 Try something like +94771234567 or just 10 digits. Or type 'skip'.");
            }
        }
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // TERMINAL STATES
    // ============================================================
    if (chatState.currentStep === 'complete') {
        await botReply("I've already got your details! I'll be in touch soon 😊");
    } else if (chatState.currentStep === 'declined') {
        await botReply("Changed your mind? Just refresh the page and we can start over! 😊");
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
        addMessage("Looking for UX/product design help, mentorship, or want to work together? Drop your details and I'll get back to you! 💬", 'received', true, false);
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

