import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionRequest } from '../interceptors/session.interceptor';

export interface SessionInfo {
  sessionId?: string;
  userId?: string;
}

export const Session = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SessionInfo => {
    const request = ctx.switchToHttp().getRequest<SessionRequest>();
    return {
      sessionId: request.sessionId,
      userId: request.userId,
    };
  },
);

