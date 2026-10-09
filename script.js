/**
 * TRAVELIA RESORTS - Master JavaScript
 * Handles Authentication Flow, Protected Page Guards, Navigation,
 * LocalStorage Room Booking, Form Validations, Dynamic Pricing, and Modals.
 */

// ==========================================================================
// 1. IMMEDIATE AUTHENTICATION GUARD (Runs immediately to prevent page flash)
// ==========================================================================
(function checkAuthGuard() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = currentPath.toLowerCase() === 'login.html';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoginPage) {
    // Protected Page: If not logged in, redirect immediately to login.html
    if (!isLoggedIn) {
      window.location.href = 'login.html';
    }
  } else {
    // If user is already logged in and visits login.html, can stay or redirect
    // Leaving on login.html with quick shortcut to dashboard/home if already logged in
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // 2. Initialize Navigation, Sticky Header, User Greeting & Logout
  initNavigation();

  // 3. Mobile Navigation Drawer
  initMobileNav();

  // 4. Scroll Reveal & Back-to-Top Button
  initScrollEffects();

  // 5. Room Booking Storage Handlers
  initRoomSelection();

  // 6. Booking Page Logic (Dynamic Pre-fill, Date checks, Price Estimator, Validation)
  initBookingPage();

  // 7. Contact Page Validation
  initContactPage();

  // 8. Login & Registration Flow
  initLoginPage();

  // 9. Auto-populate Current Year in Footer
  initFooterYear();

  // 10. Room Details Quick-View Modal
  initRoomModal();
});

/* --------------------------------------------------------------------------
   2. Navigation, User Greeting & Logout
   -------------------------------------------------------------------------- */
function initNavigation() {
  const header = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Active page link highlight
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else if (href && href !== '#' && !href.startsWith('javascript')) {
      link.classList.remove('active');
    }
  });

  // Display user name in navigation bar if logged in
  const userName = localStorage.getItem('userName') || 'Admin User';
  const userGreetingEl = document.querySelectorAll('.nav-user-name');
  userGreetingEl.forEach(el => {
    el.textContent = userName;
  });

  // Setup Logout buttons
  const logoutButtons = document.querySelectorAll('.logout-trigger');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  });
}

/**
 * Handle user logout: clear session and redirect to login.html
 */
window.handleLogout = function() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userName');
  localStorage.removeItem('travelia_selected_room');
  showToast('You have been logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 400);
};

/* --------------------------------------------------------------------------
   3. Mobile Navigation Drawer
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.nav-toggle-btn');
  const navMenu = document.querySelector('.nav-menu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBtn.classList.toggle('active');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleBtn.classList.remove('active');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // Close when clicking link
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.classList.remove('active');
      navMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* --------------------------------------------------------------------------
   4. Scroll Reveal & Back-to-Top Button
   -------------------------------------------------------------------------- */
function initScrollEffects() {
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length > 0) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('active'));
  }

  // Back to Top Button
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

/* --------------------------------------------------------------------------
   5. Room Booking Selection & LocalStorage
   -------------------------------------------------------------------------- */
const ROOM_PRICES = {
  'Deluxe Room': 5999,
  'Ocean View Suite': 9999,
  'Private Villa': 14999,
  'Family Suite': 11999
};

function initRoomSelection() {
  const roomButtons = document.querySelectorAll('.book-room-btn');
  roomButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const roomName = btn.getAttribute('data-room');
      if (roomName) {
        localStorage.setItem('travelia_selected_room', roomName);
      }
    });
  });
}

window.bookThisRoom = function(roomName) {
  if (roomName) {
    localStorage.setItem('travelia_selected_room', roomName);
  }
  window.location.href = 'booking.html';
};

/* --------------------------------------------------------------------------
   6. Booking Page Logic
   -------------------------------------------------------------------------- */
