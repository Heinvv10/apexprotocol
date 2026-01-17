import { db } from '@/lib/db';
import { brands, organizations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const ALL_INDUSTRIES = {
  'Telecommunications': [
    {
      name: 'T-Mobile',
      domain: 't-mobile.com',
      tagline: 'The Un-carrier',
      description: 'T-Mobile is a wireless network operator providing nationwide 5G coverage and mobile services.',
      logoUrl: 'https://logo.clearbit.com/t-mobile.com',
      industry: 'Telecommunications',
      keywords: ['t-mobile', '5g', 'wireless', 'mobile'],
      seoKeywords: ['5g network', 'wireless carrier', 'unlimited data', 'mobile plans', 'phone service'],
      geoKeywords: ['t-mobile near me', 't-mobile store', 't-mobile coverage'],
      competitors: [
        { name: 'Verizon', url: 'verizon.com', reason: 'Wireless carrier competitor' },
        { name: 'AT&T', url: 'att.com', reason: 'Telecom competitor' },
        { name: 'Sprint', url: 'sprint.com', reason: 'Former competitor (now merged)' },
        { name: 'US Cellular', url: 'uscellular.com', reason: 'Regional carrier competitor' },
        { name: 'Mint Mobile', url: 'mintmobile.com', reason: 'MVNO competitor' },
      ],
      valuePropositions: ['Un-carrier benefits', 'Nationwide 5G', 'No contracts', 'International roaming'],
      socialLinks: {
        twitter: 'https://twitter.com/TMobile',
        linkedin: 'https://www.linkedin.com/company/t-mobile',
        facebook: 'https://www.facebook.com/TMobile',
        instagram: 'https://www.instagram.com/tmobile',
        youtube: 'https://www.youtube.com/user/TMobile',
      },
      voice: {
        tone: 'disruptive' as const,
        personality: ['bold', 'customer-first', 'innovative', 'rebellious'],
        targetAudience: 'Mobile users seeking better value and network innovation',
        keyMessages: ['Un-carrier revolution', 'Customer benefits', '5G leadership', 'Breaking industry rules'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#E20074',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#E20074', '#000000', '#FFFFFF', '#C4005A'],
        fontFamily: 'T-Mobile Headline',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '12920 SE 38th Street',
          city: 'Bellevue',
          state: 'WA',
          country: 'USA',
          postalCode: '98006',
        },
      ],
      personnel: [
        {
          name: 'Mike Sievert',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/mike-sievert/',
          isActive: true,
          joinedDate: '2020-05',
        },
        {
          name: 'Peter Osvaldik',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/peter-osvaldik/',
          isActive: true,
          joinedDate: '2020-05',
        },
        {
          name: 'Jon Freier',
          title: 'President, Consumer Group',
          linkedinUrl: 'https://www.linkedin.com/in/jon-freier/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Callie Field',
          title: 'President, T-Mobile for Business',
          linkedinUrl: 'https://www.linkedin.com/in/calliefield/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Abdul Saad',
          title: 'Chief Technology Officer',
          linkedinUrl: 'https://www.linkedin.com/in/abdul-saad/',
          isActive: true,
          joinedDate: '2017-01',
        },
      ],
    },
    {
      name: 'Verizon',
      domain: 'verizon.com',
      tagline: 'Built right',
      description: 'Verizon is America\'s largest wireless network operator, providing wireless and fiber-optic services.',
      logoUrl: 'https://logo.clearbit.com/verizon.com',
      industry: 'Telecommunications',
      keywords: ['verizon', 'wireless', '5g', 'fios'],
      seoKeywords: ['5g ultra wideband', 'wireless network', 'fiber internet', 'mobile service', 'home internet'],
      geoKeywords: ['verizon near me', 'verizon fios', 'verizon store'],
      competitors: [
        { name: 'T-Mobile', url: 't-mobile.com', reason: 'Wireless competitor' },
        { name: 'AT&T', url: 'att.com', reason: 'Telecom competitor' },
        { name: 'Comcast Xfinity', url: 'xfinity.com', reason: 'Internet service competitor' },
        { name: 'Charter Spectrum', url: 'spectrum.com', reason: 'Home internet competitor' },
        { name: 'Visible', url: 'visible.com', reason: 'Own MVNO brand' },
      ],
      valuePropositions: ['Network reliability', '5G Ultra Wideband', 'Fiber internet', 'Business solutions'],
      socialLinks: {
        twitter: 'https://twitter.com/Verizon',
        linkedin: 'https://www.linkedin.com/company/verizon',
        facebook: 'https://www.facebook.com/verizon',
        instagram: 'https://www.instagram.com/verizon',
        youtube: 'https://www.youtube.com/user/verizon',
      },
      voice: {
        tone: 'reliable' as const,
        personality: ['trustworthy', 'innovative', 'professional', 'customer-focused'],
        targetAudience: 'Consumers and businesses seeking reliable wireless and internet services',
        keyMessages: ['Network reliability', 'Built right', '5G innovation', 'Trusted service'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#CD040B',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#CD040B', '#000000', '#FFFFFF', '#A30309'],
        fontFamily: 'Neue Haas Grotesk',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '1095 Avenue of the Americas',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10036',
        },
      ],
      personnel: [
        {
          name: 'Hans Vestberg',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/hans-vestberg/',
          isActive: true,
          joinedDate: '2018-08',
        },
        {
          name: 'Matt Ellis',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/matt-ellis-verizon/',
          isActive: true,
          joinedDate: '2016-01',
        },
        {
          name: 'Sowmyanarayan Sampath',
          title: 'CEO, Verizon Business',
          linkedinUrl: 'https://www.linkedin.com/in/sowmyanarayanan-sampath/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Manon Brouillette',
          title: 'CEO, Verizon Consumer Group',
          linkedinUrl: 'https://www.linkedin.com/in/manon-brouillette/',
          isActive: true,
          joinedDate: '2022-01',
        },
        {
          name: 'Kyle Malady',
          title: 'Chief Technology Officer',
          linkedinUrl: 'https://www.linkedin.com/in/kyle-malady/',
          isActive: true,
          joinedDate: '2017-01',
        },
      ],
    },
    {
      name: 'AT&T',
      domain: 'att.com',
      tagline: 'More for your thing. That\'s our thing.',
      description: 'AT&T is a multinational telecommunications conglomerate providing wireless, internet, and media services.',
      logoUrl: 'https://logo.clearbit.com/att.com',
      industry: 'Telecommunications',
      keywords: ['att', 'wireless', 'internet', 'directv'],
      seoKeywords: ['wireless service', 'fiber internet', 'unlimited data', 'mobile plans', 'home internet'],
      geoKeywords: ['att near me', 'att store', 'att fiber'],
      competitors: [
        { name: 'Verizon', url: 'verizon.com', reason: 'Telecom competitor' },
        { name: 'T-Mobile', url: 't-mobile.com', reason: 'Wireless competitor' },
        { name: 'Comcast', url: 'comcast.com', reason: 'Internet/media competitor' },
        { name: 'Charter Spectrum', url: 'spectrum.com', reason: 'Internet service competitor' },
        { name: 'Cricket Wireless', url: 'cricketwireless.com', reason: 'Own prepaid brand' },
      ],
      valuePropositions: ['Nationwide 5G', 'Fiber internet', 'Bundled services', 'Business solutions'],
      socialLinks: {
        twitter: 'https://twitter.com/ATT',
        linkedin: 'https://www.linkedin.com/company/att',
        facebook: 'https://www.facebook.com/ATT',
        instagram: 'https://www.instagram.com/att',
        youtube: 'https://www.youtube.com/user/ATT',
      },
      voice: {
        tone: 'friendly' as const,
        personality: ['approachable', 'innovative', 'customer-centric', 'reliable'],
        targetAudience: 'Consumers and businesses seeking comprehensive telecom solutions',
        keyMessages: ['More for you', 'Innovation', 'Connectivity', 'Trusted service'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#00A8E0',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#00A8E0', '#000000', '#FFFFFF', '#0086B3'],
        fontFamily: 'Aleck Sans',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: 'Whitacre Tower, 208 S. Akard Street',
          city: 'Dallas',
          state: 'TX',
          country: 'USA',
          postalCode: '75202',
        },
      ],
      personnel: [
        {
          name: 'John Stankey',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/john-stankey/',
          isActive: true,
          joinedDate: '2020-07',
        },
        {
          name: 'Pascal Desroches',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/pascal-desroches/',
          isActive: true,
          joinedDate: '2023-02',
        },
        {
          name: 'Jeff McElfresh',
          title: 'CEO, AT&T Communications',
          linkedinUrl: 'https://www.linkedin.com/in/jeff-mcelfresh/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Anne Chow',
          title: 'Former CEO, AT&T Business',
          linkedinUrl: 'https://www.linkedin.com/in/annechow/',
          isActive: false,
          joinedDate: '2019-05',
        },
        {
          name: 'Andre Fuetsch',
          title: 'CTO and President, AT&T Labs',
          linkedinUrl: 'https://www.linkedin.com/in/andre-fuetsch/',
          isActive: true,
          joinedDate: '2018-01',
        },
      ],
    },
    {
      name: 'Mint Mobile',
      domain: 'mintmobile.com',
      tagline: 'Wireless that makes sense',
      description: 'Mint Mobile is an MVNO offering affordable prepaid wireless plans with no contracts.',
      logoUrl: 'https://logo.clearbit.com/mintmobile.com',
      industry: 'Telecommunications',
      keywords: ['mint mobile', 'prepaid', 'mvno', 'affordable wireless'],
      seoKeywords: ['cheap phone plans', 'prepaid wireless', 'no contract phone service', 'affordable mobile', 'budget wireless'],
      geoKeywords: ['mint mobile coverage', 'mint mobile deals', 'cheap wireless plans'],
      competitors: [
        { name: 'Cricket Wireless', url: 'cricketwireless.com', reason: 'Prepaid competitor' },
        { name: 'Visible', url: 'visible.com', reason: 'MVNO competitor' },
        { name: 'Metro by T-Mobile', url: 'metrobyt-mobile.com', reason: 'Prepaid competitor' },
        { name: 'Google Fi', url: 'fi.google.com', reason: 'MVNO competitor' },
        { name: 'US Mobile', url: 'usmobile.com', reason: 'MVNO competitor' },
      ],
      valuePropositions: ['Affordable plans', 'No contracts', 'T-Mobile network', 'Bulk discounts'],
      socialLinks: {
        twitter: 'https://twitter.com/MintMobile',
        linkedin: 'https://www.linkedin.com/company/mint-mobile',
        facebook: 'https://www.facebook.com/mintmobile',
        instagram: 'https://www.instagram.com/mintmobile',
        youtube: 'https://www.youtube.com/c/MintMobile',
      },
      voice: {
        tone: 'witty' as const,
        personality: ['playful', 'transparent', 'value-focused', 'customer-first'],
        targetAudience: 'Budget-conscious mobile users seeking affordable wireless service',
        keyMessages: ['Wireless that makes sense', 'Simple pricing', 'Great value', 'No hidden fees'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#74D1A1',
        secondaryColor: '#FFFFFF',
        accentColor: '#2D2D2D',
        colorPalette: ['#74D1A1', '#FFFFFF', '#2D2D2D', '#5AB884'],
        fontFamily: 'Proxima Nova',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '6080 Center Drive',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          postalCode: '90045',
        },
      ],
      personnel: [
        {
          name: 'Ryan Reynolds',
          title: 'Owner & Creative Director',
          linkedinUrl: 'https://www.linkedin.com/in/ryanreynolds/',
          isActive: true,
          joinedDate: '2019-11',
        },
        {
          name: 'Aron North',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/aron-north/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Rizwan Kassim',
          title: 'Chief Technology Officer',
          linkedinUrl: 'https://www.linkedin.com/in/rizwan-kassim/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'David Glickman',
          title: 'Founder & Ultra Mobile CEO',
          linkedinUrl: 'https://www.linkedin.com/in/david-glickman/',
          isActive: true,
          joinedDate: '2016-01',
        },
        {
          name: 'Jason Gellman',
          title: 'VP of Marketing',
          linkedinUrl: 'https://www.linkedin.com/in/jason-gellman/',
          isActive: true,
          joinedDate: '2018-01',
        },
      ],
    },
    {
      name: 'Cricket Wireless',
      domain: 'cricketwireless.com',
      tagline: 'Something to smile about',
      description: 'Cricket Wireless is an AT&T-owned prepaid wireless service offering affordable nationwide coverage.',
      logoUrl: 'https://logo.clearbit.com/cricketwireless.com',
      industry: 'Telecommunications',
      keywords: ['cricket wireless', 'prepaid', 'no contract', 'affordable'],
      seoKeywords: ['prepaid wireless', 'no contract phone plans', 'affordable mobile service', 'unlimited data plans', 'prepaid phones'],
      geoKeywords: ['cricket wireless near me', 'cricket wireless store', 'cricket wireless coverage'],
      competitors: [
        { name: 'Mint Mobile', url: 'mintmobile.com', reason: 'MVNO competitor' },
        { name: 'Metro by T-Mobile', url: 'metrobyt-mobile.com', reason: 'Prepaid competitor' },
        { name: 'Boost Mobile', url: 'boostmobile.com', reason: 'Prepaid competitor' },
        { name: 'Visible', url: 'visible.com', reason: 'MVNO competitor' },
        { name: 'Google Fi', url: 'fi.google.com', reason: 'MVNO competitor' },
      ],
      valuePropositions: ['No annual contracts', 'Nationwide coverage', 'Affordable plans', 'AT&T network'],
      socialLinks: {
        twitter: 'https://twitter.com/Crick etWireless',
        linkedin: 'https://www.linkedin.com/company/cricket-wireless',
        facebook: 'https://www.facebook.com/cricketwireless',
        instagram: 'https://www.instagram.com/cricketwireless',
        youtube: 'https://www.youtube.com/user/mycricket',
      },
      voice: {
        tone: 'cheerful' as const,
        personality: ['friendly', 'approachable', 'value-oriented', 'simple'],
        targetAudience: 'Budget-conscious consumers seeking prepaid wireless service',
        keyMessages: ['Something to smile about', 'Affordable wireless', 'No surprises', 'Simple plans'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#8CC63F',
        secondaryColor: '#FFFFFF',
        accentColor: '#000000',
        colorPalette: ['#8CC63F', '#FFFFFF', '#000000', '#70A032'],
        fontFamily: 'Helvetica Neue',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '575 Morosgo Drive NE',
          city: 'Atlanta',
          state: 'GA',
          country: 'USA',
          postalCode: '30324',
        },
      ],
      personnel: [
        {
          name: 'John Dwyer',
          title: 'President',
          linkedinUrl: 'https://www.linkedin.com/in/john-dwyer-cricket/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Mike Graziano',
          title: 'VP of Sales',
          linkedinUrl: 'https://www.linkedin.com/in/mike-graziano/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Jennifer VanBuskirk',
          title: 'Chief Marketing Officer',
          linkedinUrl: 'https://www.linkedin.com/in/jennifer-vanbuskirk/',
          isActive: true,
          joinedDate: '2017-01',
        },
        {
          name: 'Tony Mokry',
          title: 'VP of Product',
          linkedinUrl: 'https://www.linkedin.com/in/tony-mokry/',
          isActive: true,
          joinedDate: '2016-01',
        },
        {
          name: 'Chris Sambar',
          title: 'EVP, AT&T Network (parent company)',
          linkedinUrl: 'https://www.linkedin.com/in/chris-sambar/',
          isActive: true,
          joinedDate: '2020-01',
        },
      ],
    },
  ],
  'Energy / Sustainability': [
    {
      name: 'Tesla Energy',
      domain: 'tesla.com',
      tagline: 'Accelerate the world\'s transition to sustainable energy',
      description: 'Tesla Energy provides solar panels, solar roofs, and battery storage solutions for homes and businesses.',
      logoUrl: 'https://logo.clearbit.com/tesla.com',
      industry: 'Energy / Sustainability',
      keywords: ['tesla', 'solar', 'powerwall', 'renewable energy'],
      seoKeywords: ['solar panels', 'home battery', 'solar roof', 'renewable energy', 'energy storage'],
      geoKeywords: ['tesla solar near me', 'tesla powerwall', 'solar installation'],
      competitors: [
        { name: 'Sunrun', url: 'sunrun.com', reason: 'Solar energy competitor' },
        { name: 'Vivint Solar', url: 'vivint.com', reason: 'Solar installation competitor' },
        { name: 'SunPower', url: 'sunpower.com', reason: 'Solar panel competitor' },
        { name: 'LG Chem', url: 'lgchem.com', reason: 'Battery storage competitor' },
        { name: 'Enphase Energy', url: 'enphase.com', reason: 'Solar tech competitor' },
      ],
      valuePropositions: ['Integrated solutions', 'Premium technology', 'Energy independence', 'Sustainable future'],
      socialLinks: {
        twitter: 'https://twitter.com/Tesla',
        linkedin: 'https://www.linkedin.com/company/tesla-motors',
        facebook: 'https://www.facebook.com/TeslaMotorsCorp',
        instagram: 'https://www.instagram.com/teslamotors',
        youtube: 'https://www.youtube.com/user/TeslaMotors',
      },
      voice: {
        tone: 'visionary' as const,
        personality: ['innovative', 'bold', 'mission-driven', 'disruptive'],
        targetAudience: 'Homeowners and businesses committed to sustainable energy',
        keyMessages: ['Sustainable future', 'Energy independence', 'Innovation', 'Clean energy'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#CC0000',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#CC0000', '#000000', '#FFFFFF', '#A30000'],
        fontFamily: 'Gotham',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '1 Tesla Road',
          city: 'Austin',
          state: 'TX',
          country: 'USA',
          postalCode: '78725',
        },
      ],
      personnel: [
        {
          name: 'Elon Musk',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/elonmusk/',
          isActive: true,
          joinedDate: '2008-10',
        },
        {
          name: 'Drew Baglino',
          title: 'SVP, Powertrain & Energy Engineering',
          linkedinUrl: 'https://www.linkedin.com/in/drew-baglino/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'RJ Johnson',
          title: 'VP, Energy Operations',
          linkedinUrl: 'https://www.linkedin.com/in/rj-johnson-tesla/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Martin Viecha',
          title: 'SVP, Investor Relations',
          linkedinUrl: 'https://www.linkedin.com/in/martin-viecha/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Vaibhav Taneja',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/vaibhav-taneja/',
          isActive: true,
          joinedDate: '2017-01',
        },
      ],
    },
    {
      name: 'Sunrun',
      domain: 'sunrun.com',
      tagline: 'Power your home with sunshine',
      description: 'Sunrun is America\'s largest residential solar, battery storage, and energy services company.',
      logoUrl: 'https://logo.clearbit.com/sunrun.com',
      industry: 'Energy / Sustainability',
      keywords: ['sunrun', 'solar', 'home solar', 'battery backup'],
      seoKeywords: ['residential solar', 'solar leasing', 'home battery backup', 'solar financing', 'clean energy'],
      geoKeywords: ['sunrun near me', 'solar panels installation', 'home solar cost'],
      competitors: [
        { name: 'Tesla Energy', url: 'tesla.com', reason: 'Solar and battery competitor' },
        { name: 'Vivint Solar', url: 'vivint.com', reason: 'Residential solar competitor' },
        { name: 'SunPower', url: 'sunpower.com', reason: 'Solar panel competitor' },
        { name: 'Palmetto', url: 'palmetto.com', reason: 'Solar marketplace competitor' },
        { name: 'Momentum Solar', url: 'momentumsolar.com', reason: 'Solar installation competitor' },
      ],
      valuePropositions: ['Flexible financing', 'Battery backup', 'Monitoring app', 'Full-service support'],
      socialLinks: {
        twitter: 'https://twitter.com/Sunrun',
        linkedin: 'https://www.linkedin.com/company/sunrun',
        facebook: 'https://www.facebook.com/Sunrun',
        instagram: 'https://www.instagram.com/sunrun',
        youtube: 'https://www.youtube.com/user/Sunrun',
      },
      voice: {
        tone: 'empowering' as const,
        personality: ['friendly', 'accessible', 'solution-focused', 'customer-centric'],
        targetAudience: 'Homeowners seeking affordable solar and battery storage solutions',
        keyMessages: ['Power your home', 'Energy freedom', 'Affordable solar', 'Reliable service'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#F9A825',
        secondaryColor: '#1B5E20',
        accentColor: '#FFFFFF',
        colorPalette: ['#F9A825', '#1B5E20', '#FFFFFF', '#D68A1C'],
        fontFamily: 'Proxima Nova',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '225 Bush Street, Suite 1400',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94104',
        },
      ],
      personnel: [
        {
          name: 'Mary Powell',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/mary-powell/',
          isActive: true,
          joinedDate: '2021-03',
        },
        {
          name: 'Danny Abajian',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/danny-abajian/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Jeanna Steele',
          title: 'Chief Revenue Officer',
          linkedinUrl: 'https://www.linkedin.com/in/jeanna-steele/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Edward Fenster',
          title: 'Co-Founder & Executive Chairman',
          linkedinUrl: 'https://www.linkedin.com/in/edward-fenster/',
          isActive: true,
          joinedDate: '2007-01',
        },
        {
          name: 'Lynn Jurich',
          title: 'Co-Founder & Former CEO',
          linkedinUrl: 'https://www.linkedin.com/in/lynn-jurich/',
          isActive: true,
          joinedDate: '2007-01',
        },
      ],
    },
    {
      name: 'ChargePoint',
      domain: 'chargepoint.com',
      tagline: 'We\'re fueling the EV revolution',
      description: 'ChargePoint operates the world\'s largest network of electric vehicle charging stations.',
      logoUrl: 'https://logo.clearbit.com/chargepoint.com',
      industry: 'Energy / Sustainability',
      keywords: ['chargepoint', 'ev charging', 'electric vehicle', 'charging station'],
      seoKeywords: ['ev charging network', 'electric vehicle charging', 'charging stations', 'home ev charger', 'commercial charging'],
      geoKeywords: ['chargepoint near me', 'ev charging stations', 'find charger'],
      competitors: [
        { name: 'Tesla Supercharger', url: 'tesla.com', reason: 'EV charging network competitor' },
        { name: 'EVgo', url: 'evgo.com', reason: 'Fast charging competitor' },
        { name: 'Electrify America', url: 'electrifyamerica.com', reason: 'Charging network competitor' },
        { name: 'Blink Charging', url: 'blinkcharging.com', reason: 'EV charging competitor' },
        { name: 'Volta Charging', url: 'voltacharging.com', reason: 'Free charging competitor' },
      ],
      valuePropositions: ['Largest network', 'Smart charging', 'Home and commercial', 'Reliable infrastructure'],
      socialLinks: {
        twitter: 'https://twitter.com/ChargePoint',
        linkedin: 'https://www.linkedin.com/company/chargepoint-network',
        facebook: 'https://www.facebook.com/ChargePoint',
        instagram: 'https://www.instagram.com/chargepointnetwork',
        youtube: 'https://www.youtube.com/user/ChargePoint',
      },
      voice: {
        tone: 'optimistic' as const,
        personality: ['forward-thinking', 'innovative', 'reliable', 'accessible'],
        targetAudience: 'EV drivers, fleet operators, and businesses adopting electric vehicles',
        keyMessages: ['Fueling the future', 'Charging made easy', 'Everywhere you go', 'Sustainable transportation'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#00B140',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#00B140', '#000000', '#FFFFFF', '#008E33'],
        fontFamily: 'Mark Pro',
      },
      benchmarkTier: 'gold' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '254 E Hacienda Avenue',
          city: 'Campbell',
          state: 'CA',
          country: 'USA',
          postalCode: '95008',
        },
      ],
      personnel: [
        {
          name: 'Rick Wilmer',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/rick-wilmer/',
          isActive: true,
          joinedDate: '2021-01',
        },
        {
          name: 'Rex Jackson',
          title: 'Chief Financial Officer',
          linkedinUrl: 'https://www.linkedin.com/in/rex-jackson/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Bill Loewenthal',
          title: 'SVP, Product & Marketing',
          linkedinUrl: 'https://www.linkedin.com/in/bill-loewenthal/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Patrick Hamer',
          title: 'Chief Product Officer',
          linkedinUrl: 'https://www.linkedin.com/in/patrick-hamer/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Pasquale Romano',
          title: 'Founder & Former CEO',
          linkedinUrl: 'https://www.linkedin.com/in/pasquale-romano/',
          isActive: false,
          joinedDate: '2007-01',
        },
      ],
    },
    {
      name: 'Nest',
      domain: 'nest.com',
      tagline: 'Helpful home',
      description: 'Nest, a Google company, creates smart home products including thermostats, cameras, and doorbells.',
      logoUrl: 'https://logo.clearbit.com/nest.com',
      industry: 'Energy / Sustainability',
      keywords: ['nest', 'smart thermostat', 'smart home', 'energy saving'],
      seoKeywords: ['smart thermostat', 'learning thermostat', 'home automation', 'energy efficiency', 'smart home devices'],
      geoKeywords: ['nest thermostat', 'nest near me', 'smart thermostat installation'],
      competitors: [
        { name: 'Ecobee', url: 'ecobee.com', reason: 'Smart thermostat competitor' },
        { name: 'Ring', url: 'ring.com', reason: 'Smart home security competitor' },
        { name: 'Honeywell Home', url: 'honeywellhome.com', reason: 'Smart home competitor' },
        { name: 'Arlo', url: 'arlo.com', reason: 'Smart camera competitor' },
        { name: 'August', url: 'august.com', reason: 'Smart lock competitor' },
      ],
      valuePropositions: ['Energy savings', 'Learning algorithms', 'Home awareness', 'Google integration'],
      socialLinks: {
        twitter: 'https://twitter.com/nest',
        linkedin: 'https://www.linkedin.com/company/nest',
        facebook: 'https://www.facebook.com/nest',
        instagram: 'https://www.instagram.com/nest',
        youtube: 'https://www.youtube.com/user/nest',
      },
      voice: {
        tone: 'helpful' as const,
        personality: ['intelligent', 'user-friendly', 'efficient', 'thoughtful'],
        targetAudience: 'Homeowners seeking smart home automation and energy efficiency',
        keyMessages: ['Helpful home', 'Save energy', 'Learn your routine', 'Peace of mind'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#00A4E4',
        secondaryColor: '#FFFFFF',
        accentColor: '#1A1A1A',
        colorPalette: ['#00A4E4', '#FFFFFF', '#1A1A1A', '#0083B6'],
        fontFamily: 'Google Sans',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '3400 Hillview Avenue',
          city: 'Palo Alto',
          state: 'CA',
          country: 'USA',
          postalCode: '94304',
        },
      ],
      personnel: [
        {
          name: 'Rishi Chandra',
          title: 'VP & GM, Nest',
          linkedinUrl: 'https://www.linkedin.com/in/rishichandra/',
          isActive: true,
          joinedDate: '2019-01',
        },
        {
          name: 'Michele Turner',
          title: 'VP of Product Management',
          linkedinUrl: 'https://www.linkedin.com/in/michele-turner/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Yoky Matsuoka',
          title: 'Former CTO',
          linkedinUrl: 'https://www.linkedin.com/in/yokymatsuoka/',
          isActive: false,
          joinedDate: '2016-01',
        },
        {
          name: 'Tony Fadell',
          title: 'Founder',
          linkedinUrl: 'https://www.linkedin.com/in/tfadell/',
          isActive: false,
          joinedDate: '2010-01',
        },
        {
          name: 'Matt Rogers',
          title: 'Co-Founder',
          linkedinUrl: 'https://www.linkedin.com/in/mattrogers/',
          isActive: false,
          joinedDate: '2010-01',
        },
      ],
    },
    {
      name: 'Ecobee',
      domain: 'ecobee.com',
      tagline: 'Make your home smarter and more comfortable',
      description: 'Ecobee makes smart thermostats, sensors, and cameras for energy-efficient and comfortable homes.',
      logoUrl: 'https://logo.clearbit.com/ecobee.com',
      industry: 'Energy / Sustainability',
      keywords: ['ecobee', 'smart thermostat', 'energy efficiency', 'smart home'],
      seoKeywords: ['smart thermostat', 'energy saving thermostat', 'wifi thermostat', 'room sensors', 'home comfort'],
      geoKeywords: ['ecobee thermostat', 'ecobee near me', 'smart thermostat installation'],
      competitors: [
        { name: 'Nest', url: 'nest.com', reason: 'Smart thermostat competitor' },
        { name: 'Honeywell Home', url: 'honeywellhome.com', reason: 'Thermostat competitor' },
        { name: 'Emerson Sensi', url: 'emerson.com', reason: 'Smart thermostat competitor' },
        { name: 'Lux Kono', url: 'luxproducts.com', reason: 'Smart thermostat competitor' },
        { name: 'Johnson Controls', url: 'johnsoncontrols.com', reason: 'HVAC controls competitor' },
      ],
      valuePropositions: ['Room sensors', 'Energy reports', 'Voice control', 'Comfort optimization'],
      socialLinks: {
        twitter: 'https://twitter.com/ecobee',
        linkedin: 'https://www.linkedin.com/company/ecobee',
        facebook: 'https://www.facebook.com/ecobee',
        instagram: 'https://www.instagram.com/ecobee',
        youtube: 'https://www.youtube.com/user/ecobee',
      },
      voice: {
        tone: 'friendly' as const,
        personality: ['approachable', 'innovative', 'efficient', 'customer-focused'],
        targetAudience: 'Homeowners prioritizing comfort and energy efficiency',
        keyMessages: ['Smart comfort', 'Energy savings', 'Room-by-room control', 'Always getting smarter'],
        avoidTopics: [],
      },
      visual: {
        primaryColor: '#6ECB63',
        secondaryColor: '#000000',
        accentColor: '#FFFFFF',
        colorPalette: ['#6ECB63', '#000000', '#FFFFFF', '#58A34F'],
        fontFamily: 'Proxima Nova',
      },
      benchmarkTier: 'silver' as const,
      locations: [
        {
          type: 'headquarters' as const,
          address: '25 Dockside Drive',
          city: 'Toronto',
          state: 'ON',
          country: 'Canada',
          postalCode: 'M5A 0B5',
        },
      ],
      personnel: [
        {
          name: 'Greg Fyke',
          title: 'CEO',
          linkedinUrl: 'https://www.linkedin.com/in/greg-fyke/',
          isActive: true,
          joinedDate: '2020-01',
        },
        {
          name: 'Stuart Lombard',
          title: 'Founder & Former CEO',
          linkedinUrl: 'https://www.linkedin.com/in/stuart-lombard/',
          isActive: true,
          joinedDate: '2007-01',
        },
        {
          name: 'David Jiang',
          title: 'VP of Engineering',
          linkedinUrl: 'https://www.linkedin.com/in/david-jiang-ecobee/',
          isActive: true,
          joinedDate: '2018-01',
        },
        {
          name: 'Lindsay Stead',
          title: 'VP of Marketing',
          linkedinUrl: 'https://www.linkedin.com/in/lindsay-stead/',
          isActive: true,
          joinedDate: '2017-01',
        },
        {
          name: 'Carly Deacon',
          title: 'Chief People Officer',
          linkedinUrl: 'https://www.linkedin.com/in/carly-deacon/',
          isActive: true,
          joinedDate: '2019-01',
        },
      ],
    },
  ],
};

async function main() {
  console.log('Starting benchmark brands population (Part 4b: Telecommunications + Energy/Sustainability)...\n');

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
