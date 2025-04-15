function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';

    // Close modal when clicking outside the modal content
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal(modalId);
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}