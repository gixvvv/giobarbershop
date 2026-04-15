/* ===================================================
   GioBarber – App Logic
   Base de datos: localStorage
   =================================================== */

// ========== DB HELPERS ==========
const DB = {
  get: (key) => JSON.parse(localStorage.getItem('gb_' + key) || 'null'),
  set: (key, val) => localStorage.setItem('gb_' + key, JSON.stringify(val)),
  getArr: (key) => JSON.parse(localStorage.getItem('gb_' + key) || '[]'),
  pushArr: (key, item) => {
    const arr = DB.getArr(key);
    arr.push(item);
    DB.set(key, arr);
    return arr;
  },
};

// ========== SEED ADMIN ==========
(function seedAdmin() {
  const users = DB.getArr('users');
  const adminExists = users.find(u => u.email === 'admin@giobarber.cl');
  if (!adminExists) {
    DB.pushArr('users', {
      id: 'admin',
      nombre: 'Gio',
      apellido: 'Barbero',
      email: 'admin@giobarber.cl',
      password: 'admin123',
      telefono: '+56 9 1234 5678',
      rol: 'admin',
      createdAt: new Date().toISOString(),
    });
  }
})();

// ========== SEED REVIEWS ==========
(function seedResenas() {
  const existing = DB.getArr('resenas');
  if (existing.length === 0) {
    const demos = [
      { id: 'r1', userId: 'demo1', userName: 'Carlos M.', stars: 5, texto: 'Increíble atención, Gio sabe exactamente lo que quieres. El corte quedó perfecto, el ambiente es top. 100% recomendado.', fecha: '2025-03-15' },
      { id: 'r2', userId: 'demo2', userName: 'Felipe R.', stars: 5, texto: 'La mejor barbería de Santiago. Me hice el combo corte + barba y quedé impresionado. Los precios son muy justos.', fecha: '2025-03-20' },
      { id: 'r3', userId: 'demo3', userName: 'Matías O.', stars: 4, texto: 'Muy buen servicio, puntual y profesional. El local es muy acogedor y tiene buena música. Volvería sin dudar.', fecha: '2025-04-01' },
    ];
    DB.set('resenas', demos);
  }
})();

// ========== SESSION ==========
let currentUser = DB.get('session');

function setSession(user) {
  currentUser = user;
  DB.set('session', user);
  updateNavForUser();
  updateReservaSection();
  updateResenaSection();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('gb_session');
  updateNavForUser();
  updateReservaSection();
  updateResenaSection();
  showToast('Sesión cerrada. ¡Hasta pronto! 👋', 'info');
}

// ========== NAVBAR ==========
function updateNavForUser() {
  const navAuth = document.querySelector('.nav-auth');
  if (!navAuth) return;

  if (currentUser) {
    const initials = (currentUser.nombre[0] + currentUser.apellido[0]).toUpperCase();
    navAuth.innerHTML = `
      <div class="user-nav">
        ${currentUser.rol === 'admin' ? `<button class="btn-admin" onclick="openAdmin()"><i class="fa fa-crown"></i> Admin</button>` : ''}
        <div class="user-avatar" title="${currentUser.nombre} ${currentUser.apellido}">${initials}</div>
        <span class="user-name">${currentUser.nombre}</span>
        <button class="btn-logout" onclick="logout()"><i class="fa fa-sign-out-alt"></i> Salir</button>
      </div>
    `;
  } else {
    navAuth.innerHTML = `
      <button class="btn-login" onclick="openModal('loginModal')"><i class="fa fa-user"></i> Iniciar Sesión</button>
      <button class="btn-register" onclick="openModal('registerModal')">Registrarse</button>
    `;
  }
}

// ========== NAV SCROLL ==========
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
});

// ========== MOBILE MENU ==========
function toggleMenu() {
  const links = document.getElementById('navLinks');
  links.classList.toggle('open');
}

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('navLinks').classList.remove('open');
  });
});