function initBookingPage() {
  const bookingForm = document.getElementById('bookingForm');
  if (!bookingForm) return;

  const roomSelect = document.getElementById('roomType');
  const checkInInput = document.getElementById('checkIn');
  const checkOutInput = document.getElementById('checkOut');
  const guestsSelect = document.getElementById('guests');
  const summaryRoom = document.getElementById('summaryRoom');
  const summaryNights = document.getElementById('summaryNights');
  const summaryRate = document.getElementById('summaryRate');
  const summaryTotal = document.getElementById('summaryTotal');

  // Minimum date for check-in is today
  const today = new Date().toISOString().split('T')[0];
  if (checkInInput) checkInInput.min = today;

  // Retrieve room pre-selected from rooms.html
  const savedRoom = localStorage.getItem('travelia_selected_room');
  if (savedRoom && roomSelect) {
    roomSelect.value = savedRoom;
  }

  // Pre-fill default dates
  if (checkInInput && !checkInInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    checkInInput.value = today;
    if (checkOutInput) {
      checkOutInput.min = today;
      checkOutInput.value = tomorrow.toISOString().split('T')[0];
    }
  }

  if (checkInInput && checkOutInput) {
    checkInInput.addEventListener('change', () => {
      checkOutInput.min = checkInInput.value;
      if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
        const nextDay = new Date(checkInInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutInput.value = nextDay.toISOString().split('T')[0];
      }
      updatePriceSummary();
    });

    checkOutInput.addEventListener('change', updatePriceSummary);
  }

  if (roomSelect) {
    roomSelect.addEventListener('change', () => {
      localStorage.setItem('travelia_selected_room', roomSelect.value);
      updatePriceSummary();
    });
  }

  function updatePriceSummary() {
    if (!roomSelect || !summaryTotal) return;

    const selectedRoom = roomSelect.value;
    const rate = ROOM_PRICES[selectedRoom] || 5999;

    let nights = 1;
    if (checkInInput && checkOutInput && checkInInput.value && checkOutInput.value) {
      const d1 = new Date(checkInInput.value);
      const d2 = new Date(checkOutInput.value);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      nights = diffDays > 0 ? diffDays : 1;
    }

    const subtotal = rate * nights;
    const taxes = Math.round(subtotal * 0.12);
    const total = subtotal + taxes;

    if (summaryRoom) summaryRoom.textContent = selectedRoom || 'Deluxe Room';
    if (summaryNights) summaryNights.textContent = `${nights} Night${nights > 1 ? 's' : ''}`;
    if (summaryRate) summaryRate.textContent = `₹${rate.toLocaleString('en-IN')}`;
    if (summaryTotal) summaryTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  }

  updatePriceSummary();

  // Booking Form Submission & Validation
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const specialRequests = document.getElementById('specialRequests')?.value || 'None';

    let isValid = true;

    // Validate Full Name
    if (!fullName.value.trim() || fullName.value.trim().length < 3) {
      markError(fullName, 'Please enter your full name (minimum 3 characters).');
      isValid = false;
    } else {
      clearError(fullName);
    }

    // Validate Email
    if (!email.value.trim() || !validateEmail(email.value)) {
      markError(email, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(email);
    }

    // Validate Phone
    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!phone.value.trim() || !phoneRegex.test(phone.value.trim())) {
      markError(phone, 'Please enter a valid phone number (at least 8 digits).');
      isValid = false;
    } else {
      clearError(phone);
    }

    // Validate Dates
    if (!checkInInput.value) {
      markError(checkInInput, 'Please select a check-in date.');
      isValid = false;
    } else {
      clearError(checkInInput);
    }

    if (!checkOutInput.value || checkOutInput.value <= checkInInput.value) {
      markError(checkOutInput, 'Check-out date must be after check-in date.');
      isValid = false;
    } else {
      clearError(checkOutInput);
    }

    if (!isValid) return;

    const bookingRef = 'TRV-' + Math.floor(100000 + Math.random() * 900000);

    // Show Confirmation Modal with EXACT prompt message
    showBookingConfirmationModal({
      refNumber: bookingRef,
      name: fullName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      room: roomSelect.value,
      checkIn: checkInInput.value,
      checkOut: checkOutInput.value,
      guests: guestsSelect?.value || '2 Adults',
      specialRequests: specialRequests
    });

    bookingForm.reset();
    localStorage.removeItem('travelia_selected_room');
  });
}

