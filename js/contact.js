// Contact page iMessage-like AI chat functionality

const chatState = {
    currentStep: 'greeting',
    userData: {
        topic: '',
        whatsapp: '',
        email: ''
    },
    forwardedToMom: false,
    gibberishCount: 0
};

// Vulgar/bad words list
const vulgarWords = ['fuck', 'shit', 'bitch', 'damn', 'crap', 'bastard', 'idiot', 'stupid', 'dumb', 'hate'];

// Gibberish detection
const isGibberish = (text) => {
    const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, '');
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) return true;
    
    // Common English words for basic validation
    const commonWords = ['hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'sure', 'thanks', 'thank', 'you', 'i', 'me', 'my', 'we', 'us', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'need', 'want', 'like', 'love', 'work', 'help', 'project', 'design', 'app', 'website', 'job', 'hire', 'collaborate', 'question', 'ask', 'talk', 'chat', 'please', 'just', 'looking', 'interested', 'about', 'for', 'with', 'and', 'or', 'but', 'not', 'this', 'that', 'what', 'how', 'why', 'when', 'where', 'who', 'your', 'name', 'email', 'phone', 'number', 'contact', 'message', 'great', 'good', 'nice', 'awesome', 'cool', 'amazing', 'get', 'let', 'make', 'take', 'give', 'see', 'know', 'think', 'feel', 'new', 'old', 'big', 'small', 'first', 'last', 'one', 'two', 'time', 'way', 'day', 'thing', 'person', 'people', 'world', 'life', 'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'point', 'home', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city', 'community', 'team', 'minute', 'idea', 'body', 'information', 'back', 'face', 'level', 'office', 'door', 'health', 'art', 'history', 'party', 'result', 'change', 'morning', 'reason', 'research', 'moment', 'teacher', 'force', 'education'];
    
    let recognizedCount = 0;
    for (const word of words) {
        if (commonWords.includes(word) || word.length <= 2) {
            recognizedCount++;
        }
    }
    
    const recognizedRatio = recognizedCount / words.length;
    
    // Check for keyboard mashing patterns
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

// Create message element
const createMessage = (text, type = 'received', showAvatar = true) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-new ${type}`;
    
    if (type === 'received' && showAvatar) {
        messageDiv.innerHTML = `
            <img src="https://unavatar.io/twitter/asithc" alt="Asith" class="message-avatar-new">
            <div class="message-bubble-new">
                <p>${text}</p>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-bubble-new">
                <p>${text}</p>
            </div>
        `;
    }
    
    return messageDiv;
};

// Create typing indicator
const createTypingIndicator = () => {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-new received typing-indicator';
    typingDiv.innerHTML = `
        <img src="https://unavatar.io/twitter/asithc" alt="Asith" class="message-avatar-new">
        <div class="message-bubble-new typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;
    return typingDiv;
};

// Add message with animation
const addMessage = (container, text, type = 'received', showAvatar = true) => {
    return new Promise((resolve) => {
        const message = createMessage(text, type, showAvatar);
        message.style.opacity = '0';
        message.style.transform = 'translateY(10px)';
        container.appendChild(message);
        
        requestAnimationFrame(() => {
            message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            message.style.opacity = '1';
            message.style.transform = 'translateY(0)';
        });
        
        scrollToBottom();
        setTimeout(resolve, 300);
    });
};

// Show typing then send message
const typeAndSend = async (container, text, delay = 1000) => {
    const typing = createTypingIndicator();
    container.appendChild(typing);
    scrollToBottom();
    
    await new Promise(r => setTimeout(r, delay));
    
    typing.remove();
    await addMessage(container, text, 'received', true);
};

// Scroll to bottom
const scrollToBottom = () => {
    const container = document.getElementById('messageContainer');
    if (container) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
    }
};

