// Contact page interactive iMessage chat functionality

let currentStep = 0;
const userData = {
    name: '',
    topic: '',
    phone: '',
    email: '',
    message: ''
};

const initContactChat = () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const messageContainer = document.getElementById('messageContainer');
    
    if (!messageInput || !sendButton || !messageContainer) return;

    // Handle send button click
    sendButton.addEventListener('click', handleSend);
    
    // Handle Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });
    
    // Focus input on load
    messageInput.focus();
};

const handleSend = () => {
    const messageInput = document.getElementById('messageInput');
    const value = messageInput.value.trim();
    
    if (!value) return;
    
    // Determine which field we're collecting
    switch(currentStep) {
        case 0:
            // Initial response
            showNextMessage(1);
            currentStep = 1;
            break;
        case 1:
            // Collecting name
            userData.name = value;
            updateUserResponse('name', value);
            showNextMessage(3);
            setTimeout(() => showNextMessage(4), 600);
            currentStep = 2;
            break;
        case 2:
            // Collecting topic
            userData.topic = value;
            updateUserResponse('topic', value);
            showNextMessage(5);
            setTimeout(() => showNextMessage(6), 600);
            currentStep = 3;
            break;
        case 3:
            // Collecting phone
            userData.phone = value;
            updateUserResponse('phone', value);
            showNextMessage(7);
            setTimeout(() => showNextMessage(8), 600);
            currentStep = 4;
            break;
        case 4:
            // Collecting email
            userData.email = value;
            updateUserResponse('email', value);
            showNextMessage(9);
            setTimeout(() => showNextMessage(10), 600);
            currentStep = 5;
            break;
        case 5:
            // Collecting final message
            userData.message = value;
            updateUserResponse('message', value);
            showNextMessage(11);
            setTimeout(() => showNextMessage(12), 600);
            setTimeout(() => completeForm(), 1200);
            currentStep = 6;
            break;
        default:
            return;
    }
    
    messageInput.value = '';
    scrollToBottom();
};

const showNextMessage = (step) => {
    const message = document.querySelector(`[data-step="${step}"]`);
    if (message) {
        message.style.display = 'flex';
        message.classList.add('fade-in');
        scrollToBottom();
    }
};

const updateUserResponse = (inputType, value) => {
    const responseElement = document.querySelector(`[data-input="${inputType}"]`);
    if (responseElement) {
        responseElement.textContent = value;
    }
};

const scrollToBottom = () => {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 100);
    }
};

const completeForm = () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Thanks for reaching out! ✨';
    }
    
    if (sendButton) {
        sendButton.style.opacity = '0.5';
        sendButton.style.cursor = 'not-allowed';
    }
    
    // Log the collected data (in production, this would send to a backend)
    console.log('Contact Form Submitted:', userData);
    
    // Optional: Send data to a backend API
    // sendToBackend(userData);
    
    // Show success animation
    showSuccessAnimation();
};

const showSuccessAnimation = () => {
    const messageContainer = document.getElementById('messageContainer');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-notification';
    successMessage.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            z-index: 10000;
            animation: popIn 0.3s ease;
        ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
            <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Message Sent!</h3>
            <p style="color: #6B6B6B;">I'll get back to you soon.</p>
        </div>
    `;
    
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
        successMessage.style.opacity = '0';
        successMessage.style.transition = 'opacity 0.3s ease';
        setTimeout(() => successMessage.remove(), 300);
    }, 3000);
};

// Optional: Send data to backend
const sendToBackend = async (data) => {
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log('Data sent successfully');
        } else {
            console.error('Failed to send data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// Add pop-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes popIn {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactChat);
} else {
    initContactChat();
}
