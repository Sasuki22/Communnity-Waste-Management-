document.addEventListener("DOMContentLoaded", () => {

    // SHOW / HIDE PASSWORD
    const toggleButtons = document.querySelectorAll(".toggle-password");

    toggleButtons.forEach(button => {
        button.addEventListener("click", () => {

            const input = document.getElementById(button.dataset.target);

            if (!input) return;

            const isHidden = input.type === "password";

            input.type = isHidden ? "text" : "password";

            button.textContent = isHidden ? "Hide" : "Show";
            button.setAttribute("aria-pressed", String(isHidden));
            button.setAttribute(
                "aria-label",
                `${isHidden ? "Hide" : "Show"} ${button.dataset.target === "password" ? "new password" : "confirmed password"}`
            );
        });
    });

    // PASSWORD CONFIRMATION
    const form = document.getElementById("resetForm");

    if (form) {
        form.addEventListener("submit", (event) => {

            const password = document.getElementById("password");
            const confirmPassword = document.getElementById("confirm_password");
            const error = document.getElementById("passwordError");

            if (password.value !== confirmPassword.value) {

                event.preventDefault();

                error.textContent = "Passwords do not match. Please try again.";
                error.hidden = false;

                confirmPassword.focus();

                return;
            }

            error.textContent = "";
            error.hidden = true;
        });
    }

});