// ========== MODALS ==========
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}
function closeModalOutside(e, id) {
  if (e.target.id === id) closeModal(id);
}
function switchModal(closeId, openId) {
  closeModal(closeId);
  setTimeout(() => openModal(openId), 150);
}

// ========== AUTH: LOGIN ==========
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  err.style.display = 'none';

  const users = DB.getArr('users');
  const user = users.find(u => u.email === email && u.password === pass);

  if (!user) {
    err.textContent = '❌ Correo o contraseña incorrectos.';
    err.style.display = 'block';
    return;
  }

  closeModal('loginModal');
  setSession(user);
  showToast(`¡Bienvenido, ${user.nombre}! ✂️`, 'success');
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
}

// ========== AUTH: REGISTER ==========
function handleRegister(e) {
  e.preventDefault();
  const nombre = document.getElementById('regNombre').value.trim();
  const apellido = document.getElementById('regApellido').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const tel = document.getElementById('regTel').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const err = document.getElementById('regError');
  err.style.display = 'none';

  if (pass !== pass2) {
    err.textContent = '❌ Las contraseñas no coinciden.';
    err.style.display = 'block'; return;
  }

  const users = DB.getArr('users');
  if (users.find(u => u.email === email)) {
    err.textContent = '❌ Ya existe una cuenta con ese correo.';
    err.style.display = 'block'; return;
  }

  const newUser = {
    id: 'u' + Date.now(),
    nombre, apellido, email, telefono: tel,
    password: pass, rol: 'cliente',
    createdAt: new Date().toISOString(),
  };

  DB.pushArr('users', newUser);
  closeModal('registerModal');
  setSession(newUser);
  showToast(`¡Cuenta creada! Bienvenido, ${nombre} 🎉`, 'success');

  // Clear form
  ['regNombre','regApellido','regEmail','regTel','regPass','regPass2'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

// ========== RESERVA ==========
function updateReservaSection() {
  const loginMsg = document.getElementById('reservaLoginMsg');
  const form = document.getElementById('reservaForm');
  const misCitasSection = document.getElementById('misCitasSection');

  // Set min date to today
  const fechaInput = document.getElementById('fechaInput');
  if (fechaInput) {
    const today = new Date().toISOString().split('T')[0];
    fechaInput.min = today;
  }

  if (currentUser) {
    loginMsg.style.display = 'none';
    form.style.display = 'block';
    misCitasSection.style.display = 'block';
    renderMisCitas();
  } else {
    loginMsg.style.display = 'flex';
    form.style.display = 'none';
    misCitasSection.style.display = 'none';
  }
}

function handleReserva(e) {
  e.preventDefault();
  if (!currentUser) { openModal('loginModal'); return; }

  const fd = new FormData(e.target);
  const cita = {
    id: 'c' + Date.now(),
    userId: currentUser.id,
    userName: currentUser.nombre + ' ' + currentUser.apellido,
    servicio: fd.get('servicio'),
    fecha: fd.get('fecha'),
    hora: fd.get('hora'),
    notas: fd.get('notas'),
    estado: 'confirmada',
    createdAt: new Date().toISOString(),
  };

  DB.pushArr('citas', cita);
  e.target.reset();
  renderMisCitas();
  showToast(`✅ ¡Cita confirmada para el ${formatDate(cita.fecha)} a las ${cita.hora}!`, 'success');
  
  // Scroll to citas
  setTimeout(() => document.getElementById('misCitasSection').scrollIntoView({ behavior: 'smooth' }), 300);
}

function renderMisCitas() {
  if (!currentUser) return;
  const lista = document.getElementById('misCitasLista');
  const citas = DB.getArr('citas').filter(c => c.userId === currentUser.id);

  if (citas.length === 0) {
    lista.innerHTML = '<div class="no-citas"><i class="fa fa-calendar-times fa-2x" style="color:var(--gray);margin-bottom:0.5rem;display:block"></i><p>Aún no tienes citas agendadas.</p></div>';
    return;
  }

  // Sort by date desc
  citas.sort((a,b) => new Date(b.fecha+' '+b.hora) - new Date(a.fecha+' '+a.hora));
  lista.innerHTML = citas.map(c => `
    <div class="cita-card" id="cita-${c.id}">
      <div class="cita-info">
        <h4>${c.servicio}</h4>
        <p><i class="fa fa-calendar" style="color:var(--gold);margin-right:0.4rem"></i>${formatDate(c.fecha)} a las ${c.hora}</p>
        ${c.notas ? `<p style="margin-top:0.3rem;font-style:italic">"${c.notas}"</p>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
        <span class="cita-status status-${c.estado}">${c.estado}</span>
        <button class="btn-cancel-cita" onclick="cancelarCita('${c.id}')">
          <i class="fa fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  `).join('');
}

function cancelarCita(id) {
  if (!confirm('¿Seguro que deseas cancelar esta cita?')) return;
  const citas = DB.getArr('citas');
  const idx = citas.findIndex(c => c.id === id);
  if (idx !== -1) { citas.splice(idx, 1); DB.set('citas', citas); }
  renderMisCitas();
  showToast('Cita cancelada.', 'info');
}

// ========== RESEÑAS ==========
let selectedStars = 0;

function updateResenaSection() {
  const loginMsg = document.getElementById('resenaLoginMsg');
  const form = document.getElementById('resenaForm');

  if (currentUser) {
    loginMsg.style.display = 'none';
    form.style.display = 'block';
  } else {
    loginMsg.style.display = 'flex';
    form.style.display = 'none';
  }

  renderResenas();
  renderResenaStats();
}

// Star buttons
document.querySelectorAll('.star-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedStars = parseInt(btn.dataset.val);
    document.getElementById('resenaStars').value = selectedStars;
    document.querySelectorAll('.star-btn').forEach((s, i) => {
      s.classList.toggle('active', i < selectedStars);
    });
  });
  btn.addEventListener('mouseover', () => {
    const val = parseInt(btn.dataset.val);
    document.querySelectorAll('.star-btn').forEach((s, i) => {
      s.style.color = i < val ? 'var(--gold)' : 'rgba(200,169,110,0.3)';
    });
  });
  btn.addEventListener('mouseout', () => {
    document.querySelectorAll('.star-btn').forEach((s, i) => {
      s.style.color = i < selectedStars ? 'var(--gold)' : 'rgba(200,169,110,0.3)';
    });
  });
});

