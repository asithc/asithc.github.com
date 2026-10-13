// Contact page iMessage-like AI chat functionality

const chatState = {
    currentStep: 'initial',
    userData: {
        name: '',
        topic: '',
        title: '',
        whatsapp: '',
        email: '',
        conversationStartTime: null,
        connectionSource: 'Contact Page'
    },
    hiCount: 0,
    forwardedToMom: false,
    gibberishCount: 0,
    vulgarCount: 0,
    sinhalaVulgarCount: 0,
    isProcessing: false,
    submissionInFlight: false
};

// --- Vulgar language detection ---
const vulgarWords = ['fuck', 'shit', 'bitch', 'damn', 'crap', 'bastard', 'idiot', 'stupid', 'dumb', 'hate'];
const sinhalaVulgarWords = ['pakaya', 'huththa', 'huththo', 'wesi', 'wesawa', 'wesawi', 'ponnaya', 'kariya'];

const containsVulgar = (text) => vulgarWords.some(w => new RegExp('\\b' + w + '\\b', 'i').test(text));
const containsSinhalaVulgar = (text) => {
    const lower = text.toLowerCase();
    return sinhalaVulgarWords.some(w => new RegExp('\\b' + w + '\\b', 'i').test(lower));
};

// Reject obvious noise, not unfamiliar words or non-English names.
const isGibberish = (text) => {
    const cleaned = text.normalize('NFC').trim();
    if (!/[\p{L}\p{N}]/u.test(cleaned)) return true;
    if (/(.)\1{3,}/u.test(cleaned)) return true;
    const compact = cleaned.toLowerCase().replace(/\s/g, '');
    if (/^(?:asdf|qwer|zxcv|hjkl|qwerty|asdfgh|zxcvbn|poiuyt|lkjhg)[a-z]*$/.test(compact)) return true;
    if (/^[a-z]{6,}$/i.test(compact) && !/[aeiouy]/i.test(compact)) return true;
    return false;
};

