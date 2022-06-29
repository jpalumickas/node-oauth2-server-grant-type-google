import {
  AbstractGrantType,
  InvalidArgumentError,
  InvalidRequestError,
  InvalidTokenError,
  Request,
  Client,
  TokenOptions,
  User,
  Token,
} from 'oauth2-server';
import axios from 'axios';
import { Model } from './types';

const url = 'https://oauth2.googleapis.com/tokeninfo';

export interface Options extends TokenOptions {
  model: Model;
}

class GoogleGrantType extends AbstractGrantType {
  model: Model;
  validateClientId: boolean;
  clientIds: string[] = [];

  constructor(options: Options) {
    super(options);
    this.model = options.model;

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUserWithGoogle) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getUserWithGoogle()`',
      );
    }

    this.validateClientId =
      this.model.googleGrantType?.validateClientId ?? true;
    const clientId = this.model.googleGrantType?.clientId;

    if (clientId) {
      this.clientIds = Array.isArray(clientId) ? clientId : Array(clientId);
    }

    if (this.validateClientId && this.clientIds.length === 0) {
      throw new InvalidArgumentError(
        'Invalid argument: Google valid clientId must be provided in options',
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`',
      );
    }

    this.handle = this.handle.bind(this);
    this.getUser = this.getUser.bind(this);
    this.saveToken = this.saveToken.bind(this);
  }

  async handle(request: Request, client: Client) {
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

  async getUser(request: Request) {
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

    if (this.validateClientId && !this.clientIds.includes(data.aud)) {
      throw new InvalidTokenError(
        'You cannot use this Google ID Token with this grant type',
      );
    }

    return await this.model.getUserWithGoogle(data);
  }

  async saveToken(user: User, client: Client, scope: string | string[]) {
    const scopeData = await this.validateScope(user, client, scope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const refreshToken = await this.generateRefreshToken(client, user, scope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = await this.getRefreshTokenExpiresAt();

    const token: Token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope: scopeData || [],
      user: {
        id: user.id,
      },
      client,
    };

    return await this.model.saveToken(token, client, user);
  }
}

export default GoogleGrantType;
