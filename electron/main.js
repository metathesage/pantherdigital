const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const DEV_URL = process.env.PNHR_DESKTOP_URL || "http://localhost:3000";
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // External links open in the system browser, not the app shell
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(DEV_URL) && !url.startsWith("http://localhost")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    // win.webContents.openDevTools({ mode: "detach" });
  } else {
    // Packaged: serve the Next.js standalone build via next start on a local port.
    // electron-builder "extraResources" should include .next/standalone + .next/static + public.
    const port = process.env.PORT || "3100";
    win.loadURL(`http://localhost:${port}`);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
