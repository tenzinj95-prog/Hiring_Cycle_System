/* =========================================================
   SCE CYCLE HIRE
   ADMIN JAVASCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxVfN7Xv_-yk6sGJVazdGVUsV363MikbChwvsD8JtfxEMTqy2A4A615Q2M21nkc_gC49g/exec";

const HOURLY_RATE = 100;

/* =========================================================
   GLOBAL DATA
========================================================= */

let bookings = [];
let rentalSlots = [];

let currentPage = "dashboardPage";
let adminPassword = "";

let slotFilterDate = "";
let bookingFilterDate = "";
let bookingFilterStatus = "";
let bookingSearchText = "";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginScreen = document.getElementById("loginScreen");
const adminApp = document.getElementById("adminApp");

const loginForm = document.getElementById("loginForm");
const adminPasswordInput = document.getElementById("adminPassword");

const navItems = document.querySelectorAll(".nav-item");

const pageTitle = document.getElementById("pageTitle");

const refreshButton = document.getElementById("refreshButton");

const totalBookings = document.getElementById("totalBookings");
const todayBookings = document.getElementById("todayBookings");
const ongoingBookings = document.getElementById("ongoingBookings");
const totalEarnings = document.getElementById("totalEarnings");

const adminCycleStatus = document.getElementById("adminCycleStatus");
const cycleStatusText = document.getElementById("cycleStatusText");

const recentBookingTable = document.getElementById("recentBookingTable");

const slotForm = document.getElementById("slotForm");
const slotDate = document.getElementById("slotDate");
const slotStartTime = document.getElementById("slotStartTime");
const slotEndTime = document.getElementById("slotEndTime");
const slotPreview = document.getElementById("slotPreview");
const addSlotButton = document.getElementById("addSlotButton");

const slotDateFilter = document.getElementById("slotDateFilter");
const clearSlotFilter = document.getElementById("clearSlotFilter");
const slotTable = document.getElementById("slotTable");

const bookingSearch = document.getElementById("bookingSearch");
const bookingDateFilter = document.getElementById("bookingDateFilter");
const bookingStatusFilter = document.getElementById("bookingStatusFilter");
const clearBookingFilters = document.getElementById("clearBookingFilters");
const bookingCount = document.getElementById("bookingCount");
const refreshBookingsButton = document.getElementById("refreshBookingsButton");
const bookingTable = document.getElementById("bookingTable");

const toast = document.getElementById("toast");
const toastIcon = document.getElementById("toastIcon");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");
const toastClose = document.getElementById("toastClose");

const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");


/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles = {
    dashboardPage: "Dashboard",
    slotsPage: "Rental Slots",
    bookingsPage: "Bookings"
};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    setTodayDate();

    setupNavigation();
    setupLogin();
    setupSlotForm();
    setupBookingFilters();
    setupRefreshButtons();
    setupQuickActions();
    setupToast();

    const savedPassword = sessionStorage.getItem("sceCycleHireAdminPassword");

    if (savedPassword) {
        adminPassword = savedPassword;
        showAdminApp();
    } else {
        showLogin();
    }
});


/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const password = adminPasswordInput.value.trim();

        if (!password) {
            showToast(
                "warning",
                "Password Required",
                "Please enter the admin password."
            );
            return;
        }

        adminPassword = password;

        showLoading("Checking login...");

        try {

            const result = await apiGet(
                "stats",
                {
                    password: adminPassword
                }
            );

            if (!result.success) {
                throw new Error(result.message || "Invalid password.");
            }

            sessionStorage.setItem(
                "sceCycleHireAdminPassword",
                adminPassword
            );

            hideLoading();

            showAdminApp();

            showToast(
                "success",
                "Login Successful",
                "Welcome to SCE Cycle Hire Admin."
            );

        } catch (error) {

            hideLoading();

            adminPassword = "";

            showToast(
                "error",
                "Login Failed",
                error.message || "Unable to login."
            );
        }
    });
}


function showLogin() {

    if (loginScreen) {
        loginScreen.classList.remove("hidden");
    }

    if (adminApp) {
        adminApp.classList.add("hidden");
    }
}


