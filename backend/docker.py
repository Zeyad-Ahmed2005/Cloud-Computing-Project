import subprocess
import os
import json
import platform
import shlex

class DockerManager:
    def _is_docker_daemon_running(self):
        """Check if Docker daemon is running"""
        try:
            subprocess.run(['docker', 'ps'], capture_output=True, text=True, check=True, timeout=5)
            return True
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def _check_docker_error(self, error, stderr=None):
        """Check if error is due to Docker daemon not running"""
        error_str = str(error).lower()
        
        # Convert stderr to string if it's bytes, otherwise use as-is
        if stderr is None:
            stderr_str = ''
        elif isinstance(stderr, bytes):
            stderr_str = stderr.decode('utf-8', errors='ignore').lower()
        else:
            stderr_str = str(stderr).lower()
        
        # Common Docker daemon error messages
        daemon_errors = [
            'cannot connect to the docker daemon',
            'is the docker daemon running',
            'connection refused',
            'docker daemon is not running',
            'error response from daemon',
            'dial unix',
            'connection to docker daemon failed'
        ]
        
        # Check if error message contains any daemon error indicators
        for daemon_error in daemon_errors:
            if daemon_error in error_str or daemon_error in stderr_str:
                return "Docker engine is not running. Please start Docker Desktop or Docker service."
        
        return None
    #lists all images
    def list_images(self):
        try:
            output = subprocess.check_output(['docker', 'image', 'ls', '--format', 'json'], text=True, stderr=subprocess.PIPE)
            images = []
            for line in output.strip().split('\n'):
                if line:
                    try:
                        images.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
            return json.dumps({"success": True, "data": images})
        except subprocess.CalledProcessError as e:
            # Check if error is due to Docker daemon not running
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                # Safely convert to string - handle both bytes and string
                try:
                    if isinstance(e.stderr, bytes):
                        stderr_value = e.stderr.decode('utf-8', errors='ignore')
                    else:
                        # Already a string, just use it
                        stderr_value = str(e.stderr)
                except (AttributeError, UnicodeDecodeError) as decode_err:
                    # If decode fails, just convert to string
                    stderr_value = str(e.stderr) if e.stderr else None
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})

    #lists all containers
    def list_containers(self):
        try:
            output = subprocess.check_output(['docker', 'container', 'ls', '-a', '--format', 'json'], text=True, stderr=subprocess.PIPE)
            containers = []
            for line in output.strip().split('\n'):
                if line:
                    try:
                        containers.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
            return json.dumps({"success": True, "data": containers})
        except subprocess.CalledProcessError as e:
            # Check if error is due to Docker daemon not running
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                # Safely convert to string - handle both bytes and string
                try:
                    if isinstance(e.stderr, bytes):
                        stderr_value = e.stderr.decode('utf-8', errors='ignore')
                    else:
                        # Already a string, just use it
                        stderr_value = str(e.stderr)
                except (AttributeError, UnicodeDecodeError) as decode_err:
                    # If decode fails, just convert to string
                    stderr_value = str(e.stderr) if e.stderr else None
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})

    #lists all running containers
    def list_running_containers(self):
        try:
            output = subprocess.check_output(['docker', 'ps', '--format', 'json'], text=True, stderr=subprocess.PIPE)
            containers = []
            for line in output.strip().split('\n'):
                if line:
                    try:
                        containers.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
            return json.dumps({"success": True, "data": containers})
        except subprocess.CalledProcessError as e:
            # Check if error is due to Docker daemon not running
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                # Safely convert to string - handle both bytes and string
                try:
                    if isinstance(e.stderr, bytes):
                        stderr_value = e.stderr.decode('utf-8', errors='ignore')
                    else:
                        # Already a string, just use it
                        stderr_value = str(e.stderr)
                except (AttributeError, UnicodeDecodeError) as decode_err:
                    # If decode fails, just convert to string
                    stderr_value = str(e.stderr) if e.stderr else None
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})

    # takes a path and code as input and creates a dockerfile
    def create_dockerfile(self, path: str, code: str):
        if os.path.isdir(path):
            file_path = os.path.join(path, "Dockerfile")
        else:
            file_path = path
        try:
            with open(file_path, "w", encoding='utf-8') as f:
                f.write(code)
            return json.dumps({"success": True, "message": f"Dockerfile saved to {file_path}", "path": file_path})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})

    #should be within the docker file folder or the link to the docker file
    def build_image(self, path, tag):
        # this is if the path is to a docker file
        if os.path.isfile(path):
            path = os.path.dirname(path)

        # building image
        if os.path.exists(path):
            try:
                result = subprocess.run(['docker', 'build', '-t', tag, path], 
                                      capture_output=True, text=True, check=True)
                return json.dumps({"success": True, "message": f"Image {tag} built successfully", "output": result.stdout})
            except subprocess.CalledProcessError as e:
                # Handle stderr - it might be bytes or string
                stderr_value = None
                if e.stderr:
                    if isinstance(e.stderr, bytes):
                        stderr_value = e.stderr.decode('utf-8', errors='ignore')
                    else:
                        stderr_value = str(e.stderr)
                docker_error = self._check_docker_error(e, stderr_value)
                if docker_error:
                    return json.dumps({"success": False, "error": docker_error})
                return json.dumps({"success": False, "error": str(e), "output": stderr_value if stderr_value else ''})
        else:
            return json.dumps({"success": False, "error": "Path not found"})


    #takes id or name and stops the container
    def stop_container(self, ID):
        try:
            result = subprocess.run(['docker', 'stop', ID], capture_output=True, text=True, check=True)
            return json.dumps({"success": True, "message": f"Container {ID} stopped"})
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            error_msg = stderr_value.strip() if stderr_value else str(e)
            return json.dumps({
                "success": False, 
                "error": f"Failed to stop container {ID}",
                "details": error_msg
            })
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
    
    # starts a stopped container
    def start_container(self, ID):
        try:
            result = subprocess.run(['docker', 'start', ID], capture_output=True, text=True, check=True)
            return json.dumps({"success": True, "message": f"Container {ID} started"})
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            error_msg = stderr_value.strip() if stderr_value else str(e)
            return json.dumps({
                "success": False, 
                "error": f"Failed to start container {ID}",
                "details": error_msg
            })
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
    
    # creates a container from an image
    def create_container(self, image, name=None, ports=None, env_vars=None):
        try:
            cmd = ['docker', 'create']
            if name:
                cmd.extend(['--name', name])
            if ports:
                for port_mapping in ports:
                    cmd.extend(['-p', port_mapping])
            if env_vars:
                for env_var in env_vars:
                    cmd.extend(['-e', env_var])
            cmd.append(image)
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            container_id = result.stdout.strip()
            return json.dumps({"success": True, "message": f"Container created", "container_id": container_id})
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e), "output": stderr_value if stderr_value else ''})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
    
    # deletes a container
    def delete_container(self, ID, force=False):
        try:
            cmd = ['docker', 'rm']
            if force:
                cmd.append('-f')
            cmd.append(ID)
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.dumps({"success": True, "message": f"Container {ID} deleted"})
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            error_msg = stderr_value.strip() if stderr_value else str(e)
            # Provide more helpful error messages
            if "is running" in error_msg.lower():
                return json.dumps({
                    "success": False,
                    "error": f"Container {ID} is running. Stop it first or use force delete.",
                    "details": error_msg
                })
            elif "No such container" in error_msg or "container does not exist" in error_msg.lower():
                return json.dumps({
                    "success": False,
                    "error": f"Container {ID} does not exist.",
                    "details": error_msg
                })
            else:
                return json.dumps({
                    "success": False,
                    "error": f"Failed to delete container {ID}",
                    "details": error_msg
                })
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
    
    # deletes an image
    def delete_image(self, ID, force=False):
        try:
            cmd = ['docker', 'rmi']
            if force:
                cmd.append('-f')
            cmd.append(ID)
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return json.dumps({"success": True, "message": f"Image {ID} deleted", "output": result.stdout})
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            error_msg = stderr_value.strip() if stderr_value else str(e)
            # Provide more helpful error messages
            if "is being used by" in error_msg or "is referenced in" in error_msg:
                return json.dumps({
                    "success": False, 
                    "error": f"Image {ID} is being used by a container. Stop and remove the container first, or use force delete.",
                    "details": error_msg
                })
            elif "No such image" in error_msg or "image does not exist" in error_msg.lower():
                return json.dumps({
                    "success": False,
                    "error": f"Image {ID} does not exist.",
                    "details": error_msg
                })
            else:
                return json.dumps({
                    "success": False, 
                    "error": f"Failed to delete image {ID}",
                    "details": error_msg
                })
        except Exception as e:
            return json.dumps({"success": False, "error": str(e)})
    
    # gets container logs
    def get_container_logs(self, ID, tail=100):
        try:
            result = subprocess.run(['docker', 'logs', '--tail', str(tail), ID], 
                                  capture_output=True, text=True, check=False, timeout=30)
            
            logs_output = ""
            
            #  check stdout 
            if result.stdout:
                logs_output = result.stdout
            
            if logs_output and logs_output.strip():
                return json.dumps({"success": True, "logs": logs_output})
            
            # If no stdout, check stderr
            if result.stderr:
                stderr_content = result.stderr.strip()
                if not any(keyword in stderr_content.lower() for keyword in ['error', 'no such container', 'container does not exist', 'cannot connect']):
                    if stderr_content:
                        return json.dumps({"success": True, "logs": stderr_content})
            
            # If return code is non-zero and we have no logs check the error
            if result.returncode != 0:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                
                # Check if error is due to Docker daemon not running
                docker_error = self._check_docker_error(error_msg, error_msg)
                if docker_error:
                    return json.dumps({"success": False, "error": docker_error})
                
                if "No such container" in error_msg or "container does not exist" in error_msg.lower():
                    return json.dumps({"success": False, "error": f"Container {ID} not found"})
                
                if not logs_output:
                    return json.dumps({"success": False, "error": error_msg})
            
            return json.dumps({"success": True, "logs": "No logs available for this container. The container may not have produced any output yet."})
                
        except subprocess.TimeoutExpired:
            return json.dumps({"success": False, "error": "Logs request timed out after 30 seconds"})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
    
    # gets container stats
    def get_container_stats(self, ID):
        try:
            # this requires the container to be running
            result = subprocess.run(['docker', 'stats', '--no-stream', '--format', 'json', ID], 
                                  capture_output=True, text=True, check=False, timeout=10)
            
            if result.returncode == 0:
                if result.stdout.strip():
                    try:
                        stats_line = result.stdout.strip().split('\n')[0]
                        if stats_line:
                            stats = json.loads(stats_line)
                            return json.dumps({"success": True, "stats": stats})
                        else:
                            return json.dumps({"success": False, "error": "No stats data received"})
                    except json.JSONDecodeError as e:
                        return json.dumps({"success": False, "error": f"Failed to parse stats JSON: {str(e)}", "raw": result.stdout})
                else:
                    return json.dumps({"success": False, "error": "No stats available - container may not be running"})
            else:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                
                # Check if error is due to Docker daemon not running
                docker_error = self._check_docker_error(error_msg, error_msg)
                if docker_error:
                    return json.dumps({"success": False, "error": docker_error})
                
                if "No such container" in error_msg or "container does not exist" in error_msg.lower():
                    return json.dumps({"success": False, "error": f"Container {ID} not found"})
                elif "is not running" in error_msg.lower() or "is not started" in error_msg.lower():
                    return json.dumps({"success": False, "error": "Container is not running. Stats are only available for running containers."})
                else:
                    return json.dumps({"success": False, "error": error_msg})
                    
        except subprocess.TimeoutExpired:
            return json.dumps({"success": False, "error": "Stats request timed out after 10 seconds"})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})

    # takes a name and searches for it on dockerhub
    def search_dockerhub(self, name):
        try:
            result = subprocess.run(['docker', 'search', '--format', 'json', name], 
                                  capture_output=True, text=True, check=False, timeout=30)
            
            if result.returncode == 0 and result.stdout.strip():
                results = []
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        try:
                            img_data = json.loads(line)
                            star_count_str = str(img_data.get('StarCount', '0'))
                            star_count = int(star_count_str) if star_count_str.isdigit() else 0
                            
                            results.append({
                                "name": img_data.get('Name', ''),
                                "description": img_data.get('Description', ''),
                                "star_count": star_count,
                                "is_official": str(img_data.get('IsOfficial', '')).lower() == 'true',
                                "is_automated": str(img_data.get('IsAutomated', '')).lower() == 'true'
                            })
                        except json.JSONDecodeError as e:
                            continue
                
                if results:
                    return json.dumps({"success": True, "data": results})
            
            # Fallback to text format if JSON fails or returns empty
            result = subprocess.run(['docker', 'search', name], 
                                  capture_output=True, text=True, check=False, timeout=30)
            
            if result.returncode != 0:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                docker_error = self._check_docker_error(error_msg, error_msg)
                if docker_error:
                    return json.dumps({"success": False, "error": docker_error})
                return json.dumps({"success": False, "error": error_msg})
            lines = result.stdout.strip().split('\n')
            if len(lines) < 2:
                return json.dumps({"success": True, "data": []})
            
            results = []
            for line in lines[1:]:
                if not line.strip():
                    continue
                
                parts = line.split()
                if len(parts) >= 2:
                    image_name = parts[0]
                    description_parts = parts[1:-3] if len(parts) > 4 else parts[1:]
                    description = ' '.join(description_parts) if description_parts else ''
                    stars = parts[-3] if len(parts) >= 3 else '0'
                    official = parts[-2] if len(parts) >= 2 else ''
                    automated = parts[-1] if len(parts) >= 1 else ''
                    
                    try:
                        star_count = int(stars) if stars.isdigit() else 0
                    except:
                        star_count = 0
                    
                    results.append({
                        "name": image_name,
                        "description": description,
                        "star_count": star_count,
                        "is_official": official == "[OK]",
                        "is_automated": automated == "[OK]"
                    })
            
            return json.dumps({"success": True, "data": results})
        except subprocess.TimeoutExpired:
            return json.dumps({"success": False, "error": "Search request timed out"})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})


    # takes a name and pulls the image from dockerhub
    def pull_image(self, name):
        try:
            # Docker pull outputs progress to stderr, so we need to capture both
            # Use a longer timeout for large images (10 minutes)
            result = subprocess.run(
                ['docker', 'pull', name], 
                capture_output=True, 
                text=True, 
                check=True,
                timeout=600  # 10 minute timeout
            )
            # Combine stdout and stderr as docker pull outputs to stderr
            output = result.stderr if result.stderr else result.stdout
            return json.dumps({
                "success": True, 
                "message": f"Image {name} pulled successfully", 
                "output": output
            })
        except subprocess.TimeoutExpired:
            return json.dumps({
                "success": False, 
                "error": f"Pulling image {name} timed out after 10 minutes. The image might be very large."
            })
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            error_msg = stderr_value.strip() if stderr_value else str(e)
            return json.dumps({
                "success": False, 
                "error": f"Failed to pull image {name}",
                "details": error_msg
            })
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})


    # takes a name and searches for it in the local images
    def search_image_local(self, name):
        try:
            output = subprocess.check_output(['docker', 'images', '--format', 'json'], text=True)
            results = []
            for line in output.strip().split('\n'):
                if line:
                    try:
                        image_data = json.loads(line)
                        if name.lower() in image_data.get('Repository', '').lower():
                            results.append(image_data)
                    except json.JSONDecodeError:
                        continue
            return json.dumps({"success": True, "data": results})
        except subprocess.CalledProcessError as e:
            # Handle stderr - it might be bytes or string
            stderr_value = None
            if e.stderr:
                if isinstance(e.stderr, bytes):
                    stderr_value = e.stderr.decode('utf-8', errors='ignore')
                else:
                    stderr_value = str(e.stderr)
            docker_error = self._check_docker_error(e, stderr_value)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
        except Exception as e:
            docker_error = self._check_docker_error(e)
            if docker_error:
                return json.dumps({"success": False, "error": docker_error})
            return json.dumps({"success": False, "error": str(e)})
