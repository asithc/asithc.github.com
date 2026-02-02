/**
 * Pin Protect Component - Simple Version
 * 
 * Usage:
 * 1. Add class "pin-protected" to any link/button
 * 2. Add data-pin="123456" (the 6-digit pin)
 * 3. Add data-redirect="https://example.com" (where to go after correct pin)
 * 4. Include this script on the page
 */

const PinProtect = (function() {
    'use strict';

    const PIN_LENGTH = 6;

    // Create modal HTML
    function createModal() {
        const modalHTML = `
            <div class="pin-modal-overlay" id="pinModalOverlay">
                <div class="pin-modal">
                    <button class="pin-modal-close" id="pinModalClose">&times;</button>
                    <div class="pin-modal-header">
                        <div class="pin-modal-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h2 class="pin-modal-title">Whoa there, curious one! 🔐</h2>
                        <p class="pin-modal-subtitle">This case study is pin-protected for a good reason... probably.</p>
                    </div>
                    <div class="pin-modal-body">
                        <p class="pin-modal-instruction">Enter the secret 6-digit pin to unlock:</p>
                        <div class="pin-input-container" id="pinInputContainer">
                            <input type="text" maxlength="1" class="pin-input" data-index="0" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="text" maxlength="1" class="pin-input" data-index="1" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="text" maxlength="1" class="pin-input" data-index="2" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="text" maxlength="1" class="pin-input" data-index="3" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="text" maxlength="1" class="pin-input" data-index="4" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                            <input type="text" maxlength="1" class="pin-input" data-index="5" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                        </div>
                        <p class="pin-error" id="pinError"></p>
                        <button class="pin-submit-btn" id="pinSubmitBtn">
                            <span class="btn-text">Unlock Content</span>
                            <span class="btn-loading" style="display: none;">Verifying...</span>
                        </button>
                    </div>
                    <div class="pin-modal-footer">
                        <p class="pin-contact">Don't have the pin? No worries!</p>
                        <p class="pin-contact">Contact Asith at <a href="mailto:hello@asith.cc">hello@asith.cc</a> to request access.</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Pin input handlers
    function initPinInputs() {
        const inputs = document.querySelectorAll('.pin-input');
        
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                // Auto-submit when all filled
                if (index === inputs.length - 1 && value) {
                    const allFilled = Array.from(inputs).every(i => i.value);
                    if (allFilled) {
                        document.getElementById('pinSubmitBtn').click();
                    }
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
                
                pastedData.split('').forEach((char, i) => {
                    if (inputs[i]) inputs[i].value = char;
                });
                
                if (pastedData.length === PIN_LENGTH) {
                    document.getElementById('pinSubmitBtn').click();
                }
            });
        });
    }

    function getEnteredPin() {
        return Array.from(document.querySelectorAll('.pin-input')).map(i => i.value).join('');
    }
    
    function clearPinInputs() {
        const inputs = document.querySelectorAll('.pin-input');
        inputs.forEach(i => i.value = '');
        inputs[0].focus();
    }

    function showError(msg) {
        const el = document.getElementById('pinError');
        el.textContent = msg;
        el.classList.add('show');
        document.getElementById('pinInputContainer').classList.add('shake');
        setTimeout(() => document.getElementById('pinInputContainer').classList.remove('shake'), 500);
    }
    
    function setLoading(loading) {
        const btn = document.getElementById('pinSubmitBtn');
        btn.querySelector('.btn-text').style.display = loading ? 'none' : 'inline';
        btn.querySelector('.btn-loading').style.display = loading ? 'inline' : 'none';
        btn.disabled = loading;
    }

    function openModal(pin, redirect, target) {
        const overlay = document.getElementById('pinModalOverlay');
        overlay.classList.add('active');
        overlay.dataset.pin = pin;
        overlay.dataset.redirect = redirect || '';
        overlay.dataset.target = target || '';
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.querySelector('.pin-input').focus(), 100);
    }

    function closeModal() {
        const overlay = document.getElementById('pinModalOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        clearPinInputs();
        document.getElementById('pinError').textContent = '';
        document.getElementById('pinError').classList.remove('show');
        setLoading(false);
    }

    function validatePin() {
        const overlay = document.getElementById('pinModalOverlay');
        const enteredPin = getEnteredPin();
        const correctPin = overlay.dataset.pin;
        const redirectUrl = overlay.dataset.redirect;
        const targetId = overlay.dataset.target;
        
        if (enteredPin.length < PIN_LENGTH) {
            showError('Please enter all 6 digits');
            return;
        }
        
        setLoading(true);
        
        // Small delay to show loading
        setTimeout(() => {
            if (enteredPin === correctPin) {
                closeModal();
                
                // If there's a target section, reveal it and scroll to it
                if (targetId) {
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        // Reveal the section with animation
                        targetSection.style.display = 'block';
                        targetSection.classList.add('revealed');
                        
                        // Smooth scroll to the section
                        setTimeout(() => {
                            targetSection.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        }, 100);
                        
                        // Hide the "Read Case Study" button since content is now visible
                        document.querySelectorAll('.pin-protected[data-target="' + targetId + '"]').forEach(btn => {
                            btn.style.display = 'none';
                        });
                    }
                } else if (redirectUrl && redirectUrl !== '#') {
                    // Redirect to external URL
                    window.location.href = redirectUrl;
                } else {
                    alert('🎉 Access granted! Content unlocked.');
                }
            } else {
                setLoading(false);
                showError('Incorrect pin. Try again!');
                clearPinInputs();
            }
        }, 300);
    }

    function init() {
        createModal();
        initPinInputs();
        
        document.getElementById('pinModalClose').addEventListener('click', closeModal);
        document.getElementById('pinModalOverlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
        document.getElementById('pinSubmitBtn').addEventListener('click', validatePin);
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
        
        // Handle protected links
        document.querySelectorAll('.pin-protected').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pin = link.dataset.pin;
                const redirect = link.dataset.redirect || link.href;
                const target = link.dataset.target;
                openModal(pin, redirect, target);
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
