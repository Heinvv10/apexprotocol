import * as dotenv from 'dotenv';
import * as path from 'path';
import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Load .env.local for database connection
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ALL_INDUSTRIES = {
  'Professional Services': [
    {
      name: 'McKinsey & Company',
      domain: 'mckinsey.com',
      tagline: 'Unlock the full potential of your business',
      description: 'McKinsey & Company is a global management consulting firm serving leading businesses, governments, and institutions.',
      logoUrl: 'https://logo.clearbit.com/mckinsey.com',
      industry: 'Professional Services',
      keywords: ['mckinsey', 'management consulting', 'strategy consulting'],
      seoKeywords: ['management consulting', 'business strategy', 'digital transformation', 'organizational change', 'corporate strategy'],
      geoKeywords: ['mckinsey careers', 'mckinsey consulting', 'top management consulting firms'],
      competitors: [
        { name: 'BCG', url: 'bcg.com', reason: 'Strategy consulting competitor' },
        { name: 'Bain & Company', url: 'bain.com', reason: 'Management consulting competitor' },
        { name: 'Deloitte Consulting', url: 'deloitte.com', reason: 'Consulting services competitor' },
        { name: 'Accenture', url: 'accenture.com', reason: 'Technology consulting competitor' },
        { name: 'PwC', url: 'pwc.com', reason: 'Professional services competitor' },
      ],
      valuePropositions: ['Strategic insights', 'Global expertise', 'Transformational impact', 'Fact-based approach'],
      socialLinks: {
        twitter: 'https://twitter.com/McKinsey',
        linkedin: 'https://www.linkedin.com/company/mckinsey',
        facebook: 'https://www.facebook.com/McKinsey',
        instagram: 'https://www.instagram.com/mckinsey',
        youtube: 'https://www.youtube.com/user/McKinsey',
      },
      voice: {
        tone: 'authoritative' as const,
        personality: ['analytical', 'professional', 'strategic', 'insightful'],
        targetAudience: 'C-suite executives, business leaders, government officials seeking strategic guidance',
        keyMessages: ['Transformational impact', 'Strategic insights', 'Global expertise', 'Evidence-based recommendations'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#003E6B',
        secondaryColor: '#00A3E0',
        accentColor: '#FFFFFF',
        colorPalette: ['#003E6B', '#00A3E0', '#FFFFFF', '#004B87'],
        fontFamily: 'McKinsey Sans',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '3 World Trade Center',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10007',
        },
      ],
      personnel: [
        {
          name: 'Bob Sternfels',
          title: 'Global Managing Partner',
          linkedinUrl: 'https://www.linkedin.com/in/bob-sternfels/',
          isActive: true,
          joinedDate: '2021-07',
        },
        {
          name: 'Liz Hilton Segel',
          title: 'Chief Client Officer',
          linkedinUrl: 'https://www.linkedin.com/in/liz-hilton-segel/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Katy George',
          title: 'Chief People Officer',
          linkedinUrl: 'https://www.linkedin.com/in/katy-george/',
          isActive: true,
          joinedDate: '2019-07',
        },
        {
          name: 'Homayoun Hatami',
          title: 'Managing Partner, Global Client Capabilities',
          linkedinUrl: 'https://www.linkedin.com/in/homayoun-hatami/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Kweilin Ellingrud',
          title: 'Director, McKinsey Global Institute',
          linkedinUrl: 'https://www.linkedin.com/in/kweilin-ellingrud/',
          isActive: true,
          joinedDate: '2017-01',
        },
      ],
    },
    {
      name: 'Boston Consulting Group',
      domain: 'bcg.com',
      tagline: 'Inspiring growth through bold ideas and innovation',
      description: 'Boston Consulting Group partners with leaders in business and society to tackle their most important challenges.',
      logoUrl: 'https://logo.clearbit.com/bcg.com',
      industry: 'Professional Services',
      keywords: ['bcg', 'consulting', 'strategy'],
      seoKeywords: ['strategy consulting', 'business transformation', 'innovation consulting', 'corporate strategy', 'digital strategy'],
      geoKeywords: ['bcg careers', 'bcg consulting', 'top strategy firms'],
      competitors: [
        { name: 'McKinsey', url: 'mckinsey.com', reason: 'Strategy consulting competitor' },
        { name: 'Bain & Company', url: 'bain.com', reason: 'Management consulting competitor' },
        { name: 'Deloitte', url: 'deloitte.com', reason: 'Consulting services competitor' },
        { name: 'Accenture', url: 'accenture.com', reason: 'Technology consulting competitor' },
        { name: 'PwC', url: 'pwc.com', reason: 'Professional services competitor' },
      ],
      valuePropositions: ['Bold innovation', 'Collaborative partnership', 'Sustainable impact', 'Digital transformation'],
      socialLinks: {
        twitter: 'https://twitter.com/BCG',
        linkedin: 'https://www.linkedin.com/company/boston-consulting-group',
        facebook: 'https://www.facebook.com/BostonConsultingGroup',
        instagram: 'https://www.instagram.com/bcg',
        youtube: 'https://www.youtube.com/user/BCGVision',
      },
      voice: {
        tone: 'innovative' as const,
        personality: ['bold', 'collaborative', 'forward-thinking', 'purpose-driven'],
        targetAudience: 'Business leaders, CEOs, and organizations seeking transformational growth',
        keyMessages: ['Bold ideas', 'Innovation', 'Collaboration', 'Sustainable growth'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#00205B',
        secondaryColor: '#53B748',
        accentColor: '#FFFFFF',
        colorPalette: ['#00205B', '#53B748', '#FFFFFF', '#009639'],
        fontFamily: 'BCG Sans',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '200 Pier Four Boulevard',
          city: 'Boston',
          state: 'MA',
          country: 'USA',
          postalCode: '02210',
        },
      ],
      personnel: [
        {
          name: 'Christoph Schweizer',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/christoph-schweizer/',
          isActive: true,
          joinedDate: '2021-10',
        },
        {
          name: 'Rich Lesser',
          title: 'Global Chair',
          linkedinUrl: 'https://www.linkedin.com/in/rich-lesser/',
          isActive: true,
          joinedDate: '2021-10',
        },
        {
          name: 'Jean-Werner De T\'Serclaes',
          title: 'Chief Operating Officer',
          linkedinUrl: 'https://www.linkedin.com/in/jean-werner-de-t-serclaes/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Sylvain Duranton',
          title: 'Global Leader, BCG X',
          linkedinUrl: 'https://www.linkedin.com/in/sylvain-duranton/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Vinciane Beauchene',
          title: 'Global Chair, People Team',
          linkedinUrl: 'https://www.linkedin.com/in/vinciane-beauchene/',
          isActive: true,
          joinedDate: '2018-01',
        },
      ],
    },
    {
      name: 'Deloitte',
      domain: 'deloitte.com',
      tagline: 'Making an impact that matters',
      description: 'Deloitte provides audit, consulting, tax, and advisory services to organizations across industries.',
      logoUrl: 'https://logo.clearbit.com/deloitte.com',
      industry: 'Professional Services',
      keywords: ['deloitte', 'audit', 'consulting', 'advisory'],
      seoKeywords: ['professional services', 'audit services', 'tax consulting', 'risk advisory', 'financial advisory'],
      geoKeywords: ['deloitte careers', 'deloitte consulting', 'big four accounting'],
      competitors: [
        { name: 'PwC', url: 'pwc.com', reason: 'Big Four competitor' },
        { name: 'EY', url: 'ey.com', reason: 'Big Four competitor' },
        { name: 'KPMG', url: 'kpmg.com', reason: 'Big Four competitor' },
        { name: 'Accenture', url: 'accenture.com', reason: 'Consulting competitor' },
        { name: 'McKinsey', url: 'mckinsey.com', reason: 'Strategy consulting competitor' },
      ],
      valuePropositions: ['Multidisciplinary expertise', 'Industry insights', 'Innovation focus', 'Global reach'],
      socialLinks: {
        twitter: 'https://twitter.com/Deloitte',
        linkedin: 'https://www.linkedin.com/company/deloitte',
        facebook: 'https://www.facebook.com/deloitte',
        instagram: 'https://www.instagram.com/deloitte',
        youtube: 'https://www.youtube.com/user/DeloitteLLP',
      },
      voice: {
        tone: 'professional' as const,
        personality: ['trusted', 'innovative', 'collaborative', 'impact-driven'],
        targetAudience: 'Organizations seeking audit, consulting, tax, and advisory services',
        keyMessages: ['Making an impact', 'Trust and integrity', 'Innovation', 'Industry expertise'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#00A300',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#00A300', '#000000', '#FFFFFF', '#86BC25'],
        fontFamily: 'Open Sans',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '30 Rockefeller Plaza',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10112',
        },
      ],
      personnel: [
        {
          name: 'Joe Ucuzoglu',
          title: 'CEO, Deloitte US',
          linkedinUrl: 'https://www.linkedin.com/in/joe-ucuzoglu/',
          isActive: true,
          joinedDate: '2022-06',
        },
        {
          name: 'Punit Renjen',
          title: 'Global CEO',
          linkedinUrl: 'https://www.linkedin.com/in/punitrenjen/',
          isActive: true,
          joinedDate: '2015-06',
        },
        {
          name: 'Diana Kearns-Manolatos',
          title: 'Chief People & Purpose Officer',
          linkedinUrl: 'https://www.linkedin.com/in/diana-kearns-manolatos/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Mike Fucci',
          title: 'Vice Chair, US Consulting',
          linkedinUrl: 'https://www.linkedin.com/in/mike-fucci/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Jason Girzadas',
          title: 'CEO, Deloitte Consulting',
          linkedinUrl: 'https://www.linkedin.com/in/jason-girzadas/',
          isActive: true,
          joinedDate: '2018-07',
        },
      ],
    },
    {
      name: 'PwC',
      domain: 'pwc.com',
      tagline: 'Building trust in society and solving important problems',
      description: 'PwC is a global professional services network providing assurance, tax, and advisory services.',
      logoUrl: 'https://logo.clearbit.com/pwc.com',
      industry: 'Professional Services',
      keywords: ['pwc', 'audit', 'tax', 'advisory'],
      seoKeywords: ['professional services', 'assurance services', 'tax advisory', 'business consulting', 'risk management'],
      geoKeywords: ['pwc careers', 'pwc consulting', 'big four firms'],
      competitors: [
        { name: 'Deloitte', url: 'deloitte.com', reason: 'Big Four competitor' },
        { name: 'EY', url: 'ey.com', reason: 'Big Four competitor' },
        { name: 'KPMG', url: 'kpmg.com', reason: 'Big Four competitor' },
        { name: 'Accenture', url: 'accenture.com', reason: 'Consulting competitor' },
        { name: 'McKinsey', url: 'mckinsey.com', reason: 'Strategy consulting competitor' },
      ],
      valuePropositions: ['Trust building', 'Quality assurance', 'Industry expertise', 'Technology innovation'],
      socialLinks: {
        twitter: 'https://twitter.com/PwC',
        linkedin: 'https://www.linkedin.com/company/pwc',
        facebook: 'https://www.facebook.com/PwC',
        instagram: 'https://www.instagram.com/pwc',
        youtube: 'https://www.youtube.com/user/PwC',
      },
      voice: {
        tone: 'trustworthy' as const,
        personality: ['reliable', 'professional', 'innovative', 'collaborative'],
        targetAudience: 'Organizations seeking assurance, tax, and advisory services',
        keyMessages: ['Building trust', 'Quality service', 'Innovation', 'Global expertise'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#D93954',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#D93954', '#000000', '#FFFFFF', '#E8112D'],
        fontFamily: 'Georgia',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '300 Madison Avenue',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10017',
        },
      ],
      personnel: [
        {
          name: 'Mohamed Kande',
          title: 'Vice Chair, US Consulting Solutions Co-Leader',
          linkedinUrl: 'https://www.linkedin.com/in/mohamed-kande/',
          isActive: true,
          joinedDate: '2021-07',
        },
        {
          name: 'Bob Moritz',
          title: 'Global Chairman',
          linkedinUrl: 'https://www.linkedin.com/in/bob-moritz/',
          isActive: true,
          joinedDate: '2016-07',
        },
        {
          name: 'Yolanda Seals-Coffield',
          title: 'Chief People Officer',
          linkedinUrl: 'https://www.linkedin.com/in/yolanda-seals-coffield/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Michael Fenlon',
          title: 'Vice Chair, Tax',
          linkedinUrl: 'https://www.linkedin.com/in/michael-fenlon/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Tim Ryan',
          title: 'Senior Partner',
          linkedinUrl: 'https://www.linkedin.com/in/timothy-ryan/',
          isActive: true,
          joinedDate: '2018-01',
        },
      ],
    },
    {
      name: 'Accenture',
      domain: 'accenture.com',
      tagline: 'Let there be change',
      description: 'Accenture is a global professional services company with leading capabilities in digital, cloud, and security.',
      logoUrl: 'https://logo.clearbit.com/accenture.com',
      industry: 'Professional Services',
      keywords: ['accenture', 'consulting', 'digital transformation', 'technology'],
      seoKeywords: ['technology consulting', 'digital transformation', 'cloud consulting', 'enterprise software', 'IT services'],
      geoKeywords: ['accenture careers', 'accenture consulting', 'technology consulting firms'],
      competitors: [
        { name: 'Deloitte', url: 'deloitte.com', reason: 'Consulting competitor' },
        { name: 'IBM Consulting', url: 'ibm.com', reason: 'Technology consulting competitor' },
        { name: 'Cognizant', url: 'cognizant.com', reason: 'IT services competitor' },
        { name: 'Capgemini', url: 'capgemini.com', reason: 'Consulting and technology competitor' },
        { name: 'McKinsey', url: 'mckinsey.com', reason: 'Strategy consulting competitor' },
      ],
      valuePropositions: ['Digital transformation', 'Cloud expertise', 'Innovation at scale', 'Industry solutions'],
      socialLinks: {
        twitter: 'https://twitter.com/Accenture',
        linkedin: 'https://www.linkedin.com/company/accenture',
        facebook: 'https://www.facebook.com/accenture',
        instagram: 'https://www.instagram.com/accenture',
        youtube: 'https://www.youtube.com/user/Accenture',
      },
      voice: {
        tone: 'innovative' as const,
        personality: ['forward-thinking', 'collaborative', 'tech-savvy', 'change-driven'],
        targetAudience: 'Organizations seeking digital transformation and technology consulting',
        keyMessages: ['Digital transformation', 'Innovation', 'Change leadership', 'Technology excellence'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#A100FF',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#A100FF', '#000000', '#FFFFFF', '#8000CC'],
        fontFamily: 'Graphik',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '161 N Clark Street',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          postalCode: '60601',
        },
      ],
      personnel: [
        {
          name: 'Julie Sweet',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/julie-sweet/',
          isActive: true,
          joinedDate: '2019-09',
        },
        {
          name: 'Manish Sharma',
          title: 'Chief Operating Officer',
          linkedinUrl: 'https://www.linkedin.com/in/manish-sharma-accenture/',
          isActive: true,
          joinedDate: '2020-09',
        },
        {
          name: 'Ellyn Shook',
          title: 'Chief Leadership & HR Officer',
          linkedinUrl: 'https://www.linkedin.com/in/ellynshook/',
          isActive: true,
          joinedDate: '2015-01',
        },
        {
          name: 'Paul Daugherty',
          title: 'Chief Technology & Innovation Officer',
          linkedinUrl: 'https://www.linkedin.com/in/pauldaugherty/',
          isActive: true,
          joinedDate: '2017-01',
        },
        {
          name: 'KC McClure',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/kcmcclure/',
          isActive: true,
          joinedDate: '2019-01',
        },
      ],
    },
  ],
  'Sports & Fitness': [
    {
      name: 'Peloton',
      domain: 'onepeloton.com',
      tagline: 'Together we go far',
      description: 'Peloton is a fitness technology company that combines premium equipment with live and on-demand fitness classes.',
      logoUrl: 'https://logo.clearbit.com/onepeloton.com',
      industry: 'Sports & Fitness',
      keywords: ['peloton', 'fitness', 'connected fitness', 'home workouts'],
      seoKeywords: ['peloton bike', 'home fitness', 'live fitness classes', 'connected fitness equipment', 'workout streaming'],
      geoKeywords: ['peloton near me', 'peloton showroom', 'peloton bike price'],
      competitors: [
        { name: 'NordicTrack', url: 'nordictrack.com', reason: 'Connected fitness equipment competitor' },
        { name: 'Mirror', url: 'mirror.co', reason: 'Home fitness competitor' },
        { name: 'Tonal', url: 'tonal.com', reason: 'Smart fitness equipment competitor' },
        { name: 'ClassPass', url: 'classpass.com', reason: 'Fitness class access competitor' },
        { name: 'Apple Fitness+', url: 'apple.com/apple-fitness-plus/', reason: 'Digital fitness platform competitor' },
      ],
      valuePropositions: ['Premium equipment', 'Live classes', 'Community connection', 'Expert instructors'],
      socialLinks: {
        twitter: 'https://twitter.com/onepeloton',
        linkedin: 'https://www.linkedin.com/company/peloton-interactive',
        facebook: 'https://www.facebook.com/onepeloton',
        instagram: 'https://www.instagram.com/onepeloton',
        youtube: 'https://www.youtube.com/onepeloton',
      },
      voice: {
        tone: 'motivational' as const,
        personality: ['energetic', 'inclusive', 'supportive', 'community-driven'],
        targetAudience: 'Fitness enthusiasts seeking premium at-home workout experiences',
        keyMessages: ['Together we go far', 'Community support', 'Premium experience', 'Fitness innovation'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#000000',
        secondaryColor: '#DA0000',
        accentColor: '#FFFFFF',
        colorPalette: ['#000000', '#DA0000', '#FFFFFF', '#8C0000'],
        fontFamily: 'Stratos',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '441 9th Avenue',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
        },
      ],
      personnel: [
        {
          name: 'Barry McCarthy',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/barry-mccarthy/',
          isActive: true,
          joinedDate: '2022-02',
        },
        {
          name: 'Liz Coddington',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/liz-coddington/',
          isActive: true,
          joinedDate: '2021-05',
        },
        {
          name: 'Jen Cotter',
          title: 'Chief Content Officer',
          linkedinUrl: 'https://www.linkedin.com/in/jennifer-cotter/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Dara Treseder',
          title: 'Chief Marketing Officer',
          linkedinUrl: 'https://www.linkedin.com/in/daratreseder/',
          isActive: true,
          joinedDate: '2020-09',
        },
        {
          name: 'Tammy Albarrán',
          title: 'Chief Legal Officer',
          linkedinUrl: 'https://www.linkedin.com/in/tammy-albarran/',
          isActive: true,
          joinedDate: '2019-01',
        },
      ],
    },
    {
      name: 'Strava',
      domain: 'strava.com',
      tagline: 'The social network for athletes',
      description: 'Strava is a social fitness app for tracking running, cycling, and other athletic activities.',
      logoUrl: 'https://logo.clearbit.com/strava.com',
      industry: 'Sports & Fitness',
      keywords: ['strava', 'running', 'cycling', 'fitness tracking'],
      seoKeywords: ['fitness app', 'running tracker', 'cycling app', 'activity tracking', 'athlete social network'],
      geoKeywords: ['strava app', 'strava routes', 'strava segments'],
      competitors: [
        { name: 'Garmin Connect', url: 'garmin.com', reason: 'Fitness tracking competitor' },
        { name: 'Nike Run Club', url: 'nike.com', reason: 'Running app competitor' },
        { name: 'MapMyRun', url: 'mapmyrun.com', reason: 'Activity tracking competitor' },
        { name: 'Runkeeper', url: 'runkeeper.com', reason: 'Running app competitor' },
        { name: 'TrainingPeaks', url: 'trainingpeaks.com', reason: 'Training platform competitor' },
      ],
      valuePropositions: ['Social motivation', 'Route discovery', 'Performance analysis', 'Community challenges'],
      socialLinks: {
        twitter: 'https://twitter.com/Strava',
        linkedin: 'https://www.linkedin.com/company/strava',
        facebook: 'https://www.facebook.com/Strava',
        instagram: 'https://www.instagram.com/strava',
        youtube: 'https://www.youtube.com/user/strava',
      },
      voice: {
        tone: 'encouraging' as const,
        personality: ['supportive', 'data-driven', 'competitive', 'community-focused'],
        targetAudience: 'Runners, cyclists, and athletes seeking social fitness tracking',
        keyMessages: ['Social motivation', 'Track progress', 'Join the community', 'Push your limits'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#FC4C02',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#FC4C02', '#000000', '#FFFFFF', '#E34402'],
        fontFamily: 'Stratum',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '208 Utah Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94103',
        },
      ],
      personnel: [
        {
          name: 'Michael Horvath',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/michael-horvath/',
          isActive: true,
          joinedDate: '2019-11',
        },
        {
          name: 'Zipporah Allen',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/zipporah-allen/',
          isActive: true,
          joinedDate: '2021-01',
        },
        {
          name: 'Mateo Ortega',
          title: 'VP of Product',
          linkedinUrl: 'https://www.linkedin.com/in/mateo-ortega/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Michael Martin',
          title: 'General Counsel',
          linkedinUrl: 'https://www.linkedin.com/in/michael-martin-strava/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Gareth Nettleton',
          title: 'VP of Engineering',
          linkedinUrl: 'https://www.linkedin.com/in/gareth-nettleton/',
          isActive: true,
          joinedDate: '2018-01',
        },
      ],
    },
    {
      name: 'ClassPass',
      domain: 'classpass.com',
      tagline: 'Your world of wellness',
      description: 'ClassPass gives members unlimited access to thousands of fitness studios and wellness experiences.',
      logoUrl: 'https://logo.clearbit.com/classpass.com',
      industry: 'Sports & Fitness',
      keywords: ['classpass', 'fitness classes', 'gym membership', 'wellness'],
      seoKeywords: ['fitness membership', 'gym classes', 'yoga classes', 'workout variety', 'fitness studios'],
      geoKeywords: ['classpass near me', 'fitness classes near me', 'gym membership options'],
      competitors: [
        { name: 'Mindbody', url: 'mindbodyonline.com', reason: 'Fitness booking competitor' },
        { name: 'Gympass', url: 'gympass.com', reason: 'Gym membership competitor' },
        { name: 'Fitt Insider', url: 'fittinsider.com', reason: 'Fitness platform competitor' },
        { name: 'Groupon Fitness', url: 'groupon.com', reason: 'Fitness deal competitor' },
        { name: 'Studio+ by ClassPass', url: 'classpass.com', reason: 'Own product line' },
      ],
      valuePropositions: ['Unlimited variety', 'Flexible membership', 'Try before committing', 'Convenient booking'],
      socialLinks: {
        twitter: 'https://twitter.com/ClassPass',
        linkedin: 'https://www.linkedin.com/company/classpass',
        facebook: 'https://www.facebook.com/ClassPass',
        instagram: 'https://www.instagram.com/classpass',
        youtube: 'https://www.youtube.com/user/ClassPass',
      },
      voice: {
        tone: 'welcoming' as const,
        personality: ['inclusive', 'flexible', 'exploratory', 'supportive'],
        targetAudience: 'Fitness enthusiasts seeking variety and flexibility in their workouts',
        keyMessages: ['Unlimited variety', 'Your world of wellness', 'Flexible fitness', 'Try everything'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#1C1C1C',
        secondaryColor: '#00D4B4',
        accentColor: '#FFFFFF',
        colorPalette: ['#1C1C1C', '#00D4B4', '#FFFFFF', '#00BFA5'],
        fontFamily: 'Apercu',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '25 West 39th Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10018',
        },
      ],
      personnel: [
        {
          name: 'Fritz Lanman',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/fritzlanman/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Kintan Brahmbhatt',
          title: 'Chief Product Officer',
          linkedinUrl: 'https://www.linkedin.com/in/kintanbrahmbhatt/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Rachel Kowal',
          title: 'Chief Marketing Officer',
          linkedinUrl: 'https://www.linkedin.com/in/rachel-kowal/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Payal Kadakia',
          title: 'Founder & Executive Chairman',
          linkedinUrl: 'https://www.linkedin.com/in/payal-kadakia/',
          isActive: true,
          joinedDate: '2011-01',
        },
        {
          name: 'Mary Biggins',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/mary-biggins/',
          isActive: true,
          joinedDate: '2017-01',
        },
      ],
    },
    {
      name: 'MyFitnessPal',
      domain: 'myfitnesspal.com',
      tagline: 'Get fit. Stay healthy.',
      description: 'MyFitnessPal is a nutrition and calorie tracking app that helps users reach their health and fitness goals.',
      logoUrl: 'https://logo.clearbit.com/myfitnesspal.com',
      industry: 'Sports & Fitness',
      keywords: ['myfitnesspal', 'calorie counter', 'nutrition tracking', 'diet app'],
      seoKeywords: ['calorie tracking', 'nutrition app', 'food diary', 'weight loss app', 'macro tracking'],
      geoKeywords: ['myfitnesspal app', 'calorie counter app', 'best diet app'],
      competitors: [
        { name: 'Lose It!', url: 'loseit.com', reason: 'Calorie tracking competitor' },
        { name: 'Noom', url: 'noom.com', reason: 'Weight loss app competitor' },
        { name: 'Cronometer', url: 'cronometer.com', reason: 'Nutrition tracking competitor' },
        { name: 'Weight Watchers', url: 'weightwatchers.com', reason: 'Diet program competitor' },
        { name: 'Lifesum', url: 'lifesum.com', reason: 'Food tracking competitor' },
      ],
      valuePropositions: ['Largest food database', 'Easy tracking', 'Community support', 'Comprehensive insights'],
      socialLinks: {
        twitter: 'https://twitter.com/MyFitnessPal',
        linkedin: 'https://www.linkedin.com/company/myfitnesspal',
        facebook: 'https://www.facebook.com/myfitnesspal',
        instagram: 'https://www.instagram.com/myfitnesspal',
        youtube: 'https://www.youtube.com/user/MyFitnessPal',
      },
      voice: {
        tone: 'supportive' as const,
        personality: ['encouraging', 'data-driven', 'practical', 'community-focused'],
        targetAudience: 'Health-conscious individuals tracking nutrition and fitness goals',
        keyMessages: ['Track your progress', 'Reach your goals', 'Community support', 'Simple tracking'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#0072C6',
        secondaryColor: '#00BFA5',
        accentColor: '#FFFFFF',
        colorPalette: ['#0072C6', '#00BFA5', '#FFFFFF', '#005A9C'],
        fontFamily: 'Open Sans',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '135 Mississippi Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94107',
        },
      ],
      personnel: [
        {
          name: 'Mike Lee',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/mike-lee-myfitnesspal/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Tricia Han',
          title: 'Chief Product Officer',
          linkedinUrl: 'https://www.linkedin.com/in/triciahan/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Melissa Goldin',
          title: 'Chief Marketing Officer',
          linkedinUrl: 'https://www.linkedin.com/in/melissa-goldin/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Mike Sheeley',
          title: 'VP of Engineering',
          linkedinUrl: 'https://www.linkedin.com/in/mike-sheeley/',
          isActive: true,
          joinedDate: '2017-01',
        },
        {
          name: 'Albert Lee',
          title: 'Co-Founder',
          linkedinUrl: 'https://www.linkedin.com/in/albert-lee-myfitnesspal/',
          isActive: true,
          joinedDate: '2005-01',
        },
      ],
    },
    {
      name: 'Fitbit',
      domain: 'fitbit.com',
      tagline: 'Find your fit',
      description: 'Fitbit is a health and fitness wearables company that helps users track activity, sleep, and overall wellness.',
      logoUrl: 'https://logo.clearbit.com/fitbit.com',
      industry: 'Sports & Fitness',
      keywords: ['fitbit', 'fitness tracker', 'wearable', 'health tracking'],
      seoKeywords: ['fitness tracker', 'activity tracker', 'sleep tracking', 'heart rate monitor', 'smartwatch'],
      geoKeywords: ['fitbit near me', 'buy fitbit', 'fitbit watch'],
      competitors: [
        { name: 'Apple Watch', url: 'apple.com', reason: 'Smartwatch competitor' },
        { name: 'Garmin', url: 'garmin.com', reason: 'Fitness wearable competitor' },
        { name: 'Samsung Galaxy Watch', url: 'samsung.com', reason: 'Smartwatch competitor' },
        { name: 'Whoop', url: 'whoop.com', reason: 'Fitness tracker competitor' },
        { name: 'Oura Ring', url: 'ouraring.com', reason: 'Health tracker competitor' },
      ],
      valuePropositions: ['Comprehensive tracking', 'Sleep insights', 'Heart health monitoring', 'Activity motivation'],
      socialLinks: {
        twitter: 'https://twitter.com/fitbit',
        linkedin: 'https://www.linkedin.com/company/fitbit',
        facebook: 'https://www.facebook.com/fitbit',
        instagram: 'https://www.instagram.com/fitbit',
        youtube: 'https://www.youtube.com/user/FitbitOfficialSite',
      },
      voice: {
        tone: 'motivational' as const,
        personality: ['encouraging', 'health-focused', 'data-driven', 'accessible'],
        targetAudience: 'Health-conscious individuals seeking wearable fitness tracking',
        keyMessages: ['Find your fit', 'Track your health', 'Move more', 'Sleep better'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#00B0B9',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#00B0B9', '#000000', '#FFFFFF', '#008C94'],
        fontFamily: 'Proxima Nova',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '199 Fremont Street',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94105',
        },
      ],
      personnel: [
        {
          name: 'James Park',
          title: 'Co-Founder & Vice President, Google',
          linkedinUrl: 'https://www.linkedin.com/in/jamespark/',
          isActive: true,
          joinedDate: '2007-01',
        },
        {
          name: 'Eric Friedman',
          title: 'Co-Founder & CTO',
          linkedinUrl: 'https://www.linkedin.com/in/eric-friedman-fitbit/',
          isActive: true,
          joinedDate: '2007-01',
        },
        {
          name: 'Amy McDonough',
          title: 'VP & General Manager, Fitbit Health Solutions',
          linkedinUrl: 'https://www.linkedin.com/in/amy-mcdonough/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Tim Roberts',
          title: 'VP of Product',
          linkedinUrl: 'https://www.linkedin.com/in/tim-roberts-fitbit/',
          isActive: true,
          joinedDate: '2017-01',
        },
        {
          name: 'Sara Clemens',
          title: 'Former COO',
          linkedinUrl: 'https://www.linkedin.com/in/saraclemens/',
          isActive: false,
          joinedDate: '2018-01',
        },
      ],
    },
  ],
};

