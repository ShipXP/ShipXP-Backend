/**
 * @file Tests for the GitHub webhook handler.
 */
import request from 'supertest';
import app from '../src/server';
import crypto from 'crypto';

describe('GitHub Webhook Handler', () => {
  const secret = 'test-secret';
  process.env.GITHUB_WEBHOOK_SECRET = secret;

  it('should return 401 for requests with no signature', async () => {
    const response = await request(app).post('/api/webhook/github').send({});
    expect(response.status).toBe(401);
  });

  it('should return 401 for requests with an invalid signature', async () => {
    const payload = { foo: 'bar' };
    const signature = 'sha256=invalid-signature';
    const response = await request(app)
      .post('/api/webhook/github')
      .set('X-Hub-Signature-256', signature)
      .send(payload);
    expect(response.status).toBe(401);
  });

  it('should return 200 for requests with a valid signature', async () => {
    const payload = { pull_request: { merged: true, number: 123 }, repository: { full_name: 'test/repo' } };
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');

    const response = await request(app)
      .post('/api/webhook/github')
      .set('X-Hub-Signature-256', signature)
      .set('X-GitHub-Event', 'pull_request')
      .send(payload);

    expect(response.status).toBe(200);
  });
});