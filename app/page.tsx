import { Nav } from "@/components/Nav";
import { RestaurantWorld } from "@/components/RestaurantWorld";
import { ExperienceController } from "@/components/ExperienceController";
import { Story } from "@/components/Story";

export default function Home() {
  return (
    <div>
      <Nav />
      <RestaurantWorld />
      <ExperienceController />
      <main className="relative z-10">
        <Story />
      </main>
    </div>
  );
}
