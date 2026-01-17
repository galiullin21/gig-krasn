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

      {/* Articles Section */}
      <div className="container">
        <ArticlesSection />
      </div>

      {/* Photo Galleries Section */}
      <div className="container">
        <PhotoSection />
      </div>

      {/* News Section with Calendar */}
      <div className="container">
        <NewsSectionRedesign />
      </div>
    </Layout>
  );
};

export default Index;
