const DEFAULT_SETTINGS = {
  eventName: "My Exam",
  targetDate: "",
  targetTime: "10:15",
  theme: "forest",
  opacity: 94,
  launchAtLogin: false,
};

const widgetView = document.getElementById("widgetView");
const settingsView = document.getElementById("settingsView");
const settingsForm = document.getElementById("settingsForm");
const eventNameInput = document.getElementById("eventNameInput");
const targetDateInput = document.getElementById("targetDateInput");
const targetTimeInput = document.getElementById("targetTimeInput");
const opacityInput = document.getElementById("opacityInput");
const opacityValue = document.getElementById("opacityValue");
const launchAtLoginInput = document.getElementById("launchAtLoginInput");
const formError = document.getElementById("formError");
const saveButton = document.getElementById("saveSettings");

let currentSettings = { ...DEFAULT_SETTINGS };
let selectedTheme = DEFAULT_SETTINGS.theme;
let countdownInterval;

function setTheme(theme) {
  selectedTheme = theme;
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeOption === theme));
  });
}

function applySettings(settings) {
  currentSettings = { ...DEFAULT_SETTINGS, ...settings };
  document.documentElement.style.setProperty("--surface-opacity", `${currentSettings.opacity}%`);
  document.getElementById("eventName").textContent = currentSettings.eventName;
  setTheme(currentSettings.theme);
  renderCountdown();
}

function populateForm(settings) {
  eventNameInput.value = settings.eventName;
  targetDateInput.value = settings.targetDate;
  targetTimeInput.value = settings.targetTime || DEFAULT_SETTINGS.targetTime;
  opacityInput.value = settings.opacity;
  opacityValue.value = `${settings.opacity}%`;
  launchAtLoginInput.checked = settings.launchAtLogin;
  setTheme(settings.theme);
}

async function showView(view) {
  const isWidget = view === "widget";
  widgetView.hidden = !isWidget;
  settingsView.hidden = isWidget;
  await window.widgetApp.setView(view);
  if (!isWidget) eventNameInput.focus();
}

function renderCountdown() {
  if (!currentSettings.targetDate || !currentSettings.targetTime) return;

  const target = new Date(`${currentSettings.targetDate}T${currentSettings.targetTime}:00`);
  const remaining = target.getTime() - Date.now();
  const finished = remaining <= 0;
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const values = {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };

  document.getElementById("days").textContent = String(values.days).padStart(3, "0");
  document.getElementById("hours").textContent = String(values.hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(values.minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(values.seconds).padStart(2, "0");
  document.getElementById("countdownStatus").textContent = finished ? "DATE REACHED" : "TIME REMAINING";
  document.getElementById("targetLabel").textContent = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(target);
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = !message;
}

document.getElementById("openSettings").addEventListener("click", async () => {
  populateForm(currentSettings);
  showError("");
  await showView("settings");
});

document.querySelectorAll("[data-quit]").forEach((button) => {
  button.addEventListener("click", () => window.widgetApp.quit());
});

document.querySelectorAll("[data-theme-option]").forEach((button) => {
  button.addEventListener("click", () => setTheme(button.dataset.themeOption));
});

opacityInput.addEventListener("input", () => {
  opacityValue.value = `${opacityInput.value}%`;
  document.documentElement.style.setProperty("--surface-opacity", `${opacityInput.value}%`);
});

document.getElementById("cancelSettings").addEventListener("click", async () => {
  if (currentSettings.targetDate) {
    populateForm(currentSettings);
    setTheme(currentSettings.theme);
    document.documentElement.style.setProperty("--surface-opacity", `${currentSettings.opacity}%`);
    await showView("widget");
  } else {
    window.widgetApp.quit();
  }
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  saveButton.disabled = true;

  const result = await window.widgetApp.saveSettings({
    eventName: eventNameInput.value,
    targetDate: targetDateInput.value,
    targetTime: targetTimeInput.value,
    theme: selectedTheme,
    opacity: Number(opacityInput.value),
    launchAtLogin: launchAtLoginInput.checked,
  });

  saveButton.disabled = false;
  if (result.error) {
    showError(result.error);
    return;
  }

  applySettings(result.settings);
  if (!countdownInterval) countdownInterval = window.setInterval(renderCountdown, 1000);
  await showView("widget");
});

async function initialize() {
  const settings = await window.widgetApp.getSettings();
  populateForm(settings);
  applySettings(settings);

  if (settings.targetDate) {
    await showView("widget");
    countdownInterval = window.setInterval(renderCountdown, 1000);
  } else {
    await showView("settings");
  }
}

initialize();