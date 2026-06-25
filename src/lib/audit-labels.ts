// Menselijke NL-labels voor audit-acties (logboek-weergave). De audit-`action` is een stabiele
// machine-string (bv. "PROFILE_UPDATED"); deze helper vertaalt de bekende naar nette Nederlandse
// tekst en valt voor onbekende terug op een geleesbare vorm. Geen I/O, pure functie.

const AUDIT_ACTION_LABEL: Record<string, string> = {
  // Auth & account
  USER_LOGIN: "Ingelogd",
  USER_LOGOUT: "Uitgelogd",
  USER_LOGIN_FAILED: "Mislukte inlogpoging",
  AUTH_RATE_LIMITED: "Inlogpogingen begrensd",
  USER_REGISTERED: "Geregistreerd",
  USER_IMPORTED: "Gebruiker geïmporteerd",
  USERS_IMPORTED: "Gebruikers geïmporteerd",
  USER_STATUS_CHANGED: "Accountstatus gewijzigd",
  PASSWORD_CHANGED: "Wachtwoord gewijzigd",
  PASSWORD_RESET_REQUESTED: "Wachtwoordherstel aangevraagd",
  PASSWORD_RESET_COMPLETED: "Wachtwoord hersteld",
  REGISTER_RATE_LIMITED: "Registratiepogingen begrensd",
  IDENTITY_VERIFIED: "Identiteit geverifieerd",
  ROLE_CHANGED: "Rol gewijzigd",
  STATUS_CHANGED: "Status gewijzigd",
  ACCOUNT_DATA_EXPORTED: "Accountgegevens geëxporteerd",
  ACCOUNT_DELETION_REQUESTED: "Accountverwijdering aangevraagd",
  ACCOUNT_DELETION_CANCELLED: "Accountverwijdering geannuleerd",
  ACCOUNT_ANONYMIZED: "Account geanonimiseerd",

  // Profiel & bedrijf
  PROFILE_UPDATED: "Profiel bijgewerkt",
  COMPANY_UPDATED: "Bedrijfsprofiel bijgewerkt",
  AVAILABILITY_ADDED: "Beschikbaarheid toegevoegd",
  AVAILABILITY_REMOVED: "Beschikbaarheid verwijderd",

  // Opdrachten & reacties
  JOB_CREATED: "Opdracht aangemaakt",
  JOB_UPDATED: "Opdracht bijgewerkt",
  JOB_STATUS_CHANGED: "Opdrachtstatus gewijzigd",
  JOB_CLOSED_BY_ADMIN: "Opdracht gesloten door beheerder",
  JOB_ALERT_SENT: "Opdrachtmelding verstuurd",
  JOB_REOPENED_FOR_REPLACEMENT: "Dienst heropend voor herplaatsing",
  APPLICATION_CREATED: "Gereageerd op opdracht",
  APPLICATION_STATUS_CHANGED: "Reactiestatus gewijzigd",
  APPLICATION_NOTE_SAVED: "Notitie bij reactie opgeslagen",
  APPLICATION_WITHDRAWN: "Reactie ingetrokken",
  FAVORITE_ADDED: "ZZP'er aan flexpool toegevoegd",
  FAVORITE_REMOVED: "ZZP'er uit flexpool verwijderd",
  FAVORITE_NOTE_SAVED: "Notitie bij flexpool-favoriet opgeslagen",
  POOL_INVITED: "Flexpool geïnformeerd bij publicatie",

  // Samenwerking & werkproces
  COLLABORATION_PROPOSED: "Samenwerking voorgesteld",
  COLLABORATION_STATUS_CHANGED: "Samenwerkingsstatus gewijzigd",
  COLLABORATION_REPLACEMENT_OPENED: "Herplaatsing geopend na uitval",
  COLLABORATION_ORT_SET: "ORT-profiel ingesteld",
  COLLABORATION_WEEKDAYS_SET: "Weekrooster ingesteld",
  CONTRACT_SIGNED: "Contract ondertekend",
  MODEL_AGREEMENT_SIGNED: "Modelovereenkomst ondertekend",
  MODEL_AGREEMENT_TYPE_SET: "Modelovereenkomstvorm vastgelegd",
  PERFORMANCE_SUBMITTED: "Prestatie ingediend",
  PERFORMANCE_APPROVED: "Prestatie goedgekeurd",
  PERFORMANCE_REJECTED: "Prestatie afgekeurd",
  DISPUTE_OPENED: "Dispuut geopend",
  DISPUTE_RESOLVED: "Dispuut opgelost",
  DBA_SIGNAL_RAISED: "DBA-signaal gemeld",

  // Facturen & betalingen
  INVOICE_CREATED: "Factuur aangemaakt",
  INVOICE_SUBMITTED: "Factuur ingediend",
  INVOICE_APPROVED: "Factuur goedgekeurd",
  INVOICE_REJECTED: "Factuur afgekeurd",
  INVOICE_SENT: "Factuur verzonden",
  INVOICE_PAID: "Factuur betaald",
  INVOICE_CANCELLED: "Factuur geannuleerd",
  INVOICE_CREDITED: "Factuur gecrediteerd",
  INVOICE_DRAFT_REMINDER: "Herinnering conceptfactuur",
  INVOICE_DRAFT_ESCALATED: "Conceptfactuur geëscaleerd",
  INVOICE_PDF_ACCESSED: "Factuur-PDF ingezien",
  PERFORMANCE_PDF_ACCESSED: "Urenstaat/oplevering ingezien",
  MODEL_AGREEMENT_ACCESSED: "Modelovereenkomst ingezien",
  PAYMENT_CONFIRMED: "Betaling bevestigd",
  PAYMENT_OVERDUE: "Betaling te laat",

  // Certificaten & documenten
  CREDENTIAL_CREATED: "Certificaat aangemaakt",
  CREDENTIAL_UPDATED: "Certificaat bijgewerkt",
  CREDENTIAL_SUBMITTED: "Certificaat ingediend",
  CREDENTIAL_VERIFIED: "Certificaat geverifieerd",
  CREDENTIAL_REJECTED: "Certificaat afgewezen",
  CREDENTIAL_DELETED: "Certificaat verwijderd",
  CREDENTIAL_EXPIRED: "Certificaat verlopen",
  CREDENTIALS_EXPIRED: "Certificaten verlopen",
  CREDENTIALS_EXPIRING_REMINDED: "Herinnering verlopende certificaten",
  CREDENTIAL_SHARING_CHANGED: "Certificaat-deling gewijzigd",
  CREDENTIAL_VISIBILITY_CHANGED: "Certificaat-zichtbaarheid gewijzigd",
  DOCUMENT_UPLOADED: "Document geüpload",
  DOCUMENT_ACCESSED: "Document ingezien",
  DOCUMENT_ACCESS_DENIED: "Documenttoegang geweigerd",
  DOCUMENT_DELETED: "Document verwijderd",
  DOSSIER_EXPORTED: "Dossier geëxporteerd",
  TRUST_DOSSIER_VIEWED: "Vertrouwensdossier ingezien",

  // Academie
  COURSE_CREATED: "Cursus aangemaakt",
  COURSE_UPDATED: "Cursus bijgewerkt",
  COURSE_STATUS_SET: "Cursusstatus gewijzigd",
  COURSE_DELETED: "Cursus verwijderd",
  LESSON_CREATED: "Les aangemaakt",
  LESSON_UPDATED: "Les bijgewerkt",
  LESSON_DELETED: "Les verwijderd",
  LESSON_COMPLETED: "Les afgerond",

  // Ideeën & leads
  IDEA_CREATED: "Idee geplaatst",
  IDEA_COMMENTED: "Op idee gereageerd",
  IDEA_STATUS_SET: "Ideestatus gewijzigd",
  IDEA_CATEGORIZED: "Idee gecategoriseerd",
  LEAD_CREATED: "Lead aangemaakt",
  LEAD_CONTACT_ADDED: "Contactnotitie toegevoegd",
  LEAD_STATUS_SET: "Leadstatus gewijzigd",

  // Franchise
  FRANCHISE_CREATED: "Bemiddeling aangemaakt",
  FRANCHISE_CLIENT_ADDED: "Opdrachtgever toegevoegd",
  FRANCHISE_FREELANCER_ADDED: "Aan roster toegevoegd",
  FRANCHISE_DEPARTMENT_ADDED: "Afdeling toegevoegd",
  FRANCHISE_DEPARTMENT_REMOVED: "Afdeling verwijderd",
  FRANCHISE_DIENST_STATUS_SET: "Dienststatus gewijzigd",
  FRANCHISE_BRANDING_UPDATED: "Bemiddeling-branding bijgewerkt",
  TENANT_FEE_RECORDED: "Fee geboekt",

  // Support
  SUPPORT_TICKET_CREATED: "Supportticket aangemaakt",
  SUPPORT_TICKET_REPLY: "Op ticket gereageerd",
  SUPPORT_AGENT_REPLY: "Beheerder reageerde op ticket",
  SUPPORT_AUTO_ANSWERED: "Ticket automatisch beantwoord",
  SUPPORT_TICKET_RESOLVED: "Ticket opgelost",
  SUPPORT_TICKET_ESCALATED: "Ticket geëscaleerd",
  SUPPORT_TICKET_ACCESS_DENIED: "Tickettoegang geweigerd",

  // Abonnement & belasting
  SUBSCRIPTION_ACTIVATED: "Abonnement geactiveerd",
  SUBSCRIPTION_DOWNGRADED: "Abonnement verlaagd",
  SUBSCRIPTION_PAYMENT_FAILED: "Abonnementsbetaling mislukt",
  SUBSCRIPTION_PAST_DUE_REMINDER: "Herinnering openstaand abonnement",
  TAX_FILING_REQUESTED: "Belastingaangifte aangevraagd",
  TAX_FILING_SUBMITTED: "Belastingaangifte ingediend",
  TAX_FILING_REVOKED: "Belastingaangifte ingetrokken",
  VAT_REMINDER_SENT: "Btw-herinnering verstuurd",
  VAT_OVERVIEW_EXPORTED: "Btw-overzicht geëxporteerd",

  // Platform & beheer
  PLATFORM_BILLING_GENERATED: "Facturatie gegenereerd",
  PLATFORM_BILLING_STATUS_SET: "Facturatiestatus gewijzigd",
  PLATFORM_BILLING_PDF_ACCESSED: "Platformfactuur-PDF ingezien",
  PLATFORM_INVOICES_EXPORTED: "Platformfacturen geëxporteerd",
  AUDIT_LOG_EXPORTED: "Audit-log geëxporteerd",
  PLATFORM_CONFIG_UPDATED: "Platforminstelling bijgewerkt",
  ADMINISTRATION_EXPORTED: "Boekhouding geëxporteerd",
  OPEN_ITEMS_EXPORTED: "Openstaande posten geëxporteerd",
  HEALTH_INCIDENT_OPENED: "Bewaking-incident geopend",
};

