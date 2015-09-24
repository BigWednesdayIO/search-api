# Search API [![Build Status](https://circleci.com/gh/BigWednesdayIO/search-api.png?style=shield&circle-token=d9f42c0774b161326ed32a47f67f725bf246ae28)](https://circleci.com/gh/BigWednesdayIO/search-api)

## API keys
API keys are configured throuh the `API_KEYS` environment variable. The value should be a JSON map in the form:
`{"key1": "clientName1", "key2": "clientName2"}`

To apply this when running the docker container use, the `-e` flag of the `docker run` command:
```shell
docker run -e API_KEYS="{\"12345\": \"test-user\"}" ...
```

## Logstash example
These examples use the full logstash service. [Logstash-forwarder](https://github.com/elastic/logstash-forwarder) is an alternative and more lightweight means of retrieving log files but is being replaced byt [Filebeat](https://github.com/elastic/filebeat/) in the near future.
Run the search container exposings logs as a volume:
```shell
docker run -e API_KEYS="{\"12345\": \"test-user\"}" -p 8080:8080 -d -v /src/logs --name search-api -v $(pwd):/src -w /src search-api
```

Run a logstash container that mounts the logs volume and uses the logstash config:
```shell
docker run -d -v "$PWD/logstash":/config-dir --volumes-from search-api logstash logstash -f /config-dir/good_response.conf
```
