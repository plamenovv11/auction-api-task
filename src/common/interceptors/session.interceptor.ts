import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

export interface SessionRequest extends Request {
  sessionId?: string;
  userId?: string;
}

@Injectable()
export class SessionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Extract session ID from headers, validate session ID format and attath session info to request object
    const request = context.switchToHttp().getRequest<SessionRequest>();

    const sessionId = request.headers['x-session-id'] as string;
    const userId = request.headers['x-user-id'] as string;

    if (sessionId && !this.isValidSessionId(sessionId)) {
      throw new BadRequestException('Invalid session ID format');
    }

    request.sessionId = sessionId;
    request.userId = userId;

    return next.handle();
  }

  private isValidSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.trim().length > 0;
  }
}

