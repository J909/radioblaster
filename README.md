This webservice connects to a given Icecast radio stream, extracts Icy audio metadata if available, and emits parts of the audio metadata as FCM message to registered clients.

This project is work in progress.

1. Install dependencies from package.json:

  ```bash
  npm install
  ```

2. Set environment variable to absolute URL of Icecast audio stream:
  ```bash
  export RADIO_STREAM_URL=https://xyz/live
  ```

3. Set environment variables to configure user-agent of this app when accessing metadata APIs:
  ```bash
  export USER_AGENT_APPLICATION=app-Name
  export USER_AGENT_OWNER=owner-url
  ```

4. Provide configuration options to use Google Cloud Storage as image file cache:
* `GOOGLE_APPLICATION_CREDENTIALS`: Service account config for your Google Cloud Project.
* `GCLOUD_PROJECT`: Google Cloud Project ID. Must match `project_id` as found in the service account config file.
* `CLOUD_BUCKET`: Globally unique ID of existing Google Cloud Storage bucket.
* `SALT`: Salt for generating image cache keys that cannot be replicated.
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
  export GClOUD_PROJECT=project-id
  export CLOUD_BUCKET=bucket-id
  export SALT=crypto-salt
  ```

5. Set environment variables to define Firebase message subscription topic:
* `RADIO_STATION_KEY`: Topic identifier of the streamed radio station.
* `RADIO_STATION_NAME`: Human-readable name of the streamed radio station.
  ```bash
  export RADIO_STATION_KEY=xyz
  export RADIO_STATION_NAME='Station XYZ'
  ```

6. Start the server:
  ```bash
  npm start
  ```
