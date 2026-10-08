const D = {
    categories: [
        "Waste Categories",
        `
        <p>
            <b>Green:</b> biodegradable.
            <b>Blue:</b> recyclable.
            <b>Yellow:</b> special waste.
            <b>Black:</b> residual.
            Sorting at home makes collection faster and recycling cleaner.
        </p>
        `
    ],

    schedule: [
        "Pickup Scheduling",
        `
        <p>
            Choose your area to see regular collection days,
            or request an extra collection.
        </p>

        <label for="ar">Your area</label>

        <select id="ar">
            <option>Zone 1</option>
            <option>Zone 2</option>
            <option>Zone 3</option>
        </select>

        <p id="sr" aria-live="polite"></p>

        <div class="row">
            <button type="button" class="btn ghost" data-close>
                Close
            </button>

            <button type="button" class="btn" id="chk">
                Show schedule
            </button>
        </div>
        `
    ],

    guide: [
        "Recycling Guide",
        `
        <p>
            Rinse bottles and cans, flatten cardboard,
            keep paper dry, and never mix food waste
            with recyclables.
        </p>
        `
    ],

    programs: [
        "Community Programs",
        `
        <p>
            Join clean-up drives, composting workshops,
            and swap events. Volunteers earn reward points.
        </p>

        <div class="row">
            <button type="button" class="btn ghost" data-close>
                Close
            </button>

            <button type="button" class="btn" id="jn">
                Join a program
            </button>
        </div>
        `
    ],

    pickup: [
        "Request a pickup",
        `
        <form id="f">

            <label for="n">Full name</label>
            <input id="n" type="text" required>

            <label for="a">Address</label>
            <input id="a" type="text" required>

            <label for="w">Waste type</label>

            <select id="w">
                <option>Bulky items</option>
                <option>Recyclables</option>
                <option>Garden waste</option>
                <option>Special waste</option>
            </select>

            <label for="d">Preferred date</label>
            <input id="d" type="date" required>

            <div class="row">
                <button
                    type="button"
                    class="btn ghost"
                    data-close>
                    Cancel
                </button>

                <button
                    type="submit"
                    class="btn">
                    Submit request
                </button>
            </div>

        </form>
        `
    ]
};

const dlg = document.getElementById("dlg");
const dt = document.getElementById("dt");
const db = document.getElementById("db");

function show(title, html) {

    if (!dlg || !dt || !db) {
        console.error(
            "Dialog elements are missing. Check #dlg, #dt and #db."
        );
        return;
    }

    dt.textContent = title;
    db.innerHTML = html;

    if (!dlg.open) {
        dlg.showModal();
    }
}


let user = null;

