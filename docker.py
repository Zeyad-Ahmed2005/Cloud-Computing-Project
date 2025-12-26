import subprocess
import os

class DockerManager:
    #lists all images
    def list_images(self):
        try:
            output = subprocess.check_output(['docker', 'image', 'ls'], text=True)
            print(output)
        except subprocess.CalledProcessError as e:
            print(f"Error listing images: {e}")

    #lists all containers
    def list_containers(self):
        try:
            output = subprocess.check_output(['docker', 'container', 'ls', '-a'], text=True)
            print(output)
        except subprocess.CalledProcessError as e:
            print(f"Error listing containers: {e}")

    #lists all running containers
    def list_running_containers(self):
        try:
            output = subprocess.check_output(['docker', 'ps'], text=True)
            print(output)
        except subprocess.CalledProcessError as e:
            print(f"Error listing running containers: {e}")

    # takes a path and code as input and creates a dockerfile
    def create_dockerfile(self, path: str, code: str):
        if os.path.isdir(path):
            file_path = os.path.join(path, "Dockerfile")
        else:
            file_path = path
        try:
            with open(file_path, "w") as f:
                f.write(code)
            print(f"Dockerfile saved to {file_path}")
        except Exception as e:
            print(f"Error creating Dockerfile: {e}")

    #should be within the docker file folder or the link to the docker file
    def build_image(self, path, tag):
        # this is if the path is to a docker file
        if os.path.isfile(path):
            path = os.path.dirname(path)

        # building image
        if os.path.exists(path):
            try:
                subprocess.run(['docker', 'build', '-t', tag, path], check=True)
            except subprocess.CalledProcessError as e:
                print(f"Error building image: {e}")
        else:
            print("Path not found")


    #takes id or name and stops the container
    def stop_container(self, ID):
        try:
            subprocess.run(['docker', 'stop', ID], check=True)
            print(f"Container {ID} stopped.")
        except subprocess.CalledProcessError as e:
            print(f"Error stopping container: {e}")

    # takes a name and searches for it on dockerhub
    def search_dockerhub(self, name):
        try:
            output = subprocess.check_output(['docker', 'search', name], text=True)
            print(output)
        except subprocess.CalledProcessError as e:
            print(f"Error searching DockerHub: {e}")


    # takes a name and pulls the image from dockerhub
    def pull_image(self, name):
        try:
            subprocess.run(['docker', 'pull', name], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error pulling image: {e}")


    # takes a name and searches for it in the local images
    def search_image_local(self, name):
        try:
            output = subprocess.check_output(['docker', 'images'], text=True)
            lines = output.splitlines()

            header = lines[0]
            print(header)
            
            for line in lines[1:]:
                if name.lower() in line.lower():
                    print(line)            
        except subprocess.CalledProcessError as e:
            print(f"Error searching local images: {e}")
