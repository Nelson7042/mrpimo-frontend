// Feature: vendor-dispute-settings, Property 5: Closed dispute rejects all chat operations
// **Validates: Requirements 6.1, 6.2**

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * We test the sendDisputeMessage and sendDisputeMedia controller functions
 * by mocking the Issue and DisputeChat models.
 *
 * Property 5: For any dispute with status "closed" and any message or media
 * submission attempt, the backend SHALL reject the operation with a 403 status code.
 */

// Mock the Issue model
const mockIssueFindById = vi.fn();
vi.mock('../../../mprimo-backend/src/models/issue.model', () => ({
  default: {
    findById: (...args: any[]) => mockIssueFindById(...args),
  },
}));

// Mock the DisputeChat and DisputeMessage models
const mockDisputeChatFindOne = vi.fn();
vi.mock('../../../mprimo-backend/src/models/dispute-chat.model', () => ({
  DisputeChat: {
    findOne: (...args: any[]) => mockDisputeChatFindOne(...args),
  },
  DisputeMessage: {
    create: vi.fn().mockResolvedValue({ _id: 'msg123' }),
    findById: vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({ _id: 'msg123', text: 'test' }),
    }),
  },
}));

// Mock the LoggerService
vi.mock('../../../mprimo-backend/src/services/logger.service', () => ({
  LoggerService: {
    getInstance: () => ({
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

// Mock Redis service
vi.mock('../../../mprimo-backend/src/services/redis.service', () => ({
  default: {
    redisClient: null,
  },
}));

// Mock Cloudinary upload functions
vi.mock('../../../mprimo-backend/src/config/multer.config', () => ({
  uploadImageToCloudinary: vi.fn().mockResolvedValue({ url: 'http://example.com/img.jpg', public_id: 'img123' }),
  uploadVideoToCloudinary: vi.fn().mockResolvedValue({ url: 'http://example.com/vid.mp4', public_id: 'vid123' }),
  uploadDocumentToCloudinary: vi.fn().mockResolvedValue({ url: 'http://example.com/doc.pdf', public_id: 'doc123' }),
}));

import { sendDisputeMessage, sendDisputeMedia } from '../../../mprimo-backend/src/controllers/dispute-chat.controller';

/**
 * Helper to create a mock Express request for sendDisputeMessage.
 */
function createMessageReq(issueId: string, senderId: string, text: string) {
  return {
    params: { issueId },
    body: { text },
    userId: senderId,
  } as any;
}

/**
 * Helper to create a mock Express request for sendDisputeMedia.
 */
function createMediaReq(issueId: string, senderId: string, messageType: string) {
  return {
    params: { issueId },
    body: { messageType },
    userId: senderId,
    file: {
      path: '/tmp/test-file',
      originalname: 'test-file.jpg',
      size: 1024,
    },
  } as any;
}

/**
 * Helper to create a mock Express response.
 */
function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

/**
 * Arbitrary that generates MongoDB-like ObjectId strings (24 hex characters).
 */
const objectIdArb = fc
  .array(fc.constantFrom(...'0123456789abcdef'.split('')), { minLength: 24, maxLength: 24 })
  .map((arr) => arr.join(''));

/**
 * Arbitrary that generates non-empty text message payloads.
 */
const textMessageArb = fc.string({ minLength: 1, maxLength: 500 });

/**
 * Arbitrary that generates valid media message types.
 */
const mediaTypeArb = fc.constantFrom('image', 'video', 'document');

describe('Property 5: Closed dispute rejects all chat operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sendDisputeMessage returns 403 for any text payload when dispute is closed', async () => {
    await fc.assert(
      fc.asyncProperty(
        objectIdArb,
        objectIdArb,
        textMessageArb,
        async (issueId, senderId, text) => {
          mockDisputeChatFindOne.mockReset();
          mockIssueFindById.mockReset();

          // Mock: dispute chat exists with the sender as a participant
          mockDisputeChatFindOne.mockResolvedValue({
            _id: 'chat123',
            issueId,
            participants: [senderId],
          });

          // Mock: issue exists with status "closed"
          mockIssueFindById.mockReturnValue({
            select: vi.fn().mockResolvedValue({ status: 'closed' }),
          });

          const req = createMessageReq(issueId, senderId, text);
          const res = createMockRes();

          await sendDisputeMessage(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              success: false,
              message: expect.stringContaining('closed'),
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sendDisputeMedia returns 403 for any media type when dispute is closed', async () => {
    await fc.assert(
      fc.asyncProperty(
        objectIdArb,
        objectIdArb,
        mediaTypeArb,
        async (issueId, senderId, messageType) => {
          mockDisputeChatFindOne.mockReset();
          mockIssueFindById.mockReset();

          // Mock: dispute chat exists with the sender as a participant
          mockDisputeChatFindOne.mockResolvedValue({
            _id: 'chat123',
            issueId,
            participants: [senderId],
          });

          // Mock: issue exists with status "closed"
          mockIssueFindById.mockReturnValue({
            select: vi.fn().mockResolvedValue({ status: 'closed' }),
          });

          const req = createMediaReq(issueId, senderId, messageType);
          const res = createMockRes();

          await sendDisputeMedia(req, res);

          expect(res.status).toHaveBeenCalledWith(403);
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              success: false,
              message: expect.stringContaining('closed'),
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all chat operations on closed disputes return 403 regardless of payload content', async () => {
    // Combined property: for any operation type and any payload, closed disputes always reject
    const operationArb = fc.record({
      issueId: objectIdArb,
      senderId: objectIdArb,
      text: textMessageArb,
      mediaType: mediaTypeArb,
      operationType: fc.constantFrom('message', 'media') as fc.Arbitrary<'message' | 'media'>,
    });

    await fc.assert(
      fc.asyncProperty(operationArb, async ({ issueId, senderId, text, mediaType, operationType }) => {
        mockDisputeChatFindOne.mockReset();
        mockIssueFindById.mockReset();

        // Mock: dispute chat exists with the sender as a participant
        mockDisputeChatFindOne.mockResolvedValue({
          _id: 'chat123',
          issueId,
          participants: [senderId],
        });

        // Mock: issue exists with status "closed"
        mockIssueFindById.mockReturnValue({
          select: vi.fn().mockResolvedValue({ status: 'closed' }),
        });

        const res = createMockRes();

        if (operationType === 'message') {
          const req = createMessageReq(issueId, senderId, text);
          await sendDisputeMessage(req, res);
        } else {
          const req = createMediaReq(issueId, senderId, mediaType);
          await sendDisputeMedia(req, res);
        }

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      }),
      { numRuns: 100 }
    );
  });
});
