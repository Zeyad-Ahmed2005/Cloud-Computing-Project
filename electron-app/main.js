const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

// Detect Python executable
function findPythonExecutable() {
  const platform = process.platform;
  const pythonCommands = platform === 'win32' 
    ? ['python', 'python3', 'py'] 
    : ['python3', 'python'];
  
  for (const cmd of pythonCommands) {
    try {
      const result = require('child_process').spawnSync(cmd, ['--version'], { encoding: 'utf8' });
      if (result.status === 0) {
        return cmd;
      }
    } catch (e) {
      continue;
    }
  }
  return 'python3'; // Fallback
}

const pythonExecutable = findPythonExecutable();

// Get API script path - handle both development and production builds
function getApiScriptPath() {
  // In production, files are in resources folder
  // In development, files are in backend folder
  if (app.isPackaged) {
    // Production: files are in resources folder alongside app.asar
    return path.join(process.resourcesPath, 'api.py');
  } else {
    // Development: files are in backend folder
    return path.join(__dirname, '..', 'backend', 'api.py');
  }
}

const apiScriptPath = getApiScriptPath();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: process.platform === 'win32' 
      ? path.join(__dirname, 'build', 'icon.ico')
      : process.platform === 'darwin'
      ? path.join(__dirname, 'build', 'icon.icns')
      : path.join(__dirname, 'build', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Remove menu bar in production, show in development
  if (app.isPackaged) {
    // Production: remove menu bar completely
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
    // Remove menu completely
    mainWindow.setMenu(null);
  } else {
    // Development: show menu bar and DevTools
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Execute Python API call
function execPythonAPI(service, action, args = {}) {
  return new Promise((resolve, reject) => {
    const argsJson = JSON.stringify(args);
    // Set working directory to the directory containing api.py so Python can find docker.py and qemu.py
    const apiDir = path.dirname(apiScriptPath);
    const child = spawn(pythonExecutable, [apiScriptPath, '--service', service, '--action', action, '--args', argsJson], {
      cwd: apiDir
    });
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          // If parsing fails, try to return the raw output as error
          resolve({ success: false, error: `Failed to parse response: ${stdout}`, raw: stdout });
        }
      } else {
        // Return error as a result object instead of rejecting
        resolve({ success: false, error: stderr || `Process exited with code ${code}`, code: code });
      }
    });

    child.on('error', (error) => {
      reject({ success: false, error: `Failed to start Python: ${error.message}` });
    });
  });
}

// IPC Handlers for Docker
ipcMain.handle('docker:listImages', async () => {
  return await execPythonAPI('docker', 'list_images');
});

ipcMain.handle('docker:listContainers', async () => {
  return await execPythonAPI('docker', 'list_containers');
});

ipcMain.handle('docker:listRunningContainers', async () => {
  return await execPythonAPI('docker', 'list_running_containers');
});

ipcMain.handle('docker:createDockerfile', async (event, path, code) => {
  return await execPythonAPI('docker', 'create_dockerfile', { path, code });
});

ipcMain.handle('docker:buildImage', async (event, buildPath, tag) => {
  return await execPythonAPI('docker', 'build_image', { path: buildPath, tag });
});

ipcMain.handle('docker:stopContainer', async (event, id) => {
  return await execPythonAPI('docker', 'stop_container', { id });
});

ipcMain.handle('docker:startContainer', async (event, id) => {
  return await execPythonAPI('docker', 'start_container', { id });
});

ipcMain.handle('docker:createContainer', async (event, image, name, ports, envVars) => {
  return await execPythonAPI('docker', 'create_container', { image, name, ports, env_vars: envVars });
});

ipcMain.handle('docker:deleteContainer', async (event, id, force = false) => {
  return await execPythonAPI('docker', 'delete_container', { id, force });
});

ipcMain.handle('docker:deleteImage', async (event, id, force = false) => {
  return await execPythonAPI('docker', 'delete_image', { id, force });
});

ipcMain.handle('docker:getContainerLogs', async (event, id, tail = 100) => {
  return await execPythonAPI('docker', 'get_container_logs', { id, tail });
});

ipcMain.handle('docker:getContainerStats', async (event, id) => {
  return await execPythonAPI('docker', 'get_container_stats', { id });
});

ipcMain.handle('docker:searchDockerhub', async (event, name) => {
  return await execPythonAPI('docker', 'search_dockerhub', { name });
});

ipcMain.handle('docker:pullImage', async (event, name) => {
  return await execPythonAPI('docker', 'pull_image', { name });
});

ipcMain.handle('docker:searchImageLocal', async (event, name) => {
  return await execPythonAPI('docker', 'search_image_local', { name });
});

// IPC Handlers for QEMU
ipcMain.handle('qemu:startVM', async (event, cpuCores, ramSize, diskPath, isoPath) => {
  return await execPythonAPI('qemu', 'start_virtual_machine', { 
    cpu_cores: cpuCores, 
    ram_size: ramSize, 
    disk_path: diskPath, 
    iso_path: isoPath 
  });
});

ipcMain.handle('qemu:createVMFromConfig', async (event, configFilePath) => {
  return await execPythonAPI('qemu', 'create_vm_from_config', { config_file_path: configFilePath });
});

ipcMain.handle('qemu:deleteVM', async (event, diskPath) => {
  return await execPythonAPI('qemu', 'delete_vm', { disk_path: diskPath });
});

ipcMain.handle('qemu:listRunningVMs', async () => {
  return await execPythonAPI('qemu', 'list_running_vms');
});

ipcMain.handle('qemu:stopVM', async (event, pid) => {
  return await execPythonAPI('qemu', 'stop_vm', { pid });
});

ipcMain.handle('qemu:createDiskImage', async (event, imagePath, size) => {
  return await execPythonAPI('qemu', 'create_disk_image', { path: imagePath, size });
});

// File dialog handlers
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// File operations
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:write', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

