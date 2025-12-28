// Tab Management
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Refresh data when switching tabs
        if (tabName === 'docker') {
            loadImages();
            loadContainers();
        } else if (tabName === 'vm') {
            loadRunningVMs();
        }
    });
});

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Input Dialog System (replacement for prompt())
let inputDialogResolve = null;

function showInputDialog(title, label, placeholder = '', defaultValue = '') {
    console.log('showInputDialog called with:', { title, label, placeholder, defaultValue });
    return new Promise((resolve) => {
        const modal = document.getElementById('inputDialogModal');
        if (!modal) {
            console.error('inputDialogModal element not found!');
            resolve(null);
            return;
        }
        
        const titleEl = document.getElementById('inputDialogTitle');
        const labelEl = document.getElementById('inputDialogLabel');
        const inputEl = document.getElementById('inputDialogInput');
        const okBtn = document.getElementById('inputDialogOk');
        const cancelBtn = document.getElementById('inputDialogCancel');
        
        if (!titleEl || !labelEl || !inputEl || !okBtn || !cancelBtn) {
            console.error('Input dialog elements missing!', { titleEl: !!titleEl, labelEl: !!labelEl, inputEl: !!inputEl, okBtn: !!okBtn, cancelBtn: !!cancelBtn });
            resolve(null);
            return;
        }
        
        // Store resolve function
        inputDialogResolve = resolve;
        
        titleEl.textContent = title;
        labelEl.textContent = label;
        inputEl.placeholder = placeholder;
        inputEl.value = defaultValue;
        
        const handleOk = () => {
            const value = inputEl.value.trim();
            modal.classList.remove('active');
            inputDialogResolve = null;
            resolve(value || null);
        };
        
        const handleCancel = () => {
            modal.classList.remove('active');
            inputDialogResolve = null;
            resolve(null);
        };
        
        // Remove old listeners and add new ones
        okBtn.replaceWith(okBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        const newOkBtn = document.getElementById('inputDialogOk');
        const newCancelBtn = document.getElementById('inputDialogCancel');
        
        newOkBtn.onclick = handleOk;
        newCancelBtn.onclick = handleCancel;
        
        inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') {
                handleOk();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        modal.classList.add('active');
        setTimeout(() => {
            inputEl.focus();
            inputEl.select();
        }, 100);
    });
}

// Update Status Indicator
function updateStatus(message, isError = false) {
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');
    statusText.textContent = message;
    statusDot.style.backgroundColor = isError ? '#dc3545' : '#28a745';
}

// Track ongoing search to cancel if needed
let currentSearchPromise = null;

// Show DockerHub Search Results in Modal
function showSearchResults(results) {
    const modal = document.getElementById('searchResultsModal');
    const container = document.getElementById('searchResultsContainer');
    
    if (!modal || !container) {
        console.error('Search results modal elements not found');
        return;
    }
    
    // Clear any ongoing search
    currentSearchPromise = null;
    
    if (results.length === 0) {
        container.innerHTML = '<div class="loading">No results found</div>';
        modal.classList.add('active');
        return;
    }
    
    container.innerHTML = results.map((img, index) => {
        const name = img.name || img.NAME || 'Unknown';
        const description = img.description || img.DESCRIPTION || 'No description available';
        const stars = img.star_count || img.STAR_COUNT || 0;
        const official = img.is_official || img.IS_OFFICIAL || false;
        const automated = img.is_automated || img.IS_AUTOMATED || false;
        
        return `
            <div class="search-result-item" style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--primary-color);">
                            ${name}
                            ${official ? '<span style="background: var(--success-color); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">OFFICIAL</span>' : ''}
                            ${automated ? '<span style="background: var(--info-color); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">AUTOMATED</span>' : ''}
                        </h3>
                        <p style="margin: 0.5rem 0; color: var(--text-color); line-height: 1.5;">
                            ${description.length > 150 ? description.substring(0, 150) + '...' : description}
                        </p>
                        <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.9rem; color: var(--secondary-color);">
                            <span>⭐ ${stars.toLocaleString()} stars</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="pullImageFromSearch('${name.replace(/'/g, "\\'")}')" style="white-space: nowrap;">
                        Pull Image
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    modal.classList.add('active');
}

// Pull image from search results
async function pullImageFromSearch(imageName) {
    console.log('Pulling image from search:', imageName);
    
    // Close the search results modal
    document.getElementById('searchResultsModal').classList.remove('active');
    
    try {
        updateStatus(`Pulling image ${imageName}... This may take a while.`);
        showToast(`Starting to pull ${imageName}... Please wait.`, 'info');
        
        const result = await window.electronAPI.docker.pullImage(imageName);
        
        console.log('Pull result:', result);
        
        if (result && result.success) {
            showToast(`Image ${imageName} pulled successfully!`, 'success');
            updateStatus('Image pulled successfully');
            // Refresh images list after a short delay
            setTimeout(() => {
                loadImages();
            }, 1000);
        } else {
            const errorMsg = (result && (result.details || result.error)) || 'Unknown error occurred';
            console.error('Pull error:', errorMsg);
            showToast(`Error: ${errorMsg}`, 'error');
            updateStatus('Error pulling image', true);
        }
    } catch (error) {
        console.error('Pull exception:', error);
        showToast(`Error pulling image: ${error.message}`, 'error');
        updateStatus('Error pulling image', true);
    }
}

// Docker Functions
async function loadImages() {
    const tbody = document.getElementById('imagesTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading images...</td></tr>';
    
    try {
        updateStatus('Loading images...');
        const result = await window.electronAPI.docker.listImages();
        
        if (result.success && result.data) {
            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="loading">No images found</td></tr>';
            } else {
                tbody.innerHTML = result.data.map(img => `
                    <tr>
                        <td>${img.Repository || img.REPOSITORY || '-'}</td>
                        <td>${img.Tag || img.TAG || '-'}</td>
                        <td>${(img.Id || img.ID || '').substring(0, 12)}</td>
                        <td>${img.CreatedAt || img.CREATED || '-'}</td>
                        <td>${img.Size || img.SIZE || '-'}</td>
                        <td class="action-buttons">
                            <button class="btn btn-danger btn-small" onclick="deleteImage('${img.Id || img.ID}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
            updateStatus('Images loaded');
        } else {
            throw new Error(result.error || 'Failed to load images');
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="loading" style="color: var(--danger-color);">Error: ${error.message}</td></tr>`;
        updateStatus('Error loading images', true);
        showToast(`Error loading images: ${error.message}`, 'error');
    }
}

async function loadContainers() {
    const tbody = document.getElementById('containersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading containers...</td></tr>';
    
    try {
        updateStatus('Loading containers...');
        const result = await window.electronAPI.docker.listContainers();
        
        if (result.success && result.data) {
            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="loading">No containers found</td></tr>';
            } else {
                tbody.innerHTML = result.data.map(container => {
                    const status = container.Status || container.STATUS || 'unknown';
                    const statusClass = status.includes('Up') ? 'running' : 
                                       status.includes('Exited') ? 'exited' : 'stopped';
                    return `
                        <tr>
                            <td>${(container.Id || container.ID || '').substring(0, 12)}</td>
                            <td>${container.Image || container.IMAGE || '-'}</td>
                            <td>${(container.Command || container.COMMAND || '-').substring(0, 30)}</td>
                            <td>${container.CreatedAt || container.CREATED || '-'}</td>
                            <td style="vertical-align: middle; padding: 0.75rem;"><span class="status-badge status-${statusClass}">${status}</span></td>
                            <td style="padding: 0.75rem;">${container.Names || container.NAMES || '-'}</td>
                            <td class="action-buttons" style="vertical-align: middle; padding: 0.75rem;">
                                ${status.includes('Up') 
                                    ? `<button class="btn btn-warning btn-small" onclick="stopContainer('${container.Id || container.ID}')">Stop</button>`
                                    : `<button class="btn btn-success btn-small" onclick="startContainer('${container.Id || container.ID}')">Start</button>`
                                }
                                <button class="btn btn-danger btn-small" onclick="deleteContainer('${container.Id || container.ID}')">Delete</button>
                                <button class="btn btn-secondary btn-small" onclick="showContainerDetails('${container.Id || container.ID}', '${container.Names || container.NAMES || ''}')">Details</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
            updateStatus('Containers loaded');
        } else {
            throw new Error(result.error || 'Failed to load containers');
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading" style="color: var(--danger-color);">Error: ${error.message}</td></tr>`;
        updateStatus('Error loading containers', true);
        showToast(`Error loading containers: ${error.message}`, 'error');
    }
}

async function deleteImage(id, force = false) {
    const action = force ? 'force delete' : 'delete';
    if (!confirm(`Are you sure you want to ${action} image ${id.substring(0, 12)}?`)) return;
    
    try {
        updateStatus('Deleting image...');
        const result = await window.electronAPI.docker.deleteImage(id, force);
        if (result.success) {
            showToast('Image deleted successfully', 'success');
            loadImages();
        } else {
            // Show detailed error message
            const errorMsg = result.details || result.error;
            showToast(errorMsg, 'error');
            // If image is in use, offer to force delete
            if (errorMsg.includes('being used by') && !force) {
                if (confirm('Image is in use. Do you want to force delete it?')) {
                    await deleteImage(id, true);
                }
            }
        }
    } catch (error) {
        showToast(`Error deleting image: ${error.message}`, 'error');
        updateStatus('Error deleting image', true);
    }
}

async function stopContainer(id) {
    try {
        updateStatus('Stopping container...');
        const result = await window.electronAPI.docker.stopContainer(id);
        if (result.success) {
            showToast('Container stopped', 'success');
            loadContainers();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error stopping container: ${error.message}`, 'error');
        updateStatus('Error stopping container', true);
    }
}

async function startContainer(id) {
    try {
        updateStatus('Starting container...');
        const result = await window.electronAPI.docker.startContainer(id);
        
        if (result && result.success) {
            showToast('Container started', 'success');
            loadContainers();
        } else {
            const errorMsg = (result && (result.details || result.error)) || 'Unknown error occurred';
            showToast(`Error: ${errorMsg}`, 'error');
            updateStatus('Error starting container', true);
        }
    } catch (error) {
        console.error('Start container error:', error);
        const errorMsg = error.message || error.toString() || 'Unknown error occurred';
        showToast(`Error starting container: ${errorMsg}`, 'error');
        updateStatus('Error starting container', true);
    }
}

async function deleteContainer(id) {
    if (!confirm(`Are you sure you want to delete container ${id.substring(0, 12)}?`)) return;
    
    try {
        updateStatus('Deleting container...');
        const result = await window.electronAPI.docker.deleteContainer(id, false);
        if (result.success) {
            showToast('Container deleted', 'success');
            loadContainers();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error deleting container: ${error.message}`, 'error');
        updateStatus('Error deleting container', true);
    }
}

async function showContainerDetails(id, name) {
    const modal = document.getElementById('containerModal');
    const title = document.getElementById('containerModalTitle');
    title.textContent = `Container: ${name || id.substring(0, 12)}`;
    
    modal.classList.add('active');
    
    // Load logs by default
    loadContainerLogs(id);
    
    // Tab switching
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.modalTab;
            document.getElementById(`${tab}Tab`).classList.add('active');
            
            if (tab === 'logs') {
                loadContainerLogs(id);
            } else if (tab === 'stats') {
                loadContainerStats(id);
            }
        });
    });
}

