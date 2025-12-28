#!/usr/bin/env python3
"""
API wrapper for Docker and QEMU operations
Called from Electron via command line
"""
import sys
import json
import argparse
from docker import DockerManager
from qemu import Qemu

def main():
    parser = argparse.ArgumentParser(description='Docker and QEMU API')
    parser.add_argument('--service', required=True, choices=['docker', 'qemu'], help='Service to use')
    parser.add_argument('--action', required=True, help='Action to perform')
    parser.add_argument('--args', help='JSON string with arguments')
    
    args = parser.parse_args()
    
    try:
        if args.service == 'docker':
            manager = DockerManager()
            action = args.action
            
            # Parse arguments
            params = json.loads(args.args) if args.args else {}
            
            # Map actions to methods
            if action == 'list_images':
                result = manager.list_images()
            elif action == 'list_containers':
                result = manager.list_containers()
            elif action == 'list_running_containers':
                result = manager.list_running_containers()
            elif action == 'create_dockerfile':
                result = manager.create_dockerfile(params.get('path', ''), params.get('code', ''))
            elif action == 'build_image':
                result = manager.build_image(params.get('path', ''), params.get('tag', ''))
            elif action == 'stop_container':
                result = manager.stop_container(params.get('id', ''))
            elif action == 'start_container':
                result = manager.start_container(params.get('id', ''))
            elif action == 'create_container':
                result = manager.create_container(
                    params.get('image', ''),
                    params.get('name'),
                    params.get('ports'),
                    params.get('env_vars')
                )
            elif action == 'delete_container':
                result = manager.delete_container(params.get('id', ''), params.get('force', False))
            elif action == 'delete_image':
                result = manager.delete_image(params.get('id', ''), params.get('force', False))
            elif action == 'get_container_logs':
                result = manager.get_container_logs(params.get('id', ''), params.get('tail', 100))
            elif action == 'get_container_stats':
                result = manager.get_container_stats(params.get('id', ''))
            elif action == 'search_dockerhub':
                result = manager.search_dockerhub(params.get('name', ''))
            elif action == 'pull_image':
                result = manager.pull_image(params.get('name', ''))
            elif action == 'search_image_local':
                result = manager.search_image_local(params.get('name', ''))
            else:
                result = json.dumps({"success": False, "error": f"Unknown action: {action}"})
        
        elif args.service == 'qemu':
            qemu = Qemu()
            action = args.action
            
            # Parse arguments
            params = json.loads(args.args) if args.args else {}
            
            # Map actions to methods
            if action == 'start_virtual_machine':
                result = qemu.start_virtual_machine(
                    params.get('cpu_cores'),
                    params.get('ram_size'),
                    params.get('disk_path'),
                    params.get('iso_path')
                )
            elif action == 'create_vm_from_config':
                result = qemu.create_vm_from_config(params.get('config_file_path', ''))
            elif action == 'delete_vm':
                result = qemu.delete_vm(params.get('disk_path', ''))
            elif action == 'list_running_vms':
                result = qemu.list_running_vms()
            elif action == 'stop_vm':
                result = qemu.stop_vm(params.get('pid'))
            elif action == 'create_disk_image':
                result = qemu.create_disk_image(params.get('path', ''), params.get('size', ''))
            else:
                result = json.dumps({"success": False, "error": f"Unknown action: {action}"})
        
        # Output result (ensure no extra output before JSON)
        sys.stdout.write(result)
        sys.stdout.flush()
        sys.exit(0)
    
    except Exception as e:
        error_result = json.dumps({"success": False, "error": str(e)})
        sys.stdout.write(error_result)
        sys.stdout.flush()
        sys.exit(1)

if __name__ == '__main__':
    main()

