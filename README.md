# OAuth2 Server Google Grant Type

Adds Google grant type for [oauth2-server][oauth2-server]

## Installation

Using Yarn
```sh
yarn add oauth2-server-grant-type-google
```

Using NPM

```sh
npm install oauth2-server-grant-type-google
```

## Usage


Add `getUserWithGoogle` to [oauth2-server] model.

```js
  const getUserWithGoogle = async (googleData) => {
    // Find and return user by Google ID

    // Find and return user by Google email

    // If not exists create new user
  };
```

Add Google grant type to `extendedGrantTypes` in [oauth2-server] options:

```js
  import GoogleGrantType from 'oauth2-server-grant-type-google';

  const options = {
    model: ...,
    extendedGrantTypes: {
      google: GoogleGrantType,
    }
    requireClientAuthentication: {
      google: false,
    },
  }
```

You need to provide Google Client ID in model `googleGrantType`  :

```js
const options = {
  model: {
    ...model,
    googleGrantType: {
      clientId: 'xxxxxxx.apps.googleusercontent.com' // Array also supported
    },
  },
  extendedGrantTypes,
}
```

Post request to `/oauth/token` with `google` grant type and provided id token:

```json
{
  "grant_type": "google",
  "client_id": "YOUR_CLIENT_ID",
  "google_id_token": "GOOGLE_ID_TOKEN"
}
```

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

[oauth2-server]: https://github.com/oauthjs/node-oauth2-server