function showBookingConfirmationModal(data) {
  let modal = document.getElementById('bookingConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bookingConfirmModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close-btn" onclick="closeBookingModal()">&times;</button>
      <div class="modal-icon-success">✓</div>
      <h3 style="font-size: 1.8rem; margin-bottom: 8px;">Reservation Received</h3>
      <!-- EXACT REQUIRED TEXT -->
      <p style="color: var(--color-gold-dark); font-size: 1.15rem; font-weight: 700; margin-bottom: 20px;">
        “Your booking has been successfully submitted!”
      </p>
      
      <div style="background: var(--color-sand); border-radius: var(--radius-sm); padding: 20px; text-align: left; margin-bottom: 24px; font-size: 0.92rem; line-height: 1.8;">
        <div><strong>Booking Reference:</strong> <span style="color: var(--color-gold-dark); font-weight: 700;">${data.refNumber}</span></div>
        <div><strong>Guest Name:</strong> ${data.name}</div>
        <div><strong>Selected Room:</strong> ${data.room}</div>
        <div><strong>Stay Dates:</strong> ${data.checkIn} to ${data.checkOut}</div>
        <div><strong>Guests:</strong> ${data.guests}</div>
        <div><strong>Contact:</strong> ${data.email} | ${data.phone}</div>
      </div>

      <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 24px;">
        A personal concierge from Travelia Resorts will contact you within 2 hours to confirm details and coordinate complimentary arrival transfers.
      </p>

      <div style="display: flex; gap: 12px; justify-content: center;">
        <button class="btn btn-primary" onclick="closeBookingModal()">Done</button>
        <a href="index.html" class="btn btn-dark">Return to Home</a>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

window.closeBookingModal = function() {
  const modal = document.getElementById('bookingConfirmModal');
  if (modal) modal.classList.remove('active');
};

/* --------------------------------------------------------------------------
   7. Contact Page Validation
   -------------------------------------------------------------------------- */
function initContactPage() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName');
    const email = document.getElementById('contactEmail');
    const subject = document.getElementById('contactSubject');
    const message = document.getElementById('contactMessage');

    let isValid = true;

    if (!name.value.trim()) {
      markError(name, 'Please enter your name.');
      isValid = false;
    } else {
      clearError(name);
    }

    if (!email.value.trim() || !validateEmail(email.value)) {
      markError(email, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(email);
    }

    if (!subject.value.trim()) {
      markError(subject, 'Please specify a subject.');
      isValid = false;
    } else {
      clearError(subject);
    }

    if (!message.value.trim() || message.value.trim().length < 10) {
      markError(message, 'Message must be at least 10 characters long.');
      isValid = false;
    } else {
      clearError(message);
    }

    if (!isValid) return;

    showToast('Thank you! Your message has been sent to our concierge desk. We will respond promptly.', 'success');
    contactForm.reset();
  });
}

/* --------------------------------------------------------------------------
   8. Login & Authentication Flow (login.html)
   -------------------------------------------------------------------------- */
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const formTitle = document.getElementById('authFormTitle');
  const submitBtn = document.getElementById('authSubmitBtn');
  const extraFields = document.getElementById('registerExtraFields');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const quickDemoFill = document.getElementById('quickDemoFill');

  let isRegisterMode = false;

  // Quick autofill demo credentials
  if (quickDemoFill) {
    quickDemoFill.addEventListener('click', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      if (emailInput) emailInput.value = 'admin@travelia.com';
      if (passInput) passInput.value = '12345';
      clearError(emailInput);
      clearError(passInput);
      showToast('Demo credentials filled: admin@travelia.com / 12345', 'info');
    });
  }

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      isRegisterMode = false;
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      if (formTitle) formTitle.textContent = 'Welcome Back';
      if (submitBtn) submitBtn.textContent = 'Login';
      if (extraFields) extraFields.style.display = 'none';
    });

    tabRegister.addEventListener('click', () => {
      isRegisterMode = true;
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      if (formTitle) formTitle.textContent = 'Create Member Account';
      if (submitBtn) submitBtn.textContent = 'Create Account';
      if (extraFields) extraFields.style.display = 'block';
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value;
      if (email && validateEmail(email)) {
        showToast(`Password reset link sent to ${email}`, 'success');
      } else {
        showToast('Please enter your email address to receive reset instructions.', 'error');
      }
    });
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail');
    const password = document.getElementById('loginPassword');
    const regName = document.getElementById('regName');
    let isValid = true;

    // Validate email
    if (!email.value.trim() || !validateEmail(email.value)) {
      markError(email, 'Please enter a valid email address.');
      isValid = false;
    } else {
      clearError(email);
    }

    // Validate password
    if (!password.value || password.value.length < 4) {
      markError(password, 'Password must be at least 4 characters.');
      isValid = false;
    } else {
      clearError(password);
    }

    if (!isValid) return;

    if (isRegisterMode) {
      // Create Account simulation
      const newName = (regName && regName.value.trim()) ? regName.value.trim() : email.value.split('@')[0];
      localStorage.setItem('userName', newName);
      showToast('Account created successfully! Switching to Login...', 'success');
      setTimeout(() => {
        if (tabLogin) tabLogin.click();
      }, 1000);
      return;
    }

    // Login logic
    const enteredEmail = email.value.trim().toLowerCase();
    const enteredPassword = password.value;

    // Check demo credentials: admin@travelia.com / 12345 (also allow any valid email + 4+ char password)
    let userDisplayName = 'Admin User';
    if (enteredEmail === 'admin@travelia.com' && enteredPassword === '12345') {
      userDisplayName = 'Admin User';
    } else {
      // Allow custom registered name or capitalize email prefix
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        userDisplayName = storedName;
      } else {
        const prefix = enteredEmail.split('@')[0];
        userDisplayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
    }

    // Store login status and user name in localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', userDisplayName);

    // Display required confirmation message:
    // “Login successful! Welcome to Travelia Resorts.”
    const successBanner = document.getElementById('loginSuccessBanner');
    if (successBanner) {
      successBanner.style.display = 'block';
    }
    showToast('Login successful! Welcome to Travelia Resorts.', 'success');

    // Redirect to index.html
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  });
}