const extractName = (text) => {
    let candidate = text.normalize('NFC').trim();
    candidate = candidate.replace(/^(?:hi|hello|hey)[,!.]?\s+(?=(?:my name|i['’]m|i am|this is))/i, '');
    candidate = candidate.replace(/^(?:my name(?: is)?|i['’]m|i am|call me|it['’]s|this is)\s*[:,-]?\s+/i, '');
    candidate = candidate.replace(/[!?,]+$/g, '').trim();
    if (candidate.length > 80 || !/\p{L}/u.test(candidate)) return null;
    if (!/^[\p{L}\p{M}][\p{L}\p{M} .’'−-]*$/u.test(candidate)) return null;
    if (candidate.split(/\s+/).length > 6 || isGibberish(candidate)) return null;
    if (/^(?:hi|hello|hey|yes|no|ok|okay|sure|thanks|thank you|test|testing|skip|anonymous|not sure|just browsing|just looking|just saying hi|help me)$/i.test(candidate)) return null;
    if (/^(?:a |an |the |i |we |you |my |can |could |what |how |why |looking |need |want |just |not |rather |prefer |none |don't |do not )/i.test(candidate)) return null;
    if (hasWorkIntent(candidate) || /^(?:work|project|help|design|ux|ui|product|review|feedback|consultation)$/i.test(candidate)) return null;
    return candidate.replace(/\s+/g, ' ');
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

// --- Intent detection (work/project/hire/mentor/job/career) ---
const hasWorkIntent = (text) => {
    return [
        /\b(?:website|web|app|mobile|brand|logo|product)\s+(?:design|redesign|development)\b/i,
        /\b(?:need|want|looking for)\b.*\b(?:website|app|design|help|project)\b/i,
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
        /\b(job|career|opportunity|position|role|opening|vacancy)\b/i,
        /\b(offer|offering|have\s+a\s+position|recruiting|recruitment)\b/i,
        /\b(join\s+(our|my|the)|company|team|organization)\b/i,
        /\b(employment|employ|full[\s-]?time|part[\s-]?time|contract|permanent)\b/i,
    ].some(p => p.test(text));
};

// --- Topic categorization for contextual Asith-like responses ---
const categorizeTopic = (text) => {
    const lower = text.toLowerCase();
    if (/\b(job|career|opportunity|position|role|opening|vacancy|offer|offering|recruiting|recruitment|employment|employ)\b/.test(lower)) return 'career_opportunity';
    if (/\b(mentor|mentorship|guidance|guide|learn|teach|advice|career|grow|growth)\b/.test(lower)) return 'mentorship';
    if (/\b(hire|hiring|freelance|contract|full[\s-]?time|part[\s-]?time|gig)\b/.test(lower)) return 'hiring';
    if (/\b(ux|ui|user\s*experience|user\s*interface|wireframe|prototype|figma|design\s*system|usability|research|heuristic|interaction)\b/.test(lower)) return 'ux_design';
    if (/\b(product|product\s*design|saas|startup|mvp|feature|roadmap|strategy)\b/.test(lower)) return 'product_design';
    if (/\b(brand|branding|logo|identity|visual|graphic)\b/.test(lower)) return 'branding';
    if (/\b(app|mobile|ios|android|web|website|landing\s*page|dashboard|platform)\b/.test(lower)) return 'app_project';
    if (/\b(review|feedback|audit|critique|portfolio|look\s*at)\b/.test(lower)) return 'review';
    if (/\b(collab|collaboration|partner|together|team\s*up)\b/.test(lower)) return 'collaboration';
    return 'general';
};

// Extract job title/role from text
const extractTitle = (text) => {
    const lower = text.toLowerCase();
    
    // Common title patterns
    const titlePatterns = [
        /\b(senior|lead|principal|staff|head\s+of)\s+(ux|ui|product|design)/i,
        /\b(ux|ui|product)\s+(designer|design|lead|manager|director)/i,
        /\b(design\s+manager|design\s+director|design\s+lead)/i,
        /\b(recruiter|hr\s+manager|talent\s+acquisition|hiring\s+manager)/i,
        /\b(ceo|cto|coo|founder|co[\s-]?founder)/i,
        /\b(manager|director|vp|vice\s+president)/i,
    ];
    
    for (const pattern of titlePatterns) {
        const match = text.match(pattern);
        if (match) return match[0];
    }
    
    // If mentioning a role/position
    if (/\b(position|role|job)\s+(?:for|as)\s+([a-z\s]+)/i.test(lower)) {
        const match = text.match(/\b(?:position|role|job)\s+(?:for|as)\s+([a-z\s]{3,30})/i);
        if (match) return match[1].trim();
    }
    
    return '';
};

const getTopicResponse = (category) => {
    const responses = {
        career_opportunity: "Thanks for thinking of me for this opportunity! I'm definitely interested in hearing more about the role 🎯",
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

// Sanitize text to prevent XSS
const sanitizeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// Add message to chat
const addMessage = (text, type = 'received', showAvatar = true, showNameLabel = true) => {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-new ' + type;

    // Sanitize user-sent messages to prevent self-XSS
    const safeText = type === 'sent' ? sanitizeHTML(text) : text;

    if (type === 'received') {
        const avatarHTML = showAvatar ? '<img src="images/asith-avatar.webp" alt="Asith" class="message-avatar-new">' : '<div class="message-avatar-spacer"></div>';
        const nameLabelHTML = showNameLabel ? '<div class="message-name-label">Asith</div>' : '';
        messageDiv.innerHTML =
            nameLabelHTML +
            avatarHTML +
            '<div class="message-bubble-new"><p>' + safeText + '</p></div>';
    } else {
        messageDiv.innerHTML =
            '<div class="message-bubble-new"><p>' + safeText + '</p></div>';
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
        '<img src="images/asith-avatar.webp" alt="Asith" class="message-avatar-new">' +
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
    const readPause = 150 + Math.random() * 150; // 150-300ms

    // Typing speed: ~35-55ms per character
    const charDelay = text.length * (35 + Math.random() * 20);

    // Thinking jitter
    const jitter = Math.random() * 800; // 0-800ms

    // Keep replies responsive while retaining a brief typing cue.
    const typingTime = Math.min(Math.max(charDelay + jitter, 350), 1000);

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

    if (chatState.currentStep === 'delivery_failed') {
        if (/^(retry|try again)$/i.test(userText)) {
            input.value = '';
            await completeChat();
        } else {
            addMessage('Your details are saved in this conversation. Use Retry or Send by email below.', 'received');
        }
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
            await botReply("Thanks! I’ll submit your details now.", true, false);
            await completeChat();
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
            await botReply("Thanks! I’ll submit your details now.", true, false);
            await completeChat();
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
                await botReply("Thanks! I’ll submit your details now.", true, false);
                await completeChat();
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
            await botReply("I’ll submit your details now.", true, false);
            await completeChat();
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

    // D) Sinhala vulgar language - extended trolling sequence
    if (containsSinhalaVulgar(userText)) {
        chatState.sinhalaVulgarCount++;

        if (chatState.sinhalaVulgarCount === 1) {
            await botReply("Aiyo machan... 😅", false, true);
            await botReply("Mokakda me wennne? Professional portfolio site ekak meka 😄", false, false);
            await botReply("Try again? 😊", true, false);
        } else if (chatState.sinhalaVulgarCount === 2) {
            await botReply("Oyyy... again? 🤦‍♂️", false, true);
            await botReply("Mama oya words tika Google Sheets ekak update karala oyage ammata email yawanawada... 📧", false, false);
            await botReply("daaa??? 😏", true, false);
            await botReply("Still want to try your luck? 😏", true, false);
        } else if (chatState.sinhalaVulgarCount === 3) {
            await botReply("Okkoma screenshot gannawa bn... 📸", false, true);
            await botReply("Oyage company eke HR wa copy karala dannada email ekak 😂", false, false);
            await botReply("Well, I know you joking... but seriously, can we talk like normal people? 🙃", true, false);
        } else if (chatState.sinhalaVulgarCount === 4) {
            await botReply("You know what? Respect for the persistence 😆", false, true);
            await botReply("But mama hari tired bng... Let's just move on? 😅", false, false);
            await botReply("What are you actually here for? UX work? Mentorship? Portfolio review?", true, false);
            // Reset to allow normal conversation but stay in initial
        } else {
            // After 5+ times, just ignore and ask again
            await botReply("... 😑", false, true);
            await botReply("Okay, I'll just assume you need design help. What brings you here?", true, false);
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
            await completeChat();
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

        // Yes/No responses (check BEFORE name detection to avoid "yes"/"no" being treated as names)
        if (isNo) {
            chatState.currentStep = 'declined';
            await botReply("No worries! 👋", false, true);
            await botReply("Feel free to come back anytime. See you around! ✨", true, false);
            await completeChat();
            chatState.isProcessing = false;
            return;
        } else if (isYes) {
            chatState.currentStep = 'ask_topic';
            await botReply("Awesome! 🎉", false, true);
            await botReply("So what brings you here? UX/product design work, mentorship, portfolio review, or something else?", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Work/project/hire/mentorship/job/career intent (check BEFORE name detection)
        const isWorkKeyword = /^(work|project|hire|hiring|collab|collaboration|mentor|mentorship|freelance|opportunity|job|career|gig|design|ux|ui|product|review|feedback|consultation|help|position|role|opening|offer)$/i.test(lowerText);

        if (isWorkKeyword || hasWorkIntent(userText)) {
            chatState.userData.topic = userText;
            chatState.userData.title = extractTitle(userText);
            chatState.currentStep = 'ask_name';
            await botReply("Awesome, thanks for reaching out! 🙌", false, true);
            await botReply("Before we dive in - what's your name?", true, false);
            chatState.isProcessing = false;
            return;
        }

        const name = extractName(userText);
        if (name) {
            chatState.userData.name = name;
            chatState.currentStep = 'ask_topic';
            await botReply("Nice to meet you, " + name + "! 👋", false, true);
            await botReply("What would you like to discuss?", true, false);
            chatState.isProcessing = false;
            return;
        }

        // Fallback for anything else in initial state
        // Gibberish check
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
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // ASK_NAME STATE
    // ============================================================
    if (chatState.currentStep === 'ask_name') {
        const name = extractName(userText);
        if (!name) {
            if (hasWorkIntent(userText)) {
                chatState.userData.topic = userText;
                await botReply("Got the project details. What name should I use for you?", true, false);
            } else {
                await botReply("What name should I use for you? A first name is fine — for example, ‘My name is Alex’.", true, false);
            }
            chatState.isProcessing = false;
            return;
        }
        chatState.userData.name = name;
        const nextStep = advanceToNextStep();
        chatState.currentStep = nextStep;

        const greeting = "Nice to meet you, " + name + "! 👋";

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
            await botReply("Thanks! I’ll submit your details now.", true, false);
            await completeChat();
        }
        chatState.isProcessing = false;
        return;
    }

    // ============================================================
    // ASK_TOPIC STATE - smart contextual responses
    // ============================================================
    if (chatState.currentStep === 'ask_topic') {
        if (isGibberish(userText) || /^(hi|hello|hey|yes|no|ok|okay)$/i.test(lowerText)) {
            await botReply('Could you tell me a little about your inquiry? For example, a website project, a job opportunity, or a portfolio review.', true, false);
            chatState.isProcessing = false;
            return;
        }
        chatState.userData.topic = userText;
        const category = categorizeTopic(userText);
        const extractedTitle = extractTitle(userText);
        if (extractedTitle) {
            chatState.userData.title = extractedTitle;
        }
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
            await botReply("Thanks! I’ll submit your details now.", true, false);
            await completeChat();
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
            await botReply("Thanks! I’ll submit your details now.", true, false);
            await completeChat();
        } else {
            // Try to extract a phone number from what they typed
            const phone = extractPhone(userText);
            if (phone) {
                chatState.userData.whatsapp = phone;
                chatState.currentStep = 'complete';
                await botReply("Got it! 📱", false, true);
                await botReply("Thanks! I’ll submit your details now.", true, false);
                await completeChat();
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
    if (chatState.currentStep === 'complete' || chatState.currentStep === 'sent') {
        await botReply("I've already got your details! I'll be in touch soon 😊");
    } else if (chatState.currentStep === 'declined') {
        await botReply("Changed your mind? Just refresh the page and we can start over! 😊");
    }

    chatState.isProcessing = false;
};

// Rate limiting for form submissions
const formRateLimit = {
    lastSubmission: 0,
    submissionCount: 0,
    cooldownMs: 60000, // 1 minute between submissions
    maxSubmissions: 3,  // Max 3 submissions per session
    windowMs: 600000,   // 10 minute window for max submissions
    windowStart: 0
};

// Google Sheets API URL (update this with your deployed script URL)
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbySW5IrauskchS8HOSWPxe-FiJ1wxg-Vsx_uIhOiQ_P-3KKLv2Fo_udGoim0zMul-CQ/exec';

// Send data to Google Sheets and trigger email notifications
const sendToGoogleSheets = async (data) => {
    try {
        if (!navigator.onLine) return false;
        const now = Date.now();
        if (now - formRateLimit.windowStart >= formRateLimit.windowMs) {
            formRateLimit.windowStart = now;
            formRateLimit.submissionCount = 0;
            formRateLimit.lastSubmission = 0;
        }
        // Only acknowledged submissions consume the local rate limit.
        if (now - formRateLimit.lastSubmission < formRateLimit.cooldownMs) {
            console.warn('Rate limit: Too many submissions, please wait.');
            return false;
        }
        if (formRateLimit.submissionCount >= formRateLimit.maxSubmissions) {
            console.warn('Rate limit: Maximum submissions reached for this session.');
            return false;
        }
        const conversationEnd = new Date();
        const startTime = data.conversationStartTime ? new Date(data.conversationStartTime) : conversationEnd;
        
        const secureData = {
            name: data.name || 'Not provided',
            email: data.email || 'Not provided',
            whatsapp: data.whatsapp || 'Not provided',
            topic: data.topic || 'Not provided',
            title: data.title || 'Not specified',
            connectionSource: data.connectionSource || 'Contact Page',
            conversationStartTime: startTime.toLocaleString('en-US', { 
                timeZone: 'Asia/Colombo',
                dateStyle: 'medium',
                timeStyle: 'medium'
            }),
            conversationEndTime: conversationEnd.toLocaleString('en-US', { 
                timeZone: 'Asia/Colombo',
                dateStyle: 'medium',
                timeStyle: 'medium'
            }),
            origin: window.location.origin,
            website: '', // Honeypot field — should always be empty
            timestamp: Date.now(),
            sendEmail: true,
            emailRecipients: ['asithwijenayake@gmail.com']
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(GOOGLE_SHEETS_URL, {
                method: 'POST',
                mode: 'cors',
                // A simple cross-origin request avoids an OPTIONS preflight.
                // Apps Script still receives the JSON body in e.postData.contents.
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify(secureData),
                signal: controller.signal
            });
            if (!response.ok) return false;
            const result = await response.json();
            if (!result || result.success === false || result.error ||
                result.status === 'error' || result.result === 'error') return false;
            const accepted = result.success === true ||
                result.status === 'success' || result.result === 'success';
            if (!accepted) return false;
            formRateLimit.lastSubmission = Date.now();
            formRateLimit.submissionCount++;
            return true;
        } finally {
            clearTimeout(timeout);
        }
    } catch (error) {
        // A network, CORS, timeout or invalid response cannot confirm delivery.
        console.warn('Contact delivery could not be confirmed.');
        return false;
    }
};

const updateEmailFallback = () => {
    const link = document.getElementById('contactEmailFallback');
    if (!link) return;
    const data = chatState.userData;
    const body = [
        `Name: ${data.name || ''}`,
        `Email: ${data.email || ''}`,
        `WhatsApp: ${data.whatsapp || ''}`,
        '',
        `Inquiry: ${data.topic || ''}`,
        data.title ? `Details: ${data.title}` : ''
    ].filter(Boolean).join('\n');
    link.href = 'mailto:asithwijenayake@gmail.com?subject=' +
        encodeURIComponent('Website inquiry' + (data.name ? ' from ' + data.name : '')) +
        '&body=' + encodeURIComponent(body);
};

// Completion is shown only after the delivery service acknowledges acceptance.
const completeChat = async () => {
    if (chatState.submissionInFlight || chatState.currentStep === 'sent') return;
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendButton');
    const status = document.getElementById('contactDeliveryStatus');
    const retry = document.getElementById('contactRetry');
    const fallback = document.getElementById('contactDeliveryActions');

    // A farewell is not a contact inquiry and should not submit empty data.
    if (chatState.currentStep === 'declined' ||
        (!chatState.userData.email && !chatState.userData.whatsapp)) {
        chatState.currentStep = 'declined';
        if (status) status.textContent = 'Thanks for visiting. You can also reach me by email below.';
        return;
    }

    chatState.submissionInFlight = true;
    chatState.currentStep = 'submitting';
    updateEmailFallback();
    if (input) { input.disabled = true; input.placeholder = 'Sending your details…'; }
    if (sendBtn) sendBtn.disabled = true;
    if (retry) retry.disabled = true;
    if (status) status.textContent = 'Sending your details…';
    if (fallback) fallback.hidden = true;

    const accepted = await sendToGoogleSheets(chatState.userData);
    chatState.submissionInFlight = false;
    if (accepted) {
        chatState.currentStep = 'sent';
        if (status) status.textContent = 'Your inquiry was received. Thanks for reaching out!';
        if (input) input.placeholder = 'Inquiry received ✓';
        if (sendBtn) sendBtn.classList.add('complete');
        addMessage('Your inquiry was received. I’ll get back to you soon.', 'received');
    } else {
        chatState.currentStep = 'delivery_failed';
        if (status) status.textContent = 'We couldn’t confirm delivery. Your details are still here. Retry or send them by email.';
        if (input) { input.disabled = false; input.placeholder = 'Type retry to try again'; }
        if (sendBtn) sendBtn.disabled = false;
        if (retry) retry.disabled = false;
        if (fallback) fallback.hidden = false;
    }
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
    
    // Set conversation start time
    chatState.userData.conversationStartTime = new Date().toISOString();

    // Show initial welcome messages with natural delay
    addMessage("Hey! 👋", 'received', false, true);
    setTimeout(() => {
        addMessage("Looking for UX/product design help, have a job opportunity, interested in mentorship, or want to collaborate? Drop your details and I'll get back to you! 💬", 'received', true, false);
    }, 1200 + Math.random() * 600);

    // Handle send
    const handleSend = () => {
        const text = input.value.trim();
        if (text && !chatState.isProcessing) {
            handleMessage(text);
        }
    };

    sendBtn.addEventListener('click', handleSend);
    document.getElementById('contactRetry')?.addEventListener('click', () => completeChat());

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
