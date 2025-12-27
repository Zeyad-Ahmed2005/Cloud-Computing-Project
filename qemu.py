import subprocess
import os

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
    # ram_size = Amount of RAM
    # disk_path = Path where the VM will be saved
    # iso_path = Path to the ISO image

    def start_virtual_machine(self, cpu_cores, ram_size, disk_path, iso_path):
        if not os.path.exists(disk_path):
            print("Disk path does not exist: ", disk_path)
            return

        if not os.path.exists(iso_path):
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