function showAdminApp() {

    if (loginScreen) {
        loginScreen.classList.add("hidden");
    }

    if (adminApp) {
        adminApp.classList.remove("hidden");
    }

    showPage("dashboardPage");

    loadAllData();
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    sessionStorage.removeItem("sceCycleHireAdminPassword");

    adminPassword = "";

    bookings = [];
    rentalSlots = [];

    showLogin();

    if (adminPasswordInput) {
        adminPasswordInput.value = "";
    }

    showToast(
        "success",
        "Logged Out",
        "You have been logged out successfully."
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    navItems.forEach(function (item) {

        item.addEventListener("click", function (event) {

            event.preventDefault();

            const page = item.dataset.page;

            if (!page) {
                return;
            }

            if (page === "logout") {
                logout();
                return;
            }

            showPage(page);
        });
    });
}


function showPage(pageId) {

    const pages = document.querySelectorAll(".admin-page");

    pages.forEach(function (page) {
        page.classList.remove("active-page");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    navItems.forEach(function (item) {

        item.classList.remove("active");

        if (item.dataset.page === pageId) {
            item.classList.add("active");
        }
    });

    currentPage = pageId;

    if (pageTitle) {
        pageTitle.textContent =
            pageTitles[pageId] || "SCE Cycle Hire";
    }

    if (pageId === "dashboardPage") {
        loadDashboard();
    }

    if (pageId === "slotsPage") {
        loadSlots();
    }

    if (pageId === "bookingsPage") {
        loadBookings();
    }
}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    const quickButtons = document.querySelectorAll(
        "[data-action]"
    );

    quickButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const action = button.dataset.action;

            if (action === "add-slot") {
                showPage("slotsPage");

                setTimeout(function () {

                    if (slotDate) {
                        slotDate.focus();
                    }

                }, 100);

                return;
            }

            if (action === "view-bookings") {
                showPage("bookingsPage");
                return;
            }

            if (action === "refresh") {
                loadAllData();
            }
        });
    });
}


/* =========================================================
   REFRESH BUTTONS
========================================================= */

function setupRefreshButtons() {

    if (refreshButton) {

        refreshButton.addEventListener("click", function () {
            loadAllData();
        });
    }

    if (refreshBookingsButton) {

        refreshBookingsButton.addEventListener("click", function () {
            loadBookings();
        });
    }
}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadAllData() {

    showLoading("Loading admin data...");

    try {

        await Promise.all([
            fetchBookings(),
            fetchSlots()
        ]);

        renderDashboard();
        renderBookings();
        renderSlots();

        hideLoading();

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Loading Failed",
            error.message || "Unable to load admin data."
        );
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        if (bookings.length === 0) {
            await fetchBookings();
        }

        renderDashboard();

    } catch (error) {

        showToast(
            "error",
            "Dashboard Error",
            error.message || "Unable to load dashboard."
        );
    }
}


function renderDashboard() {

    const today = getTodayString();

    const total = bookings.length;

    const todayCount = bookings.filter(function (booking) {
        return normalizeDate(booking.hireDate) === today;
    }).length;

    const ongoing = bookings.filter(function (booking) {
        return normalizeStatus(booking.status) === "Ongoing";
    }).length;

    const earnings = bookings
        .filter(function (booking) {
            return normalizeStatus(booking.status) !== "Rejected";
        })
        .reduce(function (sum, booking) {

            return sum + Number(booking.total || 0);

        }, 0);

    setText(totalBookings, total);
    setText(todayBookings, todayCount);
    setText(ongoingBookings, ongoing);

    setText(
        totalEarnings,
        "Nu. " + formatMoney(earnings)
    );

    updateCycleStatus();

    renderRecentBookings();
}


function renderRecentBookings() {

    if (!recentBookingTable) {
        return;
    }

    if (bookings.length === 0) {

        recentBookingTable.innerHTML =
            `<tr>
                <td colspan="7" class="empty-table">
                    No bookings found.
                </td>
            </tr>`;

        return;
    }

    const recent = [...bookings]
        .sort(function (a, b) {
            return getTimestamp(b) - getTimestamp(a);
        })
        .slice(0, 8);

    recentBookingTable.innerHTML = recent.map(function (booking) {

        return createBookingRow(booking, true);

    }).join("");
}


/* =========================================================
   CYCLE STATUS
========================================================= */

function updateCycleStatus() {

    const today = getTodayString();

    const activeToday = bookings.filter(function (booking) {

        const date = normalizeDate(booking.hireDate);
        const status = normalizeStatus(booking.status);

        return (
            date === today &&
            (
                status === "Approved" ||
                status === "Ongoing"
            )
        );

    }).length;

    if (!adminCycleStatus || !cycleStatusText) {
        return;
    }

    if (activeToday > 0) {

        adminCycleStatus.className =
            "status-pill available";

        cycleStatusText.textContent =
            activeToday + " active booking" +
            (activeToday === 1 ? "" : "s") +
            " today";

    } else {

        adminCycleStatus.className =
            "status-pill";

        cycleStatusText.textContent =
            "No active bookings today";
    }
}


/* =========================================================
   FETCH BOOKINGS
========================================================= */

