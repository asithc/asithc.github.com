// Contact page iMessage-like AI chat functionality

const chatState = {
    currentStep: 'initial',
    userData: {
        topic: '',
        whatsapp: '',
        email: ''
    },
    forwardedToMom: false,
    gibberishCount: 0,
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

// Validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate WhatsApp number
const isValidPhone = (phone) => {
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(cleaned);
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
    
    // Check for vulgar language
    if (containsVulgar(userText)) {
        if (!chatState.forwardedToMom) {
            chatState.forwardedToMom = true;
            await botReply("oh wow... hold on, i'm forwarding this to your mom real quick 📱", 1500);
            await botReply("done! she said Hi btw 👋😊", 2000);
            await botReply("anyway... how can i actually help you today?", 1000);
        } else {
            await botReply("your mom already knows about this one too 😅 let's try something more productive?", 1500);
        }
        chatState.isProcessing = false;
        return;
    }
    
    // Check for gibberish (except when collecting phone/email)
    if (isGibberish(userText) && chatState.currentStep !== 'ask_email' && chatState.currentStep !== 'ask_whatsapp') {
        chatState.gibberishCount++;
        if (chatState.gibberishCount <= 2) {
            await botReply("its funny i cant understand any of those. i'm not sure i should laugh or cry. ;3", 1500);
            await botReply("wanna try again? what can i help you with?", 1000);
        } else {
            await botReply("okay i really can't understand you 😅 maybe try the email or X options below?", 1500);
        }
        chatState.isProcessing = false;
        return;
    }
    
    // Process based on current step
    switch (chatState.currentStep) {
        case 'initial':
            // First message from user - greet and ask what they need
            chatState.userData.topic = userText;
            chatState.currentStep = 'ask_whatsapp';
            await botReply("hey! 👋", 800);
            await botReply("nice! sounds interesting 🤔", 1000);
            await botReply("what's your whatsapp number so i can reach you? 📱 (or type 'skip')", 1200);
            break;
            
        case 'ask_whatsapp':
            if (userText.toLowerCase().includes('skip') || userText.toLowerCase().includes('no') || userText.toLowerCase() === 'n') {
                chatState.currentStep = 'ask_email';
                await botReply("no worries! what about your email then? 📧", 1000);
            } else if (isValidPhone(userText)) {
                chatState.userData.whatsapp = userText;
                chatState.currentStep = 'ask_email';
                await botReply("got it! 👍", 800);
                await botReply("and what's your email? 📧", 1000);
            } else {
                await botReply("hmm that doesn't look like a valid number 🤔 try again or type 'skip' to move on", 1200);
            }
            break;
            
        case 'ask_email':
            if (userText.toLowerCase().includes('skip') || userText.toLowerCase().includes('no') || userText.toLowerCase() === 'n') {
                if (!chatState.userData.whatsapp) {
                    await botReply("i need at least one way to reach you! 😅 what's your email?", 1200);
                } else {
                    chatState.currentStep = 'complete';
                    await botReply("alright, got your whatsapp! thanks 🙏", 1000);
                    await botReply("i'll hit you up at the earliest! talk soon ✨", 1200);
                    completeChat();
                }
            } else if (isValidEmail(userText)) {
                chatState.userData.email = userText;
                chatState.currentStep = 'complete';
                await botReply("perfect! thanks 🙏", 800);
                await botReply("i'll hit you up at the earliest! talk soon ✨", 1200);
                completeChat();
            } else {
                await botReply("that doesn't look like a valid email 🤔 try again?", 1200);
            }
            break;
            
        case 'complete':
            await botReply("we're all set! i already have your info 😊 just wait for my message!", 1200);
            break;
    }
    
    chatState.isProcessing = false;
};

// Complete chat
const completeChat = () => {
    const input = document.getElementById('messageInput');
    console.log('Contact submitted:', chatState.userData);
    
    setTimeout(() => {
        if (input) {
            input.placeholder = 'Chat complete! ✨';
            input.disabled = true;
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

