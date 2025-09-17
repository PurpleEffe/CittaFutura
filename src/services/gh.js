import { getConfig } from './config.js';

const API_BASE = 'https://api.github.com';
const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

function encodeContent(content) {
  if (typeof window !== 'undefined' && window.btoa && encoder) {
    const bytes = encoder.encode(content);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }
  return Buffer.from(content, 'utf8').toString('base64');
}

function decodeContent(content) {
  if (typeof window !== 'undefined' && window.atob && decoder) {
    const binary = window.atob(content);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return decoder.decode(bytes);
  }
  return Buffer.from(content, 'base64').toString('utf8');
}

export function parseRepoFromConfig(config) {
  const endpoint = config?.staticman?.endpoint;
  if (!endpoint) {
    return null;
  }
  const parts = endpoint.split('/');
  const idx = parts.findIndex((part) => part === 'github');
  if (idx === -1) {
    return null;
  }
  const owner = parts[idx + 1];
  const repo = parts[idx + 2];
  const branch = parts[idx + 3] || 'main';
  if (!owner || !repo) {
    return null;
  }
  return { owner, repo, branch };
}

export class GitHubClient {
  constructor({ owner, repo, branch = 'main' }) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = null;
    this.user = null;
  }

  setToken(token) {
    this.token = token;
  }

  async ensureUser() {
    if (!this.user) {
      this.user = await this.request('/user');
    }
    return this.user;
  }

  async request(path, { method = 'GET', headers = {}, body, raw = false } = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`github:${response.status}`);
      error.status = response.status;
      error.body = text;
      throw error;
    }

    if (response.status === 204 || raw) {
      return response;
    }

    return response.json();
  }

  async getRepoContents(path) {
    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`);
  }

  async getFile(path) {
    const data = await this.request(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`);
    let decoded = null;
    try {
      decoded = decodeContent(data.content);
    } catch (error) {
      decoded = null;
    }
    return { ...data, decoded };
  }

  async updateFile({ path, message, content, sha, encoded = false }) {
    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'PUT',
      body: {
        message,
        content: encoded ? content : encodeContent(content),
        branch: this.branch,
        sha,
      },
    });
  }

  async createFile({ path, message, content, encoded = false }) {
    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'PUT',
      body: {
        message,
        content: encoded ? content : encodeContent(content),
        branch: this.branch,
      },
    });
  }

  async deleteFile({ path, message, sha }) {
    return this.request(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
      method: 'DELETE',
      body: {
        message,
        branch: this.branch,
        sha,
      },
    });
  }

  async listBookings() {
    try {
      const files = await this.getRepoContents('data/bookings');
      if (!Array.isArray(files)) {
        return [];
      }
      const bookings = [];
      for (const file of files) {
        if (file.type !== 'file' || !file.name.endsWith('.json')) continue;
        const detail = await this.getFile(`data/bookings/${file.name}`);
        try {
          const json = JSON.parse(detail.decoded);
          bookings.push({ ...json, path: `data/bookings/${file.name}`, sha: detail.sha });
        } catch (error) {
          console.warn('Invalid booking file', file.name, error);
        }
      }
      return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async saveBooking(booking) {
    if (!booking.path) {
      throw new Error('booking-path-missing');
    }
    const payload = { ...booking };
    delete payload.path;
    delete payload.sha;
    const content = JSON.stringify(payload, null, 2);
    return this.updateFile({
      path: booking.path,
      message: `chore: update booking ${booking.id}`,
      content,
      sha: booking.sha,
    });
  }

  async updateBookingStatus(booking, status) {
    const detail = await this.getFile(booking.path);
    const data = JSON.parse(detail.decoded);
    data.status = status;
    data.updatedAt = new Date().toISOString();
    return this.updateFile({
      path: booking.path,
      message: `chore: set ${booking.id} to ${status}`,
      content: JSON.stringify(data, null, 2),
      sha: detail.sha,
    });
  }

  async deleteBooking(booking) {
    return this.deleteFile({
      path: booking.path,
      message: `chore: delete booking ${booking.id}`,
      sha: booking.sha,
    });
  }

  async listHouses() {
    const detail = await this.getFile('data/houses.json');
    const data = JSON.parse(detail.decoded);
    return { houses: data, sha: detail.sha };
  }

  async updateHouses({ houses, sha }) {
    return this.updateFile({
      path: 'data/houses.json',
      message: 'chore: update houses gallery',
      content: JSON.stringify(houses, null, 2),
      sha,
    });
  }

  async uploadImage({ path, content, message }) {
    return this.createFile({ path, content, message, encoded: true });
  }

  async removeImage({ path, sha }) {
    return this.deleteFile({ path, sha, message: `chore: remove ${path}` });
  }

  async hasWriteAccess() {
    const user = await this.ensureUser();
    const data = await this.request(`/repos/${this.owner}/${this.repo}/collaborators/${user.login}/permission`);
    return ['admin', 'write', 'maintain'].includes(data.permission);
  }
}

export function buildAuthorizeUrl(clientId, redirectUri, state) {
  const params = new URLSearchParams({
    client_id: clientId,
    allow_signup: 'false',
    scope: 'repo',
  });
  if (state) {
    params.set('state', state);
  }
  params.set('redirect_uri', redirectUri);
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const config = await getConfig();
  if (!config.oauthProxyUrl) {
    throw new Error('missing-proxy');
  }
  const response = await fetch(config.oauthProxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new Error('oauth-failed');
    error.responseText = text;
    throw error;
  }
  return response.json();
}

export async function createClientFromConfig() {
  const config = await getConfig();
  const repoInfo = parseRepoFromConfig(config);
  if (!repoInfo) {
    throw new Error('repo-config-missing');
  }
  return new GitHubClient(repoInfo);
}
