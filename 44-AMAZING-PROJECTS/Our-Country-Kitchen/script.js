// ===== MOBILE MENU TOGGLE =====
 
const hamburger = document.getElementById('hamburger');
 
const navMenu = document.getElementById('navMenu');
 
const navLinks = document.querySelectorAll('.nav-link');
 
 
 
hamburger.addEventListener('click', () => {
 
    hamburger.classList.toggle('active');
 
    navMenu.classList.toggle('active');
 
});
 
 
 
// Close mobile menu when clicking on a nav link
 
navLinks.forEach(link => {
 
    link.addEventListener('click', () => {
 
        hamburger.classList.remove('active');
 
        navMenu.classList.remove('active');
 
    });
 
});
 
 
 
// ===== NAVBAR SCROLL EFFECT =====
 
const navbar = document.getElementById('navbar');
 
 
 
window.addEventListener('scroll', () => {
 
    if (window.scrollY > 100) {
 
        navbar.classList.add('scrolled');
 
    } else {
 
        navbar.classList.remove('scrolled');
 
    }
 
});
 
 
 
// ===== ACTIVE NAVIGATION HIGHLIGHTING =====
 
const sections = document.querySelectorAll('section');
 
 
 
window.addEventListener('scroll', () => {
 
    let current = '';
 
    
 
    sections.forEach(section => {
 
        const sectionTop = section.offsetTop;
 
        const sectionHeight = section.clientHeight;
 
        
 
        if (window.pageYOffset >= sectionTop - 200) {
 
            current = section.getAttribute('id');
 
        }
 
    });
 
    
 
    navLinks.forEach(link => {
 
        link.classList.remove('active');
 
        if (link.getAttribute('href') === `#${current}`) {
 
            link.classList.add('active');
 
        }
 
    });
 
});
 
 
 
// ===== SMOOTH SCROLLING =====
 
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
 
    anchor.addEventListener('click', function (e) {
 
        e.preventDefault();
 
        const target = document.querySelector(this.getAttribute('href'));
 
        
 
        if (target) {
 
            const offsetTop = target.offsetTop - 80;
 
            window.scrollTo({
 
                top: offsetTop,
 
                behavior: 'smooth'
 
            });
 
        }
 
    });
 
});
 
 
 
// ===== SCROLL REVEAL ANIMATION =====
 
const revealElements = document.querySelectorAll('.reveal');
 
 
 
const revealOnScroll = () => {
 
    revealElements.forEach(element => {
 
        const elementTop = element.getBoundingClientRect().top;
 
        const windowHeight = window.innerHeight;
 
        
 
        if (elementTop < windowHeight - 100) {
 
            element.classList.add('active');
 
        }
 
    });
 
};
 
 
 
window.addEventListener('scroll', revealOnScroll);
 
window.addEventListener('load', revealOnScroll);
 
 
 
// ===== MENU FILTERING =====
 
const menuTabs = document.querySelectorAll('.menu-tab');
 
const menuItems = document.querySelectorAll('.menu-item');
 
 
 
menuTabs.forEach(tab => {
 
    tab.addEventListener('click', () => {
 
        // Remove active class from all tabs
 
        menuTabs.forEach(t => t.classList.remove('active'));
 
        // Add active class to clicked tab
 
        tab.classList.add('active');
 
        
 
        const category = tab.getAttribute('data-category');
 
        
 
        menuItems.forEach(item => {
 
            const itemCategory = item.getAttribute('data-category');
 
            
 
            if (category === 'all' || itemCategory === category) {
 
                item.style.display = 'block';
 
                setTimeout(() => {
 
                    item.style.opacity = '1';
 
                    item.style.transform = 'translateY(0)';
 
                }, 10);
 
            } else {
 
                item.style.opacity = '0';
 
                item.style.transform = 'translateY(20px)';
 
                setTimeout(() => {
 
                    item.style.display = 'none';
 
                }, 300);
 
            }
 
        });
 
    });
 
});
 
 
 
// ===== FORM VALIDATION =====
 
const contactForm = document.getElementById('contactForm');
 
 
 
