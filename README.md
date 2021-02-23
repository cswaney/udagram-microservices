# Udagram Image Filtering Application
Udagram is a simple cloud application developed alongside the Udacity Cloud Engineering Nanodegree. It allows users to register and log into a web client, post photos to the feed, and process photos using an image filtering microservice.

The project is split into two parts:
1. Frontend - Angular web application built with Ionic Framework
2. Backend RESTful API - Node-Express application

## Setup

#### Backend API
* To download all the package dependencies, run the command from the directory `udagram-api/`:
    ```bash
    npm install .
    ```
* To run the application locally, run:
    ```bash
    npm run dev
    ```
* You can visit `http://localhost:8080/api/v0/feed` in your web browser to verify that the application is running. You should see a JSON payload. Feel free to play around with Postman to test the API's.

#### Frontend App
* To download all the package dependencies, run the command from the directory `udagram-frontend/`:
    ```bash
    npm install .
    ```
* Install Ionic Framework's Command Line tools for us to build and run the application:
    ```bash
    npm install -g ionic
    ```
* Prepare your application by compiling them into static files.
    ```bash
    ionic build
    ```
* Run the application locally using files created from the `ionic build` command.
    ```bash
    ionic serve
    ```
* You can visit `http://localhost:8100` in your web browser to verify that the application is running. You should see a web interface.



## Local Deployment
These instructions are incomplete because they don't setup a reverse proxy locally, but the frontend expects a single API endpoint. You can still check that the APIs work as expected and that the frontend deploys.

#### Create Docker images
```bash
docker build -t <DOCKER_USERNAME>/udagram-feed udagram-feed
docker build -t <DOCKER_USERNAME>/udagram-users udagram-users
docker build -t <DOCKER_USERNAME>/udagram-frontend udagram-frontend
```
#### Deploy APIs
- Note that port `8080` is specified by the Docker files and corresponds to the *second* `8080` in `8080:8080`. You can change one of the specified ports (e.g., `8200:8080`) to run the APIs concurrently.
```bash
docker run --env-file ../.env -p 8080:8080 udagram-feed
docker run --env-file ../.env -p 8200:8080 udagram-users
```
- Check the deployment:
```bash
curl localhost:8080/api/v0/feed  # {"count": 0,"rows":[]}
curl localhost:8200/api/v0/users/test-user@gmail.com  # {"email":"test-user@gmail.com", ...}
```

#### Deploy frontend
- Note that `8100:80` is the default port for the server.
```bash
docker run --env-file ../.env -p 8100:80 udagram-frontend
```
- Check [localhost:8100](localhost:8100) to check the deployment.


## AWS Deployment
It's suggested to setup the repository with TravisCI, but you can also push Docker images manually from the command line.

#### Create an Amazon-EKS Cluster
Follow this [tutorial](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html).

#### Install the Kubernetes Metrics Server
Follow these [instructions](https://docs.aws.amazon.com/eks/latest/userguide/metrics-server.html).

#### Deploy environment variables (secrets and configmaps)
```bash
kubectl apply -f aws-secret.yml
kubectl apply -f env-secret.yml
kubectl apply -f env-configmap.yml
kubectl get secrets  # check deployment
kubectl get configmaps  # check deployment
```

#### Deploy the API
```bash
kubectl apply -f udagram-feed/deploy/deployment.yml
kubectl apply -f udagram-feed/deploy/service.yml
kubectl apply -f udagram-users/deploy/deployment.yml
kubectl apply -f udagram-users/deploy/service.yml
```
- Add horizontal auto-scaling:
```bash
kubectl autoscale deployment udagram-feed --min=1 --max=2 --cpu-percent=90
kubectl autoscale deployment udagram-users --min=1 --max=2 --cpu-percent=90
kubectl get hpa  # confirm deployment
```
- HPA requires the `deployment.yml` files to specify `resources`.
- Check the deployment is working:
```bash
kubectl get pods  # check deployment
kubectl exec -it <FEED_API_POD> -- /bin/bash
curl <SERVICE_NAME>:8080/api/v0  # check functionality
kubectl exec -it <USERS_API_POD> -- /bin/bash
curl <SERVICE_NAME>:8080/api/v0  # check functionality
```

#### Deploy the reverse proxy
- Setting the service `type` to `LoadBalancer` will generate a public IP address.
```bash
kubectl apply -f udagram-reverse-proxy/deploy/deployment.yml
kubectl apply -f udagram-reverse-proxy/deploy/service.yml
```
- Get the public/external IP address and check the deployment:
```bash
kubectl get services  # list external IP
curl <EXTERNAL-IP>:8080/api/v0/users/test-user@gmail.com
curl <EXTERNAL-IP>:8080/api/v0/feed/
```

#### Deploy the frontend
- Specify the public IP address in the frontend `env` files and update the Docker image. If you have TravisCI setup, then you just need to update the files, commit the changes, and wait for the build to complete. Otherwise:
```bash
docker build -t <DOCKER_USERNAME>/udagram-frontend udagram-frontend
docker push <DOCKER_USERNAME>/udagram-frontend:latest
```
- This could also be done with environment variables / a configmap, but the public IP address changes whenever the reverse proxy *service* is deployed. For this reason, you should avoid re-deploying the service, if possible—just re-deploy the deployment if you need to modify the reverse proxy configuration).
- When the build completes, deploy:
```bash
kubectl apply -f udagram-frontend/deploy/deployment.yml
kubectl apply -f udagram-frontend/deploy/service.yml
```
- Setting the service `type` to `LoadBalancer` will generate a public IP address. The API needs to know this address in order to allow traffic from the frontend. Update `URL` in `env-configmap.yml`, re-deploy the configmap, and then re-deploy the APIs (so they have access to the new URL value):
```bash
kubectl delete configmap env-config
kubectl apply -f env-configmap.yml
kubectl delete deployment udagram-feed
kubectl delete deployment udagram-users
kubectl apply -f udagram-feed/deploy/deployment.yml
kubectl apply -f udagram-users/deploy/deployment.yml
```

#### Check Logs
- See activity on APIs:
```bash
kubectl get pods  # select an API pod
kubectl logs <POD>
```
- Debug deployment:
```bash
kubectl get pods
kubectl describe pod <POD>
```