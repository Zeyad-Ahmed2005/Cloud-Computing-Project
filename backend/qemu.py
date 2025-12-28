import subprocess
import os
import json
import platform
import psutil

class Qemu:
    def __init__(self):
        self.platform = platform.system()
        self.qemu_binary = self._detect_qemu_binary()
    
    def _detect_qemu_binary(self):
        """Detect QEMU binary path based on platform"""
        if self.platform == "Windows":
            binaries = ["qemu-system-x86_64.exe", "qemu-system-x86_64"]
        else:
            binaries = ["qemu-system-x86_64"]
        
        for binary in binaries:
            try:
                subprocess.run([binary, '--version'], capture_output=True, check=True, timeout=2)
                return binary
            except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
                continue
        
        return "qemu-system-x86_64"  # Default fallback

    def run_cmd(self, cmd: list[str]):
        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return json.dumps({"success": True, "message": "VM started", "pid": process.pid, "command": " ".join(cmd)})
        except FileNotFoundError:
            return json.dumps({"success": False, "error": "QEMU not found. Is Qemu installed and in PATH?"})
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})

    # cpu_cores = Amount of Cores
    # ram_size = Amount of RAM (in MB)
    # disk_path = Path where the VM will be saved
    # iso_path = Path to the ISO image (optional)

    def start_virtual_machine(self, cpu_cores, ram_size, disk_path, iso_path=None):
        if not cpu_cores:
            return json.dumps({"success": False, "error": "No CPU Cores given."})
        
        if not ram_size:
            return json.dumps({"success": False, "error": "No RAM Size given."})
        
        if not disk_path:
            return json.dumps({"success": False, "error": "No Disk Path given."})

        disk_path = os.path.normpath(disk_path)
        
        # Check if disk_path is a directory - if so, look for existing disk images
        if os.path.isdir(disk_path):
            # Look for existing disk image files in the directory
            disk_extensions = ['.qcow2', '.raw', '.img', '.vmdk', '.vhdx', '.vdi']
            found_disk = None
            
            # Search for disk image files in the directory
            try:
                for file in os.listdir(disk_path):
                    file_path = os.path.join(disk_path, file)
                    if os.path.isfile(file_path):
                        # Check if file has a disk image extension
                        file_ext = os.path.splitext(file)[1].lower()
                        if file_ext in disk_extensions:
                            found_disk = file_path
                            break  # Use the first disk image found
            except OSError:
                pass
            
            if found_disk:
                # Use the found disk image
                disk_path = found_disk
            else:
                # No disk image found, check if we need to create one or require ISO
                default_disk = os.path.join(disk_path, "vm_disk.qcow2")
                if not iso_path:
                    return json.dumps({
                        "success": False, 
                        "error": f"Directory selected but no disk image found (looking for: {', '.join(disk_extensions)}). Please create a disk image first, select an existing disk file, or provide an ISO image to create a new VM."
                    })
                # If ISO is provided, we can create a disk image later, but for now use default path
                disk_path = default_disk
        
        if not os.path.exists(disk_path) and not os.path.isdir(os.path.dirname(disk_path) if os.path.dirname(disk_path) else disk_path):
            # If the disk doesn't exist and the parent directory doesn't exist either, it's an error
            parent_dir = os.path.dirname(disk_path)
            if parent_dir and not os.path.exists(parent_dir):
                return json.dumps({"success": False, "error": f"Parent directory does not exist: {parent_dir}"})

        if iso_path:
            iso_path = os.path.normpath(iso_path)
            if not os.path.exists(iso_path):
                return json.dumps({"success": False, "error": f"ISO does not exist: {iso_path}"})
        
        # Determine disk format based on file extension
        disk_format = "raw"  # default
        disk_lower = disk_path.lower()
        if disk_lower.endswith('.qcow2'):
            disk_format = "qcow2"
        elif disk_lower.endswith('.vmdk'):
            disk_format = "vmdk"
        elif disk_lower.endswith('.vhdx'):
            disk_format = "vhdx"
        elif disk_lower.endswith('.vdi'):
            disk_format = "vdi"
        elif disk_lower.endswith('.img') or disk_lower.endswith('.raw'):
            # .img and .raw files are usually raw format
            disk_format = "raw"
        
        # Check if disk exists
        disk_exists = os.path.exists(disk_path)
        if not disk_exists:
            # Disk doesn't exist yet - ISO is required to create and install
            if not iso_path:
                return json.dumps({
                    "success": False,
                    "error": f"Disk image does not exist: {disk_path}. Please create a disk image first or provide an ISO image to create a new VM."
                })
        else:
            # Disk exists - check if it might be empty (but allow boot attempt)
            # Note: We can't reliably detect if a disk is bootable without trying to boot it
            # So we'll let QEMU try, and if it fails with "no bootable device", 
            # the user can provide an ISO
            try:
                disk_size = os.path.getsize(disk_path)
                # For qcow2, size check is not reliable (sparse files)
                # For other formats, if extremely small, it's likely empty
                if not disk_lower.endswith('.qcow2') and disk_size < 100 * 1024 and not iso_path:
                    # For non-qcow2 formats, if very small and no ISO, warn
                    return json.dumps({
                        "success": False, 
                        "error": "Disk image appears to be empty or very small. Please provide an ISO image to install an operating system, or use an existing bootable disk image."
                    })
            except OSError:
                pass  # If we can't check size, continue anyway
        
        # Build QEMU command with proper arguments
        # Use -drive instead of deprecated -hda for better compatibility
        # Format the drive option with proper escaping for Windows paths
        disk_path_escaped = disk_path.replace('\\', '/')  # QEMU uses forward slashes
        
        cmd = [
            self.qemu_binary,
            "-smp", str(cpu_cores),
            "-m", str(ram_size),
            "-drive", f"file={disk_path_escaped},format={disk_format},if=ide,index=0,media=disk"
        ]
        
        # Add ISO/CD-ROM if provided
        if iso_path:
            # Use -cdrom for ISO (simpler and more compatible)
            iso_path_escaped = iso_path.replace('\\', '/')  # QEMU uses forward slashes
            cmd.extend(["-cdrom", iso_path_escaped])
            # Boot from CD-ROM first (d), then hard disk (c)
            # Use simple boot order syntax for better compatibility
            cmd.extend(["-boot", "order=dc"])
        else:
            # Boot from hard disk only
            # If disk might not be bootable, try multiple boot methods
            # order=c means boot from hard disk (c:)
            # If that fails, QEMU will show "no bootable device"
            cmd.extend(["-boot", "order=c"])
            # Add BIOS boot menu option to help with boot issues
            # This allows selecting boot device if available
        
        # Add network (user mode networking) - useful for most VMs
        cmd.extend(["-netdev", "user,id=net0", "-device", "virtio-net,netdev=net0"])

        return self.run_cmd(cmd)
    
    def create_vm_from_config(self, config_file_path):
        config_file_path = os.path.normpath(config_file_path)
        if not os.path.exists(config_file_path):
            return json.dumps({"success": False, "error": f"Configuration file not found: {config_file_path}"})

        try:
            with open(config_file_path, 'r', encoding='utf-8') as f:
                vm_file = json.load(f)
            
            results = []
            if isinstance(vm_file, list):
                for config_data in vm_file:
                    result = self.start_virtual_machine(
                        cpu_cores=config_data.get('cpu_cores'),
                        ram_size=config_data.get('ram_size'),
                        disk_path=config_data.get('disk_path'),
                        iso_path=config_data.get('iso_path')
                    )
                    results.append(json.loads(result))
            else:
                result = self.start_virtual_machine(
                    cpu_cores=vm_file.get('cpu_cores'),
                    ram_size=vm_file.get('ram_size'),
                    disk_path=vm_file.get('disk_path'),
                    iso_path=vm_file.get('iso_path')
                )
                results.append(json.loads(result))
            
            return json.dumps({"success": True, "results": results})
        except json.JSONDecodeError:
            return json.dumps({"success": False, "error": "The configuration file is not in JSON format."})
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})

    def delete_vm(self, disk_path):
        disk_path = os.path.normpath(disk_path)
        if os.path.exists(disk_path):
            try:
                os.remove(disk_path)
                return json.dumps({"success": True, "message": "VM deleted successfully."})
            except Exception as e:
                return json.dumps({"success": False, "error": str(e)})
        else:
            return json.dumps({"success": False, "error": "VM not found."})
    
    def list_running_vms(self):
        """List all running QEMU processes"""
        try:
            running_vms = []
            # QEMU binary names to look for (exact matches or starts with)
            qemu_binary_patterns = ['qemu-system-', 'qemu-kvm', 'qemu.exe']
            
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'cmdline', 'create_time']):
                try:
                    proc_name = proc.info['name'].lower()
                    proc_exe = (proc.info.get('exe') or '').lower()
                    cmdline = proc.info['cmdline'] or []
                    
                    # Check if the process executable name matches QEMU patterns
                    is_qemu_binary = any(
                        proc_name.startswith(pattern) or 
                        pattern in proc_name or
                        (proc_exe and (pattern in proc_exe or proc_exe.endswith(pattern.replace('-', '_'))))
                        for pattern in qemu_binary_patterns
                    )
                    
                    # Exclude Python processes and other non-QEMU processes
                    # Only include if it's actually a QEMU binary process
                    if is_qemu_binary and 'python' not in proc_name and 'python' not in proc_exe:
                        running_vms.append({
                            "pid": proc.info['pid'],
                            "name": proc.info['name'],
                            "cmdline": proc.info['cmdline'],
                            "create_time": proc.info['create_time']
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            return json.dumps({"success": True, "data": running_vms})
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})
    
    def stop_vm(self, pid):
        """Stop a running VM by PID"""
        try:
            pid = int(pid)
            process = psutil.Process(pid)
            process.terminate()
            try:
                process.wait(timeout=5)
            except psutil.TimeoutExpired:
                process.kill()
            return json.dumps({"success": True, "message": f"VM with PID {pid} stopped"})
        except psutil.NoSuchProcess:
            return json.dumps({"success": False, "error": f"Process with PID {pid} not found"})
        except psutil.AccessDenied:
            return json.dumps({"success": False, "error": f"Access denied to process {pid}"})
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})
    
    def create_disk_image(self, path, size):
        """Create a QEMU disk image"""
        try:
            path = os.path.normpath(path)
            
            # Check if path is a directory - if so, create a default disk image filename
            if os.path.isdir(path):
                # If it's a directory, create a disk image file inside it
                disk_filename = os.path.join(path, "vm_disk.qcow2")
                path = disk_filename
            elif os.path.exists(path) and not os.path.isfile(path):
                # Path exists but is not a file (shouldn't happen, but handle it)
                return json.dumps({"success": False, "error": f"Path exists but is not a file: {path}"})
            
            # Ensure directory exists
            dir_path = os.path.dirname(path)
            if dir_path and not os.path.exists(dir_path):
                os.makedirs(dir_path, exist_ok=True)
            
            # Check if file already exists
            if os.path.exists(path):
                return json.dumps({"success": False, "error": f"Disk image already exists at {path}. Please choose a different path or delete the existing file."})
            
            # Use qemu-img to create disk
            cmd = ['qemu-img', 'create', '-f', 'qcow2', path, size]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.dumps({"success": True, "message": f"Disk image created at {path}", "output": result.stdout})
        except FileNotFoundError:
            return json.dumps({"success": False, "error": "qemu-img not found. Is QEMU installed?"})
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)
            return json.dumps({"success": False, "error": f"Error creating disk image: {error_msg}"})
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})