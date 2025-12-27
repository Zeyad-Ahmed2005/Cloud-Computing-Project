import subprocess
import os
import json

class Qemu:
    def __init__(self):
        pass

    def run_cmd(self, cmd: list[str]):
        try:
            subprocess.Popen(cmd)
            print("Running:", " ".join(cmd))
        except FileNotFoundError:
            print("QEMU not found. Is Qemu installed and in PATH?")
        except Exception as e:
            print("Error occurred:", e)

    # cpu_cores = Amount of Cores
    # ram_size = Amount of RAM (in MB)
    # disk_path = Path where the VM will be saved
    # iso_path = Path to the ISO image (optional)

    def start_virtual_machine(self, cpu_cores, ram_size, disk_path, iso_path=None):
        if not os.path.exists(disk_path):
            print("Disk path does not exist: ", disk_path)
            return

        if iso_path and not os.path.exists(iso_path):
            print("ISO does not exist: ", iso_path)
            return
            
        cmd = [
            "qemu-system-x86_64",
            "-smp", str(cpu_cores),
            "-m", str(ram_size),
            "-hda", disk_path,
        ]
        if iso_path:
            cmd.extend(["-cdrom", iso_path, "-boot", "d"])
        else:
            cmd.extend(["-boot", "c"])

        self.run_cmd(cmd)
    
    def create_vm_from_config(self, config_file_path):
        if not os.path.exists(config_file_path):
            print("Configuration file not found: ", config_file_path)
            return

        try:
            with open(config_file_path, 'r') as f:
                vm_file = json.load(f)
                
            for config_data in vm_file:
                self.start_virtual_machine(
                    cpu_cores=config_data.get('cpu_cores'),
                    ram_size=config_data.get('ram_size'),
                    disk_path=config_data.get('disk_path'),
                    iso_path=config_data.get('iso_path')
                )
        except json.JSONDecodeError:
            print("Error: The configuration file is not in JSON format.")
        except Exception as e:
            print("Error occurred: ", e)