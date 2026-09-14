import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return <LegalPage eyebrow="LEGAL / PROTOTYPE" title="Privacy">
    <p>This prototype does not create production user accounts or persist camera footage. The AR-style ingredient lens requests camera access only after you press the launch button; the browser camera stream is displayed locally in the page and is stopped when the lens closes.</p>
    <p>The interactive menu and profit scenario are demonstration experiences. They do not process payments or represent customer results.</p>
    <p>Before a commercial launch, this notice must be replaced with a jurisdiction-appropriate privacy policy that accurately describes the final analytics, authentication, storage, processors and retention practices.</p>
  </LegalPage>;
}