async function loadContainerLogs(id) {
    const logsElement = document.getElementById('containerLogs');
    logsElement.textContent = 'Loading logs...';
    
    try {
        console.log('Loading logs for container:', id);
        const result = await window.electronAPI.docker.getContainerLogs(id, 500);
        console.log('Logs result:', result);
        console.log('Logs content:', result?.logs);
        
        if (result && result.success) {
            const logs = result.logs || '';
            // Always display the logs, even if they seem empty (might have whitespace)
            logsElement.textContent = logs;
            
            // Only show "no logs" message if logs are truly empty
            if (!logs || logs.trim() === '' || logs === 'No logs available for this container. The container may not have produced any output yet.') {
                logsElement.textContent = 'No logs available for this container. The container may not have produced any output yet.';
            }
        } else {
            const errorMsg = (result && result.error) || 'Unknown error occurred';
            logsElement.textContent = `Error: ${errorMsg}`;
            console.error('Logs error:', errorMsg, result);
        }
    } catch (error) {
        console.error('Logs exception:', error);
        const errorMsg = error.message || error.toString() || 'Failed to load logs';
        logsElement.textContent = `Error loading logs: ${errorMsg}`;
    }
}

async function loadContainerStats(id) {
    const statsElement = document.getElementById('containerStats');
    statsElement.textContent = 'Loading stats...';
    
    try {
        console.log('Loading stats for container:', id);
        const result = await window.electronAPI.docker.getContainerStats(id);
        console.log('Stats result:', result);
        
        if (result && result.success) {
            if (result.stats) {
                statsElement.textContent = JSON.stringify(result.stats, null, 2);
            } else {
                statsElement.textContent = 'No stats data available';
            }
        } else {
            const errorMsg = (result && result.error) || 'Unknown error occurred';
            statsElement.textContent = `Error: ${errorMsg}`;
            console.error('Stats error:', errorMsg);
        }
    } catch (error) {
        console.error('Stats exception:', error);
        const errorMsg = error.message || error.toString() || 'Failed to load stats';
        statsElement.textContent = `Error loading stats: ${errorMsg}`;
    }
}

