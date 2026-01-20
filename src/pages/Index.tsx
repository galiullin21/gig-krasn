import { Layout } from "@/components/layout/Layout";
import { GallerySliderSection } from "@/components/home/GallerySliderSection";
import { ArticlesSectionRedesign } from "@/components/home/ArticlesSectionRedesign";
import { NewsSectionFinal } from "@/components/home/NewsSectionFinal";
import { AdBanner } from "@/components/home/AdBanner";

const Index = () => {
  return (
    <Layout>
      {/* Top Ad Banner - only shows if there's an active ad */}
      <div className="container py-4">
        <AdBanner position="header" />
      </div>

      {/* Main Content with white background */}
      <div className="bg-card">
        <div className="container py-6">
          {/* News Section with Calendar - FIRST */}
          <NewsSectionFinal />

          {/* Photo & Video Galleries Slider */}
          <GallerySliderSection />

          {/* Articles Section with Slider */}
          <ArticlesSectionRedesign />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
