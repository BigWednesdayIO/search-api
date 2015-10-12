# Search API [![Build Status](https://circleci.com/gh/BigWednesdayIO/search-api.png?style=shield&circle-token=d9f42c0774b161326ed32a47f67f725bf246ae28)](https://circleci.com/gh/BigWednesdayIO/search-api)

Docker Compose Example:
```shell
## start a container with grunt watch for testing (use docker exec to open a shell to perform other development tasks)
docker-compose up dev

## run the api
docker-compose up api
```
# Deployment

 ``` shell
 # Set required variables
 export PROJECT_ID=first-footing-108508
 export NAMESPACE=development
 export TAG=v1
 export QUALIFIED_IMAGE_NAME=eu.gcr.io/${PROJECT_ID}/search-api:${TAG}
 export DEPLOYMENT_ID=1
 export ELASTICSEARCH_HOST=http://theelasticsearchurl:9200

 # Build the image and push to the container engine
 docker build -t ${QUALIFIED_IMAGE_NAME} .
 gcloud docker push ${QUALIFIED_IMAGE_NAME}

 # Create the service:
 cat ./kubernetes/service.json | \
    perl -pe 's/\{\{(\w+)\}\}/$ENV{$1}/eg' | \
    kubectl create --namespace=${NAMESPACE} -f -

 # Create the replication controller:
 cat ./kubernetes/rc.json | \
    perl -pe 's/\{\{(\w+)\}\}/$ENV{$1}/eg' | \
    kubectl create --namespace=${NAMESPACE} -f -
 ```

## Update steps

 ``` shell
 # Set required variables
 export PROJECT_ID=first-footing-108508
 export NAMESPACE=development
 export TAG=v2
 export DEPLOYMENT_ID=2
 export QUALIFIED_IMAGE_NAME=eu.gcr.io/${PROJECT_ID}/search-api:${TAG}
 export ELASTICSEARCH_HOST=http://theelasticsearchurl:9200

 # Build the new image and push to container engine
 docker build -t ${QUALIFIED_IMAGE_NAME} .
 gcloud docker push ${QUALIFIED_IMAGE_NAME}

 # Peform a rolling update on the replication controller
 OLD_RC=$(~/google-cloud-sdk/bin/kubectl get rc -l "app=nginx" --namespace=${NAMESPACE} -o template --template="{{(index .items 0).metadata.name}}")

 export REPLICAS=$(~/google-cloud-sdk/bin/kubectl get rc ${OLD_RC} --namespace=${NAMESPACE} -o template --template="{{.spec.replicas}}")

 cat ./kubernetes/rc.json | \
    perl -pe 's/\{\{(\w+)\}\}/$ENV{$1}/eg' | \
    kubectl rolling-update ${OLD_RC} --namespace=${NAMESPACE} -f -
 ```

