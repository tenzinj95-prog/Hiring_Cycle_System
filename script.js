/* =========================================================
   SCE CYCLE HIRE
   STUDENT JAVASCRIPT
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT URL
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxVfN7Xv_-yk6sGJVazdGVUsV363MikbChwvsD8JtfxEMTqy2A4A615Q2M21nkc_gC49g/exec";


/* =========================================================
   SETTINGS
========================================================= */

const HOURLY_RATE = 100;


/* =========================================================
   ELEMENTS
========================================================= */

const bookingForm =
    document.getElementById("bookingForm");

const studentNameInput =
    document.getElementById("studentName");

const programmeInput =
    document.getElementById("programme");

const phoneInput =
    document.getElementById("phone");

const hireDateInput =
    document.getElementById("hireDate");

const timeSlotSelect =
    document.getElementById("timeSlot");

const slotMessage =
    document.getElementById("slotMessage");

const durationText =
    document.getElementById("durationText");

const totalAmount =
    document.getElementById("totalAmount");

const submitButton =
    document.getElementById("submitButton");

const bookingResult =
    document.getElementById("bookingResult");

const bookingId =
    document.getElementById("bookingId");

const resultStatus =
    document.getElementById("resultStatus");

const resultDate =
    document.getElementById("resultDate");

const resultTime =
    document.getElementById("resultTime");

const resultDuration =
    document.getElementById("resultDuration");

const resultAmount =
    document.getElementById("resultAmount");

const checkBookingForm =
    document.getElementById("checkBookingForm");

const checkBookingId =
    document.getElementById("checkBookingId");

const checkPhone =
    document.getElementById("checkPhone");

const checkButton =
    document.getElementById("checkButton");

const statusResult =
    document.getElementById("statusResult");

const statusBadge =
    document.getElementById("statusBadge");

const statusBookingId =
    document.getElementById("statusBookingId");

const statusStudent =
    document.getElementById("statusStudent");

const statusDate =
    document.getElementById("statusDate");

const statusTime =
    document.getElementById("statusTime");

const statusDuration =
    document.getElementById("statusDuration");

const statusAmount =
    document.getElementById("statusAmount");

const approvalMessage =
    document.getElementById("approvalMessage");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const loadingText =
    document.getElementById("loadingText");


/* =========================================================
   INITIAL SETUP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setMinimumDate();

    setupEvents();

});


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupEvents() {

    if (hireDateInput) {

        hireDateInput.addEventListener(
            "change",
            loadAvailableSlots
        );

    }


    if (timeSlotSelect) {

        timeSlotSelect.addEventListener(
            "change",
            updatePrice
        );

    }


    if (bookingForm) {

        bookingForm.addEventListener(
            "submit",
            submitBooking
        );

    }


    if (checkBookingForm) {

        checkBookingForm.addEventListener(
            "submit",
            checkBooking
        );

    }

}


/* =========================================================
   SET MINIMUM DATE
========================================================= */

function setMinimumDate() {

    if (!hireDateInput) {
        return;
    }

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    const date =
        `${year}-${month}-${day}`;

    hireDateInput.min = date;

}


/* =========================================================
   LOAD AVAILABLE SLOTS
========================================================= */

