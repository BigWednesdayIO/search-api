# Search API [![Build Status](https://circleci.com/gh/BigWednesdayIO/search-api.png?style=shield&circle-token=d9f42c0774b161326ed32a47f67f725bf246ae28)](https://circleci.com/gh/BigWednesdayIO/search-api)

## Environment variables
 - `API_KEYS`: A comma separated list of API keys required for access

Docker Example:
```shell
docker run -e API_KEYS=12345,abcdef ...
```

Docker Compose Example:
```shell
# start a container with grunt watch for testing (use docker exec to open a shell to perform other development tasks)
docker-compose up dev

# run the api
docker-compose up api
```
