import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@ApiTags('Users Proxy')
@Controller('users')
export class UserProxyController {
  private readonly userServiceUrl = process.env['USER_SERVICE_URL'] || 'http://localhost:4719';
  private readonly emailServiceUrl = process.env['EMAIL_SERVICE_URL'] || 'http://email-service:4721';

  constructor(private readonly httpService: HttpService) {}

  @Get('profile')
  async getProfile(@Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile`;
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return {};
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get profile',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Patch('profile')
  async updateProfile(@Body() body: any, @Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile`;
      const response = await firstValueFrom(
        this.httpService.patch(url, body, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update profile',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('profile/import/linkedin')
  async importProfileFromLinkedIn(@Body() body: any, @Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile/import/linkedin`;
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to import profile from LinkedIn',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('profile/import/linkedin/payload')
  async importProfileFromLinkedInPayload(@Body() body: any, @Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile/import/linkedin/payload`;
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to import profile from LinkedIn payload',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('profile/upload-url')
  async generateProfileUploadUrl(@Body() body: any, @Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile/upload-url`;
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to generate profile upload URL',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Delete('profile')
  async deleteProfile(@Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile`;
      const response = await firstValueFrom(
        this.httpService.delete(url, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to delete profile',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('profile/completeness')
  async getProfileCompleteness(@Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/profile/completeness`;
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { percentage: 0, missing: ['All fields'] };
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get profile completeness',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('education')
  async createEducation(@Body() body: any, @Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/education`;
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create education',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('education')
  async getEducation(@Headers('authorization') auth: string) {
    try {
      const url = `${this.userServiceUrl}/api/v1/education`;
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get education',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Patch('education/:id')
  async updateEducation(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    try {
      const url = `${this.userServiceUrl}/api/v1/education/${id}`;
      const response = await firstValueFrom(
        this.httpService.patch(url, body, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update education',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Delete('education/:id')
  async deleteEducation(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    try {
      const url = `${this.userServiceUrl}/api/v1/education/${id}`;
      const response = await firstValueFrom(
        this.httpService.delete(url, { headers: { authorization: auth } })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to delete education',
        (axios.isAxiosError(error) && error.response?.status) || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('me')
  async getCurrentUser(@Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/users/me`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Get('emails')
  async getEmails(@Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/email-configs`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Get(':id([0-9a-fA-F-]{36})')
  async getUserById(@Param('id') id: string, @Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/users/${id}`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Put(':id([0-9a-fA-F-]{36})')
  async updateUser(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string
  ) {
    const url = `${this.userServiceUrl}/api/v1/users/${id}`;
    const response = await firstValueFrom(
      this.httpService.put(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Post('emails')
  async addEmail(@Body() body: any, @Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/email-configs`;
    const response = await firstValueFrom(
      this.httpService.post(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Patch('emails/:id')
  async updateEmail(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/email-configs/${id}`;
    const response = await firstValueFrom(
      this.httpService.patch(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Patch('emails/:id/default')
  async setDefaultEmail(@Param('id') id: string, @Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/email-configs/${id}/default`;
    const response = await firstValueFrom(
      this.httpService.patch(url, {}, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Delete('emails/:id')
  async deleteEmail(@Param('id') id: string, @Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/email-configs/${id}`;
    const response = await firstValueFrom(
      this.httpService.delete(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Post('emails/send')
  async sendEmail(@Body() body: any, @Headers('authorization') auth: string) {
    const resolveUrl = `${this.userServiceUrl}/api/v1/email-configs/resolve-sender`;
    const senderConfigResponse = await firstValueFrom(
      this.httpService.post(
        resolveUrl,
        { email: body?.from },
        { headers: { authorization: auth } }
      )
    );

    const senderConfig = senderConfigResponse.data;

    const url = `${this.emailServiceUrl}/api/v1/email/send`;
    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          ...body,
          from: body?.from || senderConfig.fromEmail,
          smtpConfig: {
            smtpHost: senderConfig.smtpHost,
            smtpPort: senderConfig.smtpPort,
            smtpSecure: senderConfig.smtpSecure,
            smtpUser: senderConfig.smtpUser,
            smtpPassword: senderConfig.smtpPassword,
            fromEmail: senderConfig.fromEmail,
            fromName: senderConfig.fromName,
          },
        },
        { headers: { authorization: auth } }
      )
    );
    return response.data;
  }

  @Post('bundles')
  async createBundle(@Body() body: any, @Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/bundles`;
    const response = await firstValueFrom(
      this.httpService.post(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Get('bundles')
  async getBundles(@Headers('authorization') auth: string) {
    const url = `${this.userServiceUrl}/api/v1/bundles`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Get('bundles/:id')
  async getBundle(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Patch('bundles/:id')
  async updateBundle(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}`;
    const response = await firstValueFrom(
      this.httpService.patch(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Delete('bundles/:id')
  async deleteBundle(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}`;
    const response = await firstValueFrom(
      this.httpService.delete(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Post('bundles/:id/documents')
  async addBundleDocument(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}/documents`;
    const response = await firstValueFrom(
      this.httpService.post(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Get('bundles/:id/documents')
  async getBundleDocuments(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}/documents`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Get('bundles/:id/documents/:documentId/download')
  async getBundleDocumentDownloadUrl(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}/documents/${documentId}/download`;
    const response = await firstValueFrom(
      this.httpService.get(url, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Patch('bundles/:id/documents/:documentId')
  async updateBundleDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body() body: any,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}/documents/${documentId}`;
    const response = await firstValueFrom(
      this.httpService.patch(url, body, { headers: { authorization: auth } })
    );
    return response.data;
  }

  @Delete('bundles/:id/documents/:documentId')
  async deleteBundleDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Headers('authorization') auth: string,
  ) {
    const url = `${this.userServiceUrl}/api/v1/bundles/${id}/documents/${documentId}`;
    const response = await firstValueFrom(
      this.httpService.delete(url, { headers: { authorization: auth } })
    );
    return response.data;
  }
}