async function loadAvailableSlots() {

    const date =
        hireDateInput.value;

    resetPrice();

    if (!date) {

        timeSlotSelect.innerHTML =
            `<option value="">
                Select a hire date first
            </option>`;

        timeSlotSelect.disabled = true;

        setSlotMessage(
            "Please select a date first.",
            ""
        );

        return;
    }


    timeSlotSelect.disabled = true;

    timeSlotSelect.innerHTML =
        `<option value="">
            Loading available times...
        </option>`;


    setSlotMessage(
        "Checking available rental times...",
        ""
    );


    try {

        const url =
            `${GOOGLE_SCRIPT_URL}?action=availableSlots&date=${encodeURIComponent(date)}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Unable to connect to the booking system."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Unable to load rental slots."
            );

        }


        const slots =
            Array.isArray(data.slots)
                ? data.slots
                : [];


        displayAvailableSlots(slots);

    }

    catch (error) {

        console.error(
            "Slot loading error:",
            error
        );


        timeSlotSelect.innerHTML =
            `<option value="">
                Unable to load slots
            </option>`;

        timeSlotSelect.disabled = true;


        setSlotMessage(
            "Unable to load available times. Please try again.",
            "error"
        );

    }

}


/* =========================================================
   DISPLAY AVAILABLE SLOTS
========================================================= */

function displayAvailableSlots(slots) {

    timeSlotSelect.innerHTML = "";


    if (!slots || slots.length === 0) {

        timeSlotSelect.innerHTML =
            `<option value="">
                No available rental times
            </option>`;

        timeSlotSelect.disabled = true;


        setSlotMessage(
            "There are no available rental slots for this date.",
            "warning"
        );


        return;
    }


    const firstOption =
        document.createElement("option");

    firstOption.value = "";

    firstOption.textContent =
        "Select an available rental time";

    timeSlotSelect.appendChild(
        firstOption
    );


    slots.forEach(slot => {

        const option =
            document.createElement("option");

        option.value =
            slot.slotId ||
            slot.id ||
            "";


        const start =
            slot.startTime ||
            slot.start ||
            "";

        const end =
            slot.endTime ||
            slot.end ||
            "";


        const duration =
            Number(
                slot.duration ||
                slot.hours ||
                calculateDuration(start, end)
            );


        option.textContent =
            `${formatTime(start)} - ${formatTime(end)} (${formatHours(duration)})`;


        option.dataset.start =
            start;

        option.dataset.end =
            end;

        option.dataset.duration =
            duration;


        timeSlotSelect.appendChild(
            option
        );

    });


    timeSlotSelect.disabled = false;


    setSlotMessage(
        `${slots.length} rental slot${slots.length === 1 ? "" : "s"} available.`,
        "success"
    );

}


/* =========================================================
   UPDATE PRICE
========================================================= */

function updatePrice() {

    const selected =
        timeSlotSelect.options[
            timeSlotSelect.selectedIndex
        ];


    if (
        !selected ||
        !selected.value
    ) {

        resetPrice();

        return;
    }


    const start =
        selected.dataset.start || "";

    const end =
        selected.dataset.end || "";

    let duration =
        Number(
            selected.dataset.duration
        );


    if (
        !duration ||
        duration <= 0
    ) {

        duration =
            calculateDuration(
                start,
                end
            );

    }


    const total =
        duration * HOURLY_RATE;


    durationText.textContent =
        formatHours(duration);


    totalAmount.textContent =
        `Nu. ${formatNumber(total)}`;

}


/* =========================================================
   RESET PRICE
========================================================= */

function resetPrice() {

    if (durationText) {

        durationText.textContent =
            "—";

    }


    if (totalAmount) {

        totalAmount.textContent =
            "Nu. 0";

    }

}


/* =========================================================
   SUBMIT BOOKING
========================================================= */

async function submitBooking(event) {

    event.preventDefault();


    const name =
        studentNameInput.value.trim();

    const programme =
        programmeInput.value.trim();

    const phone =
        phoneInput.value.trim();

    const hireDate =
        hireDateInput.value;

    const slotId =
        timeSlotSelect.value;


    if (!name) {

        showError(
            "Please enter your full name."
        );

        studentNameInput.focus();

        return;
    }


    if (!programme) {

        showError(
            "Please enter your programme and year."
        );

        programmeInput.focus();

        return;
    }


    if (!phone) {

        showError(
            "Please enter your phone number."
        );

        phoneInput.focus();

        return;
    }


    if (!hireDate) {

        showError(
            "Please select a hire date."
        );

        hireDateInput.focus();

        return;
    }


    if (!slotId) {

        showError(
            "Please select an available rental time."
        );

        timeSlotSelect.focus();

        return;
    }


    const agreement =
        document.getElementById(
            "agreement"
        );


    if (
        agreement &&
        !agreement.checked
    ) {

        showError(
            "Please confirm the agreement before submitting."
        );

        return;
    }


    const selected =
        timeSlotSelect.options[
            timeSlotSelect.selectedIndex
        ];


    const startTime =
        selected.dataset.start || "";

    const endTime =
        selected.dataset.end || "";

    const duration =
        Number(
            selected.dataset.duration ||
            calculateDuration(
                startTime,
                endTime
            )
        );


    if (
        !duration ||
        duration <= 0
    ) {

        showError(
            "The selected rental time is invalid."
        );

        return;
    }


    const total =
        duration * HOURLY_RATE;


    const clientBookingId =
        generateClientBookingId();


    const bookingData = {

        action: "booking",

        studentName: name,

        programme: programme,

        phone: phone,

        hireDate: hireDate,

        slotId: slotId,

        clientBookingId: clientBookingId

    };


    setLoading(
        true,
        "Submitting your booking..."
    );


    submitButton.disabled = true;


    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8"
                    },

                    body:
                        new URLSearchParams(
                            bookingData
                        ).toString()
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to submit your booking."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "The booking could not be submitted."
            );

        }


        const finalBookingId =
            data.bookingId ||
            data.id ||
            clientBookingId;


        showBookingReceipt({

            bookingId:
                finalBookingId,

            status:
                data.status ||
                "Pending",

            date:
                data.hireDate ||
                hireDate,

            time:
                data.time ||
                `${formatTime(startTime)} - ${formatTime(endTime)}`,

            duration:
                data.duration ||
                duration,

            amount:
                data.total ||
                total

        });


        bookingForm.reset();

        resetPrice();

        timeSlotSelect.innerHTML =
            `<option value="">
                Select a hire date first
            </option>`;

        timeSlotSelect.disabled = true;


        setSlotMessage(
            "Please select a date first.",
            ""
        );


        window.scrollTo({
            top:
                bookingResult.offsetTop - 90,
            behavior:
                "smooth"
        });

    }

    catch (error) {

        console.error(
            "Booking submission error:",
            error
        );


        showError(
            error.message ||
            "Something went wrong while submitting your booking."
        );

    }

    finally {

        submitButton.disabled = false;

        setLoading(
            false
        );

    }

}


/* =========================================================
   SHOW BOOKING RECEIPT
========================================================= */

function showBookingReceipt(data) {

    if (!bookingResult) {
        return;
    }


    bookingResult.classList.remove(
        "hidden"
    );


    bookingId.textContent =
        data.bookingId || "—";


    resultStatus.textContent =
        data.status || "Pending";


    resultDate.textContent =
        formatDate(
            data.date
        );


    resultTime.textContent =
        data.time || "—";


    resultDuration.textContent =
        formatHours(
            Number(data.duration)
        );


    resultAmount.textContent =
        `Nu. ${formatNumber(
            Number(data.amount)
        )}`;

}


/* =========================================================
   CHECK BOOKING
========================================================= */

async function checkBooking(event) {

    event.preventDefault();


    const id =
        checkBookingId.value.trim();

    const phone =
        checkPhone.value.trim();


    if (!id) {

        showError(
            "Please enter your booking reference."
        );

        checkBookingId.focus();

        return;
    }


    if (!phone) {

        showError(
            "Please enter your phone number."
        );

        checkPhone.focus();

        return;
    }


    setLoading(
        true,
        "Checking your booking..."
    );


    checkButton.disabled = true;


    try {

        const url =
            `${GOOGLE_SCRIPT_URL}?action=bookingStatus&bookingId=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Unable to check your booking."
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Booking not found."
            );

        }


        displayBookingStatus(
            data.booking ||
            data
        );


        statusResult.classList.remove(
            "hidden"
        );


        statusResult.scrollIntoView({
            behavior:
                "smooth",
            block:
                "center"
        });

    }

    catch (error) {

        console.error(
            "Booking check error:",
            error
        );


        statusResult.classList.add(
            "hidden"
        );


        showError(
            error.message ||
            "Unable to find your booking."
        );

    }

    finally {

        checkButton.disabled = false;

        setLoading(
            false
        );

    }

}


