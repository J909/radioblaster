This webservice connects to a given Icecast radio stream, extracts Icy audio metadata if available, and emits parts of the audio metadata as FCM message to registered clients.

This project is work in progress. 

1. Install dependencies from package.json:

  ```bash
  npm install
  ```

2. Export environment variables.
* `RADIO_STREAM_URL`: absolute URL to Icecast stream.
* `USER_AGENT_APPLICATION`: application id for the user-agent header when requesting media metadata from a 3rd party API such as MusicBrainz.

  ```bash
  export RADIO_STREAM_URL=https://xyz/live
  export USER_AGENT_APPLICATION=App-Name
  ```

3. Start the server:

  ```bash
  npm start
  ```
