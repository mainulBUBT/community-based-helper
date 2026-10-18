import { PageTransition } from "@/components/layout/PageTransition";
import { HomeView } from "./HomeView";

export default function HomePage() {
  return (
    <PageTransition>
      <HomeView />
    </PageTransition>
  );
}
