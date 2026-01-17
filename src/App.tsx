import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cabinet from "./pages/Cabinet";
import Notifications from "./pages/Notifications";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import Archive from "./pages/Archive";
import Documents from "./pages/Documents";
import Galleries from "./pages/Galleries";
import Contacts from "./pages/Contacts";
import Search from "./pages/Search";
import CityMap from "./pages/CityMap";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNewsList from "./pages/admin/AdminNewsList";
import AdminNewsForm from "./pages/admin/AdminNewsForm";
import AdminBlogsList from "./pages/admin/AdminBlogsList";
import AdminBlogForm from "./pages/admin/AdminBlogForm";
import AdminDocumentsList from "./pages/admin/AdminDocumentsList";
import AdminDocumentForm from "./pages/admin/AdminDocumentForm";
import AdminGalleriesList from "./pages/admin/AdminGalleriesList";
import AdminGalleryForm from "./pages/admin/AdminGalleryForm";
import AdminArchiveList from "./pages/admin/AdminArchiveList";
import AdminArchiveForm from "./pages/admin/AdminArchiveForm";
import AdminAdsList from "./pages/admin/AdminAdsList";
import AdminAdsForm from "./pages/admin/AdminAdsForm";
import AdminUsersList from "./pages/admin/AdminUsersList";
import AdminWarningForm from "./pages/admin/AdminWarningForm";
import AdminWarnings from "./pages/admin/AdminWarnings";
import AdminActions from "./pages/admin/AdminActions";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminComments from "./pages/admin/AdminComments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCrosspost from "./pages/admin/AdminCrosspost";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminDevLogs from "./pages/admin/AdminDevLogs";
import GalleryDetail from "./pages/GalleryDetail";

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
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </RealtimeNotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
