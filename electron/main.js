const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const { fork } = require("node:child_process");
const net = require("node:net");

const DEV_URL = process.env.PNHR_DESKTOP_URL || "http://localhost:3000";
const isDev = !app.isPackaged;
const PROD_PORT = process.env.PORT || "3100";

let serverProc = null;

function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(port, host);
      sock.once("connect", () => {
        sock.end();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`port ${port} timeout`));
        else setTimeout(tryOnce, 500);
      });
    };
    tryOnce();
  });
}

function startPackagedServer() {
  // extraResources lands standalone at <resources>/.next/standalone/server.js
  const serverJs = path.join(process.resourcesPath, ".next", "standalone", "server.js");
  serverProc = fork(serverJs, [], {
    env: { ...process.env, PORT: PROD_PORT, HOSTNAME: "127.0.0.1" },
    silent: true,
  });
  serverProc.on("error", () => {});
  serverProc.stderr?.on("data", () => {});
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "PNHR DGTL v1.0.0",
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
    // Packaged: boot the bundled Next standalone server, then load it.
    waitForPort(Number(PROD_PORT)).then(
      () => win.loadURL(`http://localhost:${PROD_PORT}`),
      () => win.loadURL(`http://localhost:${PROD_PORT}`)
    );
  }
}

app.whenReady().then(() => {
  if (!isDev) startPackagedServer();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  if (serverProc) serverProc.kill();
});
