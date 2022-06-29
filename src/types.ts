import {
  AuthorizationCodeModel,
  ClientCredentialsModel,
  RefreshTokenModel,
  PasswordModel,
  ExtensionModel,
} from 'oauth2-server';

type Oauth2ServerModel =
  | AuthorizationCodeModel
  | ClientCredentialsModel
  | RefreshTokenModel
  | PasswordModel
  | ExtensionModel;

type GoogleTokenData = {
  name: string;
  email: string;
  sub: string;
};

export type Model = Oauth2ServerModel & {
  googleGrantType: {
    clientId: string | string[];
    validateClientId?: boolean;
  };
  getUserWithGoogle: (data: GoogleTokenData) => any;
};
