document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('vote-form');
  const dniInput = document.getElementById('dni');
  const votoSelect = document.getElementById('voto');
  const submitBtn = document.getElementById('submit-btn');
  const messageEl = document.getElementById('message');
  
  // Elementos del dashboard
  const totalVotosEl = document.getElementById('total-votos');
  const listaResultados = document.getElementById('lista-resultados');

  // Cargar resultados iniciales
  cargarResultados();

  // Prevenir que escriban letras en el DNI (UX)
  dniInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, ''); 
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dni = dniInput.value.trim();
    const voto = votoSelect.value;

    // Validación Frontend (Seguridad extra)
    if (!/^\d{8}$/.test(dni)) {
      showMessage('El DNI debe tener 8 dígitos numéricos.', 'error');
      return;
    }
    if (!voto) {
      showMessage('Debe seleccionar una preferencia de voto.', 'error');
      return;
    }

    // Bloquear botón para evitar envío múltiple
    submitBtn.disabled = true;
    submitBtn.innerText = 'Registrando...';
    messageEl.classList.add('hidden');

    try {
      const response = await fetch('/api/votar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni, voto })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, 'success');
        form.reset();
        cargarResultados(); // Actualizar dashboard
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Error de conexión. Intente nuevamente.', 'error');
    } finally {
      // Desbloquear botón
      submitBtn.disabled = false;
      submitBtn.innerText = 'Registrar Voto';
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = type; // Asigna 'success' o 'error'
    messageEl.classList.remove('hidden');
  }

  async function cargarResultados() {
    try {
      const res = await fetch('/api/resultados');
      const data = await res.json();
      
      if (data.success) {
        totalVotosEl.textContent = data.total;
        listaResultados.innerHTML = '';
        
        // Ordenar resultados de mayor a menor y mostrar
        const resultadosOrdenados = Object.entries(data.resultados)
          .sort((a, b) => b[1] - a[1]);

        resultadosOrdenados.forEach(([partido, votos]) => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${partido}</span> <strong>${votos} votos</strong>`;
          listaResultados.appendChild(li);
        });
      }
    } catch (error) {
      console.error('Error al cargar resultados del dashboard.');
    }
  }
});