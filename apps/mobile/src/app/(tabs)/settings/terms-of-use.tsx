import { useTranslation } from "react-i18next";

import { LegalDocumentScreen } from "@/components/settings/legal-document-screen";

export default function TermsOfUseScreen() {
  const { t } = useTranslation();

  return (
    <LegalDocumentScreen
      documentKey="termsOfUse"
      title={t("settings.legal.termsOfUse.title")}
      subtitle={t("settings.legal.termsOfUse.subtitle")}
    />
  );
}
