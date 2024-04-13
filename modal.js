document.addEventListener("DOMContentLoaded", function() {
    // Function to close all specified modals
    function closeAllModals() {
        const modalIds = ['#modal10', '#modal11', '#modal12', '#modal13', '#modal14', '#modal15'];
        modalIds.forEach(id => {
            const modal = document.querySelector(id);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Open modals
    const buttons = document.querySelectorAll(".button");
    buttons.forEach(button => {
        button.addEventListener("click", function() {
            // Close all specific modals before opening a new one
            closeAllModals();

            const modalId = this.getAttribute("data-modal-target");
            const modal = document.querySelector(modalId);
            modal.style.display = "block";
        });
    });

    // Close modals
    const closeButtons = document.querySelectorAll("[data-modal-close]");
    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const modal = button.closest(".modal");
            modal.style.display = "none";
        });
    });

    // Close modal when clicking outside of the modal content
    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    });
});