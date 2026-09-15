// =====================================================
// 🔗 CONEXÃO COM O BANCO DE DADOS SUPABASE
// =====================================================
// ✅ LÊ AS VARIÁVEIS DO window.ENV_CONFIG (gerado no build)
const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || ''
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
// 🔔 TOAST NOTIFICATIONS (compartilhado com admin)
// =====================================================
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'toast-container'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.innerHTML = `
    <div class="toast-icon">${getToastIcon(type)}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `

  container.appendChild(toast)

  requestAnimationFrame(() => {
    toast.classList.add('toast-show')
  })

  setTimeout(() => {
    toast.classList.remove('toast-show')
    toast.classList.add('toast-hide')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

function getToastIcon(type) {
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  }
  return icons[type] || icons.info
}

window.showToast = showToast

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

// Máscara de WhatsApp
function applyPhoneMask(input) {
  let value = input.value.replace(/\D/g, '')
  
  if (value.length > 11) value = value.slice(0, 11)
  
  if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`
  } else if (value.length > 0) {
    value = `(${value}`
  }
  
  if (value.length > 10) {
    value = `${value.slice(0, 10)}-${value.slice(10)}`
  }
  
  input.value = value
}

// Validação de telefone
function validatePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

// Validação inline
function validateField(field) {
  const value = field.value.trim()
  const fieldName = field.name
  let isValid = true
  let message = ''

  // Remove validação anterior
  field.classList.remove('valid', 'invalid')
  const existingError = field.parentElement.querySelector('.field-error')
  if (existingError) existingError.remove()

  switch (fieldName) {
    case 'nome':
      if (!value) {
        isValid = false
        message = 'Nome é obrigatório'
      } else if (value.length < 2) {
        isValid = false
        message = 'Nome muito curto'
      }
      break
    case 'whatsapp':
      if (!value) {
        isValid = false
        message = 'WhatsApp é obrigatório'
      } else if (!validatePhone(value)) {
        isValid = false
        message = 'WhatsApp inválido (ex: (11) 9 9999-9999)'
      }
      break
    case 'objetivo':
      if (!value) {
        isValid = false
        message = 'Conte seu objetivo'
      } else if (value.length < 10) {
        isValid = false
        message = 'Mínimo 10 caracteres'
      }
      break
  }

  if (isValid && value) {
    field.classList.add('valid')
  } else if (!isValid) {
    field.classList.add('invalid')
    const errorEl = document.createElement('span')
    errorEl.className = 'field-error'
    errorEl.textContent = message
    field.parentElement.appendChild(errorEl)
  }

  return isValid
}

// Contador de caracteres
function updateCharCount(textarea) {
  const counter = textarea.parentElement.querySelector('.char-counter')
  if (counter) {
    const len = textarea.value.length
    counter.textContent = `${len}/500`
    counter.style.color = len > 500 ? '#ff6b6b' : len > 450 ? '#ffb800' : '#666'
  }
}

// Estado de loading do botão
function setFormLoading(form, loading) {
  const submitBtn = form.querySelector('button[type="submit"]')
  const btnText = submitBtn.querySelector('.btn-text') || submitBtn
  const btnLoader = submitBtn.querySelector('.btn-loader')
  
  if (!btnLoader) {
    const loader = document.createElement('span')
    loader.className = 'btn-loader'
    loader.style.display = 'none'
    loader.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round"></circle></svg>'
    submitBtn.appendChild(loader)
  }
  
  submitBtn.disabled = loading
  if (loading) {
    btnText.style.display = 'none'
    submitBtn.querySelector('.btn-loader').style.display = 'inline-flex'
  } else {
    btnText.style.display = 'inline'
    submitBtn.querySelector('.btn-loader').style.display = 'none'
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Conecta ao banco ANTES de tudo
  await conectarSupabase()

  if (contactForm && formMessage) {
    const nomeInput = contactForm.querySelector('input[name="nome"]')
    const whatsappInput = contactForm.querySelector('input[name="whatsapp"]')
    const objetivoInput = contactForm.querySelector('textarea[name="objetivo"]')

    // Máscara no WhatsApp
    whatsappInput.addEventListener('input', () => applyPhoneMask(whatsappInput))

    // Validação ao perder foco
    ;[nomeInput, whatsappInput, objetivoInput].forEach(input => {
      input.addEventListener('blur', () => validateField(input))
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) {
          validateField(input)
        }
      })
    })

    // Contador de caracteres no objetivo
    objetivoInput.addEventListener('input', () => updateCharCount(objetivoInput))

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      // Validação completa
      const nomeValid = validateField(nomeInput)
      const whatsappValid = validateField(whatsappInput)
      const objetivoValid = validateField(objetivoInput)

      if (!nomeValid || !whatsappValid || !objetivoValid) {
        showToast('Por favor, corrija os erros no formulário', 'error')
        return
      }

      const nome = nomeInput.value.trim()
      const whatsapp = whatsappInput.value.trim()
      const objetivo = objetivoInput.value.trim()

      setFormLoading(contactForm, true)

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

        showToast('✅ Mensagem enviada! Entrarei em contato em breve!', 'success')
        contactForm.reset()
        ;[nomeInput, whatsappInput, objetivoInput].forEach(input => input.classList.remove('valid'))
        updateCharCount(objetivoInput)

        // Dispara notificação de e-mail via Edge Function (fire and forget)
        fetch(`${SUPABASE_URL}/functions/v1/notify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ nome, whatsapp, objetivo, data_envio: new Date().toISOString() })
        }).catch(console.error)

        // notify-whatsapp comentado até a function ser criada no Supabase
        // fetch(`${SUPABASE_URL}/functions/v1/notify-whatsapp`, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        //   },
        //   body: JSON.stringify({ nome, whatsapp, objetivo, data_envio: new Date().toISOString() })
        // }).catch(console.error)

      } catch (erro) {
        console.error(erro)
        showToast('⚠️ Erro ao salvar. Tente novamente ou chame no WhatsApp.', 'error')
      } finally {
        setFormLoading(contactForm, false)
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