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

// Helper function to notify renderer that Docker is ready
function notifyDockerReady() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // If window is already loaded, send immediately
    if (!mainWindow.webContents.isLoading()) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('docker:ready');
        }
      }, 500);
    } else {
      // Wait for window to load first
      mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('docker:ready');
          }
        }, 500);
      });
    }
  }
}

// Function to check if Docker is running
function checkDockerRunning() {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec('docker ps', { timeout: 5000 }, (error) => {
      // If no error, Docker is running
      resolve(!error);
    });
  });
}

// Function to start Docker engine based on platform
async function startDockerEngine() {
  const platform = process.platform;
  
  // First check if Docker is already running
  const isRunning = await checkDockerRunning();
  if (isRunning) {
    console.log('Docker is already running');
    return { success: true, message: 'Docker is already running' };
  }

  console.log('Attempting to start Docker engine...');

  return new Promise((resolve) => {
    let command;
    let args = [];

    if (platform === 'win32') {
      // Windows: Try to start Docker Desktop
      // Common locations for Docker Desktop
      const dockerPaths = [
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Docker', 'Docker', 'Docker Desktop.exe'),
        path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Docker', 'Docker', 'Docker Desktop.exe'),
        path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE, 'AppData', 'Local', 'Docker', 'Docker Desktop.exe')
      ];

      // Try to find and start Docker Desktop
      const fs = require('fs');
      let dockerPath = null;
      for (const dockerExe of dockerPaths) {
        if (fs.existsSync(dockerExe)) {
          dockerPath = dockerExe;
          break;
        }
      }

      if (dockerPath) {
        command = dockerPath;
        // Start Docker Desktop in background
        args = [];
      } else {
        // Fallback: try using start command
        command = 'cmd';
        args = ['/c', 'start', '""', 'Docker Desktop'];
      }
    } else if (platform === 'darwin') {
      // macOS: Open Docker.app
      command = 'open';
      args = ['-a', 'Docker'];
    } else {
      // Linux: Try to start Docker service
      // Note: This may require sudo, so we'll try without first
      command = 'systemctl';
      args = ['--user', 'start', 'docker'];
      
      // If that fails, try with sudo (but this will prompt for password)
      // For now, we'll just try the user service
    }

    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });

    child.on('error', (error) => {
      console.error('Error starting Docker:', error);
      // Try alternative method for Linux
      if (platform === 'linux') {
        // Try sudo systemctl start docker (will prompt for password)
        const sudoChild = spawn('sudo', ['systemctl', 'start', 'docker'], {
          stdio: 'inherit'
        });
        sudoChild.on('error', () => {
          resolve({ 
            success: false, 
            message: 'Could not start Docker. Please start Docker manually.' 
          });
        });
        sudoChild.on('close', () => {
          // Wait a bit and check if Docker is running
          setTimeout(async () => {
            const running = await checkDockerRunning();
            if (running) {
              notifyDockerReady();
            }
            resolve({ 
              success: running, 
              message: running ? 'Docker started successfully' : 'Docker may need to be started manually'
            });
          }, 3000);
        });
      } else {
        resolve({ 
          success: false, 
          message: 'Could not start Docker. Please start Docker Desktop manually.' 
        });
      }
    });

    child.unref(); // Allow the parent process to exit independently

    // Wait a few seconds and check if Docker started
    setTimeout(async () => {
      const running = await checkDockerRunning();
      if (running) {
        notifyDockerReady();
      }
      resolve({ 
        success: running, 
        message: running ? 'Docker started successfully' : 'Docker is starting... Please wait a moment.'
      });
    }, 3000);
  });
}

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

  // Check if Docker is already running when window loads
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      checkDockerRunning().then(isRunning => {
        if (isRunning) {
          notifyDockerReady();
        }
      });
    }, 1000);
  });
}

app.whenReady().then(async () => {
  createWindow();

  // Start Docker engine when app opens
  try {
    const dockerResult = await startDockerEngine();
    if (dockerResult.success) {
      console.log('Docker engine started:', dockerResult.message);
      // Notify renderer that Docker is ready
      notifyDockerReady();
    } else {
      console.log('Docker startup:', dockerResult.message);
    }
  } catch (error) {
    console.error('Error starting Docker:', error);
  }

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
      // Always try to parse stdout as JSON first (Python writes both success and error responses to stdout)
      if (stdout && stdout.trim()) {
        try {
          const result = JSON.parse(stdout);
          // If we got a valid JSON response, use it (regardless of exit code)
          resolve(result);
          return;
        } catch (e) {
          // If parsing fails, continue to error handling below
        }
      }
      
      // If stdout is not valid JSON or empty, check for Docker daemon errors
      const stdoutLower = (stdout || '').toLowerCase();
      const stderrLower = (stderr || '').toLowerCase();
      
      // Check for Docker daemon errors
      const dockerErrors = [
        'cannot connect to the docker daemon',
        'is the docker daemon running',
        'connection refused',
        'docker daemon is not running',
        'error response from daemon',
        'dial unix',
        'connection to docker daemon failed'
      ];
      
      let dockerError = null;
      for (const dockerErr of dockerErrors) {
        if (stdoutLower.includes(dockerErr) || stderrLower.includes(dockerErr)) {
          dockerError = "Docker engine is not running. Please start Docker Desktop or Docker service.";
          break;
        }
      }
      
      // Return error as a result object instead of rejecting
      if (code === 0) {
        // Success code but couldn't parse - this shouldn't happen, but handle it
        resolve({ 
          success: false, 
          error: dockerError || `Failed to parse response: ${stdout || stderr || 'No output'}`, 
          raw: stdout 
        });
      } else {
        // Non-zero exit code
        resolve({ 
          success: false, 
          error: dockerError || stderr || stdout || `Process exited with code ${code}`, 
          code: code 
        });
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

