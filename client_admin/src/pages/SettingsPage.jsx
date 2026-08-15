import { useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import PersonaEditor from "../components/settings/PersonaEditor";

const SettingsPage = () => {
  return (
    <div>
      <PageHeader title="Archetype Manager" subtitle="Edit Archetype palettes, fonts, and preview them live." />
      <PersonaEditor />
    </div>
  );
};

export default SettingsPage;
