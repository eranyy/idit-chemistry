// Escape hatch: reset accessibility settings via URL parameter (?reset=true or ?reset-accessibility=true)
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset-accessibility') || urlParams.has('reset')) {
        localStorage.removeItem('accSettings');
        // Clean URL query parameters
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        // Force refresh
        window.location.reload();
    }
})();

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

    // Set dynamic year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isActive = navMenu.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });

        // Close menu when clicking on nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 3. Dynamic Opening Status
    let dtfJlm = null;
    let dtfUtc = null;

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
                if (!dtfJlm || !dtfUtc) {
                    dtfJlm = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hourCycle: 'h23' });
                    dtfUtc = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', hourCycle: 'h23' });
                }
                const jlmHour = parseInt(dtfJlm.format(new Date()), 10);
                const utcHour = parseInt(dtfUtc.format(new Date()), 10);
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
                
                // Send email copy to Admin (eranyy@gmail.com) and Idit (iditzilberman@gmail.com) via Web3Forms API in background
                const adminKey = 'faf61723-a60d-463d-9f5a-8f45866c83af';
                const iditKey = '2b1aa212-58ba-4a0b-b6a0-61e48d32d526'; // Replace with Web3Forms key for iditzilberman@gmail.com when available
                
                const emailSubject = `פנייה חדשה באתר מורה לכימיה - ${nameInput.value.trim()}`;
                const emailBody = `פנייה חדשה התקבלה באתר:
שם מלא: ${nameInput.value.trim()}
טלפון: ${phoneInput.value.trim()}
רמת לימודים: ${levelText}
פורמט מועדף: ${formatText}

תוכן ההודעה:
${customMessage}`;

                // Dispatch to Admin
                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        access_key: adminKey,
                        subject: emailSubject,
                        from_name: "אתר עידית כימיה - פניות",
                        name: nameInput.value.trim(),
                        email: "no-reply@idit-chemistry.co.il",
                        message: emailBody
                    })
                }).catch(err => console.error("Admin contact dispatch error:", err));

                // Dispatch to Idit
                if (iditKey) {
                    fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            access_key: iditKey,
                            subject: emailSubject,
                            from_name: "אתר עידית כימיה - פניות",
                            name: nameInput.value.trim(),
                            email: "no-reply@idit-chemistry.co.il",
                            message: emailBody
                        })
                    }).catch(err => console.error("Idit contact dispatch error:", err));
                }
                
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

    // 6. Lightbox Modal for Certificates
    const authCards = document.querySelectorAll('.auth-card');
    const certModal = document.getElementById('certModal');
    const modalImg = document.getElementById('modalImg');
    const modalCaption = document.getElementById('modalCaption');
    const closeModal = document.getElementById('closeModal');
    
    if (authCards.length > 0 && certModal && modalImg && modalCaption && closeModal) {
        authCards.forEach(card => {
            card.addEventListener('click', () => {
                const certSrc = card.getAttribute('data-cert');
                const captionText = card.getAttribute('data-caption');
                
                modalImg.src = certSrc;
                modalCaption.innerText = captionText;
                
                certModal.style.display = 'block';
                certModal.setAttribute('aria-hidden', 'false');
                setTimeout(() => {
                    certModal.classList.add('active');
                }, 10);
            });
        });
        
        const hideModal = () => {
            certModal.classList.remove('active');
            certModal.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                certModal.style.display = 'none';
                modalImg.src = '';
                modalCaption.innerText = '';
            }, 300);
        };
        
        closeModal.addEventListener('click', hideModal);
        
        // Close modal when clicking outside the image
        certModal.addEventListener('click', (e) => {
            if (e.target === certModal) {
                hideModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && certModal.classList.contains('active')) {
                hideModal();
            }
        });
    }

    // 7. Interactive Review Modal & Star Rating
    const openReviewBtn = document.getElementById('openReviewBtn');
    const reviewModal = document.getElementById('reviewModal');
    const closeReviewModal = document.getElementById('closeReviewModal');
    const reviewForm = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('#starRating .star');
    const ratingInput = document.getElementById('reviewRating');
    
    if (openReviewBtn && reviewModal && closeReviewModal && reviewForm) {
        
        // Open Modal
        openReviewBtn.addEventListener('click', () => {
            reviewModal.style.display = 'flex';
            reviewModal.setAttribute('aria-hidden', 'false');
            setTimeout(() => {
                reviewModal.classList.add('active');
            }, 10);
        });
        
        // Hide Modal function
        const hideReviewModal = () => {
            reviewModal.classList.remove('active');
            reviewModal.setAttribute('aria-hidden', 'true');
            setTimeout(() => {
                reviewModal.style.display = 'none';
                reviewForm.reset();
                resetStars();
            }, 300);
        };
        
        closeReviewModal.addEventListener('click', hideReviewModal);
        
        // Close when clicking outside content
        reviewModal.addEventListener('click', (e) => {
            if (e.target === reviewModal) {
                hideReviewModal();
            }
        });
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && reviewModal.classList.contains('active')) {
                hideReviewModal();
            }
        });
        
        // Star Rating Selection
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = star.getAttribute('data-value');
                ratingInput.value = val;
                
                // Highlight clicked star and all lower value stars
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value'), 10) <= parseInt(val, 10)) {
                        s.classList.add('selected');
                    } else {
                        s.classList.remove('selected');
                    }
                });
            });
        });
        
        const resetStars = () => {
            stars.forEach(s => {
                s.classList.remove('selected');
            });
            ratingInput.value = '5';
        };
        
        // Handle Submit
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('reviewName').value.trim();
            const role = document.getElementById('reviewRole').value.trim();
            const rating = ratingInput.value;
            const text = document.getElementById('reviewText').value.trim();
            
            // Format star string
            const starString = '★'.repeat(rating) + '☆'.repeat(5 - rating);
            
            // Prepare Whatsapp Message
            const whatsappMsg = `היי עידית, שלחתי המלצה חדשה עבור האתר שלך:
✍️ *שם הממליץ:* ${name}
🎓 *רמת לימוד / מוסד:* ${role}
⭐ *דירוג:* ${starString} (${rating}/5)
💬 *המלצה:* ${text}`;
            
            const encodedText = encodeURIComponent(whatsappMsg);
            const whatsappURL = `https://wa.me/972502719917?text=${encodedText}`;
            
            // Send email copy to Admin (eranyy@gmail.com) and Idit (iditzilberman@gmail.com) via Web3Forms API
            const adminKey = 'faf61723-a60d-463d-9f5a-8f45866c83af';
            const iditKey = '2b1aa212-58ba-4a0b-b6a0-61e48d32d526'; // Replace with Web3Forms key for iditzilberman@gmail.com when available
            
            const emailSubject = `המלצה חדשה באתר מורה לכימיה - ${name}`;
            const emailBody = `שם הממליץ: ${name}\nרמת לימוד: ${role}\nדירוג: ${rating}/5 כוכבים (${starString})\n\nתוכן ההמלצה:\n${text}`;

            // Dispatch to Admin
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    access_key: adminKey,
                    subject: emailSubject,
                    from_name: "אתר עידית כימיה - המלצות",
                    name: name,
                    email: "no-reply@idit-chemistry.co.il",
                    message: emailBody
                })
            }).catch(err => console.error("Admin review dispatch error:", err));

            // Dispatch to Idit
            if (iditKey) {
                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        access_key: iditKey,
                        subject: emailSubject,
                        from_name: "אתר עידית כימיה - המלצות",
                        name: name,
                        email: "no-reply@idit-chemistry.co.il",
                        message: emailBody
                    })
                }).catch(err => console.error("Idit review dispatch error:", err));
            }
            
            hideReviewModal();
            
            // Redirect to WhatsApp
            setTimeout(() => {
                window.open(whatsappURL, '_blank');
            }, 500);
        });
    }

    // 8. Accessibility floating panel interactions & state persistence
    const accToggle = document.getElementById('accessibilityToggle');
    const accPanel = document.getElementById('accessibilityPanel');
    const accClose = document.getElementById('accessibilityClose');
    
    const btnEnlargeText = document.getElementById('btnEnlargeText');
    const btnContrast = document.getElementById('btnContrast');
    const btnMonochrome = document.getElementById('btnMonochrome');
    const btnLinks = document.getElementById('btnLinks');
    const btnFont = document.getElementById('btnFont');
    const btnReset = document.getElementById('btnReset');
    
    if (accToggle && accPanel && accClose) {
        // Toggle panel
        accToggle.addEventListener('click', () => {
            const isExpanded = accPanel.classList.contains('active');
            if (isExpanded) {
                accPanel.classList.remove('active');
                accPanel.setAttribute('aria-hidden', 'true');
            } else {
                accPanel.classList.add('active');
                accPanel.setAttribute('aria-hidden', 'false');
            }
        });
        
        accClose.addEventListener('click', () => {
            accPanel.classList.remove('active');
            accPanel.setAttribute('aria-hidden', 'true');
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && accPanel.classList.contains('active')) {
                accPanel.classList.remove('active');
                accPanel.setAttribute('aria-hidden', 'true');
            }
        });
        
        // State variables
        let accSettings = {
            textSize: 'md', // md, lg, xl
            contrast: false,
            monochrome: false,
            links: false,
            font: false
        };
        
        // Save to localStorage
        function saveAccSettings() {
            localStorage.setItem('accSettings', JSON.stringify(accSettings));
        }
        
        // Apply settings
        function applyAccSettings() {
            const body = document.body;
            const html = document.documentElement;
            
            // Text size
            html.classList.remove('acc-text-lg', 'acc-text-xl');
            btnEnlargeText.classList.remove('active');
            if (accSettings.textSize === 'lg') {
                html.classList.add('acc-text-lg');
                btnEnlargeText.classList.add('active');
                btnEnlargeText.querySelector('.btn-label').innerText = 'גופן: גדול';
            } else if (accSettings.textSize === 'xl') {
                html.classList.add('acc-text-xl');
                btnEnlargeText.classList.add('active');
                btnEnlargeText.querySelector('.btn-label').innerText = 'גופן: ענק';
            } else {
                btnEnlargeText.querySelector('.btn-label').innerText = 'הגדלת גופן';
            }
            
            // Contrast
            if (accSettings.contrast) {
                body.classList.add('acc-contrast');
                btnContrast.classList.add('active');
            } else {
                body.classList.remove('acc-contrast');
                btnContrast.classList.remove('active');
            }
            
            // Monochrome
            if (accSettings.monochrome) {
                html.classList.add('acc-monochrome');
                btnMonochrome.classList.add('active');
            } else {
                html.classList.remove('acc-monochrome');
                btnMonochrome.classList.remove('active');
            }
            
            // Links
            if (accSettings.links) {
                body.classList.add('acc-links');
                btnLinks.classList.add('active');
            } else {
                body.classList.remove('acc-links');
                btnLinks.classList.remove('active');
            }
            
            // Font
            if (accSettings.font) {
                body.classList.add('acc-font');
                btnFont.classList.add('active');
            } else {
                body.classList.remove('acc-font');
                btnFont.classList.remove('active');
            }
        }
        
        // Load from localStorage
        const stored = localStorage.getItem('accSettings');
        if (stored) {
            try {
                accSettings = JSON.parse(stored);
                applyAccSettings();
            } catch (e) {
                console.error("Error parsing accessibility settings", e);
            }
        }
        
        // Event Listeners for buttons
        btnEnlargeText.addEventListener('click', () => {
            if (accSettings.textSize === 'md') {
                accSettings.textSize = 'lg';
            } else if (accSettings.textSize === 'lg') {
                accSettings.textSize = 'xl';
            } else {
                accSettings.textSize = 'md';
            }
            applyAccSettings();
            saveAccSettings();
        });
        
        btnContrast.addEventListener('click', () => {
            accSettings.contrast = !accSettings.contrast;
            applyAccSettings();
            saveAccSettings();
        });
        
        btnMonochrome.addEventListener('click', () => {
            accSettings.monochrome = !accSettings.monochrome;
            applyAccSettings();
            saveAccSettings();
        });
        
        btnLinks.addEventListener('click', () => {
            accSettings.links = !accSettings.links;
            applyAccSettings();
            saveAccSettings();
        });
        
        btnFont.addEventListener('click', () => {
            accSettings.font = !accSettings.font;
            applyAccSettings();
            saveAccSettings();
        });
        
        btnReset.addEventListener('click', () => {
            accSettings = {
                textSize: 'md',
                contrast: false,
                monochrome: false,
                links: false,
                font: false
            };
            applyAccSettings();
            saveAccSettings();
        });
    }

    // 9. Cookie Consent Banner Logic
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptCookiesBtn = document.getElementById('acceptCookiesBtn');
    
    if (cookieBanner && acceptCookiesBtn) {
        // Check if user has already accepted cookies
        const hasAccepted = localStorage.getItem('cookieConsentAccepted');
        if (!hasAccepted) {
            // Show banner after short delay
            setTimeout(() => {
                cookieBanner.classList.add('active');
                cookieBanner.setAttribute('aria-hidden', 'false');
            }, 1500);
        }
        
        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsentAccepted', 'true');
            cookieBanner.classList.remove('active');
            cookieBanner.setAttribute('aria-hidden', 'true');
        });
    }
});