async function fetchBookings() {

    const result = await apiGet(
        "bookings",
        {
            password: adminPassword
        }
    );

    if (!result.success) {
        throw new Error(
            result.message || "Unable to load bookings."
        );
    }

    bookings = Array.isArray(result.bookings)
        ? result.bookings
        : [];

    return bookings;
}


async function loadBookings() {

    showLoading("Loading bookings...");

    try {

        await fetchBookings();

        renderBookings();
        renderDashboard();

        hideLoading();

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Bookings Error",
            error.message || "Unable to load bookings."
        );
    }
}


/* =========================================================
   RENDER BOOKINGS
========================================================= */

function renderBookings() {

    if (!bookingTable) {
        return;
    }

    let filtered = [...bookings];

    if (bookingSearchText) {

        const search = bookingSearchText.toLowerCase();

        filtered = filtered.filter(function (booking) {

            return (
                safeString(booking.bookingId).toLowerCase().includes(search) ||
                safeString(booking.studentName).toLowerCase().includes(search) ||
                safeString(booking.phone).toLowerCase().includes(search) ||
                safeString(booking.programme).toLowerCase().includes(search)
            );
        });
    }

    if (bookingFilterDate) {

        filtered = filtered.filter(function (booking) {

            return normalizeDate(booking.hireDate) ===
                bookingFilterDate;
        });
    }

    if (bookingFilterStatus) {

        filtered = filtered.filter(function (booking) {

            return normalizeStatus(booking.status) ===
                bookingFilterStatus;
        });
    }

    filtered.sort(function (a, b) {

        return getTimestamp(b) - getTimestamp(a);

    });

    if (bookingCount) {

        bookingCount.textContent =
            filtered.length +
            (filtered.length === 1 ? " booking" : " bookings");
    }

    if (filtered.length === 0) {

        bookingTable.innerHTML =
            `<tr>
                <td colspan="9" class="empty-table">
                    No bookings match your filters.
                </td>
            </tr>`;

        return;
    }

    bookingTable.innerHTML = filtered.map(function (booking) {

        return createBookingRow(booking, false);

    }).join("");
}


/* =========================================================
   CREATE BOOKING ROW
========================================================= */

function createBookingRow(booking, dashboardMode) {

    const status = normalizeStatus(booking.status);

    const bookingId =
        safeString(
            booking.bookingId ||
            booking.id ||
            "-"
        );

    const studentName =
        safeString(
            booking.studentName ||
            booking.name ||
            "-"
        );

    const programme =
        safeString(
            booking.programme ||
            "-"
        );

    const phone =
        safeString(
            booking.phone ||
            "-"
        );

    const date =
        formatDate(
            booking.hireDate
        );

    const startTime =
        formatTime(
            booking.startTime ||
            booking.start
        );

    const endTime =
        formatTime(
            booking.endTime ||
            booking.end
        );

    const duration =
        Number(
            booking.duration ||
            calculateDuration(
                booking.startTime,
                booking.endTime
            )
        );

    const amount =
        Number(
            booking.total ||
            booking.amount ||
            duration * HOURLY_RATE
        );

    let actionButtons = "";

    if (!dashboardMode) {

        actionButtons =
            createBookingActions(booking);
    }

    if (dashboardMode) {

        return `
            <tr>
                <td>
                    <span class="booking-id">
                        ${escapeHtml(bookingId)}
                    </span>
                </td>

                <td>
                    <span class="student-name">
                        ${escapeHtml(studentName)}
                    </span>
                </td>

                <td>
                    ${escapeHtml(date)}
                </td>

                <td>
                    ${escapeHtml(startTime)} -
                    ${escapeHtml(endTime)}
                </td>

                <td>
                    <span class="amount-text">
                        Nu. ${formatMoney(amount)}
                    </span>
                </td>

                <td>
                    ${createStatusBadge(status)}
                </td>

                <td>
                    <button
                        class="small-button"
                        onclick="openBookingDetails('${escapeJs(bookingId)}')"
                    >
                        View
                    </button>
                </td>
            </tr>
        `;
    }

    return `
        <tr>

            <td>
                <span class="booking-id">
                    ${escapeHtml(bookingId)}
                </span>
            </td>

            <td>
                <span class="student-name">
                    ${escapeHtml(studentName)}
                </span>

                <small>
                    ${escapeHtml(phone)}
                </small>
            </td>

            <td>
                <span class="programme-text">
                    ${escapeHtml(programme)}
                </span>
            </td>

            <td>
                ${escapeHtml(date)}
            </td>

            <td>
                ${escapeHtml(startTime)} -
                ${escapeHtml(endTime)}

                <div class="duration-text">
                    ${duration} hour${duration === 1 ? "" : "s"}
                </div>
            </td>

            <td>
                <span class="amount-text">
                    Nu. ${formatMoney(amount)}
                </span>
            </td>

            <td>
                ${createStatusBadge(status)}
            </td>

            <td>
                <div class="action-buttons">
                    ${actionButtons}
                </div>
            </td>

        </tr>
    `;
}


