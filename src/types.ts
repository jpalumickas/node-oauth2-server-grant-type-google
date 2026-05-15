import type {
  AuthorizationCodeModel,
  ClientCredentialsModel,
  RefreshTokenModel,
  PasswordModel,
  ExtensionModel,
  User,
} from '@node-oauth/oauth2-server';

type Oauth2ServerModel =
  | AuthorizationCodeModel
  | ClientCredentialsModel
  | RefreshTokenModel
  | PasswordModel
  | ExtensionModel;

export type GoogleTokenData = {
  name: string;
  email: string;
  sub: string;
  aud: string;
  [key: string]: unknown;
};

export type Model = Oauth2ServerModel & {
  googleGrantType: {
    clientId: string | string[];
    validateClientId?: boolean;
  };
  getUserWithGoogle: (data: GoogleTokenData) => Promise<User>;
};
