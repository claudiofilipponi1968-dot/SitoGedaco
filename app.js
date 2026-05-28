document.addEventListener('DOMContentLoaded', () => {
    // Supabase Connection Configuration
    const supabaseUrl = 'https://fnqbgnvtmnuctxriiyjc.supabase.co';
    const supabaseKey = 'sb_publishable_y3N8zo-mE8lmPoxr3J4sng_8ujt4GF8';
    
    let supabase = null;
    let loggedUser = null; // Stored user session
    let userProfile = null; // Profile from database
    let isMockMode = true; // Fallback to local demo if no real auth

    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }

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

    // 4. Portal Dashboard Core Elements
    const portalNavItems = document.querySelectorAll('.mockup-nav-item');
    const portalSections = document.querySelectorAll('.mockup-section');
    const portalLoginBtn = document.getElementById('portal-login-btn');
    const portalLogoutBtn = document.getElementById('portal-logout-btn');
    const portalEmailInput = document.getElementById('portal-email');
    const portalPassInput = document.getElementById('portal-pass');
    
    // Portal elements to populate
    const welcomeTitle = document.querySelector('#portal-home h4');
    const welcomeSubtitle = document.querySelector('#portal-home p');
    const docListContainer = document.querySelector('#portal-docs .mockup-list');
    const ticketStatusList = document.getElementById('mockup-status-list');

    // Portal Navigation Tabs
    portalNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
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

    // Portal Login Handler
    if (portalLoginBtn) {
        portalLoginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = portalEmailInput.value.trim();
            const password = portalPassInput.value.trim();

            if (email === '' || password === '') {
                alert('Inserisci le credenziali.');
                return;
            }

            portalLoginBtn.innerText = 'Accesso in corso...';
            portalLoginBtn.disabled = true;

            // Attempt login with Supabase
            if (supabase) {
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                    if (!error && data.user) {
                        loggedUser = data.user;
                        isMockMode = false;
                        
                        // Load Profile and Condominium details
                        const profileLoaded = await loadUserProfile(loggedUser.id);
                        if (profileLoaded) {
                            await loadPortalData();
                            loginSuccessUI('supabase');
                            return;
                        } else {
                            alert('Utente autenticato con successo su Supabase, ma non è stato trovato alcun record corrispondente nella tabella "profili". Assicurati di aver inserito l\'ID corretto.');
                        }
                    } else if (error) {
                        console.error('Supabase Auth error:', error.message);
                        alert('Errore di autenticazione Supabase: ' + error.message + '\n\nAccesso eseguito in Modalità Demo.');
                    }
                } catch (err) {
                    console.error('Supabase auth error, falling back to mock mode:', err);
                }
            }

            // Fallback: If Supabase auth fails/isn't configured, use local Mock mode
            isMockMode = true;
            loggedUser = { id: 'mock-user-id', email: 'demo@gedaco.it' };
            userProfile = {
                nome: 'Condomino Rossi (Demo)',
                ruolo: 'condomino',
                interno: 'Int. 4 - Scala A',
                condominio_nome: 'Condominio Primavera',
                condominio_indirizzo: 'Via Edmondo Riva 18, Monterotondo (RM)'
            };
            
            // Set static mock documents and tickets
            loadMockData();
            loginSuccessUI('mock');
        });
    }

    // Load User Profile from Database
    async function loadUserProfile(userId) {
        try {
            // Fetch profile and join with Condominio
            const { data, error } = await supabase
                .from('profili')
                .select(`
                    nome,
                    ruolo,
                    interno,
                    condomini (
                        id,
                        nome,
                        indirizzo,
                        iban
                    )
                `)
                .eq('id', userId)
                .single();

            if (error || !data) {
                console.error('Error fetching profile:', error);
                return false;
            }

            userProfile = {
                nome: data.nome,
                ruolo: data.ruolo,
                interno: data.interno,
                condominio_id: data.condomini?.id,
                condominio_nome: data.condomini?.nome || 'Nessun Condominio',
                condominio_indirizzo: data.condomini?.indirizzo || ''
            };
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // Fetch documents and tickets from Supabase
    async function loadPortalData() {
        if (!supabase || isMockMode) return;

        // 1. Populate Home
        welcomeTitle.innerText = `Benvenuto, ${userProfile.nome}`;
        welcomeSubtitle.innerText = `${userProfile.condominio_nome} - ${userProfile.interno}`;

        // 2. Fetch and populate Documents
        if (userProfile.condominio_id) {
            const { data: docs, error: docErr } = await supabase
                .from('documenti')
                .select('*')
                .eq('id_condominio', userProfile.condominio_id);

            if (!docErr && docs) {
                if (docs.length === 0) {
                    docListContainer.innerHTML = '<p style="font-size:0.8rem;color:rgba(255,255,255,0.5);text-align:center;">Nessun documento disponibile.</p>';
                } else {
                    docListContainer.innerHTML = docs.map(doc => `
                        <div class="mockup-list-item">
                            <div class="mockup-list-item-left">
                                <span style="font-weight: 600;">${doc.nome_file}</span>
                                <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">${new Date(doc.data).toLocaleDateString('it-IT')} | ${doc.categoria}</span>
                            </div>
                            <div class="mockup-download-btn" data-doc="${doc.nome_file}" title="Scarica">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            </div>
                        </div>
                    `).join('');
                    attachDownloadListeners();
                }
            }
        }

        // 3. Fetch and populate Tickets
        const { data: tickets, error: ticketErr } = await supabase
            .from('segnalazioni')
            .select('*')
            .eq('id_utente', loggedUser.id)
            .order('data', { ascending: false });

        if (!ticketErr && tickets) {
            populateTicketList(tickets);
        }
    }

    // Populate local mock data if Supabase isn't active
    function loadMockData() {
        welcomeTitle.innerText = `Benvenuto, ${userProfile.nome}`;
        welcomeSubtitle.innerText = `${userProfile.condominio_nome} - ${userProfile.interno}`;
        
        docListContainer.innerHTML = `
            <div class="mockup-list-item">
                <div class="mockup-list-item-left">
                    <span style="font-weight: 600;">Verbale Assemblea Ordinaria 2025.pdf</span>
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">12/03/2026 | Assemblee</span>
                </div>
                <div class="mockup-download-btn" data-doc="Verbale Assemblea Ordinaria 2025.pdf" title="Scarica">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </div>
            </div>
            <div class="mockup-list-item">
                <div class="mockup-list-item-left">
                    <span style="font-weight: 600;">Bilancio Consuntivo 2024.pdf</span>
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">10/01/2026 | Contabilità</span>
                </div>
                <div class="mockup-download-btn" data-doc="Bilancio Consuntivo 2024.pdf" title="Scarica">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </div>
            </div>
            <div class="mockup-list-item">
                <div class="mockup-list-item-left">
                    <span style="font-weight: 600;">Regolamento Condominiale Primavera.pdf</span>
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">Storico | Regolamenti</span>
                </div>
                <div class="mockup-download-btn" data-doc="Regolamento Condominiale Primavera.pdf" title="Scarica">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </div>
            </div>
        `;
        attachDownloadListeners();

        ticketStatusList.innerHTML = `
            <div class="mockup-list-item">
                <div class="mockup-list-item-left">
                    <span style="font-weight: 600;">Citofono - Segnalazione</span>
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">24/05/2026 | Condomino</span>
                    <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 4px;">Pulsante interno interno 4 non suona.</p>
                </div>
                <span class="mockup-tag" style="background-color: rgba(16, 185, 129, 0.15); color: #10b981;">Risolto</span>
            </div>
        `;
    }

    function populateTicketList(tickets) {
        if (tickets.length === 0) {
            ticketStatusList.innerHTML = '<p style="font-size:0.8rem;color:rgba(255,255,255,0.5);text-align:center;">Nessuna segnalazione recente.</p>';
            return;
        }

        ticketStatusList.innerHTML = tickets.map(t => {
            let tagColor = 'rgba(245, 158, 11, 0.15)';
            let textColor = '#f59e0b';
            
            if (t.stato === 'Risolto') {
                tagColor = 'rgba(16, 185, 129, 0.15)';
                textColor = '#10b981';
            } else if (t.stato === 'In Lavorazione') {
                tagColor = 'rgba(59, 130, 246, 0.15)';
                textColor = '#3b82f6';
            }

            return `
                <div class="mockup-list-item">
                    <div class="mockup-list-item-left">
                        <span style="font-weight: 600;">${t.tipo} - Segnalazione</span>
                        <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.5);">${new Date(t.data).toLocaleDateString('it-IT')} | Condomino</span>
                        <p style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 4px;">${t.descrizione}</p>
                    </div>
                    <span class="mockup-tag" style="background-color: ${tagColor}; color: ${textColor}">${t.stato}</span>
                </div>
            `;
        }).join('');
    }

    // UI Updates after login
    function loginSuccessUI(mode) {
        document.querySelector('.mockup-sidebar').classList.add('logged-in');
        
        // Reset Login Button
        portalLoginBtn.innerText = 'Accedi';
        portalLoginBtn.disabled = false;

        // Switch to Portal Home tab
        portalNavItems.forEach(i => i.classList.remove('active'));
        portalSections.forEach(s => s.classList.remove('active'));

        document.querySelector('[data-tab="home"]').classList.add('active');
        document.getElementById('portal-home').classList.add('active');

        // Toggle Sidebar visibility
        document.querySelector('[data-tab="login"]').style.display = 'none';
        document.querySelector('[data-tab="home"]').style.display = 'flex';
        document.querySelector('[data-tab="docs"]').style.display = 'flex';
        document.querySelector('[data-tab="ticket"]').style.display = 'flex';
        portalLogoutBtn.style.display = 'flex';

        if (mode === 'supabase') {
            console.log('Logged in successfully via Supabase database.');
        } else {
            console.log('Logged in via offline mock mode.');
            alert('Credenziali Supabase non trovate. Accesso effettuato in MODALITÀ DEMO LOCALE.');
        }
    }

    // Portal Logout Handler
    if (portalLogoutBtn) {
        portalLogoutBtn.addEventListener('click', () => {
            document.querySelector('.mockup-sidebar').classList.remove('logged-in');
            
            // Clear credentials
            portalEmailInput.value = '';
            portalPassInput.value = '';
            loggedUser = null;
            userProfile = null;
            isMockMode = true;

            // Log out from Supabase if connected
            if (supabase) {
                supabase.auth.signOut();
            }

            // Reset Tabs back to Login
            portalNavItems.forEach(i => i.classList.remove('active'));
            portalSections.forEach(s => s.classList.remove('active'));

            document.querySelector('[data-tab="login"]').classList.add('active');
            document.getElementById('portal-login').classList.add('active');

            // Hide Dashboard items
            document.querySelector('[data-tab="login"]').style.display = 'flex';
            document.querySelector('[data-tab="home"]').style.display = 'none';
            document.querySelector('[data-tab="docs"]').style.display = 'none';
            document.querySelector('[data-tab="ticket"]').style.display = 'none';
            portalLogoutBtn.style.display = 'none';
        });
    }

    // Attach listeners for download actions
    function attachDownloadListeners() {
        const downloadBtns = document.querySelectorAll('.mockup-download-btn');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const docName = btn.getAttribute('data-doc');
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                btn.style.backgroundColor = '#10b981';
                
                setTimeout(() => {
                    alert(`Simulazione download sicuro di: ${docName}.`);
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
                    btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }, 500);
            });
        });
    }

    // Interactive Demo Ticket Submission
    const submitTicketBtn = document.getElementById('mockup-submit-ticket');
    const ticketSelect = document.getElementById('ticket-type');
    const ticketDesc = document.getElementById('ticket-desc');

    if (submitTicketBtn && ticketSelect && ticketDesc) {
        submitTicketBtn.addEventListener('click', async () => {
            const type = ticketSelect.value;
            const desc = ticketDesc.value.trim();

            if (desc === '') {
                alert('Inserisci una descrizione del problema.');
                return;
            }

            if (supabase && !isMockMode && loggedUser) {
                submitTicketBtn.innerText = 'Invio in corso...';
                submitTicketBtn.disabled = true;

                try {
                    const { error } = await supabase
                        .from('segnalazioni')
                        .insert({
                            tipo: type,
                            descrizione: desc,
                            id_utente: loggedUser.id
                        });

                    if (!error) {
                        alert('Segnalazione salvata con successo nel database Supabase!');
                        await loadPortalData(); // Refresh ticket list
                    } else {
                        console.error('Error inserting ticket:', error);
                        alert('Errore durante il salvataggio nel database.');
                    }
                } catch (e) {
                    console.error(e);
                }

                submitTicketBtn.innerText = 'Invia Segnalazione';
                submitTicketBtn.disabled = false;
            } else {
                // Fallback to local UI append for Mock Mode
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
                alert('Segnalazione inviata con successo in Modalità Demo.');
            }

            // Reset form
            ticketDesc.value = '';
            
            // Switch back to home
            portalNavItems.forEach(i => i.classList.remove('active'));
            portalSections.forEach(s => s.classList.remove('active'));
            document.querySelector('[data-tab="home"]').classList.add('active');
            document.getElementById('portal-home').classList.add('active');
        });
    }

    // 5. Website Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    if (contactForm && formFeedback) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value.trim();

            if (name === '' || email === '' || message === '') {
                alert('Compila i campi obbligatori.');
                return;
            }

            formFeedback.innerText = `Grazie ${name}, la tua richiesta per "${service}" è stata inviata con successo. Ti risponderemo al più presto.`;
            formFeedback.classList.add('success');
            formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            contactForm.reset();
            
            setTimeout(() => {
                formFeedback.style.display = 'none';
                formFeedback.classList.remove('success');
            }, 6000);
        });
    }
});