/* --------------------------------------------------------------------------
   9. Room Quick-View Modal
   -------------------------------------------------------------------------- */
const ROOM_DETAILS = {
  'Deluxe Room': {
    price: '₹5,999 / night',
    capacity: '2 Guests',
    size: '450 sq.ft (42 m²)',
    bed: 'King Size Bed',
    view: 'Lush Botanical Garden View',
    image: 'assets/images/deluxe-room.jpg',
    description: 'Designed for discerning travelers seeking comfort and serenity. Features hand-carved teak furnishings, marble en-suite bathroom with rainfall shower, and a private botanical terrace.'
  },
  'Ocean View Suite': {
    price: '₹9,999 / night',
    capacity: '2-3 Guests',
    size: '720 sq.ft (67 m²)',
    bed: 'California King Bed',
    view: 'Panoramic Ocean & Sunset View',
    image: 'assets/images/ocean-suite.jpg',
    description: 'Awaken to the sound of azure waves. Includes an expansive wraparound balcony, freestanding deep-soaking bathtub overlooking the horizon, and dedicated butler service.'
  },
  'Private Villa': {
    price: '₹14,999 / night',
    capacity: '4 Guests',
    size: '1,350 sq.ft (125 m²)',
    bed: '2 Master King Bedrooms',
    view: 'Private Beachfront & Plunge Pool',
    image: 'assets/images/private-villa.jpg',
    description: 'The pinnacle of private luxury. Boasts your own temperature-controlled plunge pool, direct beach access, outdoor rain shower, private gazebo, and 24-hour dedicated chef option.'
  },
  'Family Suite': {
    price: '₹11,999 / night',
    capacity: '4-6 Guests',
    size: '950 sq.ft (88 m²)',
    bed: '1 King + 2 Twin Beds',
    view: 'Resort Lagoon & Palm Grove View',
    image: 'assets/images/family-suite.jpg',
    description: 'Thoughtfully planned for memorable family vacations. Two interconnected bedrooms, kids entertainment lounge, dual bathrooms, and spacious living area.'
  }
};

function initRoomModal() {
  window.viewRoomDetails = function(roomKey) {
    const data = ROOM_DETAILS[roomKey];
    if (!data) return;

    let modal = document.getElementById('roomDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'roomDetailModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 680px; text-align: left; padding: 0; overflow: hidden;">
        <button class="modal-close-btn" style="z-index: 10; top: 14px; right: 14px;" onclick="closeRoomModal()">&times;</button>
        <div style="height: 280px; position: relative;">
          <img src="${data.image}" alt="${roomKey}" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; bottom: 16px; left: 20px; background: rgba(10, 37, 29, 0.85); backdrop-filter: blur(8px); padding: 6px 16px; border-radius: 4px; color: var(--color-gold-light); font-weight: 700; border: 1px solid var(--color-border-gold);">
            ${data.price}
          </div>
        </div>
        <div style="padding: 28px;">
          <h3 style="font-size: 1.6rem; margin-bottom: 8px;">${roomKey}</h3>
          <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 20px; line-height: 1.6;">
            ${data.description}
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; font-size: 0.9rem; background: var(--color-sand); padding: 18px; border-radius: var(--radius-sm);">
            <div><strong>Capacity:</strong> ${data.capacity}</div>
            <div><strong>Room Size:</strong> ${data.size}</div>
            <div><strong>Bed Type:</strong> ${data.bed}</div>
            <div><strong>View:</strong> ${data.view}</div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-outline-gold" onclick="closeRoomModal()">Close</button>
            <button class="btn btn-primary" onclick="bookThisRoom('${roomKey}')">Book Now</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  };

  window.closeRoomModal = function() {
    const modal = document.getElementById('roomDetailModal');
    if (modal) modal.classList.remove('active');
  };
}

/* --------------------------------------------------------------------------
   10. Helper Utilities
   -------------------------------------------------------------------------- */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function markError(inputElement, msg) {
  inputElement.classList.add('error');
  let errSpan = inputElement.parentElement.querySelector('.form-error-msg');
  if (!errSpan) {
    errSpan = document.createElement('span');
    errSpan.className = 'form-error-msg';
    inputElement.parentElement.appendChild(errSpan);
  }
  errSpan.textContent = msg;
  errSpan.style.display = 'block';
}

function clearError(inputElement) {
  inputElement.classList.remove('error');
  const errSpan = inputElement.parentElement.querySelector('.form-error-msg');
  if (errSpan) {
    errSpan.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 20);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function initFooterYear() {
  const yearSpans = document.querySelectorAll('.current-year');
  const currentYear = new Date().getFullYear();
  yearSpans.forEach(span => {
    span.textContent = currentYear;
  });
}
