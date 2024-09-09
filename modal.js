document.addEventListener("DOMContentLoaded", function() {
    function closeAllModals() {
        const modalIds = ['#modal10', '#modal11', '#modal12', '#modal13', '#modal14', '#modal15'];
        modalIds.forEach(id => {
            const modal = document.querySelector(id);
            if (modal) {
                modal.style.display = 'none';
            }
        });
        
        document.body.classList.remove('modal-open');
    }

    const buttons = document.querySelectorAll(".button");
    buttons.forEach(button => {
        button.addEventListener("click", function() {
            closeAllModals();

            if (this.hasAttribute("data-modal-targets")) {
                const modalTargets = this.getAttribute("data-modal-targets");
                const modalIds = modalTargets.split(',');
                modalIds.forEach(modalId => {
                    const modal = document.querySelector(modalId.trim());
                    if (modal) {
                        modal.style.display = "block";
                    }
                });
            } else {
                const modalId = this.getAttribute("data-modal-target");
                const modal = document.querySelector(modalId);
                if (modal) {
                    modal.style.display = "block";
                }
            }

            document.body.classList.add('modal-open');
        });
    });

    const closeButtons = document.querySelectorAll("[data-modal-close]");
    closeButtons.forEach(button => {
        button.addEventListener("click", function() {
            const modal = button.closest(".modal");
            modal.style.display = "none";

            const openModals = document.querySelectorAll(".modal");
            let isAnyModalOpen = false;
            openModals.forEach(modal => {
                if (modal.style.display === "block") {
                    isAnyModalOpen = true;
                }
            });

            if (!isAnyModalOpen) {
                document.body.classList.remove('modal-open');
            }
        });
    });

    const modals = document.querySelectorAll(".modal");
    modals.forEach(modal => {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                modal.style.display = "none";

                document.body.classList.remove('modal-open');
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var popup = document.querySelector('.popup');
    var introPopup = document.querySelector('.introduction_popup');
    var closeButton = document.querySelector('.close-button');

    setTimeout(function() {
        popup.style.display = 'flex';
    }, 900);

    document.addEventListener('click', function(event) {
        var isClickInside = introPopup.contains(event.target);

        if (!isClickInside && popup.style.display === 'flex') {
            popup.style.display = 'none';
        }
    });

    closeButton.addEventListener('click', function() {
        popup.style.display = 'none';
    });
});
