import { Layout } from "@/components/layout/Layout";
import { AdBanner } from "@/components/home/AdBanner";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { PhotoSection } from "@/components/home/PhotoSection";
import { NewsSectionRedesign } from "@/components/home/NewsSectionRedesign";

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
          {/* Articles Section */}
          <ArticlesSection />

          {/* Photo Galleries Section */}
          <PhotoSection />

          {/* News Section with Calendar */}
          <NewsSectionRedesign />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