contactForm.addEventListener('submit', (e) => {
 
    e.preventDefault();
 
    
 
    const name = document.getElementById('name').value.trim();
 
    const email = document.getElementById('email').value.trim();
 
    const message = document.getElementById('message').value.trim();
 
    
 
    if (name === '' || email === '' || message === '') {
 
        showNotification('Please fill in all required fields!', 'error');
 
        return;
 
    }
 
    
 
    if (!isValidEmail(email)) {
 
        showNotification('Please enter a valid email address!', 'error');
 
        return;
 
    }
 
    
 
    // Simulate form submission
 
    showNotification('Thank you! Your message has been sent successfully!', 'success');
 
    contactForm.reset();
 
});
 
 
 
// Email validation helper
 
function isValidEmail(email) {
 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
    return emailRegex.test(email);
 
}
 
 
 
// Notification function
 
function showNotification(message, type) {
 
    // Remove existing notification if any
 
    const existingNotification = document.querySelector('.notification');
 
    if (existingNotification) {
 
        existingNotification.remove();
 
    }
 
    
 
    const notification = document.createElement('div');
 
    notification.className = `notification ${type}`;
 
    notification.textContent = message;
 
    
 
    // Add styles
 
    notification.style.cssText = `
 
        position: fixed;
 
        top: 100px;
 
        right: 20px;
 
        padding: 1rem 2rem;
 
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
 
        color: white;
 
        border-radius: 10px;
 
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
 
        z-index: 10000;
 
        animation: slideIn 0.3s ease;
 
        font-weight: 600;
 
    `;
 
    
 
    document.body.appendChild(notification);
 
    
 
    // Remove notification after 3 seconds
 
    setTimeout(() => {
 
        notification.style.animation = 'slideOut 0.3s ease';
 
        setTimeout(() => {
 
            notification.remove();
 
        }, 300);
 
    }, 3000);
 
}
 
 
 
// Add notification animations
 
const style = document.createElement('style');
 
style.textContent = `
 
    @keyframes slideIn {
 
        from {
 
            transform: translateX(400px);
 
            opacity: 0;
 
        }
 
        to {
 
            transform: translateX(0);
 
            opacity: 1;
 
        }
 
    }
 
    
 
    @keyframes slideOut {
 
        from {
 
            transform: translateX(0);
 
            opacity: 1;
 
        }
 
        to {
 
            transform: translateX(400px);
 
            opacity: 0;
 
        }
 
    }
 
`;
 
document.head.appendChild(style);
 
 
 
// ===== NEWSLETTER FORM =====
 
const newsletterForm = document.querySelector('.newsletter-form');
 
 
 
if (newsletterForm) {
 
    newsletterForm.addEventListener('submit', (e) => {
 
        e.preventDefault();
 
        const emailInput = newsletterForm.querySelector('input[type="email"]');
 
        const email = emailInput.value.trim();
 
        
 
        if (email === '') {
 
            showNotification('Please enter your email address!', 'error');
 
            return;
 
        }
 
        
 
        if (!isValidEmail(email)) {
 
            showNotification('Please enter a valid email address!', 'error');
 
            return;
 
        }
 
        
 
        showNotification('Thank you for subscribing to our newsletter!', 'success');
 
        newsletterForm.reset();
 
    });
 
}
 
 
 
// ===== ORDER BUTTON FUNCTIONALITY =====
 
const orderButtons = document.querySelectorAll('.btn-order');
 
 
 
orderButtons.forEach(button => {
 
    button.addEventListener('click', (e) => {
 
        e.preventDefault();
 
        const menuItem = button.closest('.menu-item');
 
        const itemName = menuItem.querySelector('h3').textContent;
 
        showNotification(`${itemName} added to cart!`, 'success');
 
    });
 
});
 
 
 
// ===== LAZY LOADING IMAGES =====
 
const images = document.querySelectorAll('img');
 
 
 
const imageObserver = new IntersectionObserver((entries, observer) => {
 
    entries.forEach(entry => {
 
        if (entry.isIntersecting) {
 
            const img = entry.target;
 
            img.classList.add('loaded');
 
            observer.unobserve(img);
 
        }
 
    });
 
}, {
 
    rootMargin: '50px'
 
});
 
 
 
images.forEach(img => {
 
    imageObserver.observe(img);
 
});
 
 
 
// ===== PARALLAX EFFECT FOR HERO =====
 
window.addEventListener('scroll', () => {
 
    const scrolled = window.pageYOffset;
 
    const hero = document.querySelector('.hero');
 
    
 
    if (hero) {
 
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
 
    }
 
});
 
 
 
