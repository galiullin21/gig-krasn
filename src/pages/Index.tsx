import { Layout } from "@/components/layout/Layout";
import { HeroSlider } from "@/components/home/HeroSlider";
import { AdBanner } from "@/components/home/AdBanner";
import { BlogsSection } from "@/components/home/BlogsSection";
import { NewsSection } from "@/components/home/NewsSection";
import { GalleriesSection } from "@/components/home/GalleriesSection";

const Index = () => {
  return (
    <Layout>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Ad Banner */}
      <div className="container py-4">
        <AdBanner position="header" />
      </div>

      {/* Blogs Section */}
      <div className="container">
        <BlogsSection />
      </div>

      {/* News Section */}
      <div className="container">
        <NewsSection />
      </div>

      {/* Galleries Section */}
      <div className="container">
        <GalleriesSection />
      </div>

      {/* Bottom Ad */}
      <div className="container py-8">
        <AdBanner position="content" />
      </div>
    </Layout>
  );
};

export default Index;