/* =========================================================
   BOOKING ACTION BUTTONS
========================================================= */

function createBookingActions(booking) {

    const status = normalizeStatus(booking.status);

    const bookingId =
        escapeJs(
            booking.bookingId ||
            booking.id ||
            ""
        );

    let buttons = "";

    if (status === "Pending") {

        buttons += `
            <button
                class="action-button approve"
                onclick="updateBookingStatus('${bookingId}', 'Approved')"
            >
                Approve
            </button>

            <button
                class="action-button reject"
                onclick="updateBookingStatus('${bookingId}', 'Rejected')"
            >
                Reject
            </button>
        `;
    }

    else if (status === "Approved") {

        buttons += `
            <button
                class="action-button ongoing"
                onclick="updateBookingStatus('${bookingId}', 'Ongoing')"
            >
                Start
            </button>

            <button
                class="action-button cancel"
                onclick="updateBookingStatus('${bookingId}', 'Cancelled')"
            >
                Cancel
            </button>
        `;
    }

    else if (status === "Ongoing") {

        buttons += `
            <button
                class="action-button returned"
                onclick="updateBookingStatus('${bookingId}', 'Returned')"
            >
                Returned
            </button>
        `;
    }

    else if (status === "Returned") {

        buttons += `
            <span class="text-muted">
                Completed
            </span>
        `;
    }

    else if (status === "Rejected") {

        buttons += `
            <span class="text-muted">
                Rejected
            </span>
        `;
    }

    else if (status === "Cancelled") {

        buttons += `
            <span class="text-muted">
                Cancelled
            </span>
        `;
    }

    return buttons;
}


/* =========================================================
   UPDATE BOOKING STATUS
========================================================= */

async function updateBookingStatus(bookingId, newStatus) {

    if (!bookingId) {
        return;
    }

    const messages = {
        Approved: "Approve this booking?",
        Rejected: "Reject this booking?",
        Ongoing: "Start this rental?",
        Returned: "Mark this cycle as returned?",
        Cancelled: "Cancel this booking?"
    };

    const question =
        messages[newStatus] ||
        "Update this booking?";

    if (!window.confirm(question)) {
        return;
    }

    showLoading(
        "Updating booking..."
    );

    try {

        const result = await apiPost(
            "update_status",
            {
                password: adminPassword,
                bookingId: bookingId,
                status: newStatus
            }
        );

        if (!result.success) {
            throw new Error(
                result.message ||
                "Unable to update booking."
            );
        }

        await fetchBookings();

        renderBookings();
        renderDashboard();

        hideLoading();

        showToast(
            "success",
            "Booking Updated",
            "Booking " +
            bookingId +
            " is now " +
            newStatus +
            "."
        );

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Update Failed",
            error.message ||
            "Unable to update booking."
        );
    }
}


/* =========================================================
   BOOKING FILTERS
========================================================= */

function setupBookingFilters() {

    if (bookingSearch) {

        bookingSearch.addEventListener(
            "input",
            function () {

                bookingSearchText =
                    bookingSearch.value.trim();

                renderBookings();
            }
        );
    }

    if (bookingDateFilter) {

        bookingDateFilter.addEventListener(
            "change",
            function () {

                bookingFilterDate =
                    bookingDateFilter.value;

                renderBookings();
            }
        );
    }

    if (bookingStatusFilter) {

        bookingStatusFilter.addEventListener(
            "change",
            function () {

                bookingFilterStatus =
                    bookingStatusFilter.value;

                renderBookings();
            }
        );
    }

    if (clearBookingFilters) {

        clearBookingFilters.addEventListener(
            "click",
            function () {

                bookingSearchText = "";
                bookingFilterDate = "";
                bookingFilterStatus = "";

                if (bookingSearch) {
                    bookingSearch.value = "";
                }

                if (bookingDateFilter) {
                    bookingDateFilter.value = "";
                }

                if (bookingStatusFilter) {
                    bookingStatusFilter.value = "";
                }

                renderBookings();
            }
        );
    }
}


/* =========================================================
   RENTAL SLOTS
========================================================= */

async function fetchSlots() {

    const result = await apiGet(
        "adminSlots",
        {
            password: adminPassword
        }
    );

    if (!result.success) {
        throw new Error(
            result.message ||
            "Unable to load rental slots."
        );
    }

    rentalSlots = Array.isArray(result.slots)
        ? result.slots
        : [];

    return rentalSlots;
}


