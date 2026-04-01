import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Platforms from "../components/Platforms";
import Stats from "../components/Stats";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";

export default function Home({ onDownload }) {
  return (
    <div>
      <Hero onDownload={onDownload} />
      <Platforms />
      <Stats />
      <HowItWorks />
      <FAQ />
      <Footer />
    </div>
  );
}
