// ---------- EFEITO DA IMAGEM E BOTÃO ----------
const viniciusImg = document.getElementById('vinicius-img');
const ctaButton = document.getElementById('cta-button');

const foto1 = "images/vinicius/vinicius-pose-1.jpg";
const foto2 = "images/vinicius/vinicius-pose-2.jpg";

const preloadFoto2 = new Image();
preloadFoto2.src = foto2;

if (viniciusImg && ctaButton) {
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;

    if (scrollPosition > 30) {
      viniciusImg.src = foto2;
      viniciusImg.style.transform = "scale(1.05)";

      ctaButton.style.transform = "scale(1.05)";
      ctaButton.style.boxShadow = "0 0 30px rgba(255, 59, 48, 0.8)";
      ctaButton.style.backgroundColor = "#ff2215";
    } else {
      viniciusImg.src = foto1;
      viniciusImg.style.transform = "scale(1)";

      ctaButton.style.transform = "scale(1)";
      ctaButton.style.boxShadow = "0 8px 20px rgba(255, 59, 48, 0.4)";
      ctaButton.style.backgroundColor = "#ff3b30";
    }
  }, { passive: true });

  viniciusImg.addEventListener('error', () => {
    if (viniciusImg.src.includes('pose-2')) {
      const fallback = new Image();
      fallback.src = foto1;
      viniciusImg.onerror = null;
    }
  });
}

// ---------- VALIDAÇÃO DO FORMULÁRIO DE CONTATO ----------
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm && formMessage) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = contactForm.querySelector('input[name="nome"]').value.trim();
    const whatsapp = contactForm.querySelector('input[name="whatsapp"]').value.trim();
    const objetivo = contactForm.querySelector('textarea[name="objetivo"]').value.trim();

    const apenasDigitos = whatsapp.replace(/\D/g, '');
    const whatsappValido = apenasDigitos.length >= 10 && apenasDigitos.length <= 13;

    if (!nome || !whatsapp || !objetivo) {
      formMessage.textContent = 'Por favor, preencha todos os campos.';
      formMessage.className = 'form-message error';
      formMessage.style.display = 'block';
      return;
    }

    if (!whatsappValido) {
      formMessage.textContent = 'Por favor, insira um WhatsApp válido.';
      formMessage.className = 'form-message error';
      formMessage.style.display = 'block';
      return;
    }

    formMessage.textContent = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
    formMessage.className = 'form-message success';
    formMessage.style.display = 'block';
    contactForm.reset();

    setTimeout(() => {
      formMessage.style.display = 'none';
    }, 5000);
  });
}

// ---------- CARROSSEL DA SEÇÃO SOBRE MIM ----------
const carouselImages = document.querySelectorAll('.carousel-img');
const carouselDotsContainer = document.getElementById('carouselDots');

if (carouselImages.length > 0 && carouselDotsContainer) {
  for (let i = 0; i < carouselImages.length; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('data-index', i);
    dot.setAttribute('aria-label', `Foto ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    carouselDotsContainer.appendChild(dot);
  }

  const carouselDots = document.querySelectorAll('.carousel-dot');
  const carousel = document.getElementById('aboutCarousel');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    carouselImages.forEach((img, i) => {
      img.classList.toggle('active', i === index);
    });
    carouselDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % carouselImages.length;
    showSlide(currentSlide);
  }

  function startAutoSlide() {
    if (prefersReduced || carouselImages.length <= 1) return;
    slideInterval = setInterval(nextSlide, 4000);
  }

  function stopAutoSlide() {
    clearInterval(slideInterval);
  }

  startAutoSlide();

  carouselDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.getAttribute('data-index'));
      showSlide(index);
      stopAutoSlide();
      startAutoSlide();
    });
  });

  if (carousel) {
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
  }

  if (carousel && carouselImages.length > 1) {
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      const swipeThreshold = 50;

      if (Math.abs(diff) > swipeThreshold) {
        stopAutoSlide();
        if (diff > 0) {
          currentSlide = (currentSlide + 1) % carouselImages.length;
        } else {
          currentSlide = (currentSlide - 1 + carouselImages.length) % carouselImages.length;
        }
        showSlide(currentSlide);
        startAutoSlide();
      }
    }, { passive: true });
  }
}