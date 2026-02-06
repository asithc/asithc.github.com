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
    generatedLead: false,
    vulgarCount: 0,
    isProcessing: false
};

// Vulgar/bad words list
const vulgarWords = ['fuck', 'shit', 'bitch', 'damn', 'crap', 'bastard', 'idiot', 'stupid', 'dumb', 'hate'];

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

// Validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
const addMessage = (text, type = 'received') => {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-new ' + type;

    if (type === 'received') {
        messageDiv.innerHTML =
            '<img src="https://unavatar.io/twitter/asithc" alt="Asith" class="message-avatar-new">' +
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

// Send bot reply with typing delay
const botReply = (text, delay = 1000) => {
    return new Promise((resolve) => {
        showTyping();
        setTimeout(() => {
            hideTyping();
            addMessage(text, 'received');
            resolve();
        }, delay);
    });
};

// Handle user message
const handleMessage = async (text) => {
    if (chatState.isProcessing) return;
    chatState.isProcessing = true;

    const input = document.getElementById('messageInput');
    const userText = text.trim();

    if (!userText) {
        chatState.isProcessing = false;
        return;
    }

    // Show user message
    addMessage(userText, 'sent');
    input.value = '';

    const lowerText = userText.toLowerCase();

    // 1. Check for "Hi" variations FIRST
    // Only capture simple greetings, not "Hi my name is..." sentences
    const isJustHi = /^(hi|hello|hey|hiya|hola|yo|heya)$/i.test(lowerText.replace(/[.!?,]/g, ''));

    if (isJustHi) {
        chatState.hiCount++;

        if (chatState.hiCount === 1) {
            await botReply("Hi! 👋", 1000);
        } else if (chatState.hiCount === 2) {
            await botReply("Hi, again! 😄", 1000);
        } else {
            await botReply("Hello from the other side..... 🎶", 1500);
            await botReply("anyway, how can I help you? 😊", 1000);
            // Reset state to collect info if needed, or just let them continue
            if (chatState.currentStep === 'initial') {
                chatState.currentStep = 'ask_name';
            }
        }
        chatState.isProcessing = false;
        return;
    }

    // 2. Check for vulgar language
    if (containsVulgar(userText)) {
        chatState.vulgarCount++;

        if (chatState.vulgarCount === 1) {
            // The classic joke
            await botReply("oh wow... hold on, i'm forwarding this to your mom real quick 📱", 1500);
            await botReply("done! she said Hi btw 👋😊", 2000);
            await botReply("anyway... jokes aside, I'd really love to help you professionally. What's on your mind?", 1500);
        } else {
            await botReply("Let's keep it clean and professional please! 😅", 1200);
            await botReply("How can I help you with your project?", 1000);
        }
        chatState.isProcessing = false;
        return;
    }

    // 3. Check for gibberish (except when collecting name/phone/email)
    if (isGibberish(userText) && chatState.currentStep !== 'ask_email' && chatState.currentStep !== 'ask_whatsapp' && chatState.currentStep !== 'ask_name') {
        // ... (Gibberish logic can remain similar or be simplified)
        await botReply("I'm not sure I caught that 🤔 Could you rephrase?", 1200);
        chatState.isProcessing = false;
        return;
    }

    // 4. Main Conversation Flow
    switch (chatState.currentStep) {
        case 'initial':
            // If they didn't just say "Hi" (caught above), assume they are answering the prompt or starting topic
            chatState.currentStep = 'ask_name';
            await botReply("Before we dive in, can I get your name please? 😊", 1000);
            break;

        case 'ask_name':
            chatState.userData.name = userText;
            chatState.currentStep = 'ask_topic';
            await botReply(`Nice to meet you, ${userText}! 👋`, 800);
            await botReply("So, what's the main reason you're reaching out today? (Project, Collab, or just saying hi?)", 1200);
            break;

        case 'ask_topic':
            chatState.userData.topic = userText;
            chatState.currentStep = 'ask_email';
            await botReply("Got it! Sounds interesting. 🤔", 1000);
            await botReply("What's the best email address to reach you at? 📧", 1000);
            break;

        case 'ask_email':
            if (isValidEmail(userText)) {
                chatState.userData.email = userText;
                chatState.currentStep = 'ask_whatsapp';
                await botReply("Perfect. 📧", 800);
                await botReply("Do you have a WhatsApp number I can use for quicker communication? 📱 (Type 'skip' if you prefer email)", 1500);
            } else {
                if (userText.toLowerCase().includes('skip')) {
                    await botReply("I really need an email to get back to you! 😅", 1000);
                } else {
                    await botReply("That doesn't look like a valid email. Could you check it again? 🙏", 1200);
                }
            }
            break;

        case 'ask_whatsapp':
            if (userText.toLowerCase().includes('skip') || userText.toLowerCase().replace(/[^a-z]/g, '') === 'no') {
                chatState.currentStep = 'complete';
                await botReply("No problem! I'll stick to email. 👍", 1000);
                await botReply("Thanks for reaching out! I'll get back to you very soon. ✨", 1200);
                completeChat();
            } else if (isValidPhone(userText)) {
                chatState.userData.whatsapp = userText;
                chatState.currentStep = 'complete';
                await botReply("Awesome! 📱", 800);
                await botReply("Thanks for sharing that. I'll be in touch very soon! ✨", 1200);
                completeChat();
            } else {
                await botReply("That number doesn't look quite right 🤔. Try format +1234567890 or just 10 digits. Or type 'skip'.", 1500);
            }
            break;

        case 'complete':
            await botReply("I've already got your details! I'll be in touch soon. 😊", 1200);
            break;
    }

    chatState.isProcessing = false;
};

// Google Sheets API URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzwlhTOiXwMqo9labTW3TIi6JgxxP8zKT52vlM6LakwBryWBjfZqIGxb2G68sNULIA/exec';

// Send data to Google Sheets with security measures
const sendToGoogleSheets = async (data) => {
    try {
        // Add security fields
        const secureData = {
            ...data,
            origin: window.location.origin,
            website: '', // Honeypot field - should always be empty
            timestamp: Date.now()
        };

        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for Apps Script
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
            input.placeholder = 'Your message has been sent! ✅';
            input.disabled = true;
            input.style.opacity = '0.6';
        }
        if (sendBtn) {
            sendBtn.classList.add('complete');
            sendBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/></svg>';
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

    // Add initial messages
    // Slight delay for the second message to make it feel natural
    addMessage("Hi there! 👋", 'received');
    setTimeout(() => {
        addMessage("Want to work together? Don't hesitate to drop your contact details here! 💬", 'received');
    }, 800);

    // Handle send
    const handleSend = () => {
        const text = input.value.trim();
        if (text && !chatState.isProcessing) {
            handleMessage(text);
        }
    };

    sendBtn.addEventListener('click', handleSend);

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