// Wait for DOM to be fully loaded before attaching event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Check if buttons exist
    const searchBtn = document.getElementById('searchDockerhubBtn');
    const pullBtn = document.getElementById('pullImageBtn');
    
    if (!searchBtn) {
        console.error('searchDockerhubBtn not found!');
    }
    if (!pullBtn) {
        console.error('pullImageBtn not found!');
    }
    
    // Event Listeners
    const refreshImagesBtn = document.getElementById('refreshImages');
    const refreshContainersBtn = document.getElementById('refreshContainers');
    
    if (refreshImagesBtn) {
        refreshImagesBtn.addEventListener('click', loadImages);
    }
    if (refreshContainersBtn) {
        refreshContainersBtn.addEventListener('click', loadContainers);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            console.log('Search DockerHub button clicked');
            try {
                const name = await showInputDialog('Search DockerHub', 'Enter image name to search:', 'e.g., ubuntu');
                console.log('Input dialog returned:', name);
                if (!name) {
                    console.log('No name provided, cancelling');
                    return;
                }
                
                updateStatus('Searching DockerHub...');
                showToast(`Searching for ${name}...`, 'info');
                
                // Show loading state in modal
                const searchModal = document.getElementById('searchResultsModal');
                const searchContainer = document.getElementById('searchResultsContainer');
                if (searchModal && searchContainer) {
                    searchModal.classList.add('active');
                    searchContainer.innerHTML = '<div class="loading">Searching DockerHub...</div>';
                }
                
                // Store the search promise so we can track it
                const searchPromise = window.electronAPI.docker.searchDockerhub(name);
                currentSearchPromise = searchPromise;
                
                const result = await searchPromise;
                
                // Check if search was cancelled (promise changed)
                if (currentSearchPromise !== searchPromise) {
                    console.log('Search was cancelled');
                    if (searchModal) {
                        searchModal.classList.remove('active');
                    }
                    updateStatus('Search cancelled');
                    return;
                }
                
                currentSearchPromise = null;
                console.log('Search result:', result);
                
                if (result && result.success && result.data) {
                    if (result.data.length > 0) {
                        showSearchResults(result.data);
                    } else {
                        if (searchContainer) {
                            searchContainer.innerHTML = '<div class="loading">No results found</div>';
                        }
                        showToast('No results found', 'info');
                    }
                } else {
                    const errorMsg = (result && result.error) || 'Unknown error';
                    if (searchContainer) {
                        searchContainer.innerHTML = `<div class="loading" style="color: var(--danger-color);">Error: ${errorMsg}</div>`;
                    }
                    throw new Error(errorMsg);
                }
            } catch (error) {
                // Only show error if search wasn't cancelled
                if (currentSearchPromise) {
                    console.error('Search error:', error);
                    showToast(`Error searching: ${error.message}`, 'error');
                    const searchContainer = document.getElementById('searchResultsContainer');
                    if (searchContainer) {
                        searchContainer.innerHTML = `<div class="loading" style="color: var(--danger-color);">Error: ${error.message}</div>`;
                    }
                }
                currentSearchPromise = null;
            }
        });
    } else {
        console.error('searchDockerhubBtn not found!');
    }
    
    if (pullBtn) {
        pullBtn.addEventListener('click', async () => {
    const name = await showInputDialog('Pull Image', 'Enter image name to pull:', 'e.g., ubuntu:latest');
    if (!name) return;
    
    // Validate input
    if (!name.trim()) {
        showToast('Please enter a valid image name', 'error');
        return;
    }
    
    try {
        updateStatus(`Pulling image ${name}... This may take a while.`);
        showToast(`Starting to pull ${name}... Please wait.`, 'info');
        
        console.log('Pulling image:', name);
        
        const result = await window.electronAPI.docker.pullImage(name);
        
        console.log('Pull result:', result);
        
        if (result && result.success) {
            showToast(`Image ${name} pulled successfully!`, 'success');
            updateStatus('Image pulled successfully');
            // Refresh images list after a short delay
            setTimeout(() => {
                loadImages();
            }, 1000);
        } else {
            const errorMsg = (result && (result.details || result.error)) || 'Unknown error occurred';
            console.error('Pull error:', errorMsg);
            showToast(`Error: ${errorMsg}`, 'error');
            updateStatus('Error pulling image', true);
        }
    } catch (error) {
        console.error('Pull exception:', error);
        showToast(`Error pulling image: ${error.message}`, 'error');
        updateStatus('Error pulling image', true);
    }
        });
    } else {
        console.error('pullImageBtn not found!');
    }
}

