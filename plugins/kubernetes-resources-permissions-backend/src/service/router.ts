
import { LoggerService, PermissionsService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';
import { kubernetesResourcesPermissions } from '@terasky/backstage-plugin-kubernetes-resources-common';

export interface RouterOptions {
  logger: LoggerService;
  permissions: PermissionsService;
}
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;
  logger.info('Initializing Kubernetes Resources backend');
  const router = Router();
  router.use(express.json());
  const permissionRouter = createPermissionIntegrationRouter({
    permissions: Object.values(kubernetesResourcesPermissions),
  });
  router.use(permissionRouter);
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  return router;
}