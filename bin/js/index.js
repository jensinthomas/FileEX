const { app, BrowserWindow } = require('electron')
function createWindow() {
    let win = new BrowserWindow({ title: 'FileEX', nodeIntegration: true, icon: "./bin/img/app.png", width: 1200, height: 900, frame: false, transparent: true, vibrancy: 'ultra-dark', webPreferences: { experimentalFeatures: true } })
    win.loadFile('./bin/html/fileex.html')
}
app.on('ready', createWindow)

