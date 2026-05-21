export type LegalDocumentSection = {
  body: string[];
  title: string;
};

export type LegalDocument = {
  effectiveDate: string;
  sections: LegalDocumentSection[];
};

type LegalDocumentKey = "privacyPolicy" | "termsOfUse";
type LegalLanguage = "de" | "en";

export const legalDocuments: Record<
  LegalDocumentKey,
  Record<LegalLanguage, LegalDocument>
> = {
  privacyPolicy: {
    en: {
      effectiveDate: "Effective May 21, 2026",
      sections: [
        {
          title: "Overview",
          body: [
            "Klar Kasse helps you scan receipts, enter expenses, and track budgets. This policy explains what data the app uses and how it is handled.",
            "The app is designed to keep your spending records on your device unless you choose to send information through a support request or a configured sync feature.",
          ],
        },
        {
          title: "Data you enter",
          body: [
            "You may enter a display name, currency, budget amounts, categories, receipts, receipt items, notes, merchant names, payment labels, and profile image choices.",
            "This information is used to show your budgets, receipt history, insights, exports, and app preferences.",
          ],
        },
        {
          title: "Camera and receipt images",
          body: [
            "Klar Kasse asks for camera access so you can scan receipts. Receipt images are used to detect, crop, read, and review receipt details.",
            "If you choose an existing receipt image, the app uses only the image you select. The app does not need broad photo or video library access for normal receipt scanning.",
          ],
        },
        {
          title: "Support requests",
          body: [
            "If you contact support, the app may store and submit the name, email address, message, installation identifier, device information, platform, app version, and support status needed to respond to your request.",
            "Support requests may stay pending on your device when support sync is not configured or the network is unavailable.",
          ],
        },
        {
          title: "Sharing and sale of data",
          body: [
            "Klar Kasse does not sell your personal data.",
            "Klar Kasse does not use your receipt or budget data for advertising. Data is shared only when needed to provide a feature you use, such as submitting a support request.",
          ],
        },
        {
          title: "Storage, deletion, and export",
          body: [
            "Receipt, budget, category, preference, and support ticket records are stored locally in the app database on your device.",
            "You can export monthly records from Your Data. You can delete monthly records in the app, and uninstalling the app removes local app data according to your device settings.",
          ],
        },
        {
          title: "Children",
          body: [
            "Klar Kasse is not directed to children. Do not use the app if you are not old enough to manage personal spending records in your region.",
          ],
        },
      ],
    },
    de: {
      effectiveDate: "Gueltig ab 21. Mai 2026",
      sections: [
        {
          title: "Ueberblick",
          body: [
            "Klar Kasse hilft dir, Belege zu scannen, Ausgaben einzugeben und Budgets zu verfolgen. Diese Richtlinie erklaert, welche Daten die App nutzt und wie sie verarbeitet werden.",
            "Die App ist darauf ausgelegt, deine Ausgabendaten auf deinem Geraet zu speichern, sofern du keine Informationen ueber eine Supportanfrage oder eine konfigurierte Synchronisierung sendest.",
          ],
        },
        {
          title: "Von dir eingegebene Daten",
          body: [
            "Du kannst einen Anzeigenamen, eine Waehrung, Budgetbetraege, Kategorien, Belege, Belegpositionen, Notizen, Haendlernamen, Zahlungsbezeichnungen und Profilbildauswahlen eingeben.",
            "Diese Informationen werden verwendet, um Budgets, Belegverlauf, Einblicke, Exporte und App-Einstellungen anzuzeigen.",
          ],
        },
        {
          title: "Kamera und Belegbilder",
          body: [
            "Klar Kasse fragt nach Kamerazugriff, damit du Belege scannen kannst. Belegbilder werden genutzt, um Belegdetails zu erkennen, zuzuschneiden, auszulesen und zu pruefen.",
            "Wenn du ein vorhandenes Belegbild auswaehlst, nutzt die App nur das von dir ausgewaehlte Bild. Fuer das normale Belegscannen benoetigt die App keinen breiten Foto- oder Videozugriff.",
          ],
        },
        {
          title: "Supportanfragen",
          body: [
            "Wenn du den Support kontaktierst, kann die App Name, E-Mail-Adresse, Nachricht, Installationskennung, Geraeteinformationen, Plattform, App-Version und Supportstatus speichern und senden, soweit dies fuer die Antwort auf deine Anfrage erforderlich ist.",
            "Supportanfragen koennen auf deinem Geraet ausstehen, wenn die Support-Synchronisierung nicht konfiguriert ist oder keine Netzwerkverbindung besteht.",
          ],
        },
        {
          title: "Weitergabe und Verkauf von Daten",
          body: [
            "Klar Kasse verkauft deine personenbezogenen Daten nicht.",
            "Klar Kasse nutzt deine Beleg- oder Budgetdaten nicht fuer Werbung. Daten werden nur weitergegeben, wenn dies fuer eine von dir genutzte Funktion erforderlich ist, zum Beispiel fuer eine Supportanfrage.",
          ],
        },
        {
          title: "Speicherung, Loeschung und Export",
          body: [
            "Beleg-, Budget-, Kategorie-, Einstellungs- und Supportdaten werden lokal in der App-Datenbank auf deinem Geraet gespeichert.",
            "Du kannst Monatsdaten unter Deine Daten exportieren. Du kannst Monatsdaten in der App loeschen, und durch Deinstallation der App werden lokale App-Daten gemaess deinen Geraeteeinstellungen entfernt.",
          ],
        },
        {
          title: "Kinder",
          body: [
            "Klar Kasse richtet sich nicht an Kinder. Nutze die App nicht, wenn du in deiner Region nicht alt genug bist, persoenliche Ausgabendaten zu verwalten.",
          ],
        },
      ],
    },
  },
  termsOfUse: {
    en: {
      effectiveDate: "Effective May 21, 2026",
      sections: [
        {
          title: "Use of Klar Kasse",
          body: [
            "Klar Kasse is a budgeting and receipt tracking tool. You are responsible for the information you enter, scan, save, export, or delete in the app.",
            "Use the app only for lawful personal or business record keeping.",
          ],
        },
        {
          title: "Receipt scanning accuracy",
          body: [
            "Receipt scanning, text recognition, parsing, category suggestions, totals, taxes, and item details may be incomplete or inaccurate.",
            "Always review scanned or imported receipt details before relying on them.",
          ],
        },
        {
          title: "No financial, tax, or legal advice",
          body: [
            "Klar Kasse provides organization and tracking features only. The app does not provide financial, investment, tax, accounting, or legal advice.",
            "Consult a qualified professional before making decisions that require professional advice.",
          ],
        },
        {
          title: "Your data and backups",
          body: [
            "Most app records are stored on your device. You are responsible for exporting records or keeping backups when you need them.",
            "Deleting records, uninstalling the app, changing devices, or device failure may remove local data.",
          ],
        },
        {
          title: "Support",
          body: [
            "Support messages should describe the issue clearly and should not include payment card numbers, account passwords, government IDs, or other sensitive secrets.",
          ],
        },
        {
          title: "Changes",
          body: [
            "These terms may be updated as Klar Kasse changes. Continued use of the app after an update means you accept the updated terms.",
          ],
        },
      ],
    },
    de: {
      effectiveDate: "Gueltig ab 21. Mai 2026",
      sections: [
        {
          title: "Nutzung von Klar Kasse",
          body: [
            "Klar Kasse ist ein Werkzeug zur Budget- und Belegverwaltung. Du bist fuer Informationen verantwortlich, die du in der App eingibst, scannst, speicherst, exportierst oder loeschst.",
            "Nutze die App nur fuer rechtmaessige private oder geschaeftliche Aufzeichnungen.",
          ],
        },
        {
          title: "Genauigkeit der Belegerkennung",
          body: [
            "Belegscan, Texterkennung, Auswertung, Kategorievorschlaege, Summen, Steuern und Artikeldetails koennen unvollstaendig oder fehlerhaft sein.",
            "Pruefe gescannte oder importierte Belegdaten immer, bevor du dich darauf verlaesst.",
          ],
        },
        {
          title: "Keine Finanz-, Steuer- oder Rechtsberatung",
          body: [
            "Klar Kasse bietet nur Organisations- und Trackingfunktionen. Die App bietet keine Finanz-, Anlage-, Steuer-, Buchhaltungs- oder Rechtsberatung.",
            "Wende dich an qualifizierte Fachleute, bevor du Entscheidungen triffst, die professionelle Beratung erfordern.",
          ],
        },
        {
          title: "Deine Daten und Backups",
          body: [
            "Die meisten App-Daten werden auf deinem Geraet gespeichert. Du bist dafuer verantwortlich, Daten zu exportieren oder Backups zu behalten, wenn du sie benoetigst.",
            "Das Loeschen von Daten, die Deinstallation der App, ein Geraetewechsel oder ein Geraetedefekt koennen lokale Daten entfernen.",
          ],
        },
        {
          title: "Support",
          body: [
            "Supportnachrichten sollten das Problem klar beschreiben und keine Zahlungskartennummern, Kontopasswoerter, Ausweisnummern oder andere sensiblen Geheimnisse enthalten.",
          ],
        },
        {
          title: "Aenderungen",
          body: [
            "Diese Bedingungen koennen aktualisiert werden, wenn sich Klar Kasse weiterentwickelt. Wenn du die App nach einer Aktualisierung weiter nutzt, akzeptierst du die aktualisierten Bedingungen.",
          ],
        },
      ],
    },
  },
};