/* =========================================================
   DISPLAY BOOKING STATUS
========================================================= */

function displayBookingStatus(booking) {

    const status =
        booking.status ||
        "Pending";


    statusBookingId.textContent =
        booking.bookingId ||
        booking.id ||
        "—";


    statusStudent.textContent =
        booking.studentName ||
        booking.name ||
        "—";


    statusDate.textContent =
        formatDate(
            booking.hireDate ||
            booking.date
        );


    const start =
        booking.startTime ||
        "";

    const end =
        booking.endTime ||
        "";


    statusTime.textContent =
        booking.time ||
        (
            start && end
                ? `${formatTime(start)} - ${formatTime(end)}`
                : "—"
        );


    const duration =
        Number(
            booking.duration ||
            booking.hours ||
            0
        );


    statusDuration.textContent =
        duration
            ? formatHours(duration)
            : "—";


    const amount =
        Number(
            booking.total ||
            booking.totalAmount ||
            booking.amount ||
            0
        );


    statusAmount.textContent =
        amount
            ? `Nu. ${formatNumber(amount)}`
            : "—";


    updateStatusBadge(
        status
    );


    updateApprovalMessage(
        status
    );

}


/* =========================================================
   STATUS BADGE
========================================================= */

function updateStatusBadge(status) {

    statusBadge.className = "";


    const normalized =
        String(status)
            .toLowerCase()
            .trim();


    statusBadge.textContent =
        status;


    if (
        normalized === "approved"
    ) {

        statusBadge.classList.add(
            "approved"
        );

    }

    else if (
        normalized === "rejected"
    ) {

        statusBadge.classList.add(
            "rejected"
        );

    }

    else if (
        normalized === "cancelled" ||
        normalized === "canceled"
    ) {

        statusBadge.classList.add(
            "cancelled"
        );

    }

    else if (
        normalized === "ongoing" ||
        normalized === "active"
    ) {

        statusBadge.classList.add(
            "ongoing"
        );

    }

    else if (
        normalized === "returned" ||
        normalized === "completed"
    ) {

        statusBadge.classList.add(
            "returned"
        );

    }

}


