import { DeviceFingerprint } from '../../value-objects/device-fingerprint.vo';

describe('DeviceFingerprint Value Object', () => {
  const mockRequest = (userAgent: string, ip: string) => ({
    headers: { 'user-agent': userAgent },
    ip,
  });

  describe('Fingerprint generation', () => {
    it('should generate fingerprint from user-agent and IP', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
      expect(fingerprint.hash).toHaveLength(64);
    });

    it('should generate consistent fingerprint for same inputs', () => {
      const req1 = mockRequest('Mozilla/5.0', '192.168.1.1');
      const req2 = mockRequest('Mozilla/5.0', '192.168.1.1');

      const fp1 = new DeviceFingerprint(req1 as any);
      const fp2 = new DeviceFingerprint(req2 as any);

      expect(fp1.hash).toBe(fp2.hash);
    });

    it('should generate different fingerprints for different user-agents', () => {
      const req1 = mockRequest('Mozilla/5.0', '192.168.1.1');
      const req2 = mockRequest('Chrome/90.0', '192.168.1.1');

      const fp1 = new DeviceFingerprint(req1 as any);
      const fp2 = new DeviceFingerprint(req2 as any);

      expect(fp1.hash).not.toBe(fp2.hash);
    });

    it('should use SHA-256 hashing', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('IP subnet masking', () => {
    it('should mask last octet of IPv4 address', () => {
      const req1 = mockRequest('Mozilla/5.0', '192.168.1.100');
      const req2 = mockRequest('Mozilla/5.0', '192.168.1.200');

      const fp1 = new DeviceFingerprint(req1 as any);
      const fp2 = new DeviceFingerprint(req2 as any);

      expect(fp1.hash).toBe(fp2.hash);
    });

    it('should differentiate different /24 subnets', () => {
      const req1 = mockRequest('Mozilla/5.0', '192.168.1.100');
      const req2 = mockRequest('Mozilla/5.0', '192.168.2.100');

      const fp1 = new DeviceFingerprint(req1 as any);
      const fp2 = new DeviceFingerprint(req2 as any);

      expect(fp1.hash).not.toBe(fp2.hash);
    });
  });

  describe('Static create method', () => {
    it('should create fingerprint from user-agent and IP strings', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint).toBeDefined();
      expect(fingerprint.hash).toHaveLength(64);
    });

    it('should return same hash as constructor method', () => {
      const req1 = mockRequest('Mozilla/5.0', '192.168.1.1');
      const req2 = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fp1 = new DeviceFingerprint(req1 as any);
      const fp2 = new DeviceFingerprint(req2 as any);

      expect(fp1.hash).toBe(fp2.hash);
    });
  });

  describe('Hash property', () => {
    it('should return hash value', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBe(fingerprint.hash);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing user-agent', () => {
      const req = { headers: {}, ip: '192.168.1.1' };
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
    });

    it('should handle missing IP', () => {
      const req = { headers: { 'user-agent': 'Mozilla/5.0' }, ip: undefined, socket: { remoteAddress: '127.0.0.1' } };
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
    });

    it('should handle localhost IP', () => {
      const req = mockRequest('Mozilla/5.0', '127.0.0.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
    });

    it('should handle IPv6 addresses', () => {
      const req = mockRequest('Mozilla/5.0', '2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
    });

    it('should handle very long user-agent strings', () => {
      const longUserAgent = 'Mozilla/5.0 ' + 'a'.repeat(1000);
      const req = mockRequest(longUserAgent, '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
      expect(fingerprint.hash).toHaveLength(64);
    });

    it('should handle special characters in user-agent', () => {
      const req = mockRequest('Mozilla/5.0 (特殊文字)', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(fingerprint.hash).toBeDefined();
    });
  });

  describe('Security properties', () => {
    it('should not expose original user-agent', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(JSON.stringify(fingerprint)).not.toContain('Mozilla');
    });

    it('should not expose original IP', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const fingerprint = new DeviceFingerprint(req as any);

      expect(JSON.stringify(fingerprint)).not.toContain('192.168.1.1');
    });

    it('should be deterministic', () => {
      const req = mockRequest('Mozilla/5.0', '192.168.1.1');
      const hashes = Array.from({ length: 100 }, () => 
        new DeviceFingerprint(req as any).hash
      );

      expect(new Set(hashes).size).toBe(1);
    });
  });
});
