document.addEventListener('DOMContentLoaded', () => {
  const gate = document.getElementById('gate');
  const gateInput = document.getElementById('gate-dni');
  const gateError = document.getElementById('gate-error');
  const gateSubmit = document.getElementById('gate-submit');
  const dniHidden = document.getElementById('dni');
  const voterChip = document.getElementById('voter-chip');
  const voterDniLabel = document.getElementById('voter-dni-label');

  const form = document.getElementById('vote-form');
  const submitBtn = document.getElementById('submit-btn');
  const messageEl = document.getElementById('message');

  gateInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    gateError.textContent = '';
  });
  gateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') gateSubmit.click(); });

  gateSubmit.addEventListener('click', () => {
    const val = gateInput.value.trim();
    if (!/^\d{8}$/.test(val)) {
      gateError.textContent = 'Ingresa un DNI válido de 8 dígitos.';
      return;
    }
    dniHidden.value = val;
    voterDniLabel.textContent = 'DNI •••• ' + val.slice(-4);
    voterChip.classList.add('show');
    gate.classList.add('closing');
    setTimeout(() => { gate.style.display = 'none'; }, 250);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dni = dniHidden.value.trim();
    const votoInput = form.querySelector('input[name="voto"]:checked');
    const voto = votoInput ? votoInput.value : '';

    if (!/^\d{8}$/.test(dni)) {
      showMessage('Verifica tu identidad antes de votar.', 'error');
      return;
    }
    if (!voto) {
      showMessage('Debe seleccionar una preferencia de voto.', 'error');
      return;
    }

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
        form.querySelectorAll('input[name="voto"]').forEach(i => i.checked = false);
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Error de conexión. Intente nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Registrar voto';
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = type;
    messageEl.classList.remove('hidden');
  }
});