import {
  AbstractGrantType,
  InvalidArgumentError,
  InvalidRequestError,
  InvalidTokenError,
} from 'oauth2-server';
import axios from 'axios';

const url = 'https://oauth2.googleapis.com/tokeninfo';

class GoogleGrantType extends AbstractGrantType {
  constructor(options = {}) {
    super(options);


    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUserWithGoogle) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getUserWithGoogle()`'
      );
    }

    const clientId = this.model.googleGrantType?.clientId;

    if (clientId) {
      this.clientIds = Array.isArray(clientId) ? clientId : Array(clientId);
    }

    if (!this.clientIds) {
      throw new InvalidArgumentError(
        'Invalid argument: Google valid clientId must be provided in options'
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`'
      );
    }

    this.handle = this.handle.bind(this);
    this.getUser = this.getUser.bind(this);
    this.saveToken = this.saveToken.bind(this);
  }

  async handle(request, client) {
    if (!request) {
      throw new InvalidArgumentError('Missing parameter: `request`');
    }

    if (!client) {
      throw new InvalidArgumentError('Missing parameter: `client`');
    }

    const scope = this.getScope(request);
    const user = await this.getUser(request);

    return await this.saveToken(user, client, scope);
  }

  async getUser(request) {
    const token = request.body.google_id_token;

    if (!token) {
      throw new InvalidRequestError('Missing parameter: `google_id_token`');
    }

    let data;

    try {
      const response = await axios.get(url, {
        params: { id_token: token },
      });

      data = response.data;
    } catch (err) {
      throw new InvalidTokenError('Google id token is invalid or expired');
    }

    if (!this.clientIds.includes(data.aud)) {
      throw new InvalidTokenError(
        'You cannot use this Google id token with this grant type'
      );
    }

    return await this.model.getUserWithGoogle(data);
  }

  async saveToken(user, client, scope) {
    const scopeData = await this.validateScope(user, client, scope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const refreshToken = await this.generateRefreshToken(client, user, scope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = await this.getRefreshTokenExpiresAt();

    const token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope: scopeData,
    };

    return await this.model.saveToken(token, client, user);
  }
}

export default GoogleGrantType;
