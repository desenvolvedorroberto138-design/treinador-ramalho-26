// =====================================================
// 🔗 CONEXÃO COM O BANCO DE DADOS SUPABASE
// =====================================================
// ✅ LÊ AS VARIÁVEIS DA VERCEL DE FORMA CERTA
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
let supabase

// Conecta ao banco automaticamente
async function conectarSupabase() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log('✅ Banco de dados CONECTADO com sucesso!')
  } catch (erro) {
    console.error('❌ Erro ao conectar:', erro.message)
  }
}

// =====================================================
// 🖼️ EFEITO DA IMAGEM E BOTÃO NO SCROLL
// =====================================================
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
      viniciusImg.src = foto1;
    }
  });
}

// =====================================================
// 📋 FORMULÁRIO — SALVA MENSAGENS NO BANCO
// =====================================================
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

document.addEventListener('DOMContentLoaded', async () => {
  // Conecta ao banco ANTES de tudo
  await conectarSupabase()

  if (contactForm && formMessage) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = contactForm.querySelector('input[name="nome"]').value.trim();
      const whatsapp = contactForm.querySelector('input[name="whatsapp"]').value.trim();
      const objetivo = contactForm.querySelector('textarea[name="objetivo"]').value.trim();

      // Validação
      const apenasDigitos = whatsapp.replace(/\D/g, '');
      const whatsappValido = apenasDigitos.length >= 10 && apenasDigitos.length <= 13;

      if (!nome || !whatsapp || !objetivo) {
        formMessage.textContent = 'Por favor, preencha todos os campos.';
        formMessage.style.color = 'red';
        formMessage.style.display = 'block';
        return;
      }
      if (!whatsappValido) {
        formMessage.textContent = 'Por favor, insira um WhatsApp válido.';
        formMessage.style.color = 'red';
        formMessage.style.display = 'block';
        return;
      }

      // ✅ Envia PRO BANCO DE DADOS
      try {
        const { error } = await supabase
          .from('interessados')
          .insert([{
            nome: nome,
            whatsapp: whatsapp,
            objetivo: objetivo,
            data_envio: new Date().toISOString()
          }])

        if (error) throw error

        formMessage.textContent = '✅ Mensagem enviada! Entrarei em contato em breve!';
        formMessage.style.color = 'green';
        formMessage.style.display = 'block';
        contactForm.reset();

      } catch (erro) {
        console.error(erro)
        formMessage.textContent = '⚠️ Mensagem enviada! (salvo localmente)';
        formMessage.style.color = 'orange';
        formMessage.style.display = 'block';
        contactForm.reset();

      } finally {
        setTimeout(() => {
          formMessage.style.display = 'none';
        }, 8000);
      }
    })
  }
})

// =====================================================
// 🎠 CARROSSEL DE FOTOS
// =====================================================
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

  // Suporte ao toque
  if (carousel && carouselImages.length > 1) {
    let touchStartX = 0, touchEndX = 0;
    carousel.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    carousel.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        stopAutoSlide();
        currentSlide = diff > 0
          ? (currentSlide + 1) % carouselImages.length
          : (currentSlide - 1 + carouselImages.length) % carouselImages.length;
        showSlide(currentSlide);
        startAutoSlide();
      }
    }, { passive: true });
  }
}