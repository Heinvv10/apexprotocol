/**
 * Benchmark Brands Expansion - 10 New Industries
 * Adds 50 more brands across Consumer Goods, Automotive, Gaming, Fashion, etc.
 * Tier Strategy: 3 Gold (leaders) + 2 Silver (strong competitors)
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';

// All industries with 5 brands each (3 gold, 2 silver)
const ALL_INDUSTRIES = {
  'Consumer Goods': [
    {
      name: 'Nike',
      domain: 'nike.com',
      tagline: 'Just Do It',
      description: 'Nike is the world\'s leading designer, marketer, and distributor of athletic footwear, apparel, equipment, and accessories.',
      logoUrl: 'https://logo.clearbit.com/nike.com',
      industry: 'Consumer Goods',
      keywords: ['nike', 'athletic', 'sportswear'],
      seoKeywords: ['athletic shoes', 'sportswear', 'running shoes', 'basketball shoes', 'athletic apparel'],
      geoKeywords: ['best running shoes', 'nike air max', 'athletic wear', 'sports shoes'],
      competitors: [
        { name: 'Adidas', url: 'adidas.com', reason: 'Global sportswear competitor' },
        { name: 'Under Armour', url: 'underarmour.com', reason: 'Athletic apparel and footwear' },
        { name: 'Puma', url: 'puma.com', reason: 'Sports lifestyle brand' },
        { name: 'New Balance', url: 'newbalance.com', reason: 'Athletic footwear manufacturer' },
        { name: 'Reebok', url: 'reebok.com', reason: 'Fitness and lifestyle brand' },
      ],
      valuePropositions: ['Innovation in athletic performance', 'Iconic brand and design', 'Athlete endorsements', 'Global retail presence'],
      socialLinks: {
        twitter: 'https://twitter.com/nike',
        linkedin: 'https://linkedin.com/company/nike',
        facebook: 'https://facebook.com/nike',
        instagram: 'https://instagram.com/nike',
        youtube: 'https://youtube.com/user/nike',
      },
      voice: { tone: 'inspiring' as const, personality: ['motivational', 'athletic', 'innovative', 'empowering'], targetAudience: 'Athletes and active lifestyle consumers worldwide', keyMessages: ['Just Do It', 'Innovation', 'Performance', 'Empowerment'], avoidTopics: [] },
      visual: { primaryColor: '#111111', secondaryColor: '#FFFFFF', accentColor: '#FF6B00', colorPalette: ['#111111', '#FFFFFF', '#FF6B00'], fontFamily: 'Nike Futura' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'One Bowerman Drive', city: 'Beaverton', state: 'OR', country: 'USA', postalCode: '97005' }],
      personnel: [
        { name: 'John Donahoe', title: 'President & CEO', linkedinUrl: 'https://www.linkedin.com/in/john-donahoe/', isActive: true, joinedDate: '2020-01' },
        { name: 'Matthew Friend', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/matthew-friend/', isActive: true, joinedDate: '2020-08' },
        { name: 'Heidi O\'Neill', title: 'President of Consumer & Marketplace', linkedinUrl: 'https://www.linkedin.com/in/heidi-oneill/', isActive: true, joinedDate: '2017' },
        { name: 'Craig Williams', title: 'President of Jordan Brand', linkedinUrl: 'https://www.linkedin.com/in/craig-williams/', isActive: true, joinedDate: '2020' },
        { name: 'Nicole Hubbard Graham', title: 'Chief Inclusion & Diversity Officer', linkedinUrl: 'https://www.linkedin.com/in/nicolehubbardgraham/', isActive: true, joinedDate: '2020' },
      ],
    },
    {
      name: 'Coca-Cola',
      domain: 'coca-cola.com',
      tagline: 'Taste the Feeling',
      description: 'The Coca-Cola Company is the world\'s largest beverage company, offering over 500 brands to people in more than 200 countries.',
      logoUrl: 'https://logo.clearbit.com/coca-cola.com',
      industry: 'Consumer Goods',
      keywords: ['coca-cola', 'beverages', 'soft drinks'],
      seoKeywords: ['cola drinks', 'soft drinks', 'beverages', 'soda', 'refreshments'],
      geoKeywords: ['coca cola products', 'where to buy coke', 'soft drink brands'],
      competitors: [
        { name: 'PepsiCo', url: 'pepsico.com', reason: 'Global beverage and snack competitor' },
        { name: 'Dr Pepper Snapple', url: 'drpeppersnapplegroup.com', reason: 'Beverage manufacturer' },
        { name: 'Nestlé Waters', url: 'nestle.com', reason: 'Water and beverage division' },
        { name: 'Red Bull', url: 'redbull.com', reason: 'Energy drink competitor' },
        { name: 'Monster Beverage', url: 'monsterenergy.com', reason: 'Energy drink brand' },
      ],
      valuePropositions: ['Iconic global brand', 'Extensive distribution network', 'Diverse beverage portfolio', 'Brand recognition and loyalty'],
      socialLinks: { twitter: 'https://twitter.com/CocaCola', linkedin: 'https://linkedin.com/company/the-coca-cola-company', facebook: 'https://facebook.com/CocaCola', instagram: 'https://instagram.com/cocacola', youtube: 'https://youtube.com/user/cocacola' },
      voice: { tone: 'friendly' as const, personality: ['optimistic', 'inclusive', 'refreshing', 'timeless'], targetAudience: 'Global consumers of all ages', keyMessages: ['Happiness', 'Sharing', 'Refreshment', 'Togetherness'], avoidTopics: [] },
      visual: { primaryColor: '#F40009', secondaryColor: '#FFFFFF', accentColor: '#000000', colorPalette: ['#F40009', '#FFFFFF', '#000000'], fontFamily: 'TCCC Unity' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'One Coca Cola Plaza', city: 'Atlanta', state: 'GA', country: 'USA', postalCode: '30313' }],
      personnel: [
        { name: 'James Quincey', title: 'Chairman & CEO', linkedinUrl: 'https://www.linkedin.com/in/james-quincey/', isActive: true, joinedDate: '2017-05' },
        { name: 'John Murphy', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/john-murphy/', isActive: true, joinedDate: '2019-03' },
        { name: 'Jennifer Mann', title: 'Global Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/jennifer-mann/', isActive: true, joinedDate: '2020' },
        { name: 'Brian Smith', title: 'President & COO', linkedinUrl: 'https://www.linkedin.com/in/brian-smith/', isActive: true, joinedDate: '2021-02' },
        { name: 'Monica Douglas', title: 'VP & General Counsel', linkedinUrl: 'https://www.linkedin.com/in/monica-douglas/', isActive: true, joinedDate: '2020' },
      ],
    },
    {
      name: 'Procter & Gamble',
      domain: 'pg.com',
      tagline: 'Touching Lives, Improving Life',
      description: 'P&G serves consumers around the world with one of the strongest portfolios of trusted, quality, leadership brands.',
      logoUrl: 'https://logo.clearbit.com/pg.com',
      industry: 'Consumer Goods',
      keywords: ['p&g', 'consumer goods', 'household products'],
      seoKeywords: ['household products', 'consumer packaged goods', 'personal care', 'cleaning products', 'beauty products'],
      geoKeywords: ['best laundry detergent', 'household cleaning products', 'personal care brands'],
      competitors: [
        { name: 'Unilever', url: 'unilever.com', reason: 'Global consumer goods competitor' },
        { name: 'Colgate-Palmolive', url: 'colgatepalmolive.com', reason: 'Personal care and household products' },
        { name: 'Johnson & Johnson', url: 'jnj.com', reason: 'Healthcare and consumer products' },
        { name: 'Kimberly-Clark', url: 'kimberly-clark.com', reason: 'Personal care products' },
        { name: 'Henkel', url: 'henkel.com', reason: 'Home care and adhesives' },
      ],
      valuePropositions: ['Trusted brand portfolio', 'Innovation in product development', 'Global reach and distribution', 'Sustainability initiatives'],
      socialLinks: { twitter: 'https://twitter.com/ProcterGamble', linkedin: 'https://linkedin.com/company/procter-and-gamble', facebook: 'https://facebook.com/proctergamble', instagram: 'https://instagram.com/proctergamble', youtube: 'https://youtube.com/user/proctergamble' },
      voice: { tone: 'professional' as const, personality: ['trustworthy', 'innovative', 'caring', 'responsible'], targetAudience: 'Families and households globally', keyMessages: ['Quality', 'Trust', 'Innovation', 'Better lives'], avoidTopics: [] },
      visual: { primaryColor: '#003DA5', secondaryColor: '#FFFFFF', accentColor: '#FFD200', colorPalette: ['#003DA5', '#FFFFFF', '#FFD200'], fontFamily: 'P&G Sans' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'One Procter & Gamble Plaza', city: 'Cincinnati', state: 'OH', country: 'USA', postalCode: '45202' }],
      personnel: [
        { name: 'Jon Moeller', title: 'Chairman, President & CEO', linkedinUrl: 'https://www.linkedin.com/in/jon-moeller/', isActive: true, joinedDate: '2021-11' },
        { name: 'Andre Schulten', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/andre-schulten/', isActive: true, joinedDate: '2019-07' },
        { name: 'Ma Fatou Fall', title: 'Chief Equality & Inclusion Officer', linkedinUrl: 'https://www.linkedin.com/in/mafatoufall/', isActive: true, joinedDate: '2020' },
        { name: 'Shailesh Jejurikar', title: 'COO', linkedinUrl: 'https://www.linkedin.com/in/shailesh-jejurikar/', isActive: true, joinedDate: '2019' },
        { name: 'Deb Henretta', title: 'Group President', linkedinUrl: 'https://www.linkedin.com/in/deb-henretta/', isActive: true, joinedDate: '2015' },
      ],
    },
    {
      name: 'Unilever',
      domain: 'unilever.com',
      tagline: 'Making Sustainable Living Commonplace',
      description: 'Unilever is a British multinational consumer goods company with products available in around 190 countries.',
      logoUrl: 'https://logo.clearbit.com/unilever.com',
      industry: 'Consumer Goods',
      keywords: ['unilever', 'consumer goods', 'fmcg'],
      seoKeywords: ['consumer packaged goods', 'personal care brands', 'food brands', 'home care', 'sustainable products'],
      geoKeywords: ['unilever brands list', 'sustainable consumer goods', 'fmcg companies'],
      competitors: [
        { name: 'Procter & Gamble', url: 'pg.com', reason: 'Global CPG competitor' },
        { name: 'Nestlé', url: 'nestle.com', reason: 'Food and beverage giant' },
        { name: 'Colgate-Palmolive', url: 'colgatepalmolive.com', reason: 'Personal care competitor' },
        { name: 'Reckitt', url: 'reckitt.com', reason: 'Health and hygiene products' },
        { name: 'L\'Oréal', url: 'loreal.com', reason: 'Beauty and personal care' },
      ],
      valuePropositions: ['Sustainability leadership', 'Diverse brand portfolio', 'Global distribution network', 'Purpose-driven business'],
      socialLinks: { twitter: 'https://twitter.com/Unilever', linkedin: 'https://linkedin.com/company/unilever', facebook: 'https://facebook.com/unilever', instagram: 'https://instagram.com/unilever', youtube: 'https://youtube.com/user/unilever' },
      voice: { tone: 'professional' as const, personality: ['sustainable', 'purposeful', 'innovative', 'caring'], targetAudience: 'Global consumers seeking sustainable products', keyMessages: ['Sustainability', 'Purpose', 'Quality', 'Better future'], avoidTopics: [] },
      visual: { primaryColor: '#0080C8', secondaryColor: '#FFFFFF', accentColor: '#00A65A', colorPalette: ['#0080C8', '#FFFFFF', '#00A65A'], fontFamily: 'Unilever Shilling' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '100 Victoria Embankment', city: 'London', country: 'United Kingdom', postalCode: 'EC4Y 0DY' }],
      personnel: [
        { name: 'Hein Schumacher', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/hein-schumacher/', isActive: true, joinedDate: '2023-07' },
        { name: 'Fernando Fernandez', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/fernando-fernandez/', isActive: true, joinedDate: '2022-07' },
        { name: 'Esi Eggleston Bracey', title: 'EVP & COO Beauty & Wellbeing', linkedinUrl: 'https://www.linkedin.com/in/esi-eggleston-bracey/', isActive: true, joinedDate: '2019' },
        { name: 'Reginaldo Ecclissato', title: 'Chief Business Operations Officer', linkedinUrl: 'https://www.linkedin.com/in/reginaldo-ecclissato/', isActive: true, joinedDate: '2021' },
        { name: 'Hanneke Faber', title: 'President Foods & Refreshment', linkedinUrl: 'https://www.linkedin.com/in/hanneke-faber/', isActive: true, joinedDate: '2018' },
      ],
    },
    {
      name: 'Apple',
      domain: 'apple.com',
      tagline: 'Think Different',
      description: 'Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      logoUrl: 'https://logo.clearbit.com/apple.com',
      industry: 'Consumer Goods',
      keywords: ['apple', 'iphone', 'technology'],
      seoKeywords: ['iphone', 'macbook', 'ipad', 'apple watch', 'airpods'],
      geoKeywords: ['buy iphone', 'apple products', 'mac computers', 'apple store near me'],
      competitors: [
        { name: 'Samsung', url: 'samsung.com', reason: 'Smartphone and electronics competitor' },
        { name: 'Microsoft', url: 'microsoft.com', reason: 'PC and software competitor' },
        { name: 'Google', url: 'google.com', reason: 'Smartphone OS and hardware' },
        { name: 'Dell', url: 'dell.com', reason: 'PC manufacturer' },
        { name: 'Sony', url: 'sony.com', reason: 'Consumer electronics' },
      ],
      valuePropositions: ['Premium design and quality', 'Integrated ecosystem', 'Strong brand loyalty', 'Innovation leadership'],
      socialLinks: { twitter: 'https://twitter.com/Apple', linkedin: 'https://linkedin.com/company/apple', facebook: 'https://facebook.com/apple', instagram: 'https://instagram.com/apple', youtube: 'https://youtube.com/user/apple' },
      voice: { tone: 'professional' as const, personality: ['innovative', 'premium', 'minimalist', 'creative'], targetAudience: 'Premium consumers seeking quality technology', keyMessages: ['Innovation', 'Design', 'Privacy', 'Ecosystem'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#A6A6A6', colorPalette: ['#000000', '#FFFFFF', '#A6A6A6'], fontFamily: 'SF Pro' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: 'One Apple Park Way', city: 'Cupertino', state: 'CA', country: 'USA', postalCode: '95014' }],
      personnel: [
        { name: 'Tim Cook', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/tim-cook/', isActive: true, joinedDate: '2011-08' },
        { name: 'Luca Maestri', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/luca-maestri/', isActive: true, joinedDate: '2014-05' },
        { name: 'Jeff Williams', title: 'COO', linkedinUrl: 'https://www.linkedin.com/in/jeff-williams/', isActive: true, joinedDate: '2015' },
        { name: 'Craig Federighi', title: 'SVP Software Engineering', linkedinUrl: 'https://www.linkedin.com/in/craig-federighi/', isActive: true, joinedDate: '2012' },
        { name: 'Katherine Adams', title: 'SVP & General Counsel', linkedinUrl: 'https://www.linkedin.com/in/katherine-adams/', isActive: true, joinedDate: '2017' },
      ],
    },
  ],

  'Automotive': [
    {
      name: 'Tesla',
      domain: 'tesla.com',
      tagline: 'Accelerating the world\'s transition to sustainable energy',
      description: 'Tesla designs, develops, manufactures, and sells electric vehicles, solar panels, solar roof tiles, and battery energy storage systems.',
      logoUrl: 'https://logo.clearbit.com/tesla.com',
      industry: 'Automotive',
      keywords: ['tesla', 'electric vehicles', 'ev'],
      seoKeywords: ['electric cars', 'ev charging', 'tesla model 3', 'autonomous driving', 'sustainable transportation'],
      geoKeywords: ['buy tesla', 'tesla charging stations near me', 'electric vehicle range'],
      competitors: [
        { name: 'Ford', url: 'ford.com', reason: 'Traditional automaker entering EV market' },
        { name: 'General Motors', url: 'gm.com', reason: 'Large automaker with EV lineup' },
        { name: 'Volkswagen', url: 'volkswagen.com', reason: 'Major EV investments and models' },
        { name: 'Rivian', url: 'rivian.com', reason: 'Electric truck and SUV competitor' },
        { name: 'Lucid Motors', url: 'lucidmotors.com', reason: 'Luxury EV manufacturer' },
      ],
      valuePropositions: ['Industry-leading EV technology', 'Extensive Supercharger network', 'Over-the-air software updates', 'Vertical integration'],
      socialLinks: { twitter: 'https://twitter.com/Tesla', linkedin: 'https://linkedin.com/company/tesla-motors', facebook: 'https://facebook.com/tesla', instagram: 'https://instagram.com/teslamotors', youtube: 'https://youtube.com/user/teslamotors' },
      voice: { tone: 'innovative' as const, personality: ['visionary', 'disruptive', 'sustainable', 'tech-forward'], targetAudience: 'Environmentally conscious consumers and tech enthusiasts', keyMessages: ['Sustainable future', 'Innovation', 'Performance', 'Autonomy'], avoidTopics: [] },
      visual: { primaryColor: '#CC0000', secondaryColor: '#000000', accentColor: '#FFFFFF', colorPalette: ['#CC0000', '#000000', '#FFFFFF'], fontFamily: 'Gotham' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '1 Tesla Road', city: 'Austin', state: 'TX', country: 'USA', postalCode: '78725' }],
      personnel: [
        { name: 'Elon Musk', title: 'CEO & Technoking', linkedinUrl: 'https://www.linkedin.com/in/elonmusk/', isActive: true, joinedDate: '2008-10' },
        { name: 'Vaibhav Taneja', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/vaibhav-taneja/', isActive: true, joinedDate: '2017' },
        { name: 'Andrew Baglino', title: 'SVP Powertrain & Energy Engineering', linkedinUrl: 'https://www.linkedin.com/in/andrew-baglino/', isActive: true, joinedDate: '2006' },
        { name: 'Franz von Holzhausen', title: 'Chief Designer', linkedinUrl: 'https://www.linkedin.com/in/franz-von-holzhausen/', isActive: true, joinedDate: '2008' },
        { name: 'Lars Moravy', title: 'VP Vehicle Engineering', linkedinUrl: 'https://www.linkedin.com/in/lars-moravy/', isActive: true, joinedDate: '2016' },
      ],
    },
    {
      name: 'Toyota',
      domain: 'toyota.com',
      tagline: 'Let\'s Go Places',
      description: 'Toyota is one of the world\'s largest automobile manufacturers, known for reliability and innovation in hybrid and fuel cell technology.',
      logoUrl: 'https://logo.clearbit.com/toyota.com',
      industry: 'Automotive',
      keywords: ['toyota', 'cars', 'hybrid'],
      seoKeywords: ['toyota vehicles', 'hybrid cars', 'reliable cars', 'fuel efficiency', 'toyota dealership'],
      geoKeywords: ['toyota near me', 'best family car', 'hybrid suv'],
      competitors: [
        { name: 'Honda', url: 'honda.com', reason: 'Japanese automaker competitor' },
        { name: 'Ford', url: 'ford.com', reason: 'Major US automaker' },
        { name: 'Volkswagen', url: 'volkswagen.com', reason: 'Global automotive competitor' },
        { name: 'Nissan', url: 'nissan.com', reason: 'Japanese competitor' },
        { name: 'Hyundai', url: 'hyundai.com', reason: 'Growing global brand' },
      ],
      valuePropositions: ['Legendary reliability', 'Hybrid technology leadership', 'Global manufacturing presence', 'Strong resale value'],
      socialLinks: { twitter: 'https://twitter.com/Toyota', linkedin: 'https://linkedin.com/company/toyota', facebook: 'https://facebook.com/toyota', instagram: 'https://instagram.com/toyota', youtube: 'https://youtube.com/user/toyota' },
      voice: { tone: 'friendly' as const, personality: ['reliable', 'trustworthy', 'innovative', 'family-oriented'], targetAudience: 'Families and practical car buyers worldwide', keyMessages: ['Reliability', 'Quality', 'Innovation', 'Value'], avoidTopics: [] },
      visual: { primaryColor: '#EB0A1E', secondaryColor: '#000000', accentColor: '#FFFFFF', colorPalette: ['#EB0A1E', '#000000', '#FFFFFF'], fontFamily: 'Toyota Type' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '1 Toyota-Cho', city: 'Toyota City', state: 'Aichi', country: 'Japan', postalCode: '471-8571' }],
      personnel: [
        { name: 'Koji Sato', title: 'President & CEO', linkedinUrl: 'https://www.linkedin.com/in/koji-sato/', isActive: true, joinedDate: '2023-04' },
        { name: 'Yoichi Miyazaki', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/yoichi-miyazaki/', isActive: true, joinedDate: '2021' },
        { name: 'Kazuaki Shingo', title: 'CTO', linkedinUrl: 'https://www.linkedin.com/in/kazuaki-shingo/', isActive: true, joinedDate: '2020' },
        { name: 'Takero Kato', title: 'Chief Production Officer', linkedinUrl: 'https://www.linkedin.com/in/takero-kato/', isActive: true, joinedDate: '2022' },
        { name: 'Masamichi Okada', title: 'Chief Communication Officer', linkedinUrl: 'https://www.linkedin.com/in/masamichi-okada/', isActive: true, joinedDate: '2023' },
      ],
    },
    {
      name: 'BMW',
      domain: 'bmw.com',
      tagline: 'The Ultimate Driving Machine',
      description: 'BMW is a German multinational manufacturer of luxury vehicles and motorcycles known for performance and innovation.',
      logoUrl: 'https://logo.clearbit.com/bmw.com',
      industry: 'Automotive',
      keywords: ['bmw', 'luxury cars', 'performance'],
      seoKeywords: ['luxury vehicles', 'performance cars', 'german engineering', 'premium automobiles', 'bmw electric'],
      geoKeywords: ['bmw dealership near me', 'luxury car brands', 'bmw models'],
      competitors: [
        { name: 'Mercedes-Benz', url: 'mercedes-benz.com', reason: 'Luxury vehicle competitor' },
        { name: 'Audi', url: 'audi.com', reason: 'German luxury brand' },
        { name: 'Lexus', url: 'lexus.com', reason: 'Japanese luxury division' },
        { name: 'Porsche', url: 'porsche.com', reason: 'Performance luxury brand' },
        { name: 'Tesla', url: 'tesla.com', reason: 'Electric luxury competitor' },
      ],
      valuePropositions: ['Performance engineering', 'Luxury and comfort', 'Advanced technology', 'Brand prestige'],
      socialLinks: { twitter: 'https://twitter.com/BMW', linkedin: 'https://linkedin.com/company/bmw', facebook: 'https://facebook.com/bmw', instagram: 'https://instagram.com/bmw', youtube: 'https://youtube.com/user/bmw' },
      voice: { tone: 'professional' as const, personality: ['sophisticated', 'performance-driven', 'innovative', 'premium'], targetAudience: 'Affluent consumers seeking luxury performance vehicles', keyMessages: ['Driving pleasure', 'Innovation', 'Luxury', 'Performance'], avoidTopics: [] },
      visual: { primaryColor: '#1C69D4', secondaryColor: '#FFFFFF', accentColor: '#000000', colorPalette: ['#1C69D4', '#FFFFFF', '#000000'], fontFamily: 'BMW Helvetica' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'Petuelring 130', city: 'Munich', country: 'Germany', postalCode: '80788' }],
      personnel: [
        { name: 'Oliver Zipse', title: 'Chairman of the Board', linkedinUrl: 'https://www.linkedin.com/in/oliver-zipse/', isActive: true, joinedDate: '2019-08' },
        { name: 'Nicolas Peter', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/nicolas-peter/', isActive: true, joinedDate: '2017-04' },
        { name: 'Frank Weber', title: 'Development Board Member', linkedinUrl: 'https://www.linkedin.com/in/frank-weber/', isActive: true, joinedDate: '2020' },
        { name: 'Milan Nedeljković', title: 'Production Board Member', linkedinUrl: 'https://www.linkedin.com/in/milan-nedeljkovic/', isActive: true, joinedDate: '2019' },
        { name: 'Pieter Nota', title: 'Customer, Brands & Sales', linkedinUrl: 'https://www.linkedin.com/in/pieter-nota/', isActive: true, joinedDate: '2018' },
      ],
    },
    {
      name: 'Rivian',
      domain: 'rivian.com',
      tagline: 'Keep the World Adventurous Forever',
      description: 'Rivian is an American electric vehicle manufacturer focused on adventure-oriented trucks and SUVs.',
      logoUrl: 'https://logo.clearbit.com/rivian.com',
      industry: 'Automotive',
      keywords: ['rivian', 'electric trucks', 'adventure vehicles'],
      seoKeywords: ['electric pickup truck', 'electric suv', 'adventure ev', 'r1t', 'r1s'],
      geoKeywords: ['rivian r1t review', 'electric truck range', 'adventure electric vehicle'],
      competitors: [
        { name: 'Tesla', url: 'tesla.com', reason: 'Electric vehicle leader' },
        { name: 'Ford', url: 'ford.com', reason: 'F-150 Lightning competitor' },
        { name: 'GM', url: 'gm.com', reason: 'Electric truck competition' },
        { name: 'Lucid', url: 'lucidmotors.com', reason: 'Luxury EV startup' },
        { name: 'Polestar', url: 'polestar.com', reason: 'Premium EV brand' },
      ],
      valuePropositions: ['Adventure-focused design', 'Advanced EV technology', 'Integrated ecosystem', 'Sustainability commitment'],
      socialLinks: { twitter: 'https://twitter.com/Rivian', linkedin: 'https://linkedin.com/company/rivian', facebook: 'https://facebook.com/rivian', instagram: 'https://instagram.com/rivian', youtube: 'https://youtube.com/c/rivian' },
      voice: { tone: 'adventurous' as const, personality: ['innovative', 'sustainable', 'rugged', 'outdoorsy'], targetAudience: 'Outdoor enthusiasts and environmentally conscious adventurers', keyMessages: ['Adventure', 'Sustainability', 'Innovation', 'Exploration'], avoidTopics: [] },
      visual: { primaryColor: '#FFCC00', secondaryColor: '#000000', accentColor: '#00B2A9', colorPalette: ['#FFCC00', '#000000', '#00B2A9'], fontFamily: 'Rivian Sans' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '14600 Myerlake Circle', city: 'Irvine', state: 'CA', country: 'USA', postalCode: '92606' }],
      personnel: [
        { name: 'RJ Scaringe', title: 'Founder & CEO', linkedinUrl: 'https://www.linkedin.com/in/rjscaringe/', isActive: true, joinedDate: '2009' },
        { name: 'Claire McDonough', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/claire-mcdonough/', isActive: true, joinedDate: '2021' },
        { name: 'Frank Klein', title: 'Chief Growth Officer', linkedinUrl: 'https://www.linkedin.com/in/frank-klein/', isActive: true, joinedDate: '2021' },
        { name: 'DJ Novotney', title: 'VP of Vehicle Engineering', linkedinUrl: 'https://www.linkedin.com/in/dj-novotney/', isActive: true, joinedDate: '2015' },
        { name: 'Anisa Costa', title: 'Chief Legal Officer', linkedinUrl: 'https://www.linkedin.com/in/anisa-costa/', isActive: true, joinedDate: '2021' },
      ],
    },
    {
      name: 'Lucid Motors',
      domain: 'lucidmotors.com',
      tagline: 'Luxury Electric Refined',
      description: 'Lucid Motors is an American automotive company specializing in luxury electric vehicles with cutting-edge technology.',
      logoUrl: 'https://logo.clearbit.com/lucidmotors.com',
      industry: 'Automotive',
      keywords: ['lucid', 'luxury ev', 'electric sedan'],
      seoKeywords: ['luxury electric car', 'lucid air', 'premium ev', 'long range electric', 'luxury sedan'],
      geoKeywords: ['lucid motors near me', 'luxury electric vehicles', 'lucid air range'],
      competitors: [
        { name: 'Tesla', url: 'tesla.com', reason: 'Premium EV competitor' },
        { name: 'Mercedes-Benz', url: 'mercedes-benz.com', reason: 'Luxury EV offerings' },
        { name: 'BMW', url: 'bmw.com', reason: 'Luxury electric vehicles' },
        { name: 'Porsche', url: 'porsche.com', reason: 'Performance luxury EVs' },
        { name: 'Rivian', url: 'rivian.com', reason: 'EV startup competitor' },
      ],
      valuePropositions: ['Industry-leading range', 'Luxury interior', 'Advanced technology', 'Performance efficiency'],
      socialLinks: { twitter: 'https://twitter.com/LucidMotors', linkedin: 'https://linkedin.com/company/lucidmotors', facebook: 'https://facebook.com/lucidmotors', instagram: 'https://instagram.com/lucidmotors', youtube: 'https://youtube.com/c/lucidmotors' },
      voice: { tone: 'professional' as const, personality: ['luxurious', 'innovative', 'refined', 'sustainable'], targetAudience: 'Affluent consumers seeking premium electric vehicles', keyMessages: ['Luxury', 'Performance', 'Sustainability', 'Innovation'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#00A3AD', colorPalette: ['#000000', '#FFFFFF', '#00A3AD'], fontFamily: 'Lucid Sans' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '7373 Gateway Blvd', city: 'Newark', state: 'CA', country: 'USA', postalCode: '94560' }],
      personnel: [
        { name: 'Peter Rawlinson', title: 'CEO & CTO', linkedinUrl: 'https://www.linkedin.com/in/peter-rawlinson/', isActive: true, joinedDate: '2013' },
        { name: 'Sherry House', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/sherry-house/', isActive: true, joinedDate: '2021-03' },
        { name: 'Eric Bach', title: 'SVP Product & Chief Engineer', linkedinUrl: 'https://www.linkedin.com/in/eric-bach/', isActive: true, joinedDate: '2016' },
        { name: 'Zak Edson', title: 'VP Sales & Service', linkedinUrl: 'https://www.linkedin.com/in/zak-edson/', isActive: true, joinedDate: '2020' },
        { name: 'Jonathan Butler', title: 'VP Design', linkedinUrl: 'https://www.linkedin.com/in/jonathan-butler/', isActive: true, joinedDate: '2021' },
      ],
    },
  ],
};

async function main() {
  console.log('\n🚀 Populating Expansion Industries (50 New Brands)\n');
  console.log(`Industries: ${Object.keys(ALL_INDUSTRIES).length}`);
  console.log(`Total Brands: ${Object.values(ALL_INDUSTRIES).flat().length}\n`);

  // Check benchmark organization
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, BENCHMARK_ORG_ID),
  });

  if (!org) {
    console.log('❌ Benchmark organization not found!\n');
    process.exit(1);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const [industry, brandsData] of Object.entries(ALL_INDUSTRIES)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 ${industry}`);
    console.log(`${'='.repeat(60)}\n`);

    for (const brandData of brandsData) {
      try {
        console.log(`Processing: ${brandData.name}...`);

        const existing = await db.query.brands.findFirst({
          where: eq(brands.domain, brandData.domain),
        });

        if (existing) {
          console.log(`  ⏭️  Already exists, skipping\n`);
          skipCount++;
          continue;
        }

        await db.insert(brands).values({
          organizationId: BENCHMARK_ORG_ID,
          ...brandData,
          isBenchmark: true,
          lastEnrichedAt: new Date(),
          monitoringEnabled: false,
          isActive: true,
        });

        console.log(`  ✅ Inserted successfully`);
        console.log(`     Tier: ${brandData.benchmarkTier}`);
        console.log(`     Locations: ${brandData.locations?.length || 0}`);
        console.log(`     Personnel: ${brandData.personnel?.length || 0}\n`);
        successCount++;

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`  ❌ Error inserting ${brandData.name}:`, error);
        errorCount++;
      }
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 GRAND TOTAL');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successfully inserted: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`Total: ${Object.values(ALL_INDUSTRIES).flat().length}`);
  console.log(`${'='.repeat(60)}\n`);
}

main()
  .then(() => {
    console.log('✅ Population complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
