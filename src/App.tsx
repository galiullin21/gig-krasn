import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Cabinet = lazy(() => import("./pages/Cabinet"));
const Notifications = lazy(() => import("./pages/Notifications"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Archive = lazy(() => import("./pages/Archive"));
const Documents = lazy(() => import("./pages/Documents"));
const Galleries = lazy(() => import("./pages/Galleries"));
const GalleryDetail = lazy(() => import("./pages/GalleryDetail"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Search = lazy(() => import("./pages/Search"));
const CityMap = lazy(() => import("./pages/CityMap"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Directory = lazy(() => import("./pages/Directory"));
const EmergencyServices = lazy(() => import("./pages/EmergencyServices"));
const SpecialProjects = lazy(() => import("./pages/SpecialProjects"));
const Advertising = lazy(() => import("./pages/Advertising"));
const WhereToBuy = lazy(() => import("./pages/WhereToBuy"));

// Lazy load admin components
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminNewsList = lazy(() => import("./pages/admin/AdminNewsList"));
const AdminNewsForm = lazy(() => import("./pages/admin/AdminNewsForm"));
const AdminBlogsList = lazy(() => import("./pages/admin/AdminBlogsList"));
const AdminBlogForm = lazy(() => import("./pages/admin/AdminBlogForm"));
const AdminDocumentsList = lazy(() => import("./pages/admin/AdminDocumentsList"));
const AdminDocumentForm = lazy(() => import("./pages/admin/AdminDocumentForm"));
const AdminGalleriesList = lazy(() => import("./pages/admin/AdminGalleriesList"));
const AdminGalleryForm = lazy(() => import("./pages/admin/AdminGalleryForm"));
const AdminArchiveList = lazy(() => import("./pages/admin/AdminArchiveList"));
const AdminArchiveForm = lazy(() => import("./pages/admin/AdminArchiveForm"));
const AdminAdsList = lazy(() => import("./pages/admin/AdminAdsList"));
const AdminAdsForm = lazy(() => import("./pages/admin/AdminAdsForm"));
const AdminUsersList = lazy(() => import("./pages/admin/AdminUsersList"));
const AdminWarningForm = lazy(() => import("./pages/admin/AdminWarningForm"));
const AdminWarnings = lazy(() => import("./pages/admin/AdminWarnings"));
const AdminActions = lazy(() => import("./pages/admin/AdminActions"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCrosspost = lazy(() => import("./pages/admin/AdminCrosspost"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminDevLogs = lazy(() => import("./pages/admin/AdminDevLogs"));
const AdminProjectReport = lazy(() => import("./pages/admin/AdminProjectReport"));
const AdminMigration = lazy(() => import("./pages/admin/AdminMigration"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

// Component that sets up realtime notifications
function RealtimeNotificationsProvider({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="gig-theme">
      <AuthProvider>
        <RealtimeNotificationsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/cabinet" element={<Cabinet />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:slug" element={<NewsDetail />} />
                  <Route path="/blogs" element={<Blogs />} />
                  <Route path="/blogs/:slug" element={<BlogDetail />} />
                  <Route path="/archive" element={<Archive />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/galleries" element={<Galleries />} />
                  <Route path="/galleries/:slug" element={<GalleryDetail />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/map" element={<CityMap />} />
                  <Route path="/directory" element={<Directory />} />
                  <Route path="/emergency" element={<EmergencyServices />} />
                  <Route path="/special-projects" element={<SpecialProjects />} />
                  <Route path="/advertising" element={<Advertising />} />
                  <Route path="/where-to-buy" element={<WhereToBuy />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="news" element={<AdminNewsList />} />
                    <Route path="news/new" element={<AdminNewsForm />} />
                    <Route path="news/:id" element={<AdminNewsForm />} />
                    <Route path="blogs" element={<AdminBlogsList />} />
                    <Route path="blogs/new" element={<AdminBlogForm />} />
                    <Route path="blogs/:id" element={<AdminBlogForm />} />
                    <Route path="documents" element={<AdminDocumentsList />} />
                    <Route path="documents/new" element={<AdminDocumentForm />} />
                    <Route path="documents/:id" element={<AdminDocumentForm />} />
                    <Route path="galleries" element={<AdminGalleriesList />} />
                    <Route path="galleries/new" element={<AdminGalleryForm />} />
                    <Route path="galleries/:id" element={<AdminGalleryForm />} />
                    <Route path="archive" element={<AdminArchiveList />} />
                    <Route path="archive/new" element={<AdminArchiveForm />} />
                    <Route path="archive/:id" element={<AdminArchiveForm />} />
                    <Route path="ads" element={<AdminAdsList />} />
                    <Route path="ads/new" element={<AdminAdsForm />} />
                    <Route path="ads/:id" element={<AdminAdsForm />} />
                    <Route path="crosspost" element={<AdminCrosspost />} />
                    <Route path="users" element={<AdminUsersList />} />
                    <Route path="warnings" element={<AdminWarnings />} />
                    <Route path="warnings/new" element={<AdminWarningForm />} />
                    <Route path="actions" element={<AdminActions />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                    <Route path="comments" element={<AdminComments />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="newsletter" element={<AdminNewsletter />} />
                    <Route path="media" element={<AdminMedia />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="dev-logs" element={<AdminDevLogs />} />
                    <Route path="project-report" element={<AdminProjectReport />} />
                    <Route path="migration" element={<AdminMigration />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </RealtimeNotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
