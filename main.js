const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

const DEFAULT_SETTINGS = {
  eventName: "My Exam",
  targetDate: "",
  targetTime: "10:15",
  theme: "forest",
  opacity: 94,
  launchAtLogin: false,
};

const THEMES = new Set(["forest", "night", "light"]);
let mainWindow;

function settingsFile() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(settingsFile(), "utf8")) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function updateStartupSetting(enabled) {
  if (process.platform !== "win32") return;

  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: app.isPackaged ? [] : [__dirname],
  });
}

function validateSettings(input) {
  const eventName = typeof input?.eventName === "string" ? input.eventName.trim().slice(0, 48) : "";
  const targetDate = typeof input?.targetDate === "string" ? input.targetDate : "";
  const targetTime = typeof input?.targetTime === "string" ? input.targetTime : "";

  if (!eventName) return { error: "Event name cannot be empty." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return { error: "Choose a valid date." };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(targetTime)) return { error: "Choose a valid time." };
  const [year, month, day] = targetDate.split("-").map(Number);
  const calendarDate = new Date(year, month - 1, day);
  if (calendarDate.getFullYear() !== year || calendarDate.getMonth() !== month - 1 || calendarDate.getDate() !== day) {
    return { error: "The selected date and time are invalid." };
  }

  const opacity = Number(input?.opacity);
  const settings = {
    eventName,
    targetDate,
    targetTime,
    theme: THEMES.has(input?.theme) ? input.theme : DEFAULT_SETTINGS.theme,
    opacity: Number.isFinite(opacity) ? Math.min(100, Math.max(65, Math.round(opacity))) : DEFAULT_SETTINGS.opacity,
    launchAtLogin: input?.launchAtLogin === true,
  };

  return { settings };
}

function positionWindow(width, height) {
  const workArea = screen.getPrimaryDisplay().workArea;
  const x = Math.max(workArea.x, workArea.x + workArea.width - width - 18);
  const y = workArea.y + 18;
  mainWindow.setSize(width, height);
  mainWindow.setPosition(x, y);
}

ipcMain.handle("settings:get", () => readSettings());

ipcMain.handle("settings:save", (event, input) => {
  if (event.sender !== mainWindow?.webContents) return { error: "The request could not be verified." };

  const result = validateSettings(input);
  if (result.error) return result;

  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(result.settings, null, 2), "utf8");
  updateStartupSetting(result.settings.launchAtLogin);
  return { settings: result.settings };
});

ipcMain.handle("window:set-view", (event, view) => {
  if (event.sender !== mainWindow?.webContents || !["widget", "settings"].includes(view)) return false;

  const size = view === "settings" ? { width: 430, height: 650 } : { width: 390, height: 286 };
  positionWindow(size.width, size.height);
  return true;
});

ipcMain.on("app:quit", () => app.quit());

function createWindow() {
  const settings = readSettings();
  const initialView = settings.targetDate ? "widget" : "settings";
  const size = initialView === "settings" ? { width: 430, height: 650 } : { width: 390, height: 286 };
  const workArea = screen.getPrimaryDisplay().workArea;

  mainWindow = new BrowserWindow({
    ...size,
    x: Math.max(workArea.x, workArea.x + workArea.width - size.width - 18),
    y: workArea.y + 18,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    movable: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    show: false,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  updateStartupSetting(readSettings().launchAtLogin);
  createWindow();
});

app.on("window-all-closed", () => app.quit());