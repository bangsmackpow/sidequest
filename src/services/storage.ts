export class StorageService {
  constructor(private bucket: R2Bucket) {}

  /**
   * Save raw opportunity JSON from SAM.gov
   */
  async saveRawOpportunityJson(noticeId: string, data: any): Promise<string> {
    const key = `raw/opportunities/${noticeId}.json`;
    await this.bucket.put(key, JSON.stringify(data, null, 2), {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        noticeId,
        uploadedAt: new Date().toISOString(),
      },
    });
    return key;
  }

  /**
   * Retrieve raw JSON for an opportunity
   */
  async getRawOpportunityJson(noticeId: string): Promise<any | null> {
    const key = `raw/opportunities/${noticeId}.json`;
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    const text = await obj.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /**
   * Store opportunity attachment (solicitation PDF, SOW, etc.)
   */
  async saveAttachment(
    opportunityId: string,
    filename: string,
    data: ArrayBuffer | Uint8Array | string,
    contentType: string = "application/octet-stream"
  ): Promise<string> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `attachments/${opportunityId}/${safeName}`;
    await this.bucket.put(key, data, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        opportunityId,
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
      },
    });
    return key;
  }

  /**
   * Archive incoming email text, html, and attachments
   */
  async archiveEmail(
    opportunityId: string,
    messageId: string,
    details: {
      rawEml?: ArrayBuffer | string;
      text?: string;
      html?: string;
      attachments?: Array<{ filename: string; content: ArrayBuffer | Uint8Array | string; mimeType: string }>;
    }
  ): Promise<string> {
    const prefix = `emails/${opportunityId}/${messageId}`;

    if (details.text) {
      await this.bucket.put(`${prefix}/body.txt`, details.text, {
        httpMetadata: { contentType: "text/plain; charset=utf-8" },
      });
    }

    if (details.html) {
      await this.bucket.put(`${prefix}/body.html`, details.html, {
        httpMetadata: { contentType: "text/html; charset=utf-8" },
      });
    }

    if (details.rawEml) {
      await this.bucket.put(`${prefix}/message.eml`, details.rawEml, {
        httpMetadata: { contentType: "message/rfc822" },
      });
    }

    if (details.attachments && details.attachments.length > 0) {
      for (const att of details.attachments) {
        const attKey = `${prefix}/attachments/${att.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        await this.bucket.put(attKey, att.content, {
          httpMetadata: { contentType: att.mimeType || "application/octet-stream" },
        });
      }
    }

    return prefix;
  }

  /**
   * Store generated RFI proposal response
   */
  async saveGeneratedRfi(
    opportunityId: string,
    content: string,
    format: "markdown" | "html" = "markdown"
  ): Promise<{ key: string; filename: string }> {
    const timestamp = Date.now();
    const ext = format === "markdown" ? "md" : "html";
    const filename = `RFI_Response_${opportunityId}_${timestamp}.${ext}`;
    const key = `proposals/${opportunityId}/${filename}`;

    await this.bucket.put(key, content, {
      httpMetadata: {
        contentType: format === "markdown" ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
      },
      customMetadata: {
        opportunityId,
        generatedAt: new Date().toISOString(),
      },
    });

    return { key, filename };
  }

  /**
   * Get an object from R2 by key
   */
  async getObject(key: string) {
    return this.bucket.get(key);
  }
}