function esc(value) {
    return String(value).replace(
        /[<>&"']/g,
        character =>
            "&#" + character.charCodeAt(0) + ";"
    );
}

function refresh() {

    const who = document.getElementById("who");
    const authButtons =
        document.querySelector(".auth-buttons");

    if (user) {

        if (who) {
            who.hidden = false;

            who.innerHTML = `
                Hi, ${esc(user.name)}
                ·
                <a href="#" data-logout>Log out</a>
            `;
        }

        if (authButtons) {
            authButtons.style.display = "none";
        }

    } else {

        if (who) {
            who.hidden = true;
            who.innerHTML = "";
        }

        if (authButtons) {
            authButtons.style.display = "";
        }
    }
}

function auth(tab = "login") {

    const isLogin = tab === "login";

    const loginForm = `
        <form id="lf" class="auth-form">

            <div class="auth-field">
                <label for="le">Email</label>

                <input
                    id="le"
                    type="email"
                    placeholder="Enter your email"
                    required
                    autocomplete="email">
            </div>

            <div class="auth-field">
                <label for="lp">Password</label>

                <input
                    id="lp"
                    type="password"
                    placeholder="Enter your password"
                    required
                    autocomplete="current-password">
            </div>

            <p
                id="er"
                class="auth-error"
                role="alert">
            </p>

            <button
                class="btn auth-submit"
                type="submit">
                Log in
            </button>

            <p class="auth-switch">
                Don't have an account?
                <a href="#" data-tab="signup">
                    Register
                </a>
            </p>

        </form>
    `;


const registerForm = `
        <form id="sf" class="auth-form">

            <div class="auth-field">
                <label for="sn">Full Name</label>

                <input
                    id="sn"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    autocomplete="name">
            </div>

            <div class="auth-field">
                <label for="se">Email</label>

                <input
                    id="se"
                    type="email"
                    placeholder="Enter your email"
                    required
                    autocomplete="email">
            </div>

            <div class="auth-field">
                <label for="sp">Password</label>

                <input
                    id="sp"
                    type="password"
                    placeholder="Create a password"
                    minlength="6"
                    required
                    autocomplete="new-password">
            </div>

            <div class="auth-field">
                <label for="sc">Confirm Password</label>

                <input
                    id="sc"
                    type="password"
                    placeholder="Confirm your password"
                    minlength="6"
                    required
                    autocomplete="new-password">
            </div>

            <p
                id="er"
                class="auth-error"
                role="alert">
            </p>

            <button
                class="btn auth-submit"
                type="submit">
                Create Account
            </button>

            <p class="auth-switch">
                Already have an account?
                <a href="#" data-tab="login">
                    Log in
                </a>
            </p>

        </form>
    `;


    show(
        isLogin
            ? "Welcome Back"
            : "Create Account",

        isLogin
            ? loginForm
            : registerForm
    );
}

function signIn(account) {

    user = {
        id: account.id,
        name: account.name,
        email: account.email
    };

    refresh();

    show(
        "Login successful",
        `
        <p>
            Welcome, ${esc(user.name)}!
            You are now logged in.
        </p>

        <div class="row">
            <button
                type="button"
                class="btn"
                data-close>
                Continue
            </button>
        </div>
        `
    );
}


function go(key) {

    if (
        (key === "start" || key === "pickup") &&
        !user
    ) {
        auth("login");
        return;
    }

    if (key === "start") {
        key = "pickup";
    }

    if (!D[key]) {
        return;
    }

    const [title, html] = D[key];

    show(title, html);

    if (key === "pickup" && user) {

        const nameInput =
            document.getElementById("n");

        if (nameInput) {
            nameInput.value = user.name;
        }
    }
}

document.addEventListener("click", event => {

    // LOGIN / REGISTER BUTTON
    const authButton =
        event.target.closest("[data-auth-open]");

    if (authButton) {

        auth(authButton.dataset.authOpen);
        return;
    }

    const tabButton =
        event.target.closest("[data-tab]");

    if (tabButton) {

        event.preventDefault();

        auth(tabButton.dataset.tab);
        return;
    }


const logoutButton =
        event.target.closest("[data-logout]");

    if (logoutButton) {

        event.preventDefault();

        window.location.assign("logout.php");
        return;

        show(
            "Logged out",
            `
            <p>
                You have been logged out successfully.
            </p>

            <div class="row">
                <button
                    type="button"
                    class="btn"
                    data-close>
                    Close
                </button>
            </div>
            `
        );

        return;
    }

const openButton =
        event.target.closest("[data-open]");

    if (openButton) {

        go(openButton.dataset.open);
        return;
    }

    if (event.target.closest("[data-close]")) {

        if (dlg && dlg.open) {
            dlg.close();
        }

        return;
    }


    if (event.target === dlg) {

        if (dlg.open) {
            dlg.close();
        }

        return;
    }

    if (event.target.id === "chk") {

        const area =
            document.getElementById("ar");

        const result =
            document.getElementById("sr");

        if (!area || !result) {
            return;
        }

        const selectedZone = area.value;
        result.textContent = "Checking schedule...";

        fetch(`http://127.0.0.1:5000/api/schedules/zones`)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data && json.data[selectedZone]) {
                    const z = json.data[selectedZone];
                    result.innerHTML = `<strong>${esc(selectedZone)} Collection:</strong> General Waste on <b>${esc(z.schedule)}</b>, Recyclables on <b>${esc(z.recyclables)}</b>.`;
                } else {
                    throw new Error();
                }
            })
            .catch(() => {
                const schedules = {
                    "Zone 1": "Mon & Thu",
                    "Zone 2": "Tue & Fri",
                    "Zone 3": "Wed & Sat"
                };
                result.textContent =
                    selectedZone +
                    " collection: " +
                    (schedules[selectedZone] || "Regular weekly pickup") +
                    " (General Waste).";
            });

        return;
    }

    if (event.target.id === "jn") {

        show(
            "Thank you!",
            `
            <p>
                Your interest is noted.
                The community office will contact you
                with upcoming program dates.
            </p>

            <div class="row">
                <button
                    type="button"
                    class="btn"
                    data-close>
                    Close
                </button>
            </div>
            `
        );

        return;
    }

    const bin =
        event.target.closest(".bin");

    if (bin) {

        document
            .querySelectorAll(".bin")
            .forEach(item =>
                item.classList.remove("on")
            );

        bin.classList.add("on");

        show(
            "Bin guide",
            `
            <p>
                ${esc(bin.dataset.bin || "")}
            </p>

            <div class="row">
                <button
                    type="button"
                    class="btn"
                    data-close>
                    Got it
                </button>
            </div>
            `
        );
    }
});

