import Alpine from 'alpinejs';
import './main.css';
import { initLanguage, setLanguage, getCurrentLanguage, t } from './services/i18n.js';
import { registerToastStore } from './ui/toast.js';
import { registerAnimations } from './ui/intersection.js';
import { submitBooking, isSubmitting, getFallbackLink, getErrorMessage } from './services/booking.js';
import { getConfig } from './services/config.js';
import { buildAuthorizeUrl, exchangeCodeForToken, createClientFromConfig, parseRepoFromConfig } from './services/gh.js';

window.Alpine = Alpine;

document.addEventListener('alpine:init', () => {
  registerToastStore();

  Alpine.store('lang', {
    current: getCurrentLanguage(),
    set(lang) {
      this.current = lang;
    },
  });

  Alpine.data('languageSwitcher', () => ({
    open: false,
    get current() {
      return Alpine.store('lang').current;
    },
    toggle() {
      this.open = !this.open;
    },
    close() {
      this.open = false;
    },
    switchTo(lang) {
      setLanguage(lang);
      this.close();
    },
  }));

  Alpine.data('housesList', () => ({
    houses: [],
    loading: true,
    error: null,
    async init() {
      try {
        const response = await fetch('/data/houses.json', { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error('http-error');
        }
        const data = await response.json();
        this.houses = data.filter((house) => house.active !== false);
      } catch (error) {
        console.error('Unable to load houses', error);
        this.error = error;
      } finally {
        this.loading = false;
      }
    },
    nameFor(house) {
      const lang = Alpine.store('lang').current;
      return house.name?.[lang] ?? house.name?.it ?? '';
    },
    summaryFor(house) {
      const lang = Alpine.store('lang').current;
      return house.summary?.[lang] ?? house.summary?.it ?? '';
    },
  }));

  Alpine.data('bookingForm', () => ({
    houses: [],
    fallbackLink: '',
    status: 'idle',
    message: '',
    get lang() {
      return Alpine.store('lang').current;
    },
    tKey(key) {
      return t(key);
    },
    async init() {
      const config = await getConfig();
      this.fallbackLink = getFallbackLink(config);
      await this.loadHouses();
      const params = new URLSearchParams(window.location.search);
      const selected = params.get('house');
      if (selected && this.houses.some((house) => house.id === selected)) {
        this.$refs.houseSelect.value = selected;
      }
    },
    async loadHouses() {
      try {
        const response = await fetch('/data/houses.json', { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error('http-error');
        }
        this.houses = await response.json();
        this.houses = this.houses.filter((house) => house.active !== false);
      } catch (error) {
        console.error('Unable to fetch houses', error);
        this.houses = [];
      }
    },
    async submit() {
      if (isSubmitting()) {
        this.message = t('book.form.rateLimited');
        this.status = 'error';
        return;
      }
      const form = this.$refs.form;
      if (!form.reportValidity()) {
        this.message = t('book.form.validation');
        this.status = 'error';
        return;
      }
      const formData = new FormData(form);
      this.status = 'loading';
      this.message = '';
      try {
        await submitBooking(formData);
        this.status = 'success';
        this.message = t('book.form.success');
        form.reset();
        Alpine.store('toast').show(this.message, 'success');
      } catch (error) {
        console.error('Booking error', error);
        this.status = 'error';
        this.message = getErrorMessage(error);
      }
    },
  }));

  Alpine.data('adminApp', () => ({
    config: null,
    repoInfo: null,
    token: null,
    client: null,
    authenticated: false,
    checkingPermissions: false,
    loading: false,
    error: null,
    bookings: [],
    houses: [],
    housesSha: null,
    filters: {
      status: 'all',
      search: '',
    },
    lastUpdated: null,
    modalOpen: false,
    editableBooking: null,
    oauthState: null,
    async init() {
      this.loading = true;
      this.config = await getConfig();
      this.repoInfo = parseRepoFromConfig(this.config);
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const stateParam = params.get('state');
      const storedToken = sessionStorage.getItem('cf-gh-token');
      if (storedToken) {
        this.token = storedToken;
      }
      this.oauthState = sessionStorage.getItem('cf-gh-state');
      if (code) {
        try {
          if (stateParam && this.oauthState && stateParam !== this.oauthState) {
            throw new Error('oauth-state-mismatch');
          }
          const { access_token } = await exchangeCodeForToken(code);
          this.token = access_token;
          sessionStorage.setItem('cf-gh-token', access_token);
          if (this.oauthState) {
            sessionStorage.removeItem('cf-gh-state');
            this.oauthState = null;
          }
          params.delete('code');
          params.delete('state');
          const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error('OAuth error', error);
          this.error = 'oauth';
        }
      }
      if (this.token) {
        await this.bootstrap();
      }
      this.loading = false;
    },
    login() {
      if (!this.config?.githubClientId) {
        this.error = 'missing-client';
        return;
      }
      const state = crypto.randomUUID();
      sessionStorage.setItem('cf-gh-state', state);
      const url = buildAuthorizeUrl(
        this.config.githubClientId,
        window.location.href,
        state
      );
      window.location.href = url;
    },
    logout() {
      sessionStorage.removeItem('cf-gh-token');
      this.token = null;
      this.authenticated = false;
      this.client = null;
    },
    async bootstrap() {
      try {
        this.client = await createClientFromConfig();
        this.client.setToken(this.token);
        this.checkingPermissions = true;
        const allowed = await this.client.hasWriteAccess();
        this.checkingPermissions = false;
        if (!allowed) {
          this.error = 'forbidden';
          return;
        }
        this.authenticated = true;
        await this.refreshData();
      } catch (error) {
        console.error('Unable to bootstrap admin', error);
        this.error = 'bootstrap';
      }
    },
    async refreshData() {
      if (!this.client) return;
      this.loading = true;
      try {
        this.bookings = await this.client.listBookings();
        const { houses, sha } = await this.client.listHouses();
        this.houses = houses;
        this.housesSha = sha;
        this.lastUpdated = new Date().toISOString();
      } catch (error) {
        console.error('Unable to load data', error);
        this.error = 'load';
      } finally {
        this.loading = false;
      }
    },
    get filteredBookings() {
      const search = this.filters.search.toLowerCase();
      return this.bookings.filter((booking) => {
        const statusMatch =
          this.filters.status === 'all' || booking.status === this.filters.status;
        const searchMatch =
          !search ||
          booking.name?.toLowerCase().includes(search) ||
          booking.email?.toLowerCase().includes(search);
        return statusMatch && searchMatch;
      });
    },
    tKey(key) {
      return t(key);
    },
    statusLabel(status) {
      return t(`admin.bookings.status.${status}`);
    },
    formatDates(booking) {
      const lang = Alpine.store('lang').current;
      try {
        const start = booking.checkin ? new Date(booking.checkin).toLocaleDateString(lang, { dateStyle: 'medium' }) : '';
        const end = booking.checkout ? new Date(booking.checkout).toLocaleDateString(lang, { dateStyle: 'medium' }) : '';
        return `${start} → ${end}`.trim();
      } catch (error) {
        return `${booking.checkin || ''} → ${booking.checkout || ''}`;
      }
    },
    formatTimestamp(value) {
      if (!value) return '';
      const lang = Alpine.store('lang').current;
      try {
        return new Date(value).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' });
      } catch (error) {
        return value;
      }
    },
    houseName(id) {
      const house = this.houses.find((item) => item.id === id);
      if (!house) return id;
      const lang = Alpine.store('lang').current;
      return house.name?.[lang] ?? house.name?.it ?? id;
    },
    async changeStatus(booking, status) {
      try {
        await this.client.updateBookingStatus(booking, status);
        Alpine.store('toast').show(t('admin.toasts.saved'), 'success');
        await this.refreshData();
      } catch (error) {
        console.error('Status change failed', error);
        Alpine.store('toast').show(t('admin.toasts.error'), 'error');
      }
    },
    editBooking(booking) {
      this.editableBooking = JSON.parse(JSON.stringify(booking));
      this.modalOpen = true;
    },
    closeModal() {
      this.modalOpen = false;
      this.editableBooking = null;
    },
    async saveBooking() {
      try {
        await this.client.saveBooking(this.editableBooking);
        Alpine.store('toast').show(t('admin.toasts.saved'), 'success');
        this.closeModal();
        await this.refreshData();
      } catch (error) {
        console.error('Save booking failed', error);
        Alpine.store('toast').show(t('admin.toasts.error'), 'error');
      }
    },
    async deleteBooking(booking) {
      if (!confirm(t('admin.confirm.delete.body'))) {
        return;
      }
      try {
        await this.client.deleteBooking(booking);
        Alpine.store('toast').show(t('admin.toasts.deleted'), 'success');
        await this.refreshData();
      } catch (error) {
        console.error('Delete failed', error);
        Alpine.store('toast').show(t('admin.toasts.error'), 'error');
      }
    },
    peopleLabel(booking) {
      return `${booking.people || 1}`;
    },
    async uploadImage(event, house) {
      const [file] = event.target.files;
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        Alpine.store('toast').show(t('admin.images.fileTooLarge'), 'error');
        event.target.value = '';
        return;
      }
      try {
        const base64 = await this.readFileAsBase64(file);
        const fileName = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `public/houses/${house.id}/${fileName}`;
        await this.client.uploadImage({
          path,
          content: base64,
          message: `chore: add image ${fileName}`,
        });
        house.gallery = house.gallery || [];
        house.gallery.push(`/${path}`);
        await this.saveHouses();
        Alpine.store('toast').show(t('admin.toasts.uploaded'), 'success');
        event.target.value = '';
      } catch (error) {
        console.error('Upload failed', error);
        Alpine.store('toast').show(t('admin.toasts.error'), 'error');
      }
    },
    async saveHouses() {
      if (!this.client) return;
      try {
        await this.client.updateHouses({ houses: this.houses, sha: this.housesSha });
        await this.refreshData();
      } catch (error) {
        console.error('Update houses failed', error);
        Alpine.store('toast').show(t('admin.toasts.error'), 'error');
      }
    },
    async removeImage(house, imagePath) {
      const isRemote = /^https?:\/\//.test(imagePath);
      try {
        if (!isRemote) {
          const relative = imagePath.replace(/^\//, '');
          const detail = await this.client.getFile(relative);
          await this.client.removeImage({ path: relative, sha: detail.sha });
        }
        house.gallery = house.gallery.filter((item) => item !== imagePath);
        if (house.cover === imagePath) {
          house.cover = house.gallery[0] || '';
        }
        await this.saveHouses();
      } catch (error) {
        console.error('Remove image failed', error);
        Alpine.store('toast').show(t('admin.toasts.error'), 'error');
      }
    },
    setCover(house, imagePath) {
      house.cover = imagePath;
      this.saveHouses();
    },
    moveImage(house, imagePath, direction) {
      const index = house.gallery.indexOf(imagePath);
      if (index === -1) return;
      const target = index + direction;
      if (target < 0 || target >= house.gallery.length) return;
      const [item] = house.gallery.splice(index, 1);
      house.gallery.splice(target, 0, item);
      this.saveHouses();
    },
    exportCsv() {
      if (!this.bookings.length) return;
      const headers = ['id', 'houseId', 'name', 'email', 'phone', 'checkin', 'checkout', 'people', 'status', 'createdAt'];
      const rows = [headers.join(',')];
      this.bookings.forEach((booking) => {
        const row = headers
          .map((key) => {
            const value = booking[key] ?? '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',');
        rows.push(row);
      });
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = t('admin.export.filename');
      link.click();
      URL.revokeObjectURL(url);
    },
    readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    },
  }));
});

document.addEventListener('language:changed', (event) => {
  if (window.Alpine && Alpine.store) {
    try {
      const store = Alpine.store('lang');
      if (store) {
        store.set(event.detail.lang);
      }
    } catch (error) {
      console.warn('Unable to sync language store', error);
    }
  }
});

Alpine.start();

window.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  registerAnimations();
});
