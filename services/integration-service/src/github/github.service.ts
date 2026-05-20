import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

interface PushCommit {
  id: string;
  message: string;
  author: { username: string };
  url: string;
}

interface PushPayload {
  commits?: PushCommit[];
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  html_url: string;
  merged?: boolean;
}

interface PullRequestPayload {
  action: string;
  pull_request: PullRequest;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Processes a generic GitHub webhook payload.
   * Parses commits and PR descriptions looking for "Fixes #T-102" or "NF-45".
   */
  async processWebhook(event: string, payload: Record<string, unknown>) {
    this.logger.log(`Received GitHub event: ${event}`);

    switch (event) {
      case 'push':
        await this.handlePush(payload as unknown as PushPayload);
        break;
      case 'pull_request':
        await this.handlePullRequest(payload as unknown as PullRequestPayload);
        break;
      default:
        this.logger.log(`Ignoring unhandled event type: ${event}`);
    }
  }

  private async handlePush(payload: PushPayload) {
    const commits = payload.commits ?? [];
    for (const commit of commits) {
      const ticketRefs = this.extractReferences(commit.message);
      if (ticketRefs.length > 0) {
        await this.redisService.publishEvent('events:integration', 'EXTERNAL_COMMIT_PUSHED', {
          commitId: commit.id,
          message: commit.message,
          author: commit.author.username,
          url: commit.url,
          references: ticketRefs,
        });
      }
    }
  }

  private async handlePullRequest(payload: PullRequestPayload) {
    const { action, pull_request: pr } = payload;

    // Combine title and body to search for ticket refs (e.g., "Resolves #NF-45")
    const searchString = `${pr.title} ${pr.body ?? ''}`;
    const ticketRefs = this.extractReferences(searchString);

    if (ticketRefs.length > 0) {
      let eventType = '';
      if (action === 'opened' || action === 'reopened') {
        eventType = 'EXTERNAL_PR_OPENED';
      } else if (action === 'closed' && pr.merged) {
        eventType = 'EXTERNAL_PR_MERGED';
      }

      if (eventType) {
        await this.redisService.publishEvent('events:integration', eventType, {
          prId: pr.id,
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          references: ticketRefs,
        });
      }
    }
  }

  /**
   * Simple regex to find NexFlow Ticket/WorkItem IDs.
   * Looks for patterns like "T-102", "#NF-45", etc.
   */
  private extractReferences(text: string): string[] {
    const regex = /(?:#)?((?:T|NF)-\d+)/gi;
    const matches = Array.from(text.matchAll(regex));
    return matches.map((m) => m[1].toUpperCase());
  }
}
