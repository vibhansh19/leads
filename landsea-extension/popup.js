const BACKEND = 'https://leads-finder-backend.onrender.com'
const COUNTS = [1, 2, 3, 4, 5]
let maxResults = 3

// Build count buttons
const countRow = document.getElementById('countRow')
COUNTS.forEach(n => {
  const btn = document.createElement('button')
  btn.className = 'count-btn' + (n === maxResults ? ' on' : '')
  btn.textContent = n
  btn.onclick = () => {
    maxResults = n
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('on'))
    btn.classList.add('on')
  }
  countRow.appendChild(btn)
})

// Load saved values
chrome.storage.local.get(['businessType', 'location'], (data) => {
  if (data.businessType) document.getElementById('businessType').value = data.businessType
  if (data.location) document.getElementById('location').value = data.location
})

// Search
document.getElementById('searchBtn').addEventListener('click', async () => {
  const businessType = document.getElementById('businessType').value
  const location = document.getElementById('location').value.trim()
  const errBox = document.getElementById('errorBox')
  const searchBtn = document.getElementById('searchBtn')
  const resultsDiv = document.getElementById('results')

  errBox.style.display = 'none'

  if (!businessType || !location) {
    errBox.textContent = 'Select a category and enter a city.'
    errBox.style.display = 'block'
    return
  }

  // Save values
  chrome.storage.local.set({ businessType, location })

  // Loading state
  searchBtn.disabled = true
  searchBtn.textContent = 'Searching...'
  resultsDiv.style.display = 'block'
  resultsDiv.innerHTML = `
    <div class="loading">
      <div class="spinner">◌</div>
      <div>Scanning Google Maps...</div>
    </div>
  `

  try {
    const res = await fetch(`${BACKEND}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessType, location, maxResults })
    })

    if (!res.ok) throw new Error('Backend error')
    const data = await res.json()

    if (data.error) throw new Error(data.error)
    if (!data.leads?.length) throw new Error('No results found. Try a different city.')

    const leads = data.leads
    const hasWebsite = leads.filter(l => l.hasWebsite).length
    const noWebsite = leads.filter(l => !l.hasWebsite).length

    const getWA = (phone) => {
      if (!phone) return null
      const clean = phone.replace(/\D/g, '')
      const num = clean.startsWith('91') ? clean : `91${clean}`
      return `https://wa.me/${num}`
    }

    resultsDiv.innerHTML = `
      <div class="stats-row">
        <div class="stat"><div class="stat-val" style="color:#FAFAFA">${leads.length}</div><div class="stat-key">Found</div></div>
        <div class="stat"><div class="stat-val" style="color:#22C55E">${hasWebsite}</div><div class="stat-key">Online</div></div>
        <div class="stat"><div class="stat-val" style="color:#EF4444">${noWebsite}</div><div class="stat-key">No Site</div></div>
      </div>
      <div class="result-list">
        ${leads.map(l => `
          <div class="result-item">
            <div class="r-name">${l.name || '—'}</div>
            ${l.category ? `<div class="r-cat">${l.category}</div>` : ''}
            ${l.phone ? `<div class="r-phone">📞 ${l.phone}</div>` : ''}
            <div class="r-badges">
              <span class="${l.hasWebsite ? 'badge-yes' : 'badge-no'}">${l.hasWebsite ? '● Online' : '● No Site'}</span>
              ${l.url ? `<a class="maps-link" href="${l.url}" target="_blank">📍 Maps</a>` : ''}
              ${getWA(l.phone) ? `<a class="wa-link" href="${getWA(l.phone)}" target="_blank">💬 WA</a>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `
  } catch (e) {
    resultsDiv.style.display = 'none'
    errBox.textContent = e.message || 'Something went wrong. Try again.'
    errBox.style.display = 'block'
  } finally {
    searchBtn.disabled = false
    searchBtn.textContent = 'Search Leads →'
  }
})
