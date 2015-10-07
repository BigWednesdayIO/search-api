# Search API [![Build Status](https://circleci.com/gh/BigWednesdayIO/search-api.png?style=shield&circle-token=d9f42c0774b161326ed32a47f67f725bf246ae28)](https://circleci.com/gh/BigWednesdayIO/search-api)

Docker Compose Example:
```shell
# start a container with grunt watch for testing (use docker exec to open a shell to perform other development tasks)
docker-compose up dev

# run the api
docker-compose up api
```

# Deployment
## Initial deployment steps
 - Set project id variable:

 ``` shell
 export PROJECT_ID=first-footing-108508

 ```

 - Build the image and push to the container engine (/set the image version tag as appropriate/)

 ``` shell
 docker build -t gcr.io/${PROJECT_ID}/search-api:v1 .
 ```

 ``` shell
 gcloud docker push gcr.io/${PROJECT_ID}/search-api:v1
 ```

 - Create the service:

 ``` shell
 kubectl create -f ./kubernetes/prd/service.yml --namespace=development
 ```

 - Create the replication controller (note that the image field must refer to the image and tag created above):

 ``` shell
 kubectl create -f ./kubernetes/prd/rc.yaml --namespace=development
 ```

## Update steps
 - Build the new image and push to container engine
 ``` shell
 docker build -t gcr.io/${PROJECT_ID}/search-api:v2 .
 ```
  ``` shell
 gcloud docker push gcr.io/${PROJECT_ID}/search-api:v2
 ```

 - Peform a rolling update on the replication controller
```shell
PREVIOUS=$(kubectl get rc -l app=search-api --namespace=development | cut -f1 -d " " | tail -1)
kubectl rolling-update $PREVIOUS search-api-rc-v2 --image=gcr.io/${PROJECT_ID}/search-api:v2 --namespace=development
```