async function loadSlots() {

    showLoading("Loading rental slots...");

    try {

        await fetchSlots();

        renderSlots();

        hideLoading();

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Slots Error",
            error.message ||
            "Unable to load rental slots."
        );
    }
}


/* =========================================================
   SLOT FORM
========================================================= */

function setupSlotForm() {

    if (slotForm) {

        slotForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await addRentalSlot();
            }
        );
    }

    if (slotStartTime) {

        slotStartTime.addEventListener(
            "change",
            updateSlotPreview
        );
    }

    if (slotEndTime) {

        slotEndTime.addEventListener(
            "change",
            updateSlotPreview
        );
    }

    if (slotDate) {

        slotDate.addEventListener(
            "change",
            updateSlotPreview
        );
    }

    if (slotDateFilter) {

        slotDateFilter.addEventListener(
            "change",
            function () {

                slotFilterDate =
                    slotDateFilter.value;

                renderSlots();
            }
        );
    }

    if (clearSlotFilter) {

        clearSlotFilter.addEventListener(
            "click",
            function () {

                slotFilterDate = "";

                if (slotDateFilter) {
                    slotDateFilter.value = "";
                }

                renderSlots();
            }
        );
    }
}


function updateSlotPreview() {

    if (!slotPreview) {
        return;
    }

    const start =
        slotStartTime ?
        slotStartTime.value :
        "";

    const end =
        slotEndTime ?
        slotEndTime.value :
        "";

    if (!start || !end) {

        slotPreview.textContent =
            "Select start and end time.";

        return;
    }

    const duration =
        calculateDuration(
            start,
            end
        );

    if (duration <= 0) {

        slotPreview.textContent =
            "End time must be after start time.";

        return;
    }

    slotPreview.textContent =
        formatTime(start) +
        " - " +
        formatTime(end) +
        " • " +
        duration +
        " hour" +
        (duration === 1 ? "" : "s") +
        " • Nu. " +
        formatMoney(duration * HOURLY_RATE);
}


/* =========================================================
   ADD RENTAL SLOT
========================================================= */

async function addRentalSlot() {

    const date =
        slotDate ?
        slotDate.value :
        "";

    const startTime =
        slotStartTime ?
        slotStartTime.value :
        "";

    const endTime =
        slotEndTime ?
        slotEndTime.value :
        "";

    if (!date) {

        showToast(
            "warning",
            "Date Required",
            "Please select a rental date."
        );

        return;
    }

    if (!startTime || !endTime) {

        showToast(
            "warning",
            "Time Required",
            "Please select start and end time."
        );

        return;
    }

    const duration =
        calculateDuration(
            startTime,
            endTime
        );

    if (duration <= 0) {

        showToast(
            "warning",
            "Invalid Time",
            "End time must be after start time."
        );

        return;
    }

    showLoading("Adding rental slot...");

    try {

        const result = await apiPost(
            "addSlot",
            {
                password: adminPassword,
                date: date,
                startTime: startTime,
                endTime: endTime
            }
        );

        if (!result.success) {
            throw new Error(
                result.message ||
                "Unable to add slot."
            );
        }

        await fetchSlots();

        renderSlots();

        if (slotForm) {
            slotForm.reset();
        }

        if (slotPreview) {
            slotPreview.textContent =
                "Select start and end time.";
        }

        hideLoading();

        showToast(
            "success",
            "Slot Added",
            "Rental slot added successfully."
        );

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Slot Error",
            error.message ||
            "Unable to add rental slot."
        );
    }
}


/* =========================================================
   RENDER SLOTS
========================================================= */

function renderSlots() {

    if (!slotTable) {
        return;
    }

    let filtered = [...rentalSlots];

    if (slotFilterDate) {

        filtered = filtered.filter(function (slot) {

            return normalizeDate(
                slot.date
            ) === slotFilterDate;
        });
    }

    filtered.sort(function (a, b) {

        const dateA =
            safeString(a.date) +
            safeString(a.startTime);

        const dateB =
            safeString(b.date) +
            safeString(b.startTime);

        return dateA.localeCompare(dateB);
    });

    if (filtered.length === 0) {

        slotTable.innerHTML =
            `<tr>
                <td colspan="6" class="empty-table">
                    No rental slots found.
                </td>
            </tr>`;

        return;
    }

    slotTable.innerHTML = filtered.map(
        function (slot) {

            return createSlotRow(slot);

        }
    ).join("");
}


/* =========================================================
   CREATE SLOT ROW
========================================================= */