async function main() {
  console.log('Starting benchmark brands population (Part 4a: Professional Services + Sports & Fitness)...\n');

  // Check if org exists
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, 'org_benchmark_brands'),
  });

  if (!org) {
    console.error('ERROR: Organization "org_benchmark_brands" not found!');
    process.exit(1);
  }

  console.log('Organization found:', org.name);
  console.log('');

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [industry, brandsList] of Object.entries(ALL_INDUSTRIES)) {
    console.log(`Processing industry: ${industry}`);
    console.log('='.repeat(60));

    for (const brandData of brandsList) {
      try {
        // Check if brand already exists by domain
        const existing = await db.query.brands.findFirst({
          where: eq(brands.domain, brandData.domain),
        });

        if (existing) {
          console.log(`⏭️  SKIPPED: ${brandData.name} (${brandData.domain}) - already exists`);
          totalSkipped++;
          continue;
        }

        // Insert brand
        await db.insert(brands).values({
          organizationId: 'org_benchmark_brands',
          isBenchmark: true,
          ...brandData,
        });

        console.log(`✅ INSERTED: ${brandData.name} (${brandData.domain}) - ${brandData.benchmarkTier} tier`);
        totalInserted++;

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`❌ ERROR inserting ${brandData.name}:`, error);
        totalErrors++;
      }
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('SUMMARY:');
  console.log(`✅ Inserted: ${totalInserted}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
