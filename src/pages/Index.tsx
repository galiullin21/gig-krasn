import { Layout } from "@/components/layout/Layout";
import { GallerySliderSection } from "@/components/home/GallerySliderSection";
import { ArticlesSectionRedesign } from "@/components/home/ArticlesSectionRedesign";
import { SmallNewsGrid } from "@/components/home/SmallNewsGrid";
import { NewsSectionFinal } from "@/components/home/NewsSectionFinal";

const Index = () => {
  return (
    <Layout>
      {/* Top Ad Banner */}
      <div className="bg-muted">
        <div className="container py-6">
          <div className="flex items-center justify-center min-h-[100px] text-muted-foreground">
            <span>Рекламный баннер</span>
          </div>
        </div>
      </div>

      {/* Main Content with white background */}
      <div className="bg-card">
        <div className="container py-6">
          {/* Photo & Video Galleries Slider */}
          <GallerySliderSection />

          {/* Articles Section with Slider */}
          <ArticlesSectionRedesign />

          {/* Small News Grid (4 items) */}
          <SmallNewsGrid />

          {/* News Section with Calendar */}
          <NewsSectionFinal />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
