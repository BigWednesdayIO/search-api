# Search API [![Build Status](https://circleci.com/gh/BigWednesdayIO/search-api.png?style=shield&circle-token=d9f42c0774b161326ed32a47f67f725bf246ae28)](https://circleci.com/gh/BigWednesdayIO/search-api)

## Environment variables
 - `API_KEYS`: A JSON map of api keys in the form `{"key1": "clientName1", "key2": "clientName2"}`
 - `LOGSTASH_HOST`: Logstash listener host for analytics
 - `LOGSTASH_PORT`: Logstash listener port for analytics

Example:
```shell
docker run -e API_KEYS="{\"12345\": \"test-user\"}" -e LOGSTASH_HOST="0.0.0.0" -e LOGSTASH_PORT="9999" ...
```

## Logstash example
This example uses the full logstash service. [Logstash-forwarder](https://github.com/elastic/logstash-forwarder) is an alternative and more lightweight means of retrieving log files but is being replaced byt [Filebeat](https://github.com/elastic/filebeat/) in the near future.

Run a logstash container that listens on UDP port 9999. When deployed do not expose this endpoint to the public internet!
```shell
docker run --d -v "$PWD/logstash":/config-dir -p 9999:9999/udp logstash logstash -f /config-dir/search_analytics.conf
```
