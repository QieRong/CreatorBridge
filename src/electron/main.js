/**
 * CreatorBridge - Electron 桌面端主进程入口
 * 负责客户端主窗口的生命周期管理与页面渲染
 */

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

/**
 * 创建精致的客户端渲染窗口
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "CreatorBridge - 多平台内容适配发布助手",
    backgroundColor: '#F0F2F5',
    webPreferences: {
      nodeIntegration: false,      // 关闭 Node 权限以保障安全
      contextIsolation: true,     // 启用上下文隔离以抵御 XSS
      sandbox: true               // 启用沙盒环境保证安全性
    }
  });

  // 安全载入您本地的 index.html 网页资源
  mainWindow.loadFile(path.join(__dirname, '../../index.html'));

  // 隐藏顶部系统默认的多余菜单，使其更具独立软件的清爽外观
  Menu.setApplicationMenu(null);

  // 窗口关闭时自动释放资源
  mainWindow.on('closed', function () {
    app.quit();
  });
}

// 桌面端环境初始化完毕时触发窗口渲染
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 所有窗口被关闭时自动退出应用进程
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
