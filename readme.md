# Search API [![Build Status](https://circleci.com/gh/BigWednesdayIO/search-api.png?style=shield&circle-token=d9f42c0774b161326ed32a47f67f725bf246ae28)](https://circleci.com/gh/BigWednesdayIO/search-api)

## Environment variables
 - `API_KEYS`: A JSON map of api keys in the form `{"key1": "clientName1", "key2": "clientName2"}`

Example:
```shell
docker run -e API_KEYS="{\"12345\": \"test-user\"}" ...
```
