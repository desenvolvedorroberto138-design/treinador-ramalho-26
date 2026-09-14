// =====================================================
// 🔐 PAINEL ADMINISTRATIVO - LÓGICA PRINCIPAL
// =====================================================

const SUPABASE_URL = window.ENV_CONFIG?.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = window.ENV_CONFIG?.SUPABASE_ANON_KEY || ''
const ADMIN_PASSWORD = window.ENV_CONFIG?.ADMIN_PASSWORD || 'changeme123'

let supabase = null
let allLeads = []
let filteredLeads = []
let currentPage = 1
const LEADS_PER_PAGE = 20

// Elementos DOM
const authScreen = document.getElementById('auth-screen')
const adminPanel = document.getElementById('admin-panel')
const authForm = document.getElementById('auth-form')
const authError = document.getElementById('auth-error')
const authSubmit = document.getElementById('auth-submit')
const togglePassword = document.getElementById('toggle-password')
const passwordInput = document.getElementById('admin-password')
const leadsTbody = document.getElementById('leads-tbody')
const leadCount = document.getElementById('lead-count')
const searchInput = document.getElementById('search-input')
const statusFilter = document.getElementById('status-filter')
const dateFilter = document.getElementById('date-filter')
const emptyState = document.getElementById('empty-state')
const pagination = document.getElementById('pagination')
const prevPageBtn = document.getElementById('prev-page')
const nextPageBtn = document.getElementById('next-page')
const pageInfo = document.getElementById('page-info')
const btnExport = document.getElementById('btn-export')
const btnLogout = document.getElementById('btn-logout')
const toastContainer = document.getElementById('toast-container')

// Status labels
const STATUS_LABELS = {
  novo: { label: 'Novo', class: 'status-novo', icon: '🆕' },
  contactado: { label: 'Contatado', class: 'status-contatado', icon: '📞' },
  convertido: { label: 'Convertido', class: 'status-convertido', icon: '✅' },
  perdido: { label: 'Perdido', class: 'status-perdido', icon: '❌' }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  checkAuth()
  setupEventListeners()
})

function checkAuth() {
  const isAuthed = sessionStorage.getItem('admin_auth') === 'true'
  if (isAuthed) {
    showAdminPanel()
  } else {
    showAuthScreen()
  }
}

function showAuthScreen() {
  authScreen.style.display = 'flex'
  adminPanel.style.display = 'none'
}

function showAdminPanel() {
  authScreen.style.display = 'none'
  adminPanel.style.display = 'block'
  initSupabase()
  loadLeads()
}

function setupEventListeners() {
  // Auth form
  authForm.addEventListener('submit', handleAuth)
  togglePassword.addEventListener('click', togglePasswordVisibility)

  // Admin panel
  searchInput.addEventListener('input', debounce(handleSearch, 300))
  statusFilter.addEventListener('change', handleFilter)
  dateFilter.addEventListener('change', handleFilter)
  btnExport.addEventListener('click', exportCSV)
  btnLogout.addEventListener('click', logout)
  prevPageBtn.addEventListener('click', () => changePage(currentPage - 1))
  nextPageBtn.addEventListener('click', () => changePage(currentPage + 1))
}

function togglePasswordVisibility() {
  const type = passwordInput.type === 'password' ? 'text' : 'password'
  passwordInput.type = type
  togglePassword.innerHTML = type === 'password'
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
}

async function handleAuth(e) {
  e.preventDefault()
  const password = passwordInput.value

  setAuthLoading(true)
  authError.style.display = 'none'

  // Simula verificação (em produção, usar hash)
  await new Promise(r => setTimeout(r, 500))

  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_auth', 'true')
    showAdminPanel()
    showToast('Acesso autorizado', 'success')
  } else {
    authError.textContent = 'Senha incorreta'
    authError.style.display = 'block'
    passwordInput.value = ''
    passwordInput.focus()
  }
  setAuthLoading(false)
}

function setAuthLoading(loading) {
  authSubmit.disabled = loading
  const btnText = authSubmit.querySelector('.btn-text')
  const btnLoader = authSubmit.querySelector('.btn-loader')
  btnText.style.display = loading ? 'none' : 'inline'
  btnLoader.style.display = loading ? 'inline' : 'none'
}