function submitResena() {
  if (!currentUser) { openModal('loginModal'); return; }
  const stars = parseInt(document.getElementById('resenaStars').value);
  const texto = document.getElementById('resenaTexto').value.trim();

  if (stars === 0) { showToast('⭐ Selecciona una calificación.', 'error'); return; }
  if (texto.length < 10) { showToast('✍️ Escribe al menos 10 caracteres.', 'error'); return; }

  // Check if user already reviewed
  const existing = DB.getArr('resenas');
  if (existing.find(r => r.userId === currentUser.id)) {
    showToast('Ya dejaste una reseña. ¡Gracias!', 'info'); return;
  }

  const resena = {
    id: 'res' + Date.now(),
    userId: currentUser.id,
    userName: currentUser.nombre + ' ' + currentUser.apellido,
    stars,
    texto,
    fecha: new Date().toISOString().split('T')[0],
  };

  DB.pushArr('resenas', resena);
  document.getElementById('resenaTexto').value = '';
  selectedStars = 0;
  document.getElementById('resenaStars').value = 0;
  document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('active'));

  renderResenas();
  renderResenaStats();
  showToast('¡Gracias por tu reseña! ⭐', 'success');
}

function renderResenas() {
  const lista = document.getElementById('resenasList');
  const resenas = DB.getArr('resenas');

  if (resenas.length === 0) {
    lista.innerHTML = '<div class="no-resenas"><i class="fa fa-comment-slash fa-2x" style="opacity:0.3;margin-bottom:0.8rem;display:block"></i><p>Aún no hay reseñas. ¡Sé el primero!</p></div>';
    return;
  }

  const sorted = [...resenas].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  lista.innerHTML = sorted.map(r => `
    <div class="resena-card">
      <div class="resena-header">
        <div class="resena-user">
          <div class="resena-avatar">${r.userName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</div>
          <div>
            <div class="resena-name">${r.userName}</div>
            <div class="resena-date">${formatDate(r.fecha)}</div>
          </div>
        </div>
        <div class="resena-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>
      </div>
      <p class="resena-text">"${r.texto}"</p>
    </div>
  `).join('');
}

