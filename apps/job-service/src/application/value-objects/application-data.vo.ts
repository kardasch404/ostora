export class ApplicationData {
  constructor(
    public readonly jobPostId: string,
    public readonly userId: string,
    public readonly bundleId: string,
    public readonly emailConfigId: string,
    public readonly templateId: string,
    public readonly recipientEmail: string,
    public readonly placeholders?: Record<string, string>
  ) {
    this.validate();
  }

  private validate() {
    if (!this.jobPostId || !this.userId || !this.bundleId) {
      throw new Error('Missing required application data');
    }
    if (!this.isValidEmail(this.recipientEmail)) {
      throw new Error('Invalid recipient email');
    }
  }

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  toJobData() {
    return {
      jobPostId: this.jobPostId,
      userId: this.userId,
      bundleId: this.bundleId,
      emailConfigId: this.emailConfigId,
      templateId: this.templateId,
      recipientEmail: this.recipientEmail,
      placeholders: this.placeholders,
    };
  }
}
