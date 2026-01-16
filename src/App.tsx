import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cabinet from "./pages/Cabinet";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Blogs from "./pages/Blogs";
import BlogDetail from "./pages/BlogDetail";
import Archive from "./pages/Archive";
import Documents from "./pages/Documents";
import Galleries from "./pages/Galleries";
import Contacts from "./pages/Contacts";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogDetail />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/galleries" element={<Galleries />} />
            <Route path="/contacts" element={<Contacts />} />
            
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
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
