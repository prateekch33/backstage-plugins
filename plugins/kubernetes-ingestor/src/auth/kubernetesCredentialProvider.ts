import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import {
  AksStrategy,
  AwsIamStrategy,
  AzureIdentityStrategy,
  GoogleServiceAccountStrategy,
  GoogleStrategy,
  OidcStrategy,
  ServiceAccountStrategy,
} from '@backstage/plugin-kubernetes-backend';
import { KubernetesCredential } from '@backstage/plugin-kubernetes-node';

export async function getAuthCredential(
  cluster: any,
  authProvider: string,
  config: Config,
  logger: LoggerService,
): Promise<KubernetesCredential> {
  switch (authProvider) {
    case 'aks': {
      const aksAuth = new AksStrategy();
      const authConfig = config.getConfig('auth');
      const authEnvironment = authConfig?.getOptionalString('environment');
      if (!authEnvironment) {
        throw new Error(
          'Missing environment configuration for AKS authentication',
        );
      }
      const aksAuthConfig = authConfig
        ?.getOptionalConfig('aks')
        ?.getOptionalConfig(authEnvironment);
      if (!aksAuthConfig) {
        throw new Error(
          `Missing request authentication configuration for AKS in environment: ${authEnvironment}`,
        );
      }
      const requestAuth = {
        clientId: aksAuthConfig?.getOptionalString('clientId'),
        clientSecret: aksAuthConfig?.getOptionalString('clientSecret'),
        tenantId: aksAuthConfig?.getOptionalString('tenantId'),
        domainHint: aksAuthConfig?.getOptionalString('domainHint'),
      };
      return await aksAuth.getCredential(cluster, requestAuth);
    }
    case 'aws': {
      if (!cluster.authMetadata?.['kubernetes.io/aws-assume-role']) {
        throw new Error('AWS role ARN not found in cluster auth metadata');
      }
      const awsAuth = new AwsIamStrategy({ config });
      return await awsAuth.getCredential(cluster);
    }
    case 'azure': {
      const azureAuth = new AzureIdentityStrategy(logger);
      return await azureAuth.getCredential();
    }
    case 'google': {
      const googleAuth = new GoogleStrategy();
      const authConfig = config.getConfig('auth');
      const authEnvironment = authConfig?.getOptionalString('environment');
      if (!authEnvironment) {
        throw new Error(
          'Missing environment configuration for Google authentication',
        );
      }
      const googleAuthConfig = authConfig
        ?.getOptionalConfig('google')
        ?.getOptionalConfig(authEnvironment);
      if (!googleAuthConfig) {
        throw new Error(
          `Missing request authentication configuration for Google in environment: ${authEnvironment}`,
        );
      }
      const requestAuth = {
        clientId: googleAuthConfig?.getOptionalString('clientId'),
        clientSecret: googleAuthConfig?.getOptionalString('clientSecret'),
      };
      return await googleAuth.getCredential(cluster, requestAuth);
    }
    case 'googleServiceAccount': {
      const googleServiceAccountAuth = new GoogleServiceAccountStrategy();
      return await googleServiceAccountAuth.getCredential();
    }
    case 'oidc': {
      const oidcAuth=new OidcStrategy();
      const authConfig = config.getConfig('auth');
      const authEnvironment = authConfig?.getOptionalString('environment');
      if (!authEnvironment) {
        throw new Error(
          'Missing environment configuration for OIDC authentication',
        );
      }
      const oidcAuthConfig = authConfig
        ?.getOptionalConfig('oidc')
        ?.getOptionalConfig(authEnvironment);
      if (!oidcAuthConfig) {
        throw new Error(
          `Missing request authentication configuration for OIDC in environment: ${authEnvironment}`,
        );
      }
      const requestAuth = {
        oidcTokenProvider: oidcAuthConfig?.getOptionalString('oidcTokenProvider'),
      };
      return await oidcAuth.getCredential(cluster, requestAuth);
    }
    case 'serviceAccount': {
      const serviceAccountAuth=new ServiceAccountStrategy();
      return await serviceAccountAuth.getCredential(cluster);
    }
    default:
      throw new Error(`Unsupported authentication provider: ${authProvider}`);
  }
}