// Handle user input
const handleUserInput = async (text) => {
    const container = document.getElementById('messageContainer');
    const input = document.getElementById('messageInput');
    
    if (!text.trim()) return;
    
    // Add user message
    await addMessage(container, text, 'sent', false);
    input.value = '';
    
    // Check for vulgar language first
    if (containsVulgar(text)) {
        if (!chatState.forwardedToMom) {
            chatState.forwardedToMom = true;
            await typeAndSend(container, "oh wow... hold on, i'm forwarding this to your mom real quick 📱", 1500);
            await typeAndSend(container, "done! she said Hi btw 👋😊", 2000);
            await typeAndSend(container, "anyway... how can i actually help you today?", 1000);
        } else {
            await typeAndSend(container, "your mom already knows about this one too 😅 let's try something more productive?", 1500);
        }
        return;
    }
    
    // Check for gibberish
    if (isGibberish(text) && chatState.currentStep !== 'ask_email' && chatState.currentStep !== 'ask_whatsapp') {
        chatState.gibberishCount++;
        if (chatState.gibberishCount <= 2) {
            await typeAndSend(container, "its funny i cant understand any of those. i'm not sure i should laugh or cry. ;3", 1500);
            await typeAndSend(container, "wanna try again? what can i help you with?", 1000);
        } else {
            await typeAndSend(container, "okay i really can't understand you 😅 maybe try the email or X options below?", 1500);
        }
        return;
    }
    
    // Process based on current step
    switch (chatState.currentStep) {
        case 'greeting':
            chatState.userData.topic = text;
            chatState.currentStep = 'ask_whatsapp';
            await typeAndSend(container, "nice! sounds interesting 🤔", 1000);
            await typeAndSend(container, "what's your whatsapp number so i can reach you? 📱", 1200);
            break;
            
        case 'ask_whatsapp':
            if (text.toLowerCase().includes('skip') || text.toLowerCase().includes('no') || text.toLowerCase() === 'n') {
                chatState.currentStep = 'ask_email';
                await typeAndSend(container, "no worries! what about your email then? 📧", 1000);
            } else if (isValidPhone(text)) {
                chatState.userData.whatsapp = text;
                chatState.currentStep = 'ask_email';
                await typeAndSend(container, "got it! 👍", 800);
                await typeAndSend(container, "and what's your email? 📧", 1000);
            } else {
                await typeAndSend(container, "hmm that doesn't look like a valid number 🤔 try again or type 'skip' to move on", 1200);
            }
            break;
            
        case 'ask_email':
            if (text.toLowerCase().includes('skip') || text.toLowerCase().includes('no') || text.toLowerCase() === 'n') {
                if (!chatState.userData.whatsapp) {
                    await typeAndSend(container, "i need at least one way to reach you! 😅 what's your email?", 1200);
                } else {
                    chatState.currentStep = 'complete';
                    await typeAndSend(container, "alright, got your whatsapp! thanks 🙏", 1000);
                    await typeAndSend(container, "i'll hit you up at the earliest! talk soon ✨", 1200);
                    completeChat();
                }
            } else if (isValidEmail(text)) {
                chatState.userData.email = text;
                chatState.currentStep = 'complete';
                await typeAndSend(container, "perfect! thanks 🙏", 800);
                await typeAndSend(container, "i'll hit you up at the earliest! talk soon ✨", 1200);
                completeChat();
            } else {
                await typeAndSend(container, "that doesn't look like a valid email 🤔 try again?", 1200);
            }
            break;
            
        case 'complete':
            await typeAndSend(container, "we're all set! i already have your info 😊 just wait for my message!", 1200);
            break;
    }
};

// Complete chat and log data
const completeChat = () => {
    const input = document.getElementById('messageInput');
    
    console.log('Contact submitted:', chatState.userData);
    
    setTimeout(() => {
        if (input) {
            input.placeholder = 'Chat complete! ✨';
        }
    }, 2000);
};

// Initialize chat
const initContactChat = async () => {
    const container = document.getElementById('messageContainer');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendButton');
    
    if (!container || !input || !sendBtn) return;
    
    // Start with greeting
    await typeAndSend(container, "hey there! 👋", 800);
    await typeAndSend(container, "want to work together? or just wanna chat? tell me, how can i help you?", 1200);
    
    // Handle send
    const handleSend = () => {
        const text = input.value.trim();
        if (text) {
            handleUserInput(text);
        }
    };
    
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
    
    input.focus();
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactChat);
} else {
    initContactChat();
}

