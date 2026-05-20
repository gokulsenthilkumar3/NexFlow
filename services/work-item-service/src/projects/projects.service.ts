import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, key: string, description?: string) {
    try {
      const project = await this.prisma.projects.create({
        data: { name, key, description },
      });
      return project;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Project with this key already exists');
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.projects.findMany();
  }
}
