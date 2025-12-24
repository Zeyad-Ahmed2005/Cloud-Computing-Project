import subprocess
import os

def run_cmd(cmd: list[str]):
    try:
        subprocess.Popen(cmd, check=True)
        print("Running:", " ".join(cmd))
    except Exception as e:
        print("Error:", str(e))

# cpu_cores = Amount of Cores
# ram_size = Amount of RAM
# disk_path = Path where the VM will be saved
# iso_path = Path to the ISO image

def create_virtual_machine(cpu_cores, ram_size, disk_path, iso_path):
    if not os.path.exists(disk_path):
        print("Disk path does not exist")
        return

    run_cmd([
        "qemu-system-x86_64",
        "-smp", str(cpu_cores),
        "-m", str(ram_size),
        "-hda", disk_path,
        "-cdrom", iso_path,
        "-boot", "d"
    ])

def start_virtual_machine(cpu_cores, ram_size, disk_path):
    if not os.path.exists(disk_path):
        print("Disk path does not exist")
        return

    run_cmd([
        "qemu-system-x86_64",
        "-smp", str(cpu_cores),
        "-m", str(ram_size),
        "-hda", disk_path,
        "-boot", "c"
    ])