function createSlotRow(slot) {

    const slotId =
        safeString(
            slot.slotId ||
            slot.id ||
            ""
        );

    const date =
        formatDate(
            slot.date
        );

    const start =
        formatTime(
            slot.startTime
        );

    const end =
        formatTime(
            slot.endTime
        );

    const duration =
        Number(
            slot.duration ||
            calculateDuration(
                slot.startTime,
                slot.endTime
            )
        );

    const amount =
        duration * HOURLY_RATE;

    const enabled =
        isSlotEnabled(slot);

    const booked =
        isSlotBooked(slot);

    let statusHtml = "";

    if (!enabled) {

        statusHtml =
            `<span class="slot-status disabled">
                Disabled
            </span>`;

    } else if (booked) {

        statusHtml =
            `<span class="slot-status booked">
                Booked
            </span>`;

    } else {

        statusHtml =
            `<span class="slot-status available">
                Available
            </span>`;
    }

    let actionHtml = "";

    if (booked) {

        actionHtml =
            `<span class="text-muted">
                Booking active
            </span>`;

    } else if (enabled) {

        actionHtml =
            `
            <div class="action-buttons">

                <button
                    class="action-button disable"
                    onclick="toggleSlot('${escapeJs(slotId)}', false)"
                >
                    Disable
                </button>

                <button
                    class="action-button delete"
                    onclick="deleteRentalSlot('${escapeJs(slotId)}')"
                >
                    Delete
                </button>

            </div>
            `;

    } else {

        actionHtml =
            `
            <div class="action-buttons">

                <button
                    class="action-button enable"
                    onclick="toggleSlot('${escapeJs(slotId)}', true)"
                >
                    Enable
                </button>

                <button
                    class="action-button delete"
                    onclick="deleteRentalSlot('${escapeJs(slotId)}')"
                >
                    Delete
                </button>

            </div>
            `;
    }

    return `
        <tr>

            <td>
                <span class="booking-id">
                    ${escapeHtml(slotId)}
                </span>
            </td>

            <td>
                ${escapeHtml(date)}
            </td>

            <td>
                ${escapeHtml(start)}
                -
                ${escapeHtml(end)}
            </td>

            <td>
                <span class="duration-text">
                    ${duration}
                    hour${duration === 1 ? "" : "s"}
                </span>
            </td>

            <td>
                <span class="amount-text">
                    Nu. ${formatMoney(amount)}
                </span>
            </td>

            <td>
                ${statusHtml}
            </td>

            <td>
                ${actionHtml}
            </td>

        </tr>
    `;
}


/* =========================================================
   ENABLE / DISABLE SLOT
========================================================= */

async function toggleSlot(slotId, enabled) {

    if (!slotId) {
        return;
    }

    const actionText =
        enabled ?
        "enable" :
        "disable";

    if (!window.confirm(
        "Are you sure you want to " +
        actionText +
        " this rental slot?"
    )) {
        return;
    }

    showLoading(
        enabled ?
        "Enabling slot..." :
        "Disabling slot..."
    );

    try {

        const result = await apiPost(
            "updateSlot",
            {
                password: adminPassword,
                slotId: slotId,
                enabled: enabled
            }
        );

        if (!result.success) {
            throw new Error(
                result.message ||
                "Unable to update slot."
            );
        }

        await fetchSlots();

        renderSlots();

        hideLoading();

        showToast(
            "success",
            "Slot Updated",
            "Rental slot " +
            (enabled ? "enabled" : "disabled") +
            " successfully."
        );

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Slot Error",
            error.message ||
            "Unable to update slot."
        );
    }
}


/* =========================================================
   DELETE SLOT
========================================================= */

async function deleteRentalSlot(slotId) {

    if (!slotId) {
        return;
    }

    if (!window.confirm(
        "Delete this rental slot?\n\n" +
        "This action cannot be undone."
    )) {
        return;
    }

    showLoading("Deleting slot...");

    try {

        const result = await apiPost(
            "deleteSlot",
            {
                password: adminPassword,
                slotId: slotId
            }
        );

        if (!result.success) {
            throw new Error(
                result.message ||
                "Unable to delete slot."
            );
        }

        await fetchSlots();

        renderSlots();

        hideLoading();

        showToast(
            "success",
            "Slot Deleted",
            "Rental slot deleted successfully."
        );

    } catch (error) {

        hideLoading();

        showToast(
            "error",
            "Delete Failed",
            error.message ||
            "Unable to delete slot."
        );
    }
}


/* =========================================================
   BOOKING DETAILS
========================================================= */