async function initSupabase() {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error)
    showToast('Erro ao conectar ao banco', 'error')
  }
}

async function loadLeads() {
  if (!supabase) return

  try {
    showToast('Carregando leads...', 'info', 2000)

    const { data, error } = await supabase
      .from('interessados')
      .select('*')
      .order('data_envio', { ascending: false })

    if (error) throw error

    allLeads = data || []
    applyFilters()
    updateLeadCount()
  } catch (error) {
    console.error('Erro ao carregar leads:', error)
    showToast('Erro ao carregar leads', 'error')
  }
}

function applyFilters() {
  let leads = [...allLeads]

  // Busca
  const searchTerm = searchInput.value.toLowerCase().trim()
  if (searchTerm) {
    leads = leads.filter(lead =>
      lead.nome.toLowerCase().includes(searchTerm) ||
      lead.whatsapp.includes(searchTerm)
    )
  }

  // Filtro de status
  const status = statusFilter.value
  if (status) {
    leads = leads.filter(lead => lead.status === status)
  }

  // Filtro de data
  const dateFilterVal = dateFilter.value
  if (dateFilterVal) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let startDate

    switch (dateFilterVal) {
      case 'today':
        startDate = today
        break
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endDate = new Date(now.getFullYear(), now.getMonth(), 1)
        leads = leads.filter(lead => {
          const leadDate = new Date(lead.data_envio)
          return leadDate >= startDate && leadDate < endDate
        })
        filteredLeads = leads
        currentPage = 1
        renderLeads()
        updatePagination()
        return
    }

    if (startDate) {
      leads = leads.filter(lead => new Date(lead.data_envio) >= startDate)
    }
  }

  filteredLeads = leads
  currentPage = 1
  renderLeads()
  updatePagination()
}

function handleSearch() {
  applyFilters()
}

function handleFilter() {
  applyFilters()
}

