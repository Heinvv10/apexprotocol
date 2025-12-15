// Multi-language support for African languages + English
// Translations for key UI elements

export type Language = "en" | "zu" | "xh" | "af" | "sw" | "yo";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
}

export const languages: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", direction: "ltr" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦", direction: "ltr" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa", flag: "🇿🇦", direction: "ltr" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦", direction: "ltr" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪", direction: "ltr" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬", direction: "ltr" },
];

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    monitor: "Monitor",
    create: "Create",
    audit: "Audit",
    recommendations: "Recommendations",
    settings: "Settings",
    help: "Help",
    logout: "Logout",

    // Common actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    refresh: "Refresh",
    retry: "Retry",
    submit: "Submit",
    confirm: "Confirm",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    loading: "Loading...",

    // Dashboard
    welcomeBack: "Welcome back",
    geoScore: "GEO Score",
    brandMentions: "Brand Mentions",
    aiPlatforms: "AI Platforms",
    recommendations_count: "Recommendations",
    recentActivity: "Recent Activity",
    topPerformingContent: "Top Performing Content",

    // Monitor
    brandMonitoring: "Brand Monitoring",
    platformBreakdown: "Platform Breakdown",
    mentionTrends: "Mention Trends",
    sentimentAnalysis: "Sentiment Analysis",
    competitorComparison: "Competitor Comparison",

    // Create
    contentCreation: "Content Creation",
    newContent: "New Content",
    templates: "Templates",
    brandVoice: "Brand Voice",
    generatedContent: "Generated Content",

    // Audit
    siteAudit: "Site Audit",
    startAudit: "Start Audit",
    auditHistory: "Audit History",
    technicalScore: "Technical Score",
    contentScore: "Content Score",
    schemaScore: "Schema Score",

    // Recommendations
    smartRecommendations: "Smart Recommendations",
    highPriority: "High Priority",
    mediumPriority: "Medium Priority",
    lowPriority: "Low Priority",
    completed: "Completed",
    inProgress: "In Progress",
    pending: "Pending",

    // Settings
    profile: "Profile",
    account: "Account",
    notifications: "Notifications",
    billing: "Billing",
    team: "Team",
    integrations: "Integrations",
    language: "Language",
    theme: "Theme",

    // Auth
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot Password?",

    // Errors
    error: "Error",
    somethingWentWrong: "Something went wrong",
    tryAgain: "Try Again",
    notFound: "Not Found",
    unauthorized: "Unauthorized",

    // Success
    success: "Success",
    saved: "Saved successfully",
    deleted: "Deleted successfully",
    updated: "Updated successfully",

    // Time
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",

    // Status
    active: "Active",
    inactive: "Inactive",
    online: "Online",
    offline: "Offline",
  },

  zu: {
    // Navigation
    dashboard: "Ibhodi",
    monitor: "Qaphela",
    create: "Dala",
    audit: "Hlola",
    recommendations: "Izincomo",
    settings: "Izilungiselelo",
    help: "Usizo",
    logout: "Phuma",

    // Common actions
    save: "Londoloza",
    cancel: "Khansela",
    delete: "Susa",
    edit: "Hlela",
    search: "Sesha",
    filter: "Hlunga",
    export: "Thumela",
    import: "Ngenisa",
    refresh: "Vuselela",
    retry: "Zama futhi",
    submit: "Thumela",
    confirm: "Qinisekisa",
    close: "Vala",
    back: "Emuva",
    next: "Okulandelayo",
    previous: "Okwedlule",
    loading: "Iyalayisha...",

    // Dashboard
    welcomeBack: "Siyakwamukela emuva",
    geoScore: "Amaphuzu e-GEO",
    brandMentions: "Ukubalwa Kwebhizinisi",
    aiPlatforms: "Izinhlelo ze-AI",
    recommendations_count: "Izincomo",
    recentActivity: "Umsebenzi Wakamuva",
    topPerformingContent: "Okuqukethwe Okusebenza Kahle",

    // Monitor
    brandMonitoring: "Ukuqapha Ibhizinisi",
    platformBreakdown: "Ukuhlukaniswa Kwezinhlelo",
    mentionTrends: "Izitayela Zokubalwa",
    sentimentAnalysis: "Ukuhlaziywa Kwemizwa",
    competitorComparison: "Ukuqhathanisa Nabancintisana",

    // Create
    contentCreation: "Ukudala Okuqukethwe",
    newContent: "Okuqukethwe Okusha",
    templates: "Izifanekiso",
    brandVoice: "Izwi Lebhizinisi",
    generatedContent: "Okuqukethwe Okudalwe",

    // Audit
    siteAudit: "Ukuhlola Isayithi",
    startAudit: "Qala Ukuhlola",
    auditHistory: "Umlando Wokuhlola",
    technicalScore: "Amaphuzu Obuchwepheshe",
    contentScore: "Amaphuzu Okuqukethwe",
    schemaScore: "Amaphuzu e-Schema",

    // Recommendations
    smartRecommendations: "Izincomo Ezihlakaniphile",
    highPriority: "Isibophezelo Esiphakeme",
    mediumPriority: "Isibophezelo Esimaphakathi",
    lowPriority: "Isibophezelo Esiphansi",
    completed: "Kuqediwe",
    inProgress: "Kuyaqhubeka",
    pending: "Kulindile",

    // Settings
    profile: "Iphrofayili",
    account: "I-akhawunti",
    notifications: "Izaziso",
    billing: "Ukukhokhela",
    team: "Iqembu",
    integrations: "Ukuhlanganiswa",
    language: "Ulimi",
    theme: "Ithimu",

    // Auth
    signIn: "Ngena",
    signUp: "Bhalisa",
    email: "I-imeyili",
    password: "Iphasiwedi",
    forgotPassword: "Ukhohlwe Iphasiwedi?",

    // Errors
    error: "Iphutha",
    somethingWentWrong: "Kukhona okungahambanga kahle",
    tryAgain: "Zama Futhi",
    notFound: "Ayitholakali",
    unauthorized: "Awugunyaziwe",

    // Success
    success: "Impumelelo",
    saved: "Kulondoloziwe ngempumelelo",
    deleted: "Kususiwe ngempumelelo",
    updated: "Kubuyekezwe ngempumelelo",

    // Time
    today: "Namuhla",
    yesterday: "Izolo",
    thisWeek: "Leli Sonto",
    thisMonth: "Le Nyanga",
    lastMonth: "Inyanga Edlule",

    // Status
    active: "Kusebenza",
    inactive: "Akusebenzi",
    online: "Ku-inthanethi",
    offline: "Akuxhunyiwe",
  },

  xh: {
    // Navigation
    dashboard: "Ibhodi",
    monitor: "Jonga",
    create: "Yenza",
    audit: "Hlola",
    recommendations: "Iingcebiso",
    settings: "Izicwangciso",
    help: "Uncedo",
    logout: "Phuma",

    // Common actions
    save: "Gcina",
    cancel: "Rhoxisa",
    delete: "Cima",
    edit: "Hlela",
    search: "Khangela",
    filter: "Hluza",
    export: "Thumela",
    import: "Ngenisa",
    refresh: "Hlaziya",
    retry: "Zama kwakhona",
    submit: "Ngenisa",
    confirm: "Qinisekisa",
    close: "Vala",
    back: "Emva",
    next: "Elandelayo",
    previous: "Edlulileyo",
    loading: "Iyalayisha...",

    // Dashboard
    welcomeBack: "Wamkelekile kwakhona",
    geoScore: "Amanqaku e-GEO",
    brandMentions: "Ukubalwa Kwebrand",
    aiPlatforms: "Iiplatifomu ze-AI",
    recommendations_count: "Iingcebiso",
    recentActivity: "Umsebenzi Wamva",
    topPerformingContent: "Umxholo Osebenza Kakuhle",

    // Monitor
    brandMonitoring: "Ukujonga Ibrand",
    platformBreakdown: "Ukwahlulwa Kweeplatifomu",
    mentionTrends: "Iitrensi Zokubalwa",
    sentimentAnalysis: "Uhlalutyo Lwemvakalelo",
    competitorComparison: "Ukuthelekiswa Kwabakhuphisanayo",

    // Create
    contentCreation: "Ukwenza Umxholo",
    newContent: "Umxholo Omtsha",
    templates: "Iithempleti",
    brandVoice: "Ilizwi Lebrand",
    generatedContent: "Umxholo Owenziweyo",

    // Audit
    siteAudit: "Ukuhlola Isayithi",
    startAudit: "Qala Ukuhlola",
    auditHistory: "Imbali Yokuhlola",
    technicalScore: "Amanqaku Obugcisa",
    contentScore: "Amanqaku Omxholo",
    schemaScore: "Amanqaku e-Schema",

    // Recommendations
    smartRecommendations: "Iingcebiso Ezikrelekrele",
    highPriority: "Iphambili Ephakamileyo",
    mediumPriority: "Iphambili Ephakathi",
    lowPriority: "Iphambili Ephantsi",
    completed: "Igqityiwe",
    inProgress: "Iyaqhubeka",
    pending: "Ilindile",

    // Settings
    profile: "Iprofayili",
    account: "I-akhawunti",
    notifications: "Izaziso",
    billing: "Ukuhlawula",
    team: "Iqela",
    integrations: "Ukudibanisa",
    language: "Ulwimi",
    theme: "Ithimu",

    // Auth
    signIn: "Ngena",
    signUp: "Bhalisa",
    email: "I-imeyile",
    password: "Igama lokugqitha",
    forgotPassword: "Ulibalile Igama Lokugqitha?",

    // Errors
    error: "Imposiso",
    somethingWentWrong: "Kukho into engahambanga kakuhle",
    tryAgain: "Zama Kwakhona",
    notFound: "Ayifunyenwa",
    unauthorized: "Awugunyaziswanga",

    // Success
    success: "Impumelelo",
    saved: "Igcinwe ngempumelelo",
    deleted: "Icinyiwe ngempumelelo",
    updated: "Ihlaziyiwe ngempumelelo",

    // Time
    today: "Namhlanje",
    yesterday: "Izolo",
    thisWeek: "Le Veki",
    thisMonth: "Le Nyanga",
    lastMonth: "Inyanga Ephelileyo",

    // Status
    active: "Isebenza",
    inactive: "Ayisebenzi",
    online: "Kwi-intanethi",
    offline: "Ayixhunyiswanga",
  },

  af: {
    // Navigation
    dashboard: "Kontroleskerm",
    monitor: "Monitor",
    create: "Skep",
    audit: "Oudit",
    recommendations: "Aanbevelings",
    settings: "Instellings",
    help: "Hulp",
    logout: "Teken Uit",

    // Common actions
    save: "Stoor",
    cancel: "Kanselleer",
    delete: "Skrap",
    edit: "Wysig",
    search: "Soek",
    filter: "Filter",
    export: "Uitvoer",
    import: "Invoer",
    refresh: "Verfris",
    retry: "Probeer Weer",
    submit: "Indien",
    confirm: "Bevestig",
    close: "Sluit",
    back: "Terug",
    next: "Volgende",
    previous: "Vorige",
    loading: "Laai...",

    // Dashboard
    welcomeBack: "Welkom Terug",
    geoScore: "GEO-Telling",
    brandMentions: "Handelsmerk Verwysings",
    aiPlatforms: "KI-Platforms",
    recommendations_count: "Aanbevelings",
    recentActivity: "Onlangse Aktiwiteit",
    topPerformingContent: "Topprestasierende Inhoud",

    // Monitor
    brandMonitoring: "Handelsmerk Monitering",
    platformBreakdown: "Platform Uiteensetting",
    mentionTrends: "Verwysingstendense",
    sentimentAnalysis: "Sentimentanalise",
    competitorComparison: "Mededingervergelyking",

    // Create
    contentCreation: "Inhoud Skepping",
    newContent: "Nuwe Inhoud",
    templates: "Templates",
    brandVoice: "Handelsmerk Stem",
    generatedContent: "Gegenereerde Inhoud",

    // Audit
    siteAudit: "Werf Oudit",
    startAudit: "Begin Oudit",
    auditHistory: "Oudit Geskiedenis",
    technicalScore: "Tegniese Telling",
    contentScore: "Inhoud Telling",
    schemaScore: "Skema Telling",

    // Recommendations
    smartRecommendations: "Slim Aanbevelings",
    highPriority: "Hoë Prioriteit",
    mediumPriority: "Medium Prioriteit",
    lowPriority: "Lae Prioriteit",
    completed: "Voltooi",
    inProgress: "In Proses",
    pending: "Hangend",

    // Settings
    profile: "Profiel",
    account: "Rekening",
    notifications: "Kennisgewings",
    billing: "Faktuur",
    team: "Span",
    integrations: "Integrasies",
    language: "Taal",
    theme: "Tema",

    // Auth
    signIn: "Teken In",
    signUp: "Registreer",
    email: "E-pos",
    password: "Wagwoord",
    forgotPassword: "Wagwoord Vergeet?",

    // Errors
    error: "Fout",
    somethingWentWrong: "Iets het verkeerd gegaan",
    tryAgain: "Probeer Weer",
    notFound: "Nie Gevind",
    unauthorized: "Ongemagtig",

    // Success
    success: "Sukses",
    saved: "Suksesvol gestoor",
    deleted: "Suksesvol geskrap",
    updated: "Suksesvol opgedateer",

    // Time
    today: "Vandag",
    yesterday: "Gister",
    thisWeek: "Hierdie Week",
    thisMonth: "Hierdie Maand",
    lastMonth: "Verlede Maand",

    // Status
    active: "Aktief",
    inactive: "Onaktief",
    online: "Aanlyn",
    offline: "Aflyn",
  },

  sw: {
    // Navigation
    dashboard: "Dashibodi",
    monitor: "Fuatilia",
    create: "Unda",
    audit: "Kagua",
    recommendations: "Mapendekezo",
    settings: "Mipangilio",
    help: "Msaada",
    logout: "Toka",

    // Common actions
    save: "Hifadhi",
    cancel: "Ghairi",
    delete: "Futa",
    edit: "Hariri",
    search: "Tafuta",
    filter: "Chuja",
    export: "Hamisha",
    import: "Ingiza",
    refresh: "Onyesha upya",
    retry: "Jaribu tena",
    submit: "Wasilisha",
    confirm: "Thibitisha",
    close: "Funga",
    back: "Rudi",
    next: "Inayofuata",
    previous: "Iliyopita",
    loading: "Inapakia...",

    // Dashboard
    welcomeBack: "Karibu tena",
    geoScore: "Alama ya GEO",
    brandMentions: "Kutajwa kwa Chapa",
    aiPlatforms: "Majukwaa ya AI",
    recommendations_count: "Mapendekezo",
    recentActivity: "Shughuli za Hivi Karibuni",
    topPerformingContent: "Maudhui Bora Zaidi",

    // Monitor
    brandMonitoring: "Ufuatiliaji wa Chapa",
    platformBreakdown: "Uchambuzi wa Majukwaa",
    mentionTrends: "Mwenendo wa Kutajwa",
    sentimentAnalysis: "Uchambuzi wa Hisia",
    competitorComparison: "Kulinganisha Washindani",

    // Create
    contentCreation: "Kuunda Maudhui",
    newContent: "Maudhui Mapya",
    templates: "Violezo",
    brandVoice: "Sauti ya Chapa",
    generatedContent: "Maudhui Yaliyoundwa",

    // Audit
    siteAudit: "Ukaguzi wa Tovuti",
    startAudit: "Anza Ukaguzi",
    auditHistory: "Historia ya Ukaguzi",
    technicalScore: "Alama ya Kiufundi",
    contentScore: "Alama ya Maudhui",
    schemaScore: "Alama ya Schema",

    // Recommendations
    smartRecommendations: "Mapendekezo Mahiri",
    highPriority: "Kipaumbele cha Juu",
    mediumPriority: "Kipaumbele cha Kati",
    lowPriority: "Kipaumbele cha Chini",
    completed: "Imekamilika",
    inProgress: "Inaendelea",
    pending: "Inasubiri",

    // Settings
    profile: "Wasifu",
    account: "Akaunti",
    notifications: "Arifa",
    billing: "Malipo",
    team: "Timu",
    integrations: "Uunganishaji",
    language: "Lugha",
    theme: "Mandhari",

    // Auth
    signIn: "Ingia",
    signUp: "Jisajili",
    email: "Barua pepe",
    password: "Nenosiri",
    forgotPassword: "Umesahau Nenosiri?",

    // Errors
    error: "Kosa",
    somethingWentWrong: "Kuna kitu kilienda vibaya",
    tryAgain: "Jaribu Tena",
    notFound: "Haipatikani",
    unauthorized: "Hauruhusiwi",

    // Success
    success: "Mafanikio",
    saved: "Imehifadhiwa kwa mafanikio",
    deleted: "Imefutwa kwa mafanikio",
    updated: "Imesasishwa kwa mafanikio",

    // Time
    today: "Leo",
    yesterday: "Jana",
    thisWeek: "Wiki Hii",
    thisMonth: "Mwezi Huu",
    lastMonth: "Mwezi Uliopita",

    // Status
    active: "Inafanya kazi",
    inactive: "Haifanyi kazi",
    online: "Mtandaoni",
    offline: "Nje ya mtandao",
  },

  yo: {
    // Navigation
    dashboard: "Dasibodu",
    monitor: "Ṣọna",
    create: "Ṣẹda",
    audit: "Ṣayẹwo",
    recommendations: "Awọn Imọran",
    settings: "Eto",
    help: "Iranlọwọ",
    logout: "Jade",

    // Common actions
    save: "Fipamọ",
    cancel: "Fagile",
    delete: "Pa rẹ",
    edit: "Ṣatunkọ",
    search: "Wa",
    filter: "Sẹ",
    export: "Gbe jade",
    import: "Gbe wọle",
    refresh: "Sọdọtun",
    retry: "Gbiyanju lẹẹkansi",
    submit: "Fi silẹ",
    confirm: "Jẹrisi",
    close: "Pa",
    back: "Pada",
    next: "Tẹle",
    previous: "Iṣaaju",
    loading: "N gba...",

    // Dashboard
    welcomeBack: "Kaabo pada",
    geoScore: "Ami GEO",
    brandMentions: "Mẹnuba Ami",
    aiPlatforms: "Awọn Ipilẹ AI",
    recommendations_count: "Awọn Imọran",
    recentActivity: "Iṣẹ Aipẹ",
    topPerformingContent: "Akoonu Ti O Ṣiṣẹ Dara",

    // Monitor
    brandMonitoring: "Abojuto Ami",
    platformBreakdown: "Ipinya Ipilẹ",
    mentionTrends: "Awọn Aṣa Mẹnuba",
    sentimentAnalysis: "Itupalẹ Ero",
    competitorComparison: "Ifiwera Oludije",

    // Create
    contentCreation: "Ṣiṣẹda Akoonu",
    newContent: "Akoonu Tuntun",
    templates: "Awọn Awoṣe",
    brandVoice: "Ohun Ami",
    generatedContent: "Akoonu Ti A Ṣẹda",

    // Audit
    siteAudit: "Ayẹwo Aaye",
    startAudit: "Bẹrẹ Ayẹwo",
    auditHistory: "Itan Ayẹwo",
    technicalScore: "Ami Imọ-ẹrọ",
    contentScore: "Ami Akoonu",
    schemaScore: "Ami Schema",

    // Recommendations
    smartRecommendations: "Awọn Imọran Ọlọgbọn",
    highPriority: "Pataki Giga",
    mediumPriority: "Pataki Aarin",
    lowPriority: "Pataki Kekere",
    completed: "Pari",
    inProgress: "N ṣiṣẹ",
    pending: "N duro de",

    // Settings
    profile: "Profaili",
    account: "Akanti",
    notifications: "Awọn Ifitonileti",
    billing: "Sisanwo",
    team: "Ẹgbẹ",
    integrations: "Asopọ",
    language: "Ede",
    theme: "Akori",

    // Auth
    signIn: "Wọle",
    signUp: "Forukọsilẹ",
    email: "Imeeli",
    password: "Ọrọ aṣina",
    forgotPassword: "Gbagbe Ọrọ Aṣina?",

    // Errors
    error: "Aṣiṣe",
    somethingWentWrong: "Nkan kan ko ṣiṣẹ daradara",
    tryAgain: "Gbiyanju Lẹẹkansi",
    notFound: "Ko Ri",
    unauthorized: "Ko Gba Aṣẹ",

    // Success
    success: "Aṣeyọri",
    saved: "Ti fipamọ daradara",
    deleted: "Ti pa rẹ daradara",
    updated: "Ti ṣe imudojuiwọn daradara",

    // Time
    today: "Loni",
    yesterday: "Ana",
    thisWeek: "Ọsẹ Yii",
    thisMonth: "Oṣu Yii",
    lastMonth: "Oṣu To Kọja",

    // Status
    active: "N ṣiṣẹ",
    inactive: "Ko ṣiṣẹ",
    online: "Lori ayelujara",
    offline: "Ko si lori ayelujara",
  },
} as const;

// Helper to get translation
export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// Get language info by code
export function getLanguageInfo(code: Language): LanguageInfo | undefined {
  return languages.find((l) => l.code === code);
}