// ===== COUNTER ANIMATION FOR EXPERIENCE BADGE =====
 
const experienceNumber = document.querySelector('.experience-number');
 
 
 
if (experienceNumber) {
 
    const observerOptions = {
 
        threshold: 0.5
 
    };
 
    
 
    const counterObserver = new IntersectionObserver((entries) => {
 
        entries.forEach(entry => {
 
            if (entry.isIntersecting) {
 
                animateCounter(experienceNumber, 550, 9000);
 
                counterObserver.unobserve(entry.target);
 
            }
 
        });
 
    }, observerOptions);
 
    
 
    counterObserver.observe(experienceNumber);
 
}
 
 
 
function animateCounter(element, target, duration) {
 
    let start = 0;
 
    const increment = target / (duration / 16);
 
    
 
    const timer = setInterval(() => {
 
        start += increment;
 
        if (start >= target) {
 
            element.textContent = target + '+';
 
            clearInterval(timer);
 
        } else {
 
            element.textContent = Math.floor(start) + '+';
 
        }
 
    }, 16);
 
}
 
 
 
// ===== GALLERY LIGHTBOX EFFECT =====
 
const galleryItems = document.querySelectorAll('.gallery-item');
 
 
 
galleryItems.forEach(item => {
 
    item.addEventListener('click', () => {
 
        const img = item.querySelector('img');
 
        const imgSrc = img.getAttribute('src');
 
        
 
        // Create lightbox
 
        const lightbox = document.createElement('div');
 
        lightbox.className = 'lightbox';
 
        lightbox.innerHTML = `
 
            <div class="lightbox-content">
 
                <span class="lightbox-close">&times;</span>
 
                <img src="${imgSrc}" alt="Gallery Image">
 
            </div>
 
        `;
 
        
 
        // Add styles
 
        lightbox.style.cssText = `
 
            position: fixed;
 
            top: 0;
 
            left: 0;
 
            width: 100%;
 
            height: 100%;
 
            background: rgba(0, 0, 0, 0.95);
 
            z-index: 10000;
 
            display: flex;
 
            align-items: center;
 
            justify-content: center;
 
            animation: fadeIn 0.3s ease;
 
        `;
 
        
 
        const lightboxContent = lightbox.querySelector('.lightbox-content');
 
        lightboxContent.style.cssText = `
 
            position: relative;
 
            max-width: 90%;
 
            max-height: 90%;
 
        `;
 
        
 
        const lightboxImg = lightbox.querySelector('img');
 
        lightboxImg.style.cssText = `
 
            max-width: 100%;
 
            max-height: 90vh;
 
            border-radius: 10px;
 
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
 
        `;
 
        
 
        const closeBtn = lightbox.querySelector('.lightbox-close');
 
        closeBtn.style.cssText = `
 
            position: absolute;
 
            top: -40px;
 
            right: 0;
 
            font-size: 40px;
 
            color: white;
 
            cursor: pointer;
 
            transition: all 0.3s ease;
 
        `;
 
        
 
        document.body.appendChild(lightbox);
 
        document.body.style.overflow = 'hidden';
 
        
 
        // Close lightbox
 
        closeBtn.addEventListener('click', () => {
 
            lightbox.style.animation = 'fadeOut 0.3s ease';
 
            setTimeout(() => {
 
                lightbox.remove();
 
                document.body.style.overflow = 'auto';
 
            }, 300);
 
        });
 
        
 
        // Close on background click
 
        lightbox.addEventListener('click', (e) => {
 
            if (e.target === lightbox) {
 
                lightbox.style.animation = 'fadeOut 0.3s ease';
 
                setTimeout(() => {
 
                    lightbox.remove();
 
                    document.body.style.overflow = 'auto';
 
                }, 300);
 
            }
 
        });
 
    });
 
});
 
 
 
// ===== PRELOADER (OPTIONAL) =====
 
window.addEventListener('load', () => {
 
    document.body.classList.add('loaded');
 
});
 
 
 
// ===== CONSOLE MESSAGE =====
 
console.log('%c🍽️ Welcome to Café Delight! 🍽️', 'font-size: 20px; color: #d4a574; font-weight: bold;');
 
console.log('%cEnjoy your browsing experience!', 'font-size: 14px; color: #666;');