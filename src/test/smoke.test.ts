import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
        })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        ilike: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('Smoke Tests', () => {
  describe('Application Structure', () => {
    it('should have main entry point', async () => {
      const mainModule = await import('@/main');
      expect(mainModule).toBeDefined();
    });

    it('should have App component', async () => {
      const appModule = await import('@/App');
      expect(appModule.default).toBeDefined();
    });

    it('should have Layout component', async () => {
      const layoutModule = await import('@/components/layout/Layout');
      expect(layoutModule.Layout).toBeDefined();
    });
  });

  describe('Page Components', () => {
    it('should have Index page', async () => {
      const indexModule = await import('@/pages/Index');
      expect(indexModule.default).toBeDefined();
    });

    it('should have News page', async () => {
      const newsModule = await import('@/pages/News');
      expect(newsModule.default).toBeDefined();
    });

    it('should have Blogs page', async () => {
      const blogsModule = await import('@/pages/Blogs');
      expect(blogsModule.default).toBeDefined();
    });

    it('should have Documents page', async () => {
      const docsModule = await import('@/pages/Documents');
      expect(docsModule.default).toBeDefined();
    });

    it('should have Archive page', async () => {
      const archiveModule = await import('@/pages/Archive');
      expect(archiveModule.default).toBeDefined();
    });

    it('should have Galleries page', async () => {
      const galleriesModule = await import('@/pages/Galleries');
      expect(galleriesModule.default).toBeDefined();
    });

    it('should have Search page', async () => {
      const searchModule = await import('@/pages/Search');
      expect(searchModule.default).toBeDefined();
    });

    it('should have Auth page', async () => {
      const authModule = await import('@/pages/Auth');
      expect(authModule.default).toBeDefined();
    });

    it('should have Contacts page', async () => {
      const contactsModule = await import('@/pages/Contacts');
      expect(contactsModule.default).toBeDefined();
    });
  });

  describe('Admin Pages', () => {
    it('should have AdminDashboard', async () => {
      const module = await import('@/pages/admin/AdminDashboard');
      expect(module.default).toBeDefined();
    });

    it('should have AdminNewsList', async () => {
      const module = await import('@/pages/admin/AdminNewsList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminBlogsList', async () => {
      const module = await import('@/pages/admin/AdminBlogsList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminDocumentsList', async () => {
      const module = await import('@/pages/admin/AdminDocumentsList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminGalleriesList', async () => {
      const module = await import('@/pages/admin/AdminGalleriesList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminArchiveList', async () => {
      const module = await import('@/pages/admin/AdminArchiveList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminAdsList', async () => {
      const module = await import('@/pages/admin/AdminAdsList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminUsersList', async () => {
      const module = await import('@/pages/admin/AdminUsersList');
      expect(module.default).toBeDefined();
    });

    it('should have AdminSettings', async () => {
      const module = await import('@/pages/admin/AdminSettings');
      expect(module.default).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should have cn utility', async () => {
      const { cn } = await import('@/lib/utils');
      expect(cn).toBeDefined();
      expect(cn('foo', 'bar')).toBe('foo bar');
    });
  });

  describe('Hooks', () => {
    it('should have useAuth hook', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      expect(useAuth).toBeDefined();
    });

    it('should have useToast hook', async () => {
      const { useToast } = await import('@/hooks/use-toast');
      expect(useToast).toBeDefined();
    });

    it('should have useMobile hook', async () => {
      const { useIsMobile } = await import('@/hooks/use-mobile');
      expect(useIsMobile).toBeDefined();
    });
  });
});
