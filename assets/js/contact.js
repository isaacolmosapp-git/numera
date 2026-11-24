document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-contact-btn');
  const feedback = document.getElementById('form-feedback');
  const isEn = window.NumeraCore && NumeraCore.lang === 'en';

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const accessKey = formData.get('access_key');

    // Respaldo limpio si aún no se ha configurado la clave de Web3Forms
    if (!accessKey || accessKey === 'TU_ACCESS_KEY_AQUI') {
      const name = encodeURIComponent(formData.get('name') || '');
      const topic = encodeURIComponent(formData.get('topic') || 'Numera');
      const message = encodeURIComponent(formData.get('message') || '');
      window.location.href = `mailto:contact@numeratools.com?subject=${topic}%20-%20${name}&body=${message}`;
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = isEn ? 'Sending...' : 'Enviando...';
    feedback.style.display = 'none';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.success) {
        feedback.style.display = 'block';
        feedback.style.color = 'var(--accent)';
        feedback.textContent = isEn
          ? 'Message sent! We will get back to you within 24–48 business hours.'
          : '¡Mensaje enviado! Te responderemos en un plazo de 24 a 48 horas hábiles.';
        form.reset();
      } else {
        throw new Error(result.message || 'Submission error');
      }
    } catch {
      feedback.style.display = 'block';
      feedback.style.color = '#f87171';
      feedback.textContent = isEn
        ? 'Could not send via form. Please email us directly at contact@numeratools.com.'
        : 'No se pudo enviar mediante el formulario. Escríbenos directamente a contact@numeratools.com.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});