document.addEventListener("keydown", event => {

    if (
        (event.key === "Enter" ||
         event.key === " ") &&
        event.target.classList.contains("bin")
    ) {

        event.preventDefault();
        event.target.click();
    }
});


document.addEventListener(
    "submit",
    async event => {

        const formId = event.target.id;


        if (formId === "f") {

            event.preventDefault();

            const nameInput =
                document.getElementById("n");

            if (!nameInput) {
                return;
            }

            const cleanName =
                esc(nameInput.value.trim());

            show(
                "Request received",
                `
                <p>
                    Thank you, ${cleanName}.
                    Your pickup request has been recorded.
                </p>

                <div class="row">
                    <button
                        type="button"
                        class="btn"
                        data-close>
                        Close
                    </button>
                </div>
                `
            );

            return;
        }


        if (
            formId !== "lf" &&
            formId !== "sf"
        ) {
            return;
        }


        event.preventDefault();

        const errorMessage =
            document.getElementById("er");

        if (!errorMessage) {
            return;
        }

        errorMessage.textContent = "";


        if (formId === "lf") {

            const email =
                document
                    .getElementById("le")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("lp")
                    .value;


            try {

                const response =
                    await fetch("login.php", {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    });


                const result =
                    await response.json();


                if (!result.success) {

                    errorMessage.textContent =
                        result.message;

                    return;
                }


                window.location.assign(result.redirect || "dashboard.php");


            } catch (error) {

                console.error(error);

                errorMessage.textContent =
                    "Unable to connect to the server.";
            }

            return;
        }

        const name =
            document
                .getElementById("sn")
                .value
                .trim();

        const email =
            document
                .getElementById("se")
                .value
                .trim()
                .toLowerCase();

        const password =
            document
                .getElementById("sp")
                .value;

        const confirmPassword =
            document
                .getElementById("sc")
                .value;


        if (name.length < 2) {

            errorMessage.textContent =
                "Please enter your full name.";

            return;
        }


        if (password.length < 6) {

            errorMessage.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        if (password !== confirmPassword) {

            errorMessage.textContent =
                "Passwords do not match.";

            return;
        }


        try {

const response =
                await fetch("register.php", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        full_name: name,
                        email: email,
                        password: password,

                        confirm_password:
                            confirmPassword
                    })
                });


            const result =
                await response.json();


            if (!result.success) {

                errorMessage.textContent =
                    result.message;

                return;
            }


            show(
                "Registration Successful",
                `
                <p>
                    Your account has been created successfully.
                    You can now log in using your email and password.
                </p>

                <div class="row">
                    <button
                        type="button"
                        class="btn"
                        data-tab="login">
                        Log in
                    </button>
                </div>
                `
            );


        } catch (error) {

            console.error(error);

            errorMessage.textContent =
                "Unable to connect to the server.";
        }
    }
);

refresh();