This webservice connects to a given Icecast radio stream, extracts Icy audio metadata if available, and emits parts of the audio metadata as FCM message to registered clients. 

1. Install dependencies from package.json:

  ```bash
  npm install
  ```

2. Export environment variables with Icecast stream URL:

  ```bash
  export RADIO_STREAM_URL=xyz
  ```

3. Start the server:

  ```bash
  npm start
  ```
