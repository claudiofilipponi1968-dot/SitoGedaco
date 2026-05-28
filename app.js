document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            // Toggle hamburger icon animation
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = navLinks.classList.contains('open') ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            spans[1].style.opacity = navLinks.classList.contains('open') ? '0' : '1';
            spans[2].style.transform = navLinks.classList.contains('open') ? 'rotate(-45deg) translate(7px, -7px)' : 'none';
        });

        // Close menu when link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // 3. Scroll to Active Link highlight
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    // 4. Simulated Tenant Portal Logic
    const portalNavItems = document.querySelectorAll('.mockup-nav-item');
    const portalSections = document.querySelectorAll('.mockup-section');
    const portalLoginBtn = document.getElementById('portal-login-btn');
    const portalLogoutBtn = document.getElementById('portal-logout-btn');
    const portalEmailInput = document.getElementById('portal-email');
    const portalPassInput = document.getElementById('portal-pass');

    // Portal Navigation Tabs
    portalNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Do not switch if user is not logged in and tries to access actual dashboard sections
            const isLoggedIn = document.querySelector('.mockup-sidebar').classList.contains('logged-in');
            if (!isLoggedIn && targetTab !== 'login') {
                alert('Effettua prima l\'accesso con le credenziali di prova.');
                return;
            }

            portalNavItems.forEach(i => i.classList.remove('active'));
            portalSections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`portal-${targetTab}`).classList.add('active');
        });
    });

    // Portal login Simulation
    if (portalLoginBtn) {
        portalLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = portalEmailInput.value.trim();
            const pass = portalPassInput.value.trim();

            if (email === '' || pass === '') {
                alert('Inserisci le credenziali demo per provare.');
                return;
            }

            // Successfully login (any credentials allowed for demo purposes, but we can Autofill/suggest)
            document.querySelector('.mockup-sidebar').classList.add('logged-in');
            
            // Switch tabs
            portalNavItems.forEach(i => i.classList.remove('active'));
            portalSections.forEach(s => s.classList.remove('active'));

            document.querySelector('[data-tab="home"]').classList.add('active');
            document.getElementById('portal-home').classList.add('active');
            
            // Hide login tab button from sidebar and show others
            document.querySelector('[data-tab="login"]').style.display = 'none';
            document.querySelector('[data-tab="home"]').style.display = 'flex';
            document.querySelector('[data-tab="docs"]').style.display = 'flex';
            document.querySelector('[data-tab="ticket"]').style.display = 'flex';
            portalLogoutBtn.style.display = 'flex';
        });
    }

    // Portal Logout
    if (portalLogoutBtn) {
        portalLogoutBtn.addEventListener('click', () => {
            document.querySelector('.mockup-sidebar').classList.remove('logged-in');
            
            // Reset fields
            portalEmailInput.value = '';
            portalPassInput.value = '';

            // Switch tabs back to login
            portalNavItems.forEach(i => i.classList.remove('active'));
            portalSections.forEach(s => s.classList.remove('active'));

            document.querySelector('[data-tab="login"]').classList.add('active');
            document.getElementById('portal-login').classList.add('active');

            // Hide/Show sidebar links
            document.querySelector('[data-tab="login"]').style.display = 'flex';
            document.querySelector('[data-tab="home"]').style.display = 'none';
            document.querySelector('[data-tab="docs"]').style.display = 'none';
            document.querySelector('[data-tab="ticket"]').style.display = 'none';
            portalLogoutBtn.style.display = 'none';
        });
    }

    // Interactive Demo Document Download
    const downloadBtns = document.querySelectorAll('.mockup-download-btn');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const docName = btn.getAttribute('data-doc');
            
            // Visual trigger effect
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            btn.style.backgroundColor = '#10b981';
            
            setTimeout(() => {
                alert(`Simulazione download del file: ${docName}. In un portale reale, questo avvierebbe il download sicuro del PDF.`);
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
                btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }, 500);
        });
    });

    // Interactive Demo Ticket Submission
    const submitTicketBtn = document.getElementById('mockup-submit-ticket');
    const ticketSelect = document.getElementById('ticket-type');
    const ticketDesc = document.getElementById('ticket-desc');
    const ticketStatusList = document.getElementById('mockup-status-list');

    if (submitTicketBtn && ticketSelect && ticketDesc) {
        submitTicketBtn.addEventListener('click', () => {
            const type = ticketSelect.value;
            const desc = ticketDesc.value.trim();

            if (desc === '') {
                alert('Inserisci una descrizione del problema.');
                return;
            }

            // Create new ticket and append to status list
            const today = new Date().toLocaleDateString('it-IT');
            const newTicketHtml = `
                <div class="mockup-list-item" style="animation: fadeIn 0.4s ease;">
                    <div class="mockup-list-item-left">
                        <span style="font-weight: 600;">${type} - Segnalazione</span>
                        <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">${today} | Condomino</span>
                        <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 4px;">${desc}</p>
                    </div>
                    <span class="mockup-tag pending">In Carico</span>
                </div>
            `;
            
            ticketStatusList.insertAdjacentHTML('afterbegin', newTicketHtml);
            
            // Reset inputs
            ticketDesc.value = '';
            
            // Feedback to user
            alert('Segnalazione inviata con successo! È stata aggiunta all\'elenco delle richieste in corso.');
            
            // Automatically switch back to Home to see the update
            portalNavItems.forEach(i => i.classList.remove('active'));
            portalSections.forEach(s => s.classList.remove('active'));
            document.querySelector('[data-tab="home"]').classList.add('active');
            document.getElementById('portal-home').classList.add('active');
        });
    }

    // 5. Website Contact/Quote Form Submission
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    if (contactForm && formFeedback) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value.trim();

            if (name === '' || email === '' || message === '') {
                alert('Compila tutti i campi obbligatori (Nome, Email, Messaggio).');
                return;
            }

            // Show success message
            formFeedback.innerText = `Grazie ${name}, la tua richiesta per "${service}" è stata inviata con successo. Ti risponderemo al più presto.`;
            formFeedback.classList.add('success');
            
            // Scroll to feedback
            formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Reset form
            contactForm.reset();
            
            // Auto hide feedback after 6 seconds
            setTimeout(() => {
                formFeedback.style.display = 'none';
                formFeedback.classList.remove('success');
            }, 6000);
        });
    }
});