/** NL-label voor een audit-actie; valt terug op een geleesbare vorm voor onbekende acties. */
export function auditActionLabel(action: string): string {
  const known = AUDIT_ACTION_LABEL[action];
  if (known) return known;
  const text = action.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// NL-labels voor de entiteitstypen die in de audit-`entityType` (Engelse modelnaam) voorkomen.
const AUDIT_ENTITY_LABEL: Record<string, string> = {
  User: "Gebruiker",
  FreelancerProfile: "ZZP-profiel",
  Company: "Bedrijf",
  Job: "Opdracht",
  Application: "Reactie",
  Collaboration: "Samenwerking",
  Performance: "Prestatie",
  Invoice: "Factuur",
  Credential: "Certificaat",
  Document: "Document",
  Conversation: "Gesprek",
  Course: "Cursus",
  Lesson: "Les",
  Idea: "Idee",
  Lead: "Lead",
  Tenant: "Bemiddeling",
  Department: "Afdeling",
  SupportTicket: "Supportticket",
  Subscription: "Abonnement",
  HealthIncident: "Bewaking-incident",
  Notification: "Notificatie",
  AuditLog: "Auditlog",
};

/** NL-label voor een audit-entiteitstype; valt terug op de ruwe naam voor onbekende typen. */
export function auditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABEL[entityType] ?? entityType;
}