function renderResenaStats() {
  const stats = document.getElementById('resenasStats');
  const resenas = DB.getArr('resenas');
  if (resenas.length === 0) { stats.innerHTML = ''; return; }

  const avg = (resenas.reduce((s,r) => s + r.stars, 0) / resenas.length).toFixed(1);
  const dist = [5,4,3,2,1].map(s => resenas.filter(r => r.stars === s).length);

  stats.innerHTML = `
    <div class="stat-item">
      <span class="stat-number">${avg}</span>
      <div style="color:var(--gold);font-size:1.2rem;margin:0.3rem 0">${'★'.repeat(Math.round(avg))}</div>
      <span class="stat-label">Calificación promedio</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">${resenas.length}</span>
      <span class="stat-label">Reseñas totales</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">${dist[0]}</span>
      <span class="stat-label">Calificaciones 5 ★</span>
    </div>
  `;
}

// ========== UBICACIÓN ==========
function getLocation() {
  const status = document.getElementById('locationStatus');
  const mapDiv = document.getElementById('map');
  status.className = 'location-status';
  status.textContent = '🔍 Obteniendo tu ubicación...';

  if (!navigator.geolocation) {
    status.className = 'location-status error';
    status.textContent = '❌ Tu navegador no soporta geolocalización.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      status.className = 'location-status success';
      status.textContent = `✅ Ubicación obtenida: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      // Embed Google Maps with both user location and barber location
      const barbLat = -33.60627;
      const barbLng = -70.87649;
      mapDiv.innerHTML = `
        <iframe
          src="https://www.google.com/maps?q=${barbLat},${barbLng}&z=15&output=embed"
          width="100%" height="400" style="border:0;border-radius:16px"
          allowfullscreen loading="lazy"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
        <div style="margin-top:0.8rem;padding:0.8rem;background:rgba(200,169,110,0.1);border-radius:8px;font-size:0.85rem;color:var(--gray-light);">
          <i class="fa fa-map-pin" style="color:var(--gold);margin-right:0.4rem"></i>
          Tu ubicación: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} —
          <strong style="color:var(--gold)">GioBarber</strong> en Av. Providencia 1234
        </div>
      `;
    },
    (err) => {
      status.className = 'location-status error';
      const msgs = {
        1: '❌ Permiso denegado. Activa la ubicación en tu navegador.',
        2: '❌ Posición no disponible. Intenta de nuevo.',
        3: '❌ Tiempo de espera agotado.',
      };
      status.textContent = msgs[err.code] || '❌ Error desconocido.';

      // Show barber location anyway
      mapDiv.innerHTML = `
        <iframe
          src="https://www.google.com/maps?q=-33.4372,-70.6350&z=15&output=embed"
          width="100%" height="400" style="border:0;border-radius:16px"
          allowfullscreen loading="lazy">
        </iframe>
      `;
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ========== ADMIN PANEL ==========
function openAdmin() {
  if (!currentUser || currentUser.rol !== 'admin') return;
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('adminOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
  showAdminTab('citas');
}

function closeAdmin() {
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('adminOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((t,i) => {
    t.classList.toggle('active', ['citas','usuarios','resenas-admin'][i] === tab);
  });
  document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));

  const mapping = { 'citas': 'adminCitas', 'usuarios': 'adminUsuarios', 'resenas-admin': 'adminResenasAdmin' };
  document.getElementById(mapping[tab]).classList.add('active');

  if (tab === 'citas') renderAdminCitas();
  if (tab === 'usuarios') renderAdminUsuarios();
  if (tab === 'resenas-admin') renderAdminResenas();
}

function renderAdminCitas() {
  const citas = DB.getArr('citas');
  const el = document.getElementById('adminCitas');

  if (citas.length === 0) {
    el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:2rem">No hay citas registradas.</p>';
    return;
  }

  const sorted = [...citas].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  el.innerHTML = `
    <p style="color:var(--gray);font-size:0.85rem;margin-bottom:1rem">${citas.length} cita(s) en total</p>
    <table class="admin-table">
      <thead>
        <tr>
          <th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(c => `
          <tr>
            <td>${c.userName}</td>
            <td>${c.servicio.split(' - ')[0]}</td>
            <td>${formatDate(c.fecha)}</td>
            <td>${c.hora}</td>
            <td><span class="cita-status status-${c.estado}">${c.estado}</span></td>
            <td>
              <button class="btn-delete" onclick="adminDeleteCita('${c.id}')">
                <i class="fa fa-trash"></i> Eliminar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function adminDeleteCita(id) {
  if (!confirm('¿Eliminar esta cita?')) return;
  const citas = DB.getArr('citas').filter(c => c.id !== id);
  DB.set('citas', citas);
  renderAdminCitas();
  showToast('Cita eliminada.', 'info');
}

function renderAdminUsuarios() {
  const users = DB.getArr('users').filter(u => u.rol !== 'admin');
  const el = document.getElementById('adminUsuarios');

  if (users.length === 0) {
    el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:2rem">No hay usuarios registrados.</p>';
    return;
  }

  el.innerHTML = `
    <p style="color:var(--gray);font-size:0.85rem;margin-bottom:1rem">${users.length} usuario(s) registrado(s)</p>
    <table class="admin-table">
      <thead>
        <tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Registrado</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.nombre} ${u.apellido}</td>
            <td>${u.email}</td>
            <td>${u.telefono || '-'}</td>
            <td>${formatDate(u.createdAt.split('T')[0])}</td>
            <td>
              <button class="btn-delete" onclick="adminDeleteUser('${u.id}')">
                <i class="fa fa-trash"></i> Eliminar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function adminDeleteUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  const users = DB.getArr('users').filter(u => u.id !== id);
  DB.set('users', users);
  renderAdminUsuarios();
  showToast('Usuario eliminado.', 'info');
}

