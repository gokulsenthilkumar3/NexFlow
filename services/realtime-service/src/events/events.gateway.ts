import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    // Origin is configured at bootstrap level; allow all here for flexibility
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly configService: ConfigService) {}

  afterInit(_server: Server) {
    this.logger.log('EventsGateway initialized');
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.query?.token;
    if (!token) {
      this.logger.warn(`Client ${client.id} connected without auth token`);
      // Disconnect unauthenticated clients
      client.emit('error', { message: 'Unauthorized: missing auth token' });
      client.disconnect(true);
      return;
    }
    this.logger.log(`Client connected: ${client.id}`);

    // Optionally join a project-specific room based on projectId query param
    const projectId = client.handshake.query?.projectId as string | undefined;
    if (projectId) {
      void client.join(`project:${projectId}`);
      this.logger.log(`Client ${client.id} joined room project:${projectId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast an event to all connected clients.
   * If payload contains a `projectId`, emit only to the corresponding room.
   */
  emit(event: string, payload: Record<string, unknown>) {
    const projectId = payload['projectId'] as string | undefined;
    if (projectId) {
      this.server.to(`project:${projectId}`).emit(event, payload);
    } else {
      this.server.emit(event, payload);
    }
  }
}