function openBookingDetails(bookingId) {

    const booking =
        bookings.find(function (item) {

            return safeString(
                item.bookingId ||
                item.id
            ) === bookingId;

        });

    if (!booking) {

        showToast(
            "error",
            "Not Found",
            "Booking could not be found."
        );

        return;
    }

    const student =
        booking.studentName ||
        booking.name ||
        "-";

    const programme =
        booking.programme ||
        "-";

    const phone =
        booking.phone ||
        "-";

    const date =
        formatDate(
            booking.hireDate
        );

    const start =
        formatTime(
            booking.startTime
        );

    const end =
        formatTime(
            booking.endTime
        );

    const duration =
        booking.duration ||
        calculateDuration(
            booking.startTime,
            booking.endTime
        );

    const total =
        Number(
            booking.total ||
            duration * HOURLY_RATE
        );

    const status =
        normalizeStatus(
            booking.status
        );

    const message =
        "Booking ID: " + bookingId +
        "\n\n" +
        "Student: " + student +
        "\n" +
        "Programme: " + programme +
        "\n" +
        "Phone: " + phone +
        "\n\n" +
        "Date: " + date +
        "\n" +
        "Time: " + start +
        " - " + end +
        "\n" +
        "Duration: " + duration + " hour(s)" +
        "\n" +
        "Amount: Nu. " + formatMoney(total) +
        "\n" +
        "Status: " + status;

    window.alert(message);
}


/* =========================================================
   API GET
========================================================= */

async function apiGet(action, params = {}) {

    const query = new URLSearchParams();

    query.append("action", action);

    Object.keys(params).forEach(function (key) {

        const value = params[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            query.append(
                key,
                String(value)
            );
        }
    });

    const url =
        GOOGLE_SCRIPT_URL +
        "?" +
        query.toString();

    const response =
        await fetch(url, {
            method: "GET"
        });

    if (!response.ok) {

        throw new Error(
            "Server returned error " +
            response.status
        );
    }

    const text =
        await response.text();

    return parseApiResponse(text);
}


/* =========================================================
   API POST
========================================================= */

async function apiPost(action, data = {}) {

    const body =
        new URLSearchParams();

    body.append(
        "action",
        action
    );

    Object.keys(data).forEach(function (key) {

        const value = data[key];

        if (
            value !== undefined &&
            value !== null
        ) {
            body.append(
                key,
                String(value)
            );
        }
    });

    const response =
        await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",
                body: body
            }
        );

    if (!response.ok) {

        throw new Error(
            "Server returned error " +
            response.status
        );
    }

    const text =
        await response.text();

    return parseApiResponse(text);
}


/* =========================================================
   PARSE API RESPONSE
========================================================= */

function parseApiResponse(text) {

    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid server response:",
            text
        );

        throw new Error(
            "The server returned an invalid response."
        );
    }
}


/* =========================================================
   STATUS BADGE
========================================================= */

function createStatusBadge(status) {

    const normalized =
        normalizeStatus(status);

    const className =
        normalized
            .toLowerCase()
            .replace(/\s+/g, "-");

    return `
        <span class="status-badge ${className}">
            ${escapeHtml(normalized)}
        </span>
    `;
}


/* =========================================================
   STATUS NORMALIZATION
========================================================= */

function normalizeStatus(status) {

    const value =
        safeString(status)
            .trim()
            .toLowerCase();

    const statuses = {
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        ongoing: "Ongoing",
        returned: "Returned",
        cancelled: "Cancelled",
        canceled: "Cancelled"
    };

    return statuses[value] || "Pending";
}


/* =========================================================
   SLOT HELPERS
========================================================= */

function isSlotEnabled(slot) {

    if (
        slot.enabled === false ||
        slot.enabled === "false" ||
        slot.enabled === 0 ||
        slot.enabled === "0"
    ) {
        return false;
    }

    return true;
}


function isSlotBooked(slot) {

    if (
        slot.booked === true ||
        slot.booked === "true" ||
        slot.booked === 1 ||
        slot.booked === "1"
    ) {
        return true;
    }

    if (
        slot.available === false ||
        slot.available === "false" ||
        slot.available === 0 ||
        slot.available === "0"
    ) {
        return true;
    }

    const status =
        safeString(slot.status)
            .toLowerCase();

    if (
        status === "booked" ||
        status === "unavailable"
    ) {
        return true;
    }

    return false;
}


/* =========================================================
   DATE / TIME HELPERS
========================================================= */

function calculateDuration(startTime, endTime) {

    const start =
        timeToMinutes(startTime);

    const end =
        timeToMinutes(endTime);

    if (
        start === null ||
        end === null
    ) {
        return 0;
    }

    const minutes =
        end - start;

    if (minutes <= 0) {
        return 0;
    }

    return minutes / 60;
}


