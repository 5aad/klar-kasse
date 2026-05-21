import { useTranslation } from "react-i18next";

import { LegalDocumentScreen } from "@/components/settings/legal-document-screen";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <LegalDocumentScreen
      documentKey="privacyPolicy"
      title={t("settings.legal.privacyPolicy.title")}
      subtitle={t("settings.legal.privacyPolicy.subtitle")}
    />
  );
}
