import Background from "@/components/Background";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import CaptionResults from "@/components/sections/CaptionResults";
import HeroSection from "@/components/sections/HeroSection";
import HistorySection from "@/components/sections/HistorySection";
import UploadSection from "@/components/sections/UploadSection";
import { useCaptions } from "@/hooks/useCaptions";

export default function Home() {
  const captionState = useCaptions();

  return (
    <div className="min-h-screen overflow-hidden">
      <Background />
      <Navbar />
      <main>
        <HeroSection />
        <UploadSection
          previewUrl={captionState.previewUrl}
          selectedFile={captionState.selectedFile}
          mode={captionState.mode}
          setMode={captionState.setMode}
          isGenerating={captionState.isGenerating}
          progress={captionState.progress}
          error={captionState.error}
          onSetImage={captionState.setImage}
          onGenerate={captionState.generate}
        />
        <CaptionResults
          captions={captionState.captions}
          isGenerating={captionState.isGenerating}
          mode={captionState.mode}
        />
        <HistorySection history={captionState.history} onRestore={captionState.restoreHistoryItem} />
      </main>
      <Footer />
    </div>
  );
}
