document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Header scroll styling
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // 3. Dynamic Opening Status
    function checkStatus() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTime = currentHour * 60 + currentMin; // minutes from midnight
        
        let isOpen = false;
        
        // Helper to check if Israel is currently in Daylight Saving Time (UTC+3)
        function isIsraelDST() {
            try {
                const jlmHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hourCycle: 'h23' }).format(new Date()), 10);
                const utcHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', hourCycle: 'h23' }).format(new Date()), 10);
                return ((jlmHour - utcHour + 24) % 24) === 3;
            } catch (e) {
                const month = new Date().getMonth() + 1;
                return month >= 4 && month <= 10;
            }
        }
        
        // Sunday (0) to Thursday (4) from 08:00 to 20:00
        if (day >= 0 && day <= 4) {
            const openTime = 8 * 60; // 08:00
            const closeTime = 20 * 60; // 20:00
            if (currentTime >= openTime && currentTime < closeTime) {
                isOpen = true;
            }
        } 
        // Friday (5) from 08:00 to 17:00 (Summer) or 15:00 (Winter)
        else if (day === 5) {
            const openTime = 8 * 60; // 08:00
            const closeHour = isIsraelDST() ? 17 : 15;
            const closeTime = closeHour * 60;
            if (currentTime >= openTime && currentTime < closeTime) {
                isOpen = true;
            }
        }
        // Saturday (6) from 18:00 to 21:00
        else if (day === 6) {
            const openTime = 18 * 60; // 18:00
            const closeTime = 21 * 60; // 21:00
            if (currentTime >= openTime && currentTime < closeTime) {
                isOpen = true;
            }
        }
        
        const statusBadge = document.getElementById('openingStatus');
        if (statusBadge) {
            const statusText = statusBadge.querySelector('.status-text');
            if (isOpen) {
                statusBadge.className = 'status-badge open';
                statusText.innerText = 'פתוח כעת – מוזמנים להתקשר!';
            } else {
                statusBadge.className = 'status-badge closed';
                statusText.innerText = 'סגור כעת – השאירו פרטים ונחזור אליכם';
            }
        }
        
        // Highlight current day in table
        const tableRows = document.querySelectorAll('#hoursTable tr');
        tableRows.forEach(row => {
            const rowDay = parseInt(row.getAttribute('data-day'), 10);
            if (rowDay === day) {
                row.classList.add('current-day');
            } else {
                row.classList.remove('current-day');
            }
        });
    }
    
    checkStatus();
    // Refresh status check every 30 seconds
    setInterval(checkStatus, 30000);

    // 4. Learning Tracks Interactive Tab Filtering
    const tabBtns = document.querySelectorAll('.tab-btn');
    const trackCards = document.querySelectorAll('.track-card');
    
    if (tabBtns.length > 0 && trackCards.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                tabBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                const target = btn.getAttribute('data-target');
                
                trackCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (target === 'all' || category === target) {
                        card.style.display = 'flex';
                        // Trigger fade in animation
                        card.style.opacity = '0';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transition = 'opacity 0.4s ease';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // 5. Contact Form Validation and Auto WhatsApp Direct Funnel
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('nameInput');
            const phoneInput = document.getElementById('phoneInput');
            const levelInput = document.getElementById('levelInput');
            const formatInput = document.getElementById('formatInput');
            const messageInput = document.getElementById('messageInput');
            
            let isValid = true;
            
            // Clear previous validation styling
            [nameInput, phoneInput].forEach(input => {
                input.style.borderColor = '#CBD5E1';
                input.style.boxShadow = 'none';
            });
            
            // Validate Name
            if (!nameInput.value.trim()) {
                nameInput.style.borderColor = '#E02424';
                nameInput.style.boxShadow = '0 0 0 3px rgba(224, 36, 36, 0.15)';
                isValid = false;
            }
            
            // Validate Phone (simple check: must have at least 9 characters)
            const cleanPhone = phoneInput.value.replace(/[^0-9]/g, '');
            if (cleanPhone.length < 9) {
                phoneInput.style.borderColor = '#E02424';
                phoneInput.style.boxShadow = '0 0 0 3px rgba(224, 36, 36, 0.15)';
                isValid = false;
            }
            
            if (isValid) {
                // Map level values to readable text
                let levelText = '';
                switch (levelInput.value) {
                    case 'middle': levelText = "חטיבת ביניים (ז'-ט')"; break;
                    case 'high-4': levelText = 'תיכון - 4 יח\' בגרות'; break;
                    case 'high-5': levelText = 'תיכון - 5 יח\' בגרות'; break;
                    case 'academic': levelText = 'אקדמיה / מכינה'; break;
                    case 'other': levelText = 'אחר'; break;
                    default: levelText = 'לא נבחר';
                }
                
                // Map format values to readable text
                let formatText = '';
                switch (formatInput.value) {
                    case 'ramat-gan': formatText = 'פרונטלי ברמת גן'; break;
                    case 'online': formatText = 'אונליין (Zoom/Teams)'; break;
                    default: formatText = 'לא משנה / גמיש';
                }
                
                const customMessage = messageInput.value.trim() ? messageInput.value.trim() : 'אין הערות נוספות';
                
                // Prepare WhatsApp message
                const whatsappText = `שלום עידית, שלחתי פנייה דרך האתר:
✍️ *שם מלא:* ${nameInput.value.trim()}
📞 *טלפון:* ${phoneInput.value.trim()}
🎓 *רמת לימודים:* ${levelText}
🏠 *פורמט מועדף:* ${formatText}
💬 *הודעה:* ${customMessage}`;
                
                // URL Encode
                const encodedText = encodeURIComponent(whatsappText);
                const whatsappURL = `https://wa.me/972502719917?text=${encodedText}`;
                
                // Hide Form & Show Success Message
                contactForm.style.display = 'none';
                formFeedback.style.display = 'block';
                
                // Open WhatsApp in a new tab to complete the funnel
                setTimeout(() => {
                    window.open(whatsappURL, '_blank');
                }, 1000);
            }
        });
    }
});
