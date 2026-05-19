import { Injectable, CanActivate, ExecutionContext, BadRequestException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ProjectScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const projectId = request.headers['x-project-id'];

    if (!projectId) {
      throw new BadRequestException('x-project-id header is required');
    }

    const userProjects = request.user?.projectIds || [];
    if (!userProjects.includes(projectId) && !request.user?.isSuperAdmin) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return true;
  }
}