function renderLeads() {
  const start = (currentPage - 1) * LEADS_PER_PAGE
  const end = start + LEADS_PER_PAGE
  const pageLeads = filteredLeads.slice(start, end)

  if (pageLeads.length === 0) {
    leadsTbody.innerHTML = ''
    emptyState.style.display = 'flex'
    pagination.style.display = 'none'
    return
  }

  emptyState.style.display = 'none'
  pagination.style.display = 'flex'

  leadsTbody.innerHTML = pageLeads.map(lead => {
    const statusInfo = STATUS_LABELS[lead.status] || STATUS_LABELS.novo
    const formattedDate = formatDate(lead.data_envio)
    const formattedPhone = formatPhone(lead.whatsapp)
    const shortObjetivo = lead.objetivo.length > 80
      ? lead.objetivo.substring(0, 80) + '...'
      : lead.objetivo

    return `
      <tr data-id="${lead.id}">
        <td>
          <div class="lead-name">
            <strong>${escapeHtml(lead.nome)}</strong>
          </div>
        </td>
        <td>
          <a href="https://wa.me/${lead.whatsapp.replace(/\D/g, '')}" target="_blank" class="phone-link">
            ${formattedPhone}
          </a>
        </td>
        <td>
          <div class="objetivo-cell" title="${escapeHtml(lead.objetivo)}">${escapeHtml(shortObjetivo)}</div>
        </td>
        <td class="date-cell">${formattedDate}</td>
        <td>
          <select class="status-select ${statusInfo.class}" data-id="${lead.id}" onchange="updateStatus(this)">
            <option value="novo" ${lead.status === 'novo' ? 'selected' : ''}>🆕 Novo</option>
            <option value="contatado" ${lead.status === 'contatado' ? 'selected' : ''}>📞 Contatado</option>
            <option value="convertido" ${lead.status === 'convertido' ? 'selected' : ''}>✅ Convertido</option>
            <option value="perdido" ${lead.status === 'perdido' ? 'selected' : ''}>❌ Perdido</option>
          </select>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon btn-whatsapp" onclick="openWhatsApp('${lead.whatsapp.replace(/\D/g, '')}', '${escapeHtml(lead.nome)}')" title="Abrir WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.428 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378 3.43 3.43 0 00-.932-.54 9.86 9.86 0 01-3.572-.483c-.347-.027-.72.096-.947.319l-.33.334c-.105.132-.196.274-.26.434a3.76 3.76 0 00-.37 1.376c-.095.82.193 1.42.572 1.653.78.48 3.457 1.315 4.953 1.715a10.15 10.15 0 003.248.448c.72-.148 2.084-.633 3.145-1.463a4.07 4.07 0 001.551-2.273c.06-.287.06-.62.042-.857-.03-.75-.393-1.93-.94-3.147z"/>
              </svg>
            </button>
            <button class="btn-icon btn-delete" onclick="deleteLead('${lead.id}')" title="Excluir lead">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')
}

function updateLeadCount() {
  leadCount.textContent = `${filteredLeads.length} de ${allLeads.length}`
}

function updatePagination() {
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE)
  pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`
  prevPageBtn.disabled = currentPage <= 1
  nextPageBtn.disabled = currentPage >= totalPages
}

function changePage(page) {
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE)
  if (page < 1 || page > totalPages) return
  currentPage = page
  renderLeads()
  updatePagination()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// =====================================================
// 🔄 AÇÕES DE LEADS
// =====================================================

window.updateStatus = async function(select) {
  const leadId = select.dataset.id
  const newStatus = select.value
  const row = select.closest('tr')

  // Atualiza classe visual imediatamente
  select.className = `status-select ${STATUS_LABELS[newStatus].class}`

  try {
    const { error } = await supabase
      .from('interessados')
      .update({ status: newStatus })
      .eq('id', leadId)

    if (error) throw error

    // Atualiza array local
    const leadIndex = allLeads.findIndex(l => l.id === leadId)
    if (leadIndex !== -1) {
      allLeads[leadIndex].status = newStatus
    }

    showToast(`Status alterado para "${STATUS_LABELS[newStatus].label}"`, 'success')
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    showToast('Erro ao atualizar status', 'error')
    // Reverte visual
    const oldStatus = allLeads.find(l => l.id === leadId)?.status || 'novo'
    select.value = oldStatus
    select.className = `status-select ${STATUS_LABELS[oldStatus].class}`
  }
}

window.deleteLead = async function(leadId) {
  if (!confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.')) {
    return
  }

  try {
    const { error } = await supabase
      .from('interessados')
      .delete()
      .eq('id', leadId)

    if (error) throw error

    allLeads = allLeads.filter(l => l.id !== leadId)
    applyFilters()
    showToast('Lead excluído com sucesso', 'success')
  } catch (error) {
    console.error('Erro ao excluir lead:', error)
    showToast('Erro ao excluir lead', 'error')
  }
}

window.openWhatsApp = function(phone, nome) {
  const primeiroNome = nome.split(' ')[0]
  const mensagem = `Olá ${primeiroNome}, recebi seu contato pelo site e vou entrar em contato em breve!`
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}

// =====================================================
// 📤 EXPORTAR CSV
// =====================================================

function exportCSV() {
  if (filteredLeads.length === 0) {
    showToast('Nenhum lead para exportar', 'warning')
    return
  }

  const headers = ['Nome', 'WhatsApp', 'Objetivo', 'Data', 'Status']
  const rows = filteredLeads.map(lead => [
    `"${lead.nome.replace(/"/g, '""')}"`,
    `"${lead.whatsapp}"`,
    `"${lead.objetivo.replace(/"/g, '""')}"`,
    `"${formatDate(lead.data_envio)}"`,
    `"${STATUS_LABELS[lead.status]?.label || lead.status}"`
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)

  showToast(`${filteredLeads.length} leads exportados`, 'success')
}

// =====================================================
// 🚪 LOGOUT
// =====================================================

function logout() {
  sessionStorage.removeItem('admin_auth')
  showAuthScreen()
  passwordInput.value = ''
  passwordInput.focus()
  showToast('Sessão encerrada', 'info')
}

// =====================================================
// 🛠️ UTILITÁRIOS
// =====================================================

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  })
}

function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,3)} ${cleaned.slice(3,7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`
  }
  return phone
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// =====================================================
// 🔔 TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = 'info', duration = 4000) {
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

  toastContainer.appendChild(toast)

  // Animação de entrada
  requestAnimationFrame(() => {
    toast.classList.add('toast-show')
  })

  // Auto remove
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

// Expor showToast globalmente para uso em outras partes
window.showToast = showToast