import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {}

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {}