function renderAdminResenas() {
  const resenas = DB.getArr('resenas');
  const el = document.getElementById('adminResenasAdmin');

  if (resenas.length === 0) {
    el.innerHTML = '<p style="color:var(--gray);text-align:center;padding:2rem">No hay reseñas.</p>';
    return;
  }

  el.innerHTML = `
    <p style="color:var(--gray);font-size:0.85rem;margin-bottom:1rem">${resenas.length} reseña(s)</p>
    <table class="admin-table">
      <thead>
        <tr><th>Usuario</th><th>Estrellas</th><th>Comentario</th><th>Fecha</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        ${resenas.map(r => `
          <tr>
            <td>${r.userName}</td>
            <td style="color:var(--gold)">${'★'.repeat(r.stars)}</td>
            <td style="max-width:250px;font-size:0.8rem">${r.texto.substring(0,80)}${r.texto.length > 80 ? '...' : ''}</td>
            <td>${formatDate(r.fecha)}</td>
            <td>
              <button class="btn-delete" onclick="adminDeleteResena('${r.id}')">
                <i class="fa fa-trash"></i> Eliminar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function adminDeleteResena(id) {
  if (!confirm('¿Eliminar esta reseña?')) return;
  const resenas = DB.getArr('resenas').filter(r => r.id !== id);
  DB.set('resenas', resenas);
  renderAdminResenas();
  renderResenas();
  renderResenaStats();
  showToast('Reseña eliminada.', 'info');
}

// ========== TOAST ==========
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 4000);
}

// ========== UTILS ==========
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  updateNavForUser();
  updateReservaSection();
  updateResenaSection();

  // Animate sections on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .resena-card, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Active nav link
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--gold)' : '';
    });
  });
});
