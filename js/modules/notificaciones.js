/**
 * CONSEROUT - Notifications Module
 * Internal messaging and alerts system
 */

// Extend App class with notifications module
App.prototype.loadNotificacionesModule = function (container) {
  container.innerHTML = `
    <div class="module-container">
      <div class="module-header">
        <h2 class="module-title">Avisos y Notificaciones</h2>
        <div class="module-actions">
          <button class="btn btn-primary" onclick="app.showNotificacionForm()">
            <span>+</span>
            <span>Nueva Notificación</span>
          </button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="app.switchNotifTab('recibidas')">Recibidas</button>
        <button class="tab" onclick="app.switchNotifTab('enviadas')">Enviadas</button>
        <button class="tab" onclick="app.switchNotifTab('sistema')">Sistema</button>
      </div>

      <div class="tab-content active" id="tab-recibidas">
        <div id="notificacionesRecibidas"></div>
      </div>

      <div class="tab-content" id="tab-enviadas">
        <div id="notificacionesEnviadas"></div>
      </div>

      <div class="tab-content" id="tab-sistema">
        <div id="notificacionesSistema"></div>
      </div>
    </div>
  `;

  this.renderNotificaciones();
};

App.prototype.switchNotifTab = function (tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');

  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
};

App.prototype.renderNotificaciones = function () {
  const notificaciones = db.getData('notificaciones');
  const usuarios = db.getData('usuarios');
  const currentUser = auth.getCurrentUser();

  // Recibidas
  const recibidas = notificaciones.filter(n => n.usuario_destino_id === currentUser.id);
  const recibidasContainer = document.getElementById('notificacionesRecibidas');
  if (recibidasContainer) {
    recibidasContainer.innerHTML = this.renderNotifList(recibidas, usuarios, 'recibida');
  }

  // Enviadas
  const enviadas = notificaciones.filter(n => n.usuario_origen_id === currentUser.id);
  const enviadasContainer = document.getElementById('notificacionesEnviadas');
  if (enviadasContainer) {
    enviadasContainer.innerHTML = this.renderNotifList(enviadas, usuarios, 'enviada');
  }

  // Sistema
  const sistema = this.generateSystemNotifications();
  const sistemaContainer = document.getElementById('notificacionesSistema');
  if (sistemaContainer) {
    sistemaContainer.innerHTML = sistema.length > 0 ? `
      <div style="display: grid; gap: var(--spacing-md);">
        ${sistema.map(notif => `
          <div class="card ${notif.priority === 'high' ? 'border-danger' : ''}">
            <div class="card-body">
              <div style="display: flex; gap: var(--spacing-md); align-items: start;">
                <div style="font-size: var(--font-size-2xl);">${notif.icon}</div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 var(--spacing-xs) 0;">${notif.title}</h4>
                  <p style="margin: 0; color: var(--color-text-secondary);">${notif.message}</p>
                  ${notif.action ? `
                    <button class="btn btn-sm btn-primary" style="margin-top: var(--spacing-sm);" onclick="${notif.action}">
                      ${notif.actionText}
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div class="empty-state-title">Todo en orden</div>
        <div class="empty-state-description">No hay alertas del sistema</div>
      </div>
    `;
  }
};

App.prototype.renderNotifList = function (notificaciones, usuarios, tipo) {
  if (notificaciones.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📬</div>
        <div class="empty-state-title">No hay notificaciones</div>
      </div>
    `;
  }

  return `
    <div style="display: grid; gap: var(--spacing-md);">
      ${notificaciones.map(notif => {
    const usuario = tipo === 'recibida' ?
      usuarios.find(u => u.id === notif.usuario_origen_id) :
      usuarios.find(u => u.id === notif.usuario_destino_id);

    return `
          <div class="card ${!notif.leida && tipo === 'recibida' ? 'border-primary' : ''}">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                <div>
                  <strong>${tipo === 'recibida' ? 'De' : 'Para'}: ${usuario ? usuario.nombre : 'Usuario'}</strong>
                  ${!notif.leida && tipo === 'recibida' ? '<span class="badge badge-primary" style="margin-left: var(--spacing-sm);">Nuevo</span>' : ''}
                </div>
                <span style="font-size: var(--font-size-xs); color: var(--color-text-tertiary);">
                  ${formatDate(notif.fecha)}
                </span>
              </div>
              <h4 style="margin: 0 0 var(--spacing-sm) 0;">${notif.asunto}</h4>
              <p style="margin: 0; color: var(--color-text-secondary);">${notif.mensaje}</p>
              ${tipo === 'recibida' && !notif.leida ? `
                <button class="btn btn-sm btn-secondary" style="margin-top: var(--spacing-sm);" onclick="app.marcarComoLeida(${notif.id})">
                  Marcar como leída
                </button>
                <button class="btn btn-sm btn-primary" style="margin-top: var(--spacing-sm);" onclick="app.replyNotificacion(${notif.id})">
                  Responder
                </button>
              ` : `
                <button class="btn btn-sm btn-primary" style="margin-top: var(--spacing-sm);" onclick="app.replyNotificacion(${notif.id})">
                  Responder
                </button>
              `}
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
};

App.prototype.generateSystemNotifications = function () {
  const notifications = [];
  const suministros = db.getData('suministros');
  const bodega = db.getData('bodega');
  const contratos = db.getData('contratos');

  // Check low stock
  suministros.forEach(suministro => {
    const inventario = bodega.filter(b => b.suministro_id === suministro.id);
    const stockTotal = inventario.reduce((sum, b) => sum + b.cantidad, 0);

    if (stockTotal < suministro.stock_minimo) {
      notifications.push({
        icon: '⚠️',
        title: 'Stock Bajo',
        message: `${suministro.nombre}: ${stockTotal} unidades (mínimo: ${suministro.stock_minimo})`,
        priority: 'high',
        action: 'app.loadModule("bodega")',
        actionText: 'Ir a Bodega'
      });
    }
  });

  // Check contracts expiring soon
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  contratos.filter(c => c.estado === 'vigente').forEach(contrato => {
    const fechaFin = new Date(contrato.fecha_fin);
    if (fechaFin <= in30Days && fechaFin >= today) {
      const diasRestantes = Math.ceil((fechaFin - today) / (1000 * 60 * 60 * 24));
      notifications.push({
        icon: '📅',
        title: 'Contrato por Vencer',
        message: `${contrato.numero_contrato} vence en ${diasRestantes} días`,
        priority: 'medium',
        action: `app.loadModule("contratos")`,
        actionText: 'Ver Contrato'
      });
    }
  });

  // Check equipment without counters this month
  const equipos = db.getData('equipos').filter(e => e.estado === 'instalado');
  const contadores = db.getData('contadores_equipos');
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let equiposSinContador = 0;
  equipos.forEach(equipo => {
    const hasCurrentMonthCounter = contadores.some(c => {
      if (c.equipo_id !== equipo.id) return false;
      const fecha = new Date(c.fecha_lectura);
      return fecha.getMonth() + 1 === currentMonth && fecha.getFullYear() === currentYear;
    });

    if (!hasCurrentMonthCounter) {
      equiposSinContador++;
    }
  });

  if (equiposSinContador > 0) {
    notifications.push({
      icon: '🔢',
      title: 'Contadores Pendientes',
      message: `${equiposSinContador} equipos sin lectura de contador este mes`,
      priority: 'medium',
      action: 'app.loadModule("contadores")',
      actionText: 'Registrar Contadores'
    });
  }

  return notifications;
};

App.prototype.showNotificacionForm = function (destinatarioId = null, asunto = '') {
  const usuarios = db.getData('usuarios');
  const currentUser = auth.getCurrentUser();

  const formHTML = `
    <form id="notificacionForm">
      <div class="form-group">
        <label class="form-label required">Destinatario</label>
        <select class="form-select" name="usuario_destino_id" required>
          <option value="">Seleccione un usuario</option>
          ${usuarios.filter(u => u.id !== currentUser.id).map(u => `
            <option value="${u.id}" ${destinatarioId && destinatarioId == u.id ? 'selected' : ''}>
              ${u.nombre} (${u.email})
            </option>
          `).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Asunto</label>
        <input type="text" class="form-input" name="asunto" value="${asunto}" required>
      </div>
      
      <div class="form-group">
        <label class="form-label required">Mensaje</label>
        <textarea class="form-textarea" name="mensaje" rows="5" required></textarea>
      </div>
    </form>
  `;

  const modal = createModal(
    'Nueva Notificación',
    formHTML,
    [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => closeModal(modal)
      },
      {
        text: 'Enviar',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById('notificacionForm');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const formData = new FormData(form);
          db.insert('notificaciones', {
            usuario_origen_id: currentUser.id,
            usuario_destino_id: parseInt(formData.get('usuario_destino_id')),
            asunto: formData.get('asunto'),
            mensaje: formData.get('mensaje'),
            fecha: new Date().toISOString(),
            leida: false
          });

          showToast('Notificación enviada exitosamente', 'success');
          closeModal(modal);
          this.renderNotificaciones();
        }
      }
    ]
  );

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
};

App.prototype.marcarComoLeida = function (id) {
  db.update('notificaciones', id, { leida: true });
  showToast('Marcada como leída', 'success');
  this.renderNotificaciones();
};

App.prototype.replyNotificacion = function (id) {
  const notif = db.getById('notificaciones', id);
  if (!notif) return;

  // Check if it's a system notification (usually no user_origin or specific logic)
  // But assuming user-to-user here based on context

  // We want to reply TO the SENDER of the original notification
  // If I am the receiver, the other person is the sender (usuario_origen_id)
  // However, if I am looking at sent messages, I might want to reply/follow up to the DESTINATION?
  // User requested "notificaciones recibidas", so we reply to origin.

  const replySubject = notif.asunto.startsWith('RE:') ? notif.asunto : `RE: ${notif.asunto}`;
  this.showNotificacionForm(notif.usuario_origen_id, replySubject);
};
