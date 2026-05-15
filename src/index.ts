import {
  AbstractGrantType,
  InvalidArgumentError,
  InvalidRequestError,
  InvalidTokenError,
} from '@node-oauth/oauth2-server';
import type {
  Request,
  Client,
  TokenOptions,
  User,
  Token,
} from '@node-oauth/oauth2-server';
import type { GoogleTokenData, Model } from './types.js';

const url = 'https://oauth2.googleapis.com/tokeninfo';

export interface Options extends TokenOptions {
  model: Model;
}

export class GoogleGrantType extends AbstractGrantType {
  model: Model;
  validateClientId: boolean;
  clientIds: string[] = [];

  constructor(options: Options) {
    super(options);

    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    if (!options.model.getUserWithGoogle) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `getUserWithGoogle()`',
      );
    }

    if (!options.model.saveToken) {
      throw new InvalidArgumentError(
        'Invalid argument: model does not implement `saveToken()`',
      );
    }

    this.model = options.model;

    this.validateClientId =
      this.model.googleGrantType?.validateClientId ?? true;
    const clientId = this.model.googleGrantType?.clientId;

    if (clientId) {
      this.clientIds = Array.isArray(clientId) ? clientId : [clientId];
    }

    if (this.validateClientId && this.clientIds.length === 0) {
      throw new InvalidArgumentError(
        'Invalid argument: Google valid clientId must be provided in options',
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

    let data: GoogleTokenData;

    try {
      const response = await fetch(
        `${url}?id_token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        throw new Error(`Google tokeninfo responded with ${response.status}`);
      }

      data = (await response.json()) as GoogleTokenData;
    } catch {
      throw new InvalidTokenError('Google id token is invalid or expired');
    }

    if (this.validateClientId && !this.clientIds.includes(data.aud)) {
      throw new InvalidTokenError(
        'You cannot use this Google ID Token with this grant type',
      );
    }

    return await this.model.getUserWithGoogle(data);
  }

  async saveToken(user: User, client: Client, scope: string[]) {
    const validatedScope = await this.validateScope(user, client, scope);
    const accessToken = await this.generateAccessToken(client, user, scope);
    const refreshToken = await this.generateRefreshToken(client, user, scope);
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();

    const token: Token = {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope: validatedScope || [],
      user: {
        id: user.id,
      },
      client,
    };

    return await this.model.saveToken(token, client, user);
  }
}