// Other event listeners (not in setupEventListeners)
document.getElementById('saveDockerfileBtn').addEventListener('click', async () => {
    const code = document.getElementById('dockerfileEditor').value;
    let path = document.getElementById('dockerfilePath').value;
    
    if (!path) {
        const result = await window.electronAPI.dialog.saveFile({
            title: 'Save Dockerfile',
            defaultPath: 'Dockerfile',
            filters: [{ name: 'Dockerfile', extensions: [''] }]
        });
        if (result.canceled) return;
        path = result.filePath;
        document.getElementById('dockerfilePath').value = path;
    }
    
    if (!code.trim()) {
        showToast('Dockerfile is empty', 'error');
        return;
    }
    
    try {
        updateStatus('Saving Dockerfile...');
        const result = await window.electronAPI.docker.createDockerfile(path, code);
        if (result.success) {
            showToast('Dockerfile saved successfully', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error saving Dockerfile: ${error.message}`, 'error');
        updateStatus('Error saving Dockerfile', true);
    }
});

document.getElementById('buildImageBtn').addEventListener('click', async () => {
    const buildBtn = document.getElementById('buildImageBtn');
    const path = document.getElementById('dockerfilePath').value;
    const tag = document.getElementById('imageTag').value;
    
    if (!path || !tag) {
        showToast('Please provide Dockerfile path and image tag', 'error');
        return;
    }
    
    // Disable build button and show loading state
    buildBtn.disabled = true;
    buildBtn.textContent = 'Building...';
    buildBtn.style.opacity = '0.6';
    buildBtn.style.cursor = 'not-allowed';
    
    try {
        updateStatus('Building image...');
        const result = await window.electronAPI.docker.buildImage(path, tag);
        if (result && result.success) {
            showToast('Image built successfully', 'success');
            loadImages();
            
            // Reset form after successful build
            document.getElementById('dockerfileEditor').value = '';
            document.getElementById('dockerfilePath').value = '';
            document.getElementById('imageTag').value = '';
        } else {
            const errorMsg = (result && (result.details || result.error)) || 'Unknown error occurred';
            throw new Error(errorMsg);
        }
    } catch (error) {
        showToast(`Error building image: ${error.message}`, 'error');
        updateStatus('Error building image', true);
    } finally {
        // Re-enable build button
        buildBtn.disabled = false;
        buildBtn.textContent = 'Build Image';
        buildBtn.style.opacity = '1';
        buildBtn.style.cursor = 'pointer';
    }
});

document.getElementById('createContainerBtn').addEventListener('click', async () => {
    document.getElementById('createContainerModal').classList.add('active');
    // Load images into dropdown when modal opens
    await loadImagesForContainer();
});

// Load images into the container creation dropdown
async function loadImagesForContainer() {
    const select = document.getElementById('containerImageSelect');
    if (!select) return;
    
    // Keep the first option (placeholder)
    select.innerHTML = '<option value="">-- Select an image --</option>';
    
    try {
        const result = await window.electronAPI.docker.listImages();
        if (result && result.success && result.data) {
            result.data.forEach(img => {
                const repo = img.Repository || img.REPOSITORY || '<none>';
                const tag = img.Tag || img.TAG || '<none>';
                const imageName = repo !== '<none>' && tag !== '<none>' ? `${repo}:${tag}` : repo;
                const option = document.createElement('option');
                option.value = imageName;
                option.textContent = imageName;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading images for container:', error);
    }
}

// Refresh image list button and dropdown change handler
// Set up event listeners for container image selection
(function setupContainerImageHandlers() {
    const refreshImageListBtn = document.getElementById('refreshImageListBtn');
    if (refreshImageListBtn) {
        refreshImageListBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await loadImagesForContainer();
        });
    }

    const containerImageSelect = document.getElementById('containerImageSelect');
    if (containerImageSelect) {
        containerImageSelect.addEventListener('change', (e) => {
            const textInput = document.getElementById('containerImage');
            if (e.target.value) {
                textInput.value = e.target.value;
            }
        });
    }
})();


document.getElementById('createContainerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get image from either dropdown or text input (text input takes priority)
    const imageFromText = document.getElementById('containerImage').value.trim();
    const imageFromSelect = document.getElementById('containerImageSelect').value;
    const image = imageFromText || imageFromSelect;
    
    if (!image) {
        showToast('Please select or enter an image name', 'error');
        return;
    }
    
    const name = document.getElementById('containerName').value;
    const portsStr = document.getElementById('containerPorts').value;
    const envVarsStr = document.getElementById('containerEnvVars').value;
    
    const ports = portsStr ? portsStr.split(',').map(p => p.trim()).filter(p => p) : null;
    const envVars = envVarsStr ? envVarsStr.split('\n').map(e => e.trim()).filter(e => e) : null;
    
    try {
        updateStatus('Creating container...');
        const result = await window.electronAPI.docker.createContainer(image, name || null, ports, envVars);
        if (result && result.success) {
            showToast('Container created successfully', 'success');
            document.getElementById('createContainerModal').classList.remove('active');
            document.getElementById('createContainerForm').reset();
            document.getElementById('containerImageSelect').innerHTML = '<option value="">-- Select an image --</option>';
            loadContainers();
        } else {
            const errorMsg = (result && result.error) || 'Unknown error occurred';
            throw new Error(errorMsg);
        }
    } catch (error) {
        showToast(`Error creating container: ${error.message}`, 'error');
        updateStatus('Error creating container', true);
    }
});

// VM Functions
async function loadRunningVMs() {
    const tbody = document.getElementById('vmsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading VMs...</td></tr>';
    
    try {
        updateStatus('Loading VMs...');
        const result = await window.electronAPI.qemu.listRunningVMs();
        
        if (result.success && result.data) {
            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="loading">No running VMs</td></tr>';
            } else {
                tbody.innerHTML = result.data.map(vm => `
                    <tr>
                        <td>${vm.pid}</td>
                        <td>${vm.name}</td>
                        <td>${(vm.cmdline || []).join(' ').substring(0, 50)}</td>
                        <td class="action-buttons">
                            <button class="btn btn-danger btn-small" onclick="stopVM(${vm.pid})">Stop</button>
                        </td>
                    </tr>
                `).join('');
            }
            updateStatus('VMs loaded');
        } else {
            throw new Error(result.error || 'Failed to load VMs');
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="loading" style="color: var(--danger-color);">Error: ${error.message}</td></tr>`;
        updateStatus('Error loading VMs', true);
        showToast(`Error loading VMs: ${error.message}`, 'error');
    }
}

async function stopVM(pid) {
    if (!confirm(`Are you sure you want to stop VM with PID ${pid}?`)) return;
    
    try {
        updateStatus('Stopping VM...');
        const result = await window.electronAPI.qemu.stopVM(pid);
        if (result.success) {
            showToast('VM stopped', 'success');
            loadRunningVMs();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error stopping VM: ${error.message}`, 'error');
        updateStatus('Error stopping VM', true);
    }
}

document.getElementById('refreshVMs').addEventListener('click', loadRunningVMs);

document.getElementById('pickDiskPath').addEventListener('click', async () => {
    // Allow selecting either a directory or a file
    // On some platforms, we can't combine openFile and openDirectory
    // So we'll use openDirectory which works for both folders and files on some systems
    // If that doesn't work well, user can manually type the path
    const result = await window.electronAPI.dialog.openFile({
        title: 'Select Directory (for disk images) or Disk Image File',
        filters: [
            { name: 'Disk Images', extensions: ['img', 'qcow2', 'raw'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', 'openDirectory']
    });
    
    if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        document.getElementById('vmDiskPath').value = result.filePaths[0];
    }
});

document.getElementById('pickIsoPath').addEventListener('click', async () => {
    const result = await window.electronAPI.dialog.openFile({
        title: 'Select ISO Image',
        filters: [{ name: 'ISO Images', extensions: ['iso'] }]
    });
    if (!result.canceled) {
        document.getElementById('vmIsoPath').value = result.filePaths[0];
    }
});

document.getElementById('createDiskImageBtn').addEventListener('click', async () => {
    const path = document.getElementById('vmDiskPath').value;
    const size = document.getElementById('diskImageSize').value || '10G';
    
    if (!path) {
        showToast('Please provide a disk path', 'error');
        return;
    }
    
    try {
        updateStatus('Creating disk image...');
        const result = await window.electronAPI.qemu.createDiskImage(path, size);
        if (result.success) {
            showToast('Disk image created successfully', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error creating disk image: ${error.message}`, 'error');
        updateStatus('Error creating disk image', true);
    }
});

document.getElementById('createVMForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cpuCores = parseInt(document.getElementById('vmCpuCores').value);
    const ramSize = parseInt(document.getElementById('vmRamSize').value);
    const diskPath = document.getElementById('vmDiskPath').value;
    const isoPath = document.getElementById('vmIsoPath').value || null;
    
    try {
        updateStatus('Starting VM...');
        const result = await window.electronAPI.qemu.startVM(cpuCores, ramSize, diskPath, isoPath);
        if (result.success) {
            showToast('VM started successfully', 'success');
            loadRunningVMs();
            
            // Reset form inputs after successful VM creation
            document.getElementById('vmCpuCores').value = '2';
            document.getElementById('vmRamSize').value = '2048';
            document.getElementById('vmDiskPath').value = '';
            document.getElementById('vmIsoPath').value = '';
            document.getElementById('diskImageSize').value = '10G';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error starting VM: ${error.message}`, 'error');
        updateStatus('Error starting VM', true);
    }
});

document.getElementById('loadConfigBtn').addEventListener('click', async () => {
    const result = await window.electronAPI.dialog.openFile({
        title: 'Load VM Configuration',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (!result.canceled) {
        try {
            const fileResult = await window.electronAPI.file.read(result.filePaths[0]);
            if (fileResult.success) {
                // Store the file path for later use
                window.currentConfigFilePath = result.filePaths[0];
                
                // Load into editor
                document.getElementById('vmConfigEditor').value = fileResult.content;
                
                // Parse and populate form fields
                try {
                    const config = JSON.parse(fileResult.content);
                    let vmConfig = null;
                    
                    // Handle both array and single object formats
                    if (Array.isArray(config) && config.length > 0) {
                        // Use first VM config from array
                        vmConfig = config[0];
                        showToast(`Configuration loaded (${config.length} VM(s) in config)`, 'success');
                    } else if (typeof config === 'object' && config !== null) {
                        // Single VM config object
                        vmConfig = config;
                        showToast('Configuration loaded', 'success');
                    }
                    
                    // Populate form fields if we have a valid config
                    if (vmConfig) {
                        if (vmConfig.cpu_cores) {
                            document.getElementById('vmCpuCores').value = vmConfig.cpu_cores;
                        }
                        if (vmConfig.ram_size) {
                            document.getElementById('vmRamSize').value = vmConfig.ram_size;
                        }
                        if (vmConfig.disk_path) {
                            document.getElementById('vmDiskPath').value = vmConfig.disk_path;
                        }
                        if (vmConfig.iso_path) {
                            document.getElementById('vmIsoPath').value = vmConfig.iso_path;
                        }
                    }
                } catch (parseError) {
                    // If JSON parsing fails, just show the content in editor
                    console.error('Failed to parse config JSON:', parseError);
                    showToast('Configuration loaded (JSON parse error - check editor)', 'warning');
                }
            } else {
                throw new Error(fileResult.error);
            }
        } catch (error) {
            showToast(`Error loading config: ${error.message}`, 'error');
            updateStatus('Error loading config', true);
        }
    }
});

document.getElementById('saveConfigBtn').addEventListener('click', async () => {
    const content = document.getElementById('vmConfigEditor').value;
    if (!content.trim()) {
        showToast('Configuration is empty', 'error');
        return;
    }
    
    const result = await window.electronAPI.dialog.saveFile({
        title: 'Save VM Configuration',
        defaultPath: 'vm-config.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (!result.canceled) {
        try {
            const fileResult = await window.electronAPI.file.write(result.filePath, content);
            if (fileResult.success) {
                showToast('Configuration saved', 'success');
            } else {
                throw new Error(fileResult.error);
            }
        } catch (error) {
            showToast(`Error saving config: ${error.message}`, 'error');
        }
    }
});

// Create VM from config file
document.getElementById('createVMFromConfigBtn').addEventListener('click', async () => {
    // Check if we have a loaded config file path
    if (!window.currentConfigFilePath) {
        // If no file path, ask user to select one
        const result = await window.electronAPI.dialog.openFile({
            title: 'Select VM Configuration File',
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
        });
        if (result.canceled) {
            return;
        }
        window.currentConfigFilePath = result.filePaths[0];
    }
    
    try {
        updateStatus('Creating VM(s) from configuration...');
        const result = await window.electronAPI.qemu.createVMFromConfig(window.currentConfigFilePath);
        if (result.success) {
            const vmCount = result.results ? result.results.length : 1;
            showToast(`Successfully created ${vmCount} VM(s) from configuration`, 'success');
            loadRunningVMs();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        showToast(`Error creating VM from config: ${error.message}`, 'error');
        updateStatus('Error creating VM from config', true);
    }
});

// Modal close handlers
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        const modal = closeBtn.closest('.modal');
        if (modal.id === 'inputDialogModal' && inputDialogResolve) {
            // For input dialog, cancel the promise
            inputDialogResolve(null);
            inputDialogResolve = null;
        } else if (modal.id === 'searchResultsModal') {
            // Cancel ongoing search when closing search results modal
            currentSearchPromise = null;
            updateStatus('Search cancelled');
        }
        modal.classList.remove('active');
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        if (e.target.id === 'inputDialogModal' && inputDialogResolve) {
            // For input dialog, cancel the promise when clicking outside
            inputDialogResolve(null);
            inputDialogResolve = null;
        } else if (e.target.id === 'searchResultsModal') {
            // Cancel ongoing search when closing search results modal
            currentSearchPromise = null;
            updateStatus('Search cancelled');
        }
        e.target.classList.remove('active');
    }
});

// Auto-refresh every 3 minutes (180000 milliseconds)
setInterval(() => {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab && activeTab.id === 'docker-tab') {
        loadContainers();
        loadImages();
    } else if (activeTab && activeTab.id === 'vm-tab') {
        loadRunningVMs();
    }
}, 180000);

// Make functions available globally for onclick handlers
window.deleteImage = deleteImage;
window.stopContainer = stopContainer;
window.startContainer = startContainer;
window.deleteContainer = deleteContainer;
window.showContainerDetails = showContainerDetails;
window.stopVM = stopVM;
window.pullImageFromSearch = pullImageFromSearch;

// Dockerfile path picker
document.getElementById('pickDockerfilePath').addEventListener('click', async () => {
    const result = await window.electronAPI.dialog.openFile({
        title: 'Select Directory for Dockerfile',
        properties: ['openDirectory']
    });
    if (!result.canceled) {
        document.getElementById('dockerfilePath').value = result.filePaths[0];
    }
});

// Setup event listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        loadImages();
        loadContainers();
    });
} else {
    setupEventListeners();
    loadImages();
    loadContainers();
}