function timeToMinutes(time) {

    if (!time) {
        return null;
    }

    const value =
        safeString(time)
            .trim()
            .toUpperCase();

    let match =
        value.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
        );

    if (!match) {
        return null;
    }

    let hour =
        Number(match[1]);

    const minute =
        Number(match[2]);

    const meridiem =
        match[3];

    if (
        minute < 0 ||
        minute > 59
    ) {
        return null;
    }

    if (meridiem) {

        if (
            hour < 1 ||
            hour > 12
        ) {
            return null;
        }

        if (meridiem === "AM") {

            if (hour === 12) {
                hour = 0;
            }

        } else {

            if (hour !== 12) {
                hour += 12;
            }
        }

    } else {

        if (
            hour < 0 ||
            hour > 23
        ) {
            return null;
        }
    }

    return (
        hour * 60 +
        minute
    );
}


function formatTime(time) {

    if (!time) {
        return "-";
    }

    const minutes =
        timeToMinutes(time);

    if (minutes === null) {

        return safeString(time);
    }

    let hour =
        Math.floor(minutes / 60);

    const minute =
        minutes % 60;

    const suffix =
        hour >= 12 ?
        "PM" :
        "AM";

    hour =
        hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0") +
        " " +
        suffix
    );
}


/* =========================================================
   DATE FORMATTING
========================================================= */

function normalizeDate(value) {

    if (!value) {
        return "";
    }

    const text =
        safeString(value).trim();

    const directMatch =
        text.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})/
        );

    if (directMatch) {

        return (
            directMatch[1] +
            "-" +
            String(
                Number(directMatch[2])
            ).padStart(2, "0") +
            "-" +
            String(
                Number(directMatch[3])
            ).padStart(2, "0")
        );
    }

    const date =
        new Date(value);

    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return (
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                date.getDate()
            ).padStart(2, "0")
        );
    }

    return text;
}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    const normalized =
        normalizeDate(value);

    const parts =
        normalized.split("-");

    if (parts.length !== 3) {

        return safeString(value);
    }

    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return safeString(value);
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function getTodayString() {

    const now =
        new Date();

    return (
        now.getFullYear() +
        "-" +
        String(
            now.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            now.getDate()
        ).padStart(2, "0")
    );
}


function setTodayDate() {

    const today =
        getTodayString();

    if (slotDate) {
        slotDate.min = today;
    }

    if (slotDateFilter) {
        slotDateFilter.value = "";
    }

    if (bookingDateFilter) {
        bookingDateFilter.value = "";
    }
}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTimestamp(booking) {

    const value =
        booking.timestamp ||
        booking.createdAt ||
        booking.dateCreated ||
        "";

    if (!value) {
        return 0;
    }

    const time =
        new Date(value).getTime();

    if (
        Number.isNaN(time)
    ) {
        return 0;
    }

    return time;
}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(value) {

    const number =
        Number(value || 0);

    return number.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


/* =========================================================
   TEXT HELPERS
========================================================= */

function safeString(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value);
}


function setText(element, value) {

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {

    return safeString(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeJs(value) {

    return safeString(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}


/* =========================================================
   LOADING
========================================================= */

function showLoading(message) {

    if (loadingText) {

        loadingText.textContent =
            message ||
            "Please wait...";
    }

    if (loadingOverlay) {

        loadingOverlay.classList.remove(
            "hidden"
        );
    }
}


function hideLoading() {

    if (loadingOverlay) {

        loadingOverlay.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   TOAST
========================================================= */

function setupToast() {

    if (toastClose) {

        toastClose.addEventListener(
            "click",
            function () {

                hideToast();
            }
        );
    }
}


function showToast(
    type,
    title,
    message
) {

    if (
        !toast ||
        !toastTitle ||
        !toastMessage
    ) {
        return;
    }

    toast.classList.remove(
        "error",
        "warning",
        "success",
        "show"
    );

    toast.classList.add(
        type || "success"
    );

    setText(
        toastTitle,
        title || "Message"
    );

    setText(
        toastMessage,
        message || ""
    );

    if (toastIcon) {

        if (type === "error") {
            toastIcon.textContent = "✕";
        }

        else if (type === "warning") {
            toastIcon.textContent = "!";
        }

        else {
            toastIcon.textContent = "✓";
        }
    }

    requestAnimationFrame(
        function () {

            toast.classList.add("show");
        }
    );

    clearTimeout(
        window.sceToastTimer
    );

    window.sceToastTimer =
        setTimeout(
            hideToast,
            4500
        );
}


function hideToast() {

    if (toast) {

        toast.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            hideToast();

            if (
                loadingOverlay &&
                !loadingOverlay.classList.contains("hidden")
            ) {
                return;
            }
        }
    }
);


/* =========================================================
   EXPORT / GLOBAL FUNCTIONS
========================================================= */

window.updateBookingStatus =
    updateBookingStatus;

window.toggleSlot =
    toggleSlot;

window.deleteRentalSlot =
    deleteRentalSlot;

window.openBookingDetails =
    openBookingDetails;

window.logout =
    logout;