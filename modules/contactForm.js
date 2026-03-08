export function initContactForm() {
    const linkForm = document.getElementById('link-form');
    const formModal = document.getElementById('form-modal');
    const closeFormBtn = document.getElementById('close-form');
    const form = document.getElementById('interest-form');

    if (linkForm && formModal) {
        linkForm.addEventListener('click', () => {
            formModal.classList.remove('hidden');
        });
    }

    if (closeFormBtn && formModal) {
        closeFormBtn.addEventListener('click', () => {
            formModal.classList.add('hidden');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.success) {
                    form.reset();
                    alert('Thanks!');
                    formModal.classList.add('hidden');
                } else {
                    alert('Error submitting form: ' + (json.error || 'Unknown error'));
                }
            } catch (err) {
                console.error(err);
                alert('Network error during submission.');
            }
        });
    }
}
