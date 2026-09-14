import { Nav } from "@/components/Nav";
import { RestaurantWorld } from "@/components/RestaurantWorld";
import { ExperienceController } from "@/components/ExperienceController";
import { StoryLive } from "@/components/StoryLive";

export default function Home() {
  return (
    <div>
      <Nav />
      <RestaurantWorld />
      <ExperienceController />
      <main className="relative z-10">
        <StoryLive />
      </main>
    </div>
  );
}