/* =========================================================
   APPROVAL MESSAGE
========================================================= */

function updateApprovalMessage(status) {

    const normalized =
        String(status)
            .toLowerCase()
            .trim();


    approvalMessage.className =
        "approval-message";


    if (
        normalized === "approved"
    ) {

        approvalMessage.classList.add(
            "approved"
        );

        approvalMessage.textContent =
            "✅ Your booking has been approved. Please arrive at the selected rental time to collect the cycle.";

    }

    else if (
        normalized === "rejected"
    ) {

        approvalMessage.classList.add(
            "rejected"
        );

        approvalMessage.textContent =
            "❌ Your booking was rejected by the administrator. Please contact the cycle hire office if you need more information.";

    }

    else if (
        normalized === "cancelled" ||
        normalized === "canceled"
    ) {

        approvalMessage.classList.add(
            "cancelled"
        );

        approvalMessage.textContent =
            "⚠️ This booking has been cancelled.";

    }

    else if (
        normalized === "ongoing" ||
        normalized === "active"
    ) {

        approvalMessage.classList.add(
            "ongoing"
        );

        approvalMessage.textContent =
            "🚲 Your cycle hire is currently ongoing. Please remember to return the cycle on time.";

    }

    else if (
        normalized === "returned" ||
        normalized === "completed"
    ) {

        approvalMessage.classList.add(
            "returned"
        );

        approvalMessage.textContent =
            "✅ Your cycle has been returned successfully. Thank you for using SCE Cycle Hire.";

    }

    else {

        approvalMessage.textContent =
            "⏳ Your booking is waiting for admin approval.";

    }

}


/* =========================================================
   GENERATE CLIENT BOOKING ID
========================================================= */

