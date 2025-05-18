import { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { User, AuthResponse } from '../types';
import { awsConfig } from '../config/aws';

export class AuthService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient(awsConfig);
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || '';
    this.clientId = process.env.COGNITO_CLIENT_ID || '';
  }

  async signUp(email: string, password: string, username: string): Promise<string> {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'preferred_username',
          Value: username,
        },
      ],
    });

    const response = await this.cognitoClient.send(command);
    return response.UserSub || '';
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: code,
    });

    await this.cognitoClient.send(command);
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await this.cognitoClient.send(command);
    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed');
    }

    const user = await this.getUserInfo(response.AuthenticationResult.AccessToken || '');

    return {
      accessToken: response.AuthenticationResult.AccessToken || '',
      idToken: response.AuthenticationResult.IdToken || '',
      refreshToken: response.AuthenticationResult.RefreshToken || '',
      expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
      user,
    };
  }

  private async getUserInfo(accessToken: string): Promise<User> {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await this.cognitoClient.send(command);
    const username = response.UsernameAttributes?.find(attr => attr.Name === 'preferred_username')?.Value || '';

    return {
      id: response.Username || '',
      email: response.UserAttributes?.find(attr => attr.Name === 'email')?.Value || '',
      username,
      preferences: {
        responseStyle: 'formal',
        language: 'ja',
      },
      createdAt: new Date(),
      lastLogin: new Date(),
    };
  }
} 