const { app, BrowserWindow, Menu, ipcMain } = require('electron/main')
const path = require('node:path')

let mainWindow = null
let playerAWindow = null
let playerBWindow = null
let interviewWindow = null

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: '案例研讨计时器 - 主控制台'
  })

  mainWindow.loadFile('index.html')
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

const createPlayerAWindow = () => {
  if (playerAWindow) {
    playerAWindow.focus()
    return
  }

  playerAWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'A选手计时器',
    icon: path.join(__dirname, 'assets/icon.png') // 如果有图标的话
  })

  playerAWindow.loadFile('player-a.html')
  
  playerAWindow.on('closed', () => {
    playerAWindow = null
  })
}

const createPlayerBWindow = () => {
  if (playerBWindow) {
    playerBWindow.focus()
    return
  }

  playerBWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'B选手计时器',
    icon: path.join(__dirname, 'assets/icon.png') // 如果有图标的话
  })

  playerBWindow.loadFile('player-b.html')
  
  playerBWindow.on('closed', () => {
    playerBWindow = null
  })
}

const createInterviewWindow = () => {
  if (interviewWindow) {
    interviewWindow.focus()
    return
  }

  interviewWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: '谈心谈话计时器',
    icon: path.join(__dirname, 'assets/icon.png') // 如果有图标的话
  })

  interviewWindow.loadFile('interview.html')
  
  interviewWindow.on('closed', () => {
    interviewWindow = null
  })
}

const createApplicationMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '主控制台',
          accelerator: 'CmdOrCtrl+M',
          click: createMainWindow
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '计时器窗口',
      submenu: [
        {
          label: 'A选手计时器',
          accelerator: 'CmdOrCtrl+1',
          click: createPlayerAWindow
        },
        {
          label: 'B选手计时器',
          accelerator: 'CmdOrCtrl+2',
          click: createPlayerBWindow
        },
        {
          label: '谈心谈话计时器',
          accelerator: 'CmdOrCtrl+3',
          click: createInterviewWindow
        },
        { type: 'separator' },
        {
          label: '同时开启A/B选手窗口',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => {
            createPlayerAWindow()
            createPlayerBWindow()
            
            // 自动排列窗口位置
            if (playerAWindow && playerBWindow) {
              const { screen } = require('electron')
              const primaryDisplay = screen.getPrimaryDisplay()
              const { width, height } = primaryDisplay.workAreaSize
              
              // A选手窗口放在左边
              playerAWindow.setBounds({
                x: 0,
                y: 0,
                width: Math.floor(width / 2),
                height: height
              })
              
              // B选手窗口放在右边
              playerBWindow.setBounds({
                x: Math.floor(width / 2),
                y: 0,
                width: Math.floor(width / 2),
                height: height
              })
            }
          }
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        {
          label: '切换开发者工具',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.toggleDevTools()
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            const aboutWindow = new BrowserWindow({
              width: 400,
              height: 300,
              resizable: false,
              title: '关于'
            })
            aboutWindow.loadURL(`data:text/html;charset=utf-8,
              <div style="padding: 20px; font-family: Arial; text-align: center;">
                <h2>案例研讨计时器</h2>
                <p>版本: 1.0.0</p>
                <p>专业的双人计时应用</p>
                <p>支持案例研讨和谈心谈话模式</p>
              </div>
            `)
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC 处理程序
ipcMain.handle('open-player-a-window', () => {
  createPlayerAWindow()
})

ipcMain.handle('open-player-b-window', () => {
  createPlayerBWindow()
})

ipcMain.handle('open-interview-window', () => {
  createInterviewWindow()
})

ipcMain.handle('open-both-player-windows', () => {
  createPlayerAWindow()
  createPlayerBWindow()
  
  // 自动排列窗口
  setTimeout(() => {
    if (playerAWindow && playerBWindow) {
      const { screen } = require('electron')
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width, height } = primaryDisplay.workAreaSize
      
      playerAWindow.setBounds({
        x: 0,
        y: 0,
        width: Math.floor(width / 2),
        height: height
      })
      
      playerBWindow.setBounds({
        x: Math.floor(width / 2),
        y: 0,
        width: Math.floor(width / 2),
        height: height
      })
    }
  }, 100)
})

app.whenReady().then(() => {
  createMainWindow()
  createApplicationMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 导出窗口创建函数供其他模块使用
module.exports = {
  createPlayerAWindow,
  createPlayerBWindow,
  createInterviewWindow
}