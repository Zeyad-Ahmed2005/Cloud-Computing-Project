# Docker & VM Manager - Complete Documentation

A comprehensive cross-platform Electron desktop application for managing Docker containers/images and QEMU virtual machines with an intuitive, modern user interface.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack & Libraries](#technology-stack--libraries)
- [System Requirements](#system-requirements)
- [Installation Guide](#installation-guide)
- [Running the Application](#running-the-application)
- [User Manual](#user-manual)
- [Project Architecture](#project-architecture)
- [Development Process: Design Choices, Challenges, and Solutions](#development-process-design-choices-challenges-and-solutions)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Project Overview

**Docker & VM Manager** is a desktop application that provides a unified graphical interface for managing both Docker containers/images and QEMU virtual machines. It eliminates the need to use command-line tools, making container and VM management accessible to users of all technical levels.

### Key Highlights

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Modern UI**: Clean, tabbed interface with real-time updates
- **Docker Integration**: Full Docker management without CLI
- **Auto-Start Docker**: Automatically starts Docker engine when app launches
- **QEMU Integration**: Create and manage virtual machines
- **No CLI Required**: All operations through intuitive GUI

---

## Features

### Application Startup Features

- **Automatic Docker Engine Startup**: 
  - When the application launches, it automatically detects if Docker is running
  - If Docker is not running, it attempts to start it:
    - **Windows**: Launches Docker Desktop from common installation paths
    - **macOS**: Opens Docker.app using the `open` command
    - **Linux**: Attempts to start Docker service (may require manual intervention with sudo)
  - If Docker is already running, the app detects it and proceeds normally
  - Docker startup may take a few seconds - the app will wait and verify Docker is ready

### Docker Management Features

#### 1. **Image Management**
- **List Images**: View all Docker images with details (repository, tag, ID, creation date, size)
- **Search DockerHub**: Search for images on DockerHub with detailed results showing:
  - Image name and description
  - Star count
  - Official/Automated badges
  - Direct pull capability from search results
- **Pull Images**: Download images from DockerHub with progress tracking
- **Delete Images**: Remove images with force delete option for images in use
- **Local Image Search**: Search through locally stored images

#### 2. **Container Management**
- **List Containers**: View all containers (running and stopped) with:
  - Container ID, image, command
  - Creation date and status
  - Container names
- **Create Containers**: Create new containers with:
  - Image selection (dropdown or manual entry)
  - Custom container name
  - Port mappings (comma-separated, e.g., "8080:80,3306:3306")
  - Environment variables (one per line)
- **Start/Stop Containers**: Control container lifecycle
- **Delete Containers**: Remove containers with confirmation
- **Container Details**: View detailed information including:
  - **Logs**: Last 500 lines of container logs
  - **Statistics**: Real-time resource usage (CPU, memory, network, disk I/O)

#### 3. **Dockerfile Editor**
- **Code Editor**: Built-in text editor for creating/editing Dockerfiles
- **Save Dockerfiles**: Save to custom locations
- **Build Images**: Build Docker images directly from the editor
- **Path Selection**: Browse and select directories for Dockerfiles

### Virtual Machine Management Features

#### 1. **VM Operations**
- **List Running VMs**: View all active QEMU virtual machines with:
  - Process ID (PID)
  - VM name
  - Command-line arguments
- **Create VMs**: Start virtual machines with:
  - Customizable CPU cores (minimum 1, must be positive integer)
  - RAM size (in MB, minimum 1 MB, must be positive integer)
  - Disk image path (supports multiple formats: qcow2, raw, vmdk, vhdx, vdi, img)
  - Optional ISO image for OS installation
  - **Input Validation**: All numeric inputs are validated to prevent negative numbers
- **Stop VMs**: Gracefully terminate running virtual machines
- **Delete VM Disks**: Remove VM disk images from disk

#### 2. **Disk Image Management**
- **Create Disk Images**: Generate new QEMU disk images in qcow2 format
- **Custom Sizes**: Specify disk size (e.g., "10G", "500M", "1T")
- **Size Validation**: Disk size must be a positive number with valid format
- **Directory Support**: Automatically detect disk images in directories

#### 3. **VM Configuration**
- **Load Configurations**: Import VM settings from JSON files
- **Save Configurations**: Export VM settings to JSON
- **Batch Creation**: Create multiple VMs from a single configuration file
- **Configuration Editor**: Built-in JSON editor for VM configurations

### User Interface Features

- **Tabbed Interface**: Switch between Docker and VM management
- **Real-time Status**: Status indicator showing current operation
- **Toast Notifications**: Non-intrusive notifications for all operations
- **Auto-refresh**: Automatic data refresh every 3 minutes
- **Modal Dialogs**: User-friendly input dialogs and result displays
- **Responsive Design**: Modern, clean interface with smooth animations
- **Docker Auto-Start**: Automatically starts Docker engine when application launches

---

## Technology Stack & Libraries

### Frontend Technologies

#### **Electron Framework**
- **Version**: 28.0.0
- **Purpose**: Cross-platform desktop application framework
- **Key Features Used**:
  - BrowserWindow for main application window
  - IPC (Inter-Process Communication) for secure frontend-backend communication
  - Context Isolation for security
  - File dialogs for user file selection
  - Process management for Python backend execution

#### **HTML5, CSS3, JavaScript (ES6+)**
- **Purpose**: User interface and frontend logic
- **Features**:
  - Modern ES6+ JavaScript (async/await, Promises, arrow functions)
  - CSS Grid and Flexbox for layout
  - CSS Variables for theming
  - DOM manipulation and event handling

### Backend Technologies

#### **Python 3.6+**
- **Purpose**: Backend API for Docker and QEMU operations
- **Key Modules Used**:
  - `subprocess`: Execute Docker and QEMU commands
  - `json`: Parse and format JSON responses
  - `os`: File system operations
  - `platform`: Platform detection
  - `argparse`: Command-line argument parsing

#### **psutil Library**
- **Version**: >= 5.9.0
- **Purpose**: Process and system utilities
- **Usage**:
  - List running QEMU processes
  - Get process information (PID, name, command line)
  - Terminate VM processes gracefully
- **Installation**: `pip install psutil>=5.9.0`

### Build Tools

#### **electron-builder**
- **Version**: ^24.9.1
- **Purpose**: Package and build Electron applications
- **Features**:
  - Cross-platform builds (Windows, macOS, Linux)
  - Automatic dependency bundling
  - Installer generation
  - Code signing support (disabled in current config)

### External Dependencies

#### **Docker**
- **Purpose**: Container management
- **Requirements**:
  - Docker Desktop (Windows/macOS) or Docker Engine (Linux)
  - Docker CLI must be accessible from command line
- **Commands Used**:
  - `docker image ls`, `docker container ls`, `docker ps`
  - `docker pull`, `docker build`, `docker create`
  - `docker start`, `docker stop`, `docker rm`, `docker rmi`
  - `docker logs`, `docker stats`, `docker search`

#### **QEMU**
- **Purpose**: Virtual machine emulation
- **Requirements**:
  - QEMU installed and in system PATH
  - `qemu-system-x86_64` binary available
  - `qemu-img` for disk image creation
- **Platform-Specific Installation**:
  - **Windows**: Download from QEMU website or use Chocolatey
  - **macOS**: `brew install qemu`
  - **Linux**: `sudo apt-get install qemu-system-x86` (Ubuntu/Debian)

### Node.js Dependencies

#### **Development Dependencies**
```json
{
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1"
}
```

#### **Python Dependencies**
```
psutil>=5.9.0
```

---

## System Requirements

### Minimum Requirements

- **Operating System**: 
  - Windows 10 or later
  - macOS 10.13 (High Sierra) or later
  - Linux (Ubuntu 18.04+, Debian 10+, Fedora 30+, or equivalent)

- **Python**: Version 3.6 or higher
  - Python must be in system PATH
  - On Windows, `python`, `python3`, or `py` command must work
  - On macOS/Linux, `python3` command must work

- **Node.js**: Version 16 or higher
  - npm (Node Package Manager) included

- **Docker**: 
  - Docker Desktop 4.0+ (Windows/macOS)
  - Docker Engine 20.10+ (Linux)
  - Docker daemon must be running

- **QEMU**: 
  - QEMU 5.0 or higher
  - `qemu-system-x86_64` and `qemu-img` binaries in PATH

- **Disk Space**: 
  - Minimum 500 MB for application
  - Additional space for Docker images and VM disk images

- **RAM**: 
  - Minimum 4 GB (8 GB recommended for running VMs)

---

## Installation Guide

### Step 1: Install Prerequisites

#### Install Python
1. **Windows**:
   - Download from [python.org](https://www.python.org/downloads/)
   - Check "Add Python to PATH" during installation
   - Verify: Open Command Prompt and run `python --version`

2. **macOS**:
   ```bash
   # Using Homebrew (recommended)
   brew install python3
   
   # Or download from python.org
   ```

3. **Linux**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install python3 python3-pip
   
   # Fedora
   sudo dnf install python3 python3-pip
   ```

#### Install Node.js
1. Download from [nodejs.org](https://nodejs.org/)
2. Install the LTS version
3. Verify: `node --version` and `npm --version`

#### Install Docker
1. **Windows/macOS**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. **Linux**: 
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

#### Install QEMU
1. **Windows**: 
   - Download from [QEMU website](https://www.qemu.org/download/#windows)
   - Or use Chocolatey: `choco install qemu`
   - Add QEMU to PATH: Add `C:\Program Files\qemu` to system PATH

2. **macOS**:
   ```bash
   brew install qemu
   ```

3. **Linux**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install qemu-system-x86 qemu-utils
   
   # Fedora
   sudo dnf install qemu-system-x86 qemu-img
   ```

### Step 2: Clone/Download the Project

```bash
# If using Git
git clone <repository-url>
cd Cloud-Computing-Project

# Or download and extract the ZIP file
```

### Step 3: Install Python Dependencies

```bash
# From project root
   pip install -r requirements.txt

# Or use pip3
pip3 install -r requirements.txt
```

### Step 4: Install Node.js Dependencies

```bash
cd electron-app
npm install
```

### Step 5: Verify Installation

1. **Verify Docker**:
   ```bash
   docker ps
   # Should show running containers or empty list (not an error)
   ```

2. **Verify QEMU**:
   ```bash
   qemu-system-x86_64 --version
   qemu-img --version
   ```

3. **Verify Python**:
   ```bash
   python --version  # or python3
   ```

---

## Running the Application

### Development Mode

```bash
cd electron-app
npm start
```

The application will open in a window with developer tools enabled (in development mode).

### Building for Distribution

#### Build for Current Platform
```bash
cd electron-app
npm run build
```

#### Build for Specific Platforms
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Built applications will be in the `electron-app/dist` directory:
- **Windows**: Portable executable or NSIS installer
- **macOS**: DMG file
- **Linux**: AppImage, DEB, or RPM package

---

## User Manual

### Getting Started

1. **Launch the Application**
   - Double-click the executable or run `npm start` in development
   - **Docker Engine Auto-Start**: The application automatically attempts to start Docker when it opens
     - On Windows/macOS: Launches Docker Desktop if not already running
     - On Linux: Attempts to start Docker service (may require manual start with sudo)
     - If Docker is already running, it will be detected automatically
   - The application opens with the Docker tab active

2. **Check Status Indicator**
   - Top-right corner shows current status
   - Green dot = Ready/Success
   - Red dot = Error
   - Note: Docker may take a few seconds to fully start after the app launches

### Docker Tab - Complete Guide

#### Viewing Images

1. **Refresh Images List**:
   - Click the "Refresh" button in the Images section
   - Images table displays: Repository, Tag, Image ID, Created date, Size

2. **Search DockerHub**:
   - Click "Search DockerHub" button
   - Enter image name (e.g., "ubuntu", "nginx", "postgres")
   - Results show in a modal with:
     - Image name with official/automated badges
     - Description
     - Star count
     - "Pull Image" button for each result
   - Click "Pull Image" to download directly from search results

3. **Pull an Image**:
   - Click "Pull Image" button
   - Enter full image name with tag (e.g., `ubuntu:latest`, `nginx:alpine`)
   - Wait for download (progress shown in status)
   - Image appears in list after completion

4. **Delete an Image**:
   - Click "Delete" button next to image
   - Confirm deletion
   - If image is in use, you'll be prompted to force delete

#### Managing Containers

1. **View Containers**:
   - Click "Refresh" in Containers section
   - Table shows: ID, Image, Command, Created, Status, Names, Actions
   - Status badges: Green (running), Red (stopped), Yellow (exited)

2. **Create a Container**:
   - Click "Create Container" button
   - Fill in the form:
     - **Image**: Select from dropdown or type manually (e.g., `ubuntu:latest`)
     - **Name**: Optional container name (e.g., `my-container`)
     - **Ports**: Comma-separated mappings (e.g., `8080:80,3306:3306`)
     - **Environment Variables**: One per line (e.g., `MYSQL_ROOT_PASSWORD=secret`)
   - Click "Create"
   - Container appears in list (stopped by default)

3. **Start a Container**:
   - Find container in list
   - Click "Start" button (green)
   - Status changes to "Up"

4. **Stop a Container**:
   - Find running container
   - Click "Stop" button (yellow)
   - Status changes to "Exited"

5. **View Container Details**:
   - Click "Details" button
   - Modal opens with two tabs:
     - **Logs Tab**: Last 500 lines of container output
     - **Stats Tab**: Real-time resource usage (JSON format)
       - CPU usage percentage
       - Memory usage (current, limit)
       - Network I/O (bytes sent/received)
       - Block I/O (read/write operations)

6. **Delete a Container**:
   - Click "Delete" button (red)
   - Confirm deletion
   - Container must be stopped first (or use force delete)

#### Using the Dockerfile Editor

1. **Open Dockerfile Editor**:
   - Scroll to "Dockerfile Editor" section in Docker tab

2. **Write Dockerfile**:
   - Type or paste Dockerfile content
   - Example:
     ```dockerfile
     FROM ubuntu:latest
     RUN apt-get update && apt-get install -y nginx
     EXPOSE 80
     CMD ["nginx", "-g", "daemon off;"]
     ```

3. **Save Dockerfile**:
   - Enter path in "Dockerfile Path" field or click folder icon to browse
   - Click "Save Dockerfile"
   - File is saved to specified location

4. **Build Image from Dockerfile**:
   - Enter Dockerfile path (or use saved path)
   - Enter image tag (e.g., `my-nginx:1.0`)
   - Click "Build Image"
   - Wait for build to complete (button shows "Building..." during process)
   - Built image appears in Images list

### Virtual Machines Tab - Complete Guide

#### Creating a Virtual Machine

1. **Prepare Disk Image** (if needed):
   - Enter disk path (or click folder icon to browse)
   - Enter size (e.g., `10G`, `500M`, `1T`)
     - Size must be a positive number
     - Format: number followed by optional unit (K, M, G, T)
     - Examples: `10G`, `500M`, `1.5T`
     - Negative numbers are automatically rejected
   - Click "Create Disk Image"
   - Wait for creation to complete

2. **Start a VM**:
   - Fill in VM creation form:
     - **CPU Cores**: Number of CPU cores (e.g., `2`, `4`)
       - Must be a positive integer (minimum 1)
       - Negative numbers are automatically rejected
     - **RAM Size**: Memory in MB (e.g., `2048` for 2GB)
       - Must be a positive integer (minimum 1 MB)
       - Negative numbers are automatically rejected
     - **Disk Path**: Path to disk image file or directory
     - **ISO Path** (optional): Path to OS installation ISO
   - Click "Start VM"
   - Input validation ensures all values are valid before submission
   - VM window opens (QEMU display)
   - VM appears in "Running VMs" list

3. **Using ISO for Installation**:
   - Select ISO file using folder icon
   - VM will boot from ISO first
   - Install OS as normal
   - After installation, VM will boot from disk

#### Managing Virtual Machines

1. **View Running VMs**:
   - Click "Refresh" in Running VMs section
   - Table shows: PID, Name, Command, Actions

2. **Stop a VM**:
   - Click "Stop" button next to VM
   - Confirm stop action
   - VM process terminates gracefully

3. **Delete VM Disk**:
   - Use QEMU command line or delete file manually
   - Note: This permanently deletes the VM's disk image

#### VM Configuration Management

1. **Load Configuration**:
   - Click "Load Config" button
   - Select JSON configuration file
   - Configuration loads into editor and form fields
   - **Validation**: All numeric values (cpu_cores, ram_size) are validated
     - Must be positive integers (minimum 1)
     - Negative numbers are rejected with error messages
   - Example JSON format:
     ```json
     {
       "cpu_cores": 2,
       "ram_size": 2048,
       "disk_path": "/path/to/disk.qcow2",
       "iso_path": "/path/to/os.iso"
     }
     ```
   - For multiple VMs:
     ```json
     [
       {
         "cpu_cores": 2,
         "ram_size": 2048,
         "disk_path": "/path/to/vm1.qcow2"
       },
       {
         "cpu_cores": 4,
         "ram_size": 4096,
         "disk_path": "/path/to/vm2.qcow2"
       }
     ]
     ```
   - **Note**: Invalid values (negative numbers, zero, non-numeric) will be rejected

2. **Save Configuration**:
   - Edit configuration in JSON editor
   - Click "Save Config" button
   - Choose save location
   - Configuration saved for future use

3. **Create VM from Config**:
   - Load a configuration file
   - Click "Create VM from Config" button
   - All VMs in config are created and started

### Tips and Best Practices

1. **Docker**:
   - Always pull images before creating containers
   - Use meaningful container names for easier management
   - Check container logs if a container fails to start
   - Monitor container stats to optimize resource usage

2. **Virtual Machines**:
   - Create disk images before starting VMs (unless using ISO)
   - Use qcow2 format for better performance and space efficiency
   - Allocate sufficient RAM (at least 1GB for most OSes)
   - Keep ISO files for reinstalling OS if needed

3. **General**:
   - Use refresh buttons to update lists
   - Check status indicator for operation results
   - Read toast notifications for quick feedback
   - Auto-refresh occurs every 3 minutes

---

## Project Architecture

### Directory Structure

```
Cloud-Computing-Project/
├── backend/                    # Python backend files
│   ├── api.py                 # Main API wrapper (CLI interface)
│   ├── docker.py              # DockerManager class
│   └── qemu.py                # Qemu class
├── electron-app/              # Electron application
│   ├── main.js                # Main Electron process
│   ├── preload.js             # IPC bridge (context isolation)
│   ├── package.json           # Node.js dependencies and build config
│   ├── src/
│   │   ├── index.html         # Main UI structure
│   │   ├── styles.css         # Application styling
│   │   └── renderer.js        # Frontend logic and event handlers
│   └── dist/                  # Built application (generated)
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Renderer                    │
│  (HTML/CSS/JavaScript - User Interface)                 │
│  - index.html, styles.css, renderer.js                 │
└────────────────────┬────────────────────────────────────┘
                     │ IPC (via preload.js)
                     │
┌────────────────────▼────────────────────────────────────┐
│              Electron Main Process                      │
│  (main.js - Node.js)                                    │
│  - IPC handlers                                         │
│  - Python process spawner                               │
└────────────────────┬────────────────────────────────────┘
                     │ Spawn Python process
                     │
┌────────────────────▼────────────────────────────────────┐
│              Python Backend (api.py)                    │
│  - CLI argument parser                                  │
│  - Routes to DockerManager or Qemu                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌─────────▼────────┐
│ DockerManager  │      │      Qemu        │
│  (docker.py)   │      │    (qemu.py)     │
│                │      │                  │
│ - subprocess   │      │ - subprocess     │
│   docker CLI   │      │   qemu CLI       │
│ - JSON parsing │      │ - psutil         │
└────────────────┘      └──────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   External Tools        │
        │  - Docker CLI           │
        │  - QEMU binaries        │
        └─────────────────────────┘
```

### Data Flow

1. **User Action** → Frontend (renderer.js)
2. **Frontend** → IPC call via `window.electronAPI`
3. **Preload** → Forwards to main process via `ipcRenderer.invoke`
4. **Main Process** → Spawns Python process with arguments
5. **Python API** → Parses arguments, calls appropriate class method
6. **DockerManager/Qemu** → Executes subprocess commands
7. **Response** → JSON string returned through all layers
8. **Frontend** → Updates UI with results

### Security Features

- **Context Isolation**: Preload script isolates Node.js from renderer
- **No Node Integration**: Renderer cannot access Node.js directly
- **Controlled API**: Only specific functions exposed via contextBridge
- **Input Validation**: Python backend validates all inputs
- **Error Handling**: Comprehensive error handling at all layers

---

## Development Process: Design Choices, Challenges, and Solutions

This section documents the key design decisions, challenges encountered, and solutions implemented during the development of Docker & VM Manager.

### Design Choices

#### 1. **Electron + Python Architecture**
**Decision**: Use Electron for the frontend and Python for backend operations.

**Rationale**:
- **Electron**: Provides cross-platform desktop application framework with native OS integration
- **Python**: Excellent subprocess management and system utilities (psutil) for Docker/QEMU operations
- **Separation of Concerns**: Frontend handles UI/UX, backend handles system operations
- **Security**: Isolated processes prevent direct system access from renderer process

**Trade-offs**:
- Requires spawning Python processes for each operation (slight performance overhead)
- Need to bundle Python backend with Electron app for distribution
- Cross-platform path handling complexity

#### 2. **IPC Communication Pattern**
**Decision**: Use Electron's IPC (Inter-Process Communication) with context isolation.

**Rationale**:
- **Security**: Context isolation prevents renderer from accessing Node.js directly
- **Type Safety**: Structured API through preload.js provides clear interface
- **Maintainability**: Centralized API definition in preload.js

**Implementation**:
- Preload script exposes `window.electronAPI` with structured methods
- Main process handles IPC and spawns Python processes
- JSON-based communication between all layers

#### 3. **Command-Line Interface for Python Backend**
**Decision**: Python backend uses CLI arguments instead of HTTP server or direct library import.

**Rationale**:
- **Simplicity**: No need for HTTP server or complex inter-process communication
- **Isolation**: Each operation runs in separate process, preventing state issues
- **Debugging**: Easy to test Python backend independently via command line
- **Resource Management**: Processes terminate after operation, freeing resources

**Trade-offs**:
- Process spawning overhead for each operation
- JSON parsing required at each layer
- Slightly more complex error handling across process boundaries

#### 4. **Subprocess-Based Docker/QEMU Operations**
**Decision**: Use subprocess calls to Docker CLI and QEMU binaries instead of native libraries.

**Rationale**:
- **Compatibility**: Works with any Docker/QEMU installation without additional dependencies
- **Reliability**: Uses official CLI tools that users already have
- **Maintenance**: No need to maintain bindings for multiple platforms
- **Feature Completeness**: Access to all Docker/QEMU features via CLI

**Trade-offs**:
- Requires Docker/QEMU to be installed and in PATH
- Error parsing from CLI output can be complex
- Less efficient than native libraries (but acceptable for this use case)

### Challenges Faced and Solutions

#### Challenge 1: Docker Engine Dependency

**Problem**: 
In the first version of the application, if Docker Engine was closed or not running, the application would fail to work. Users had to manually start Docker Desktop before launching the app, which created a poor user experience.

**Impact**:
- Users encountered errors when trying to use Docker features
- Required manual intervention before app could function
- Confusing error messages for non-technical users
- Reduced application usability

**Solution Implemented**:
Added automatic Docker Engine startup functionality that:
1. **Detection**: Checks if Docker is running on application launch using `docker ps` command
2. **Platform-Specific Startup**:
   - **Windows**: Automatically launches Docker Desktop from common installation paths
     - Checks multiple locations: Program Files, Program Files (x86), and LocalAppData
     - Uses `spawn` with detached process to start Docker Desktop in background
   - **macOS**: Uses `open -a Docker` command to launch Docker.app
   - **Linux**: Attempts to start Docker service using `systemctl --user start docker`
3. **Verification**: Waits and polls Docker until it's ready (with timeout)
4. **User Notification**: Sends IPC message to renderer when Docker is ready

**Implementation Details**:
- Function `startDockerEngine()` in `main.js` handles platform detection and startup
- Function `checkDockerRunning()` verifies Docker status
- Automatic startup occurs during application initialization
- Graceful fallback if auto-start fails (user can start manually)

**Result**:
- Seamless user experience - Docker starts automatically when needed
- No manual intervention required for most users
- Application works immediately after launch
- Clear status indicators show Docker startup progress

#### Challenge 2: Cross-Platform Path Handling

**Problem**: 
Different path formats across Windows, macOS, and Linux caused issues with file operations and Docker/QEMU command execution.

**Solution**:
- Used Node.js `path` module for all path operations
- Platform detection using `process.platform`
- Separate path handling logic for development vs. production builds
- Python backend uses `os.path` for cross-platform compatibility

#### Challenge 3: Python Executable Detection

**Problem**: 
Different platforms use different Python commands (`python`, `python3`, `py` on Windows).

**Solution**:
- Implemented `findPythonExecutable()` function that tries multiple commands
- Falls back gracefully if Python not found
- Provides clear error messages to users

#### Challenge 4: Process Management for QEMU VMs

**Problem**: 
Tracking and managing QEMU VM processes across different platforms, especially when VMs are started externally.

**Solution**:
- Used `psutil` library to list and manage QEMU processes
- Process filtering by command name (`qemu-system-x86_64`)
- Graceful termination using process signals
- Cross-platform process management through psutil abstraction

#### Challenge 5: Real-Time Container Statistics

**Problem**: 
Docker stats command provides streaming output, but we needed to capture single snapshots for display.

**Solution**:
- Used `docker stats --no-stream` for one-time statistics
- Implemented polling mechanism in frontend for periodic updates
- JSON parsing of Docker stats output
- Error handling for containers that stop during stats collection

#### Challenge 6: Input Validation

**Problem**: 
Users could enter invalid values (negative numbers, non-numeric strings) for CPU cores, RAM, and disk sizes.

**Solution**:
- Frontend validation with immediate feedback
- Backend validation in Python before executing commands
- Clear error messages for invalid inputs
- Prevention of negative numbers and zero values where inappropriate

#### Challenge 7: Error Handling Across Process Boundaries

**Problem**: 
Errors from Python subprocess, Docker CLI, or QEMU needed to be properly propagated to the frontend.

**Solution**:
- Consistent JSON error format: `{success: false, error: "message"}`
- Try-catch blocks at all layers
- Error message parsing from CLI output
- User-friendly error messages in UI
- Status indicators show operation results

#### Challenge 8: Production Build Path Resolution

**Problem**: 
File paths differ between development (relative paths) and production builds (packaged in resources folder).

**Solution**:
- `getApiScriptPath()` function detects build mode using `app.isPackaged`
- Development: Uses relative paths to `backend/` folder
- Production: Uses `process.resourcesPath` for bundled files
- Same logic applied to all backend file references

### Lessons Learned

1. **User Experience First**: The Docker auto-start feature significantly improved usability. Always consider the user's workflow when designing features.

2. **Platform Differences Matter**: Cross-platform development requires careful testing on all target platforms. Path handling, process management, and system integration vary significantly.

3. **Error Handling is Critical**: Comprehensive error handling at every layer prevents confusing user experiences and aids debugging.

4. **Process Isolation Benefits**: Using separate processes for backend operations provides better resource management and prevents state issues, despite slight performance overhead.

5. **CLI Tools are Reliable**: Using official CLI tools (Docker, QEMU) instead of libraries provides better compatibility and feature access, though requires more output parsing.

6. **Automatic Detection and Recovery**: Features like Docker auto-start that detect and fix common issues greatly improve user experience.

---

## API Documentation

### Electron IPC API (via preload.js)

#### Docker API

```javascript
// List all Docker images
await window.electronAPI.docker.listImages()
// Returns: { success: boolean, data: Array, error?: string }

// List all containers (including stopped)
await window.electronAPI.docker.listContainers()
// Returns: { success: boolean, data: Array, error?: string }

// List only running containers
await window.electronAPI.docker.listRunningContainers()
// Returns: { success: boolean, data: Array, error?: string }

// Create a Dockerfile
await window.electronAPI.docker.createDockerfile(path, code)
// path: string, code: string
// Returns: { success: boolean, message?: string, path?: string, error?: string }

// Build Docker image
await window.electronAPI.docker.buildImage(path, tag)
// path: string (Dockerfile path or directory), tag: string
// Returns: { success: boolean, message?: string, output?: string, error?: string }

// Stop container
await window.electronAPI.docker.stopContainer(id)
// id: string (container ID or name)
// Returns: { success: boolean, message?: string, error?: string }

// Start container
await window.electronAPI.docker.startContainer(id)
// Returns: { success: boolean, message?: string, error?: string }

// Create container
await window.electronAPI.docker.createContainer(image, name, ports, envVars)
// image: string, name?: string, ports?: string[], envVars?: string[]
// Returns: { success: boolean, message?: string, container_id?: string, error?: string }

// Delete container
await window.electronAPI.docker.deleteContainer(id, force)
// id: string, force: boolean
// Returns: { success: boolean, message?: string, error?: string, details?: string }

// Delete image
await window.electronAPI.docker.deleteImage(id, force)
// Returns: { success: boolean, message?: string, error?: string, details?: string }

// Get container logs
await window.electronAPI.docker.getContainerLogs(id, tail)
// id: string, tail: number (default 100)
// Returns: { success: boolean, logs?: string, error?: string }

// Get container statistics
await window.electronAPI.docker.getContainerStats(id)
// Returns: { success: boolean, stats?: object, error?: string }

// Search DockerHub
await window.electronAPI.docker.searchDockerhub(name)
// Returns: { success: boolean, data?: Array, error?: string }

// Pull image from DockerHub
await window.electronAPI.docker.pullImage(name)
// Returns: { success: boolean, message?: string, output?: string, error?: string }

// Search local images
await window.electronAPI.docker.searchImageLocal(name)
// Returns: { success: boolean, data?: Array, error?: string }
```

#### QEMU API

```javascript
// Start virtual machine
await window.electronAPI.qemu.startVM(cpuCores, ramSize, diskPath, isoPath)
// cpuCores: number, ramSize: number (MB), diskPath: string, isoPath?: string
// Returns: { success: boolean, message?: string, pid?: number, command?: string, error?: string }

// Create VM from configuration file
await window.electronAPI.qemu.createVMFromConfig(configFilePath)
// Returns: { success: boolean, results?: Array, error?: string }

// Delete VM disk image
await window.electronAPI.qemu.deleteVM(diskPath)
// Returns: { success: boolean, message?: string, error?: string }

// List running VMs
await window.electronAPI.qemu.listRunningVMs()
// Returns: { success: boolean, data?: Array, error?: string }

// Stop VM
await window.electronAPI.qemu.stopVM(pid)
// Returns: { success: boolean, message?: string, error?: string }

// Create disk image
await window.electronAPI.qemu.createDiskImage(imagePath, size)
// imagePath: string, size: string (e.g., "10G")
// Returns: { success: boolean, message?: string, output?: string, error?: string }
```

#### Dialog API

```javascript
// Open file dialog
await window.electronAPI.dialog.openFile(options)
// options: { title, filters, properties }
// Returns: { canceled: boolean, filePaths?: string[] }

// Save file dialog
await window.electronAPI.dialog.saveFile(options)
// Returns: { canceled: boolean, filePath?: string }
```

#### File API

```javascript
// Read file
await window.electronAPI.file.read(filePath)
// Returns: { success: boolean, content?: string, error?: string }

// Write file
await window.electronAPI.file.write(filePath, content)
// Returns: { success: boolean, error?: string }
```

### Python Backend API

#### Command-Line Interface

```bash
python api.py --service <docker|qemu> --action <action_name> --args <json_string>
```

#### DockerManager Class Methods

All methods return JSON strings with `{success: boolean, ...}` format.

- `list_images()` - List all Docker images
- `list_containers()` - List all containers
- `list_running_containers()` - List running containers only
- `create_dockerfile(path, code)` - Create Dockerfile
- `build_image(path, tag)` - Build image from Dockerfile
- `stop_container(id)` - Stop container
- `start_container(id)` - Start container
- `create_container(image, name, ports, env_vars)` - Create new container
- `delete_container(id, force)` - Delete container
- `delete_image(id, force)` - Delete image
- `get_container_logs(id, tail)` - Get container logs
- `get_container_stats(id)` - Get container statistics
- `search_dockerhub(name)` - Search DockerHub
- `pull_image(name)` - Pull image from DockerHub
- `search_image_local(name)` - Search local images

#### Qemu Class Methods

All methods return JSON strings with `{success: boolean, ...}` format.

- `start_virtual_machine(cpu_cores, ram_size, disk_path, iso_path)` - Start VM
- `create_vm_from_config(config_file_path)` - Create VM(s) from JSON config
- `delete_vm(disk_path)` - Delete VM disk image
- `list_running_vms()` - List running QEMU processes
- `stop_vm(pid)` - Stop VM by PID
- `create_disk_image(path, size)` - Create disk image

---

## Development Guide

### Setting Up Development Environment

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd Cloud-Computing-Project
   ```

2. **Install Dependencies**:
   ```bash
   # Python
   pip install -r requirements.txt
   
   # Node.js
   cd electron-app
   npm install
   ```

3. **Run in Development Mode**:
   ```bash
   cd electron-app
   npm start
   ```

### Project Structure Details

#### Backend (`backend/`)

- **`api.py`**: Entry point for Python backend
  - Parses command-line arguments
  - Routes to DockerManager or Qemu
  - Returns JSON responses

- **`docker.py`**: DockerManager class
  - Wraps Docker CLI commands
  - Handles JSON parsing
  - Error handling and validation

- **`qemu.py`**: Qemu class
  - QEMU binary detection
  - VM process management
  - Disk image operations

#### Frontend (`electron-app/src/`)

- **`index.html`**: UI structure
  - Tab navigation
  - Tables for images/containers/VMs
  - Modals for dialogs
  - Forms for creation

- **`styles.css`**: Styling
  - CSS variables for theming
  - Responsive layout
  - Animations and transitions

- **`renderer.js`**: Frontend logic
  - Event handlers
  - API calls
  - UI updates
  - Error handling

#### Electron (`electron-app/`)

- **`main.js`**: Main process
  - Window creation
  - IPC handlers
  - Python process spawning
  - File operations

- **`preload.js`**: Security bridge
  - Exposes safe API to renderer
  - Context isolation

### Adding New Features

#### Adding a New Docker Feature

1. **Add method to `DockerManager`** (`backend/docker.py`):
   ```python
   def new_feature(self, param):
       try:
           result = subprocess.run(['docker', 'command'], ...)
           return json.dumps({"success": True, "data": result})
       except Exception as e:
           return json.dumps({"success": False, "error": str(e)})
   ```

2. **Add action handler in `api.py`**:
   ```python
   elif action == 'new_feature':
       result = manager.new_feature(params.get('param'))
   ```

3. **Add IPC handler in `main.js`**:
   ```javascript
   ipcMain.handle('docker:newFeature', async (event, param) => {
     return await execPythonAPI('docker', 'new_feature', { param });
   });
   ```

4. **Expose in `preload.js`**:
   ```javascript
   docker: {
     newFeature: (param) => ipcRenderer.invoke('docker:newFeature', param)
   }
   ```

5. **Use in `renderer.js`**:
   ```javascript
   const result = await window.electronAPI.docker.newFeature(param);
   ```

### Building and Distribution

#### Build Configuration

Edit `electron-app/package.json` build section:

```json
{
  "build": {
    "appId": "com.dockervm.manager",
    "productName": "Docker & VM Manager",
    "files": ["main.js", "preload.js", "src/**/*"],
    "extraResources": [
      { "from": "../backend/docker.py", "to": "docker.py" },
      { "from": "../backend/qemu.py", "to": "qemu.py" },
      { "from": "../backend/api.py", "to": "api.py" },
      { "from": "../requirements.txt", "to": "requirements.txt" }
    ]
  }
}
```

#### Build Commands

```bash
# Development build
npm run build

# Platform-specific builds
npm run build:win
npm run build:mac
npm run build:linux
```

### Testing

1. **Test Docker Features**:
   - Ensure Docker is running
   - Test with sample images (ubuntu, nginx)
   - Verify error handling

2. **Test QEMU Features**:
   - Ensure QEMU is installed
   - Test with small disk images
   - Verify process management

3. **Test Cross-Platform**:
   - Test on Windows, macOS, Linux
   - Verify path handling
   - Test file dialogs

---

## Troubleshooting

### Common Issues and Solutions

#### Python Not Found

**Symptoms**: Error message "Python not found" or "Failed to start Python"

**Solutions**:
- **Windows**: 
  - Use `py` command instead of `python`
  - Add Python to PATH: System Properties → Environment Variables
  - Reinstall Python with "Add to PATH" checked
- **macOS/Linux**: 
  - Use `python3` explicitly
  - Install Python via package manager
  - Verify: `which python3`

#### Docker Not Working

**Symptoms**: "Docker not found" or "Cannot connect to Docker daemon"

**Solutions**:
- **Auto-Start Feature**: The app attempts to start Docker automatically on launch
  - If auto-start fails, you may need to start Docker manually
  - Wait a few seconds after app launch for Docker to fully initialize
- **Windows/macOS**: 
  - Start Docker Desktop manually if auto-start didn't work
  - Wait for Docker to fully start (whale icon in system tray)
  - Verify: `docker ps` in terminal
  - Common Docker Desktop locations:
    - Windows: `C:\Program Files\Docker\Docker\Docker Desktop.exe`
    - macOS: `/Applications/Docker.app`
- **Linux**: 
  - Start Docker service: `sudo systemctl start docker`
  - Add user to docker group: `sudo usermod -aG docker $USER`
  - Log out and back in
  - Verify: `docker ps`
  - Note: Auto-start on Linux may require sudo permissions

#### QEMU Not Found

**Symptoms**: "QEMU not found" or "qemu-system-x86_64: command not found"

**Solutions**:
- **Windows**: 
  - Download QEMU from official website
  - Add QEMU bin directory to PATH
  - Restart application
- **macOS**: 
  - Install via Homebrew: `brew install qemu`
  - Verify: `qemu-system-x86_64 --version`
- **Linux**: 
  - Install: `sudo apt-get install qemu-system-x86 qemu-utils`
  - Verify: `qemu-system-x86_64 --version`

#### psutil Installation Issues

**Symptoms**: "ModuleNotFoundError: No module named 'psutil'"

**Solutions**:
- Install psutil: `pip install psutil`
- Use pip3: `pip3 install psutil`
- Install build tools:
  - **Windows**: Install Visual C++ Build Tools
  - **macOS**: `xcode-select --install`
  - **Linux**: `sudo apt-get install python3-dev`

#### Container/Image Operations Fail

**Symptoms**: Docker operations return errors

**Solutions**:
- Check Docker daemon is running
- Verify Docker permissions (Linux)
- Check container/image IDs are correct
- Stop containers before deleting
- Remove containers before deleting images

#### VM Won't Start

**Symptoms**: VM creation fails or VM window doesn't open

**Solutions**:
- Verify disk image exists
- Check disk image path is correct
- Ensure sufficient disk space
- Verify QEMU is in PATH
- Check CPU/RAM values are valid numbers
- For new VMs, provide ISO image

#### Build Errors

**Symptoms**: `npm run build` fails

**Solutions**:
- Clear node_modules: `rm -rf node_modules && npm install`
- Update electron-builder: `npm install electron-builder@latest`
- Check Node.js version (16+)
- Clear build cache: `rm -rf dist`

#### Application Crashes

**Symptoms**: Application closes unexpectedly

**Solutions**:
- Check console for error messages (DevTools)
- Verify all dependencies are installed
- Check system requirements
- Try running in development mode for detailed errors
- Check Python/Docker/QEMU are accessible

### Getting Help

1. **Check Logs**:
   - Development mode: Check terminal output
   - Built app: Check console (if DevTools enabled)

2. **Verify Prerequisites**:
   - Python: `python --version`
   - Node.js: `node --version`
   - Docker: `docker --version`
   - QEMU: `qemu-system-x86_64 --version`

3. **Test Components Individually**:
   - Test Docker CLI directly
   - Test QEMU directly
   - Test Python backend: `python backend/api.py --service docker --action list_images`

---

## License

MIT License

---

## 🙏 Acknowledgments

- **Electron**: Cross-platform desktop framework
- **Docker**: Container platform
- **QEMU**: Virtual machine emulator
- **psutil**: Python system and process utilities

---

## 📝 Version History

- **v1.0.0**: Initial release
- Docker image and container management
- QEMU virtual machine management
- Dockerfile editor
  - Container logs and statistics
  - Cross-platform support

---

## 🔮 Future Enhancements

Potential features for future versions:

- Docker Compose support
- VM snapshots
- Container resource limits
- Network management
- Volume management
- Image tagging and versioning
- Export/import functionality
- Dark mode theme
- Multi-language support

---

**For questions, issues, or contributions, please refer to the project repository.**