function generateClientBookingId() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    const random =
        Math.floor(
            1000 +
            Math.random() * 9000
        );


    return `SCE-${year}${month}${day}-${random}`;

}


/* =========================================================
   CALCULATE DURATION
========================================================= */

function calculateDuration(
    startTime,
    endTime
) {

    if (
        !startTime ||
        !endTime
    ) {

        return 0;
    }


    const start =
        timeToMinutes(
            startTime
        );

    const end =
        timeToMinutes(
            endTime
        );


    if (
        start === null ||
        end === null
    ) {

        return 0;
    }


    let difference =
        end - start;


    if (difference < 0) {

        difference += 24 * 60;

    }


    return difference / 60;

}


/* =========================================================
   TIME TO MINUTES
========================================================= */

function timeToMinutes(time) {

    if (!time) {
        return null;
    }


    const value =
        String(time)
            .trim()
            .toUpperCase();


    let match =
        value.match(
            /^(\d{1,2}):(\d{2})(?:\s*)(AM|PM)?$/
        );


    if (!match) {
        return null;
    }


    let hours =
        Number(match[1]);

    const minutes =
        Number(match[2]);

    const period =
        match[3];


    if (
        period === "AM" &&
        hours === 12
    ) {

        hours = 0;

    }


    if (
        period === "PM" &&
        hours !== 12
    ) {

        hours += 12;

    }


    if (
        hours > 23 ||
        minutes > 59
    ) {

        return null;

    }


    return (
        hours * 60 +
        minutes
    );

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(time) {

    if (!time) {
        return "—";
    }


    const minutes =
        timeToMinutes(
            time
        );


    if (minutes === null) {

        return time;

    }


    let hours =
        Math.floor(
            minutes / 60
        );

    const mins =
        minutes % 60;


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12;


    if (hours === 0) {
        hours = 12;
    }


    return (
        `${hours}:${String(mins).padStart(2, "0")} ${period}`
    );

}


/* =========================================================
   FORMAT HOURS
========================================================= */

function formatHours(hours) {

    const value =
        Number(hours);


    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return "—";

    }


    if (value === 1) {

        return "1 hour";

    }


    if (
        Number.isInteger(value)
    ) {

        return `${value} hours`;

    }


    return `${value.toFixed(1)} hours`;

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(number) {

    const value =
        Number(number);


    if (
        !Number.isFinite(value)
    ) {

        return "0";

    }


    return value.toLocaleString(
        "en-IN"
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(
            dateValue + (
                String(dateValue).includes("T")
                    ? ""
                    : "T00:00:00"
            )
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

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


/* =========================================================
   SLOT MESSAGE HELPER
========================================================= */

function setSlotMessage(
    message,
    type
) {

    slotMessage.textContent =
        message;


    slotMessage.className =
        "slot-message";


    if (type) {

        slotMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    show,
    message = "Processing..."
) {

    if (!loadingOverlay) {
        return;
    }


    if (loadingText) {

        loadingText.textContent =
            message;

    }


    if (show) {

        loadingOverlay.classList.remove(
            "hidden"
        );

    }

    else {

        loadingOverlay.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function showError(message) {

    alert(
        message
    );

}


/* =========================================================
   PREVENT INVALID PHONE CHARACTERS
========================================================= */

if (phoneInput) {

    phoneInput.addEventListener(
        "input",
        () => {

            phoneInput.value =
                phoneInput.value.replace(
                    /[^0-9+\-\s]/g,
                    ""
                );

        }
    );

}


if (checkPhone) {

    checkPhone.addEventListener(
        "input",
        () => {

            checkPhone.value =
                checkPhone.value.replace(
                    /[^0-9+\-\s]/g,
                    ""
                );

        }
    );

}


/* =========================================================
   AUTO-UPPERCASE BOOKING ID
========================================================= */

if (checkBookingId) {

    checkBookingId.addEventListener(
        "input",
        () => {

            checkBookingId.value =
                checkBookingId.value
                    .toUpperCase()
                    .replace(
                        /\s/g,
                        ""
                    );

        }
    );

}