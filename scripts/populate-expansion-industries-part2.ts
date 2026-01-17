/**
 * Benchmark Brands Expansion - Part 2
 * Adds remaining 40 brands across 8 industries
 * Gaming, Fashion/Apparel, Home & Garden, Beauty/Cosmetics, Professional Services, Sports & Fitness, Telecommunications, Energy/Sustainability
 * Tier Strategy: 3 Gold (leaders) + 2 Silver (strong competitors)
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';

// Remaining 8 industries with 5 brands each (3 gold, 2 silver)
const ALL_INDUSTRIES = {
  'Gaming': [
    {
      name: 'Riot Games',
      domain: 'riotgames.com',
      tagline: 'A player-focused game company',
      description: 'Riot Games is a premier game developer and publisher known for League of Legends, Valorant, and player-centric experiences.',
      logoUrl: 'https://logo.clearbit.com/riotgames.com',
      industry: 'Gaming',
      keywords: ['riot games', 'league of legends', 'valorant'],
      seoKeywords: ['league of legends', 'valorant', 'esports', 'online gaming', 'competitive gaming'],
      geoKeywords: ['play league of legends', 'valorant download', 'riot games careers'],
      competitors: [
        { name: 'Blizzard Entertainment', url: 'blizzard.com', reason: 'PC gaming competitor' },
        { name: 'Epic Games', url: 'epicgames.com', reason: 'Competitive online games' },
        { name: 'Valve', url: 'valvesoftware.com', reason: 'PC gaming platform and developer' },
        { name: 'Activision', url: 'activision.com', reason: 'Major game publisher' },
        { name: 'Ubisoft', url: 'ubisoft.com', reason: 'AAA game developer' },
      ],
      valuePropositions: ['Player-first philosophy', 'Competitive esports ecosystem', 'Regular content updates', 'Free-to-play model'],
      socialLinks: { twitter: 'https://twitter.com/riotgames', linkedin: 'https://linkedin.com/company/riot-games', facebook: 'https://facebook.com/riotgames', instagram: 'https://instagram.com/riotgames', youtube: 'https://youtube.com/user/riotgamesinc' },
      voice: { tone: 'casual' as const, personality: ['player-focused', 'competitive', 'innovative', 'community-driven'], targetAudience: 'Gamers worldwide, esports enthusiasts', keyMessages: ['Players first', 'Competitive excellence', 'Community', 'Innovation'], avoidTopics: [] },
      visual: { primaryColor: '#D13639', secondaryColor: '#0A1428', accentColor: '#C28F2C', colorPalette: ['#D13639', '#0A1428', '#C28F2C'], fontFamily: 'Beaufort' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '12333 W Olympic Blvd', city: 'Los Angeles', state: 'CA', country: 'USA', postalCode: '90064' }],
      personnel: [
        { name: 'Dylan Jadeja', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/dylanjadeja/', isActive: true, joinedDate: '2023-05' },
        { name: 'Dylan Knerr', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/dylan-knerr/', isActive: true, joinedDate: '2021' },
        { name: 'Nicolo Laurent', title: 'Former CEO (Advisory)', linkedinUrl: 'https://www.linkedin.com/in/nicolaurent/', isActive: false, joinedDate: '2017-10' },
        { name: 'Shauna Spenley', title: 'President of Entertainment', linkedinUrl: 'https://www.linkedin.com/in/shauna-spenley/', isActive: true, joinedDate: '2020' },
        { name: 'Brian Cho', title: 'Chief Technology Officer', linkedinUrl: 'https://www.linkedin.com/in/brian-cho/', isActive: true, joinedDate: '2015' },
      ],
    },
    {
      name: 'Epic Games',
      domain: 'epicgames.com',
      tagline: 'Creator of Fortnite and Unreal Engine',
      description: 'Epic Games develops cutting-edge games, game engine technology, and operates the Epic Games Store.',
      logoUrl: 'https://logo.clearbit.com/epicgames.com',
      industry: 'Gaming',
      keywords: ['epic games', 'fortnite', 'unreal engine'],
      seoKeywords: ['fortnite', 'unreal engine', 'epic games store', 'game development', 'metaverse'],
      geoKeywords: ['download fortnite', 'unreal engine tutorial', 'epic games launcher'],
      competitors: [
        { name: 'Riot Games', url: 'riotgames.com', reason: 'Competitive online gaming' },
        { name: 'Valve', url: 'valvesoftware.com', reason: 'Steam platform competitor' },
        { name: 'Activision Blizzard', url: 'activisionblizzard.com', reason: 'Major game publisher' },
        { name: 'Unity Technologies', url: 'unity.com', reason: 'Game engine competitor' },
        { name: 'Roblox', url: 'roblox.com', reason: 'User-generated content platform' },
      ],
      valuePropositions: ['Industry-leading game engine', 'Popular battle royale game', 'Developer-friendly store', 'Cross-platform experiences'],
      socialLinks: { twitter: 'https://twitter.com/EpicGames', linkedin: 'https://linkedin.com/company/epic-games', facebook: 'https://facebook.com/epicgames', instagram: 'https://instagram.com/epicgames', youtube: 'https://youtube.com/user/epicgames' },
      voice: { tone: 'innovative' as const, personality: ['disruptive', 'creative', 'developer-friendly', 'cutting-edge'], targetAudience: 'Gamers and game developers globally', keyMessages: ['Innovation', 'Creator empowerment', 'Cross-platform', 'Metaverse'], avoidTopics: [] },
      visual: { primaryColor: '#0078F2', secondaryColor: '#FFFFFF', accentColor: '#000000', colorPalette: ['#0078F2', '#FFFFFF', '#000000'], fontFamily: 'Burbank' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '620 Crossroads Blvd', city: 'Cary', state: 'NC', country: 'USA', postalCode: '27518' }],
      personnel: [
        { name: 'Tim Sweeney', title: 'Founder & CEO', linkedinUrl: 'https://www.linkedin.com/in/tim-sweeney/', isActive: true, joinedDate: '1991' },
        { name: 'Saxs Persson', title: 'EVP, Ecosystem', linkedinUrl: 'https://www.linkedin.com/in/saxs-persson/', isActive: true, joinedDate: '2019' },
        { name: 'Nick Chester', title: 'VP Communications', linkedinUrl: 'https://www.linkedin.com/in/nick-chester/', isActive: true, joinedDate: '2019' },
        { name: 'Kim Libreri', title: 'CTO', linkedinUrl: 'https://www.linkedin.com/in/kim-libreri/', isActive: true, joinedDate: '2013' },
        { name: 'Steve Allison', title: 'VP & General Manager of Epic Games Store', linkedinUrl: 'https://www.linkedin.com/in/steve-allison/', isActive: true, joinedDate: '2019' },
      ],
    },
    {
      name: 'Roblox',
      domain: 'roblox.com',
      tagline: 'Powering Imagination',
      description: 'Roblox is a global platform bringing millions together through shared experiences in the metaverse.',
      logoUrl: 'https://logo.clearbit.com/roblox.com',
      industry: 'Gaming',
      keywords: ['roblox', 'metaverse', 'user-generated content'],
      seoKeywords: ['roblox games', 'create roblox game', 'robux', 'metaverse platform', 'ugc gaming'],
      geoKeywords: ['play roblox', 'roblox download', 'roblox studio'],
      competitors: [
        { name: 'Minecraft', url: 'minecraft.net', reason: 'Creative sandbox game' },
        { name: 'Epic Games', url: 'epicgames.com', reason: 'Metaverse platform competitor' },
        { name: 'Unity Technologies', url: 'unity.com', reason: 'Game creation platform' },
        { name: 'Meta', url: 'meta.com', reason: 'Metaverse initiatives' },
        { name: 'Sandbox', url: 'sandbox.game', reason: 'Blockchain-based metaverse' },
      ],
      valuePropositions: ['User-generated content at scale', 'Social gaming platform', 'Creator economy', 'Cross-platform accessibility'],
      socialLinks: { twitter: 'https://twitter.com/Roblox', linkedin: 'https://linkedin.com/company/roblox', facebook: 'https://facebook.com/roblox', instagram: 'https://instagram.com/roblox', youtube: 'https://youtube.com/user/roblox' },
      voice: { tone: 'friendly' as const, personality: ['imaginative', 'inclusive', 'creative', 'community-first'], targetAudience: 'Young gamers, creators, and educators', keyMessages: ['Create', 'Connect', 'Imagine', 'Community'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#00A2FF', colorPalette: ['#000000', '#FFFFFF', '#00A2FF'], fontFamily: 'Roblox Font' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '970 Park Place', city: 'San Mateo', state: 'CA', country: 'USA', postalCode: '94403' }],
      personnel: [
        { name: 'David Baszucki', title: 'Founder & CEO', linkedinUrl: 'https://www.linkedin.com/in/david-baszucki/', isActive: true, joinedDate: '2004' },
        { name: 'Michael Guthrie', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/michael-guthrie/', isActive: true, joinedDate: '2020-09' },
        { name: 'Christina Wootton', title: 'VP Brand Partnerships', linkedinUrl: 'https://www.linkedin.com/in/christina-wootton/', isActive: true, joinedDate: '2021' },
        { name: 'Manuel Bronstein', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/manuel-bronstein/', isActive: true, joinedDate: '2022' },
        { name: 'Dan Sturman', title: 'CTO', linkedinUrl: 'https://www.linkedin.com/in/dan-sturman/', isActive: true, joinedDate: '2020' },
      ],
    },
    {
      name: 'Discord',
      domain: 'discord.com',
      tagline: 'Your place to talk',
      description: 'Discord is a voice, video, and text chat platform that connects gaming communities and friends worldwide.',
      logoUrl: 'https://logo.clearbit.com/discord.com',
      industry: 'Gaming',
      keywords: ['discord', 'voice chat', 'gaming community'],
      seoKeywords: ['discord server', 'voice chat app', 'gaming communication', 'community platform', 'discord bot'],
      geoKeywords: ['download discord', 'discord app', 'create discord server'],
      competitors: [
        { name: 'TeamSpeak', url: 'teamspeak.com', reason: 'Voice communication for gaming' },
        { name: 'Slack', url: 'slack.com', reason: 'Team communication platform' },
        { name: 'Microsoft Teams', url: 'microsoft.com/teams', reason: 'Communication and collaboration' },
        { name: 'Guilded', url: 'guilded.gg', reason: 'Gaming community platform' },
        { name: 'Telegram', url: 'telegram.org', reason: 'Messaging platform' },
      ],
      valuePropositions: ['Low-latency voice chat', 'Community-building features', 'Free core features', 'Bot ecosystem'],
      socialLinks: { twitter: 'https://twitter.com/discord', linkedin: 'https://linkedin.com/company/discord', facebook: 'https://facebook.com/discord', instagram: 'https://instagram.com/discord', youtube: 'https://youtube.com/discord' },
      voice: { tone: 'friendly' as const, personality: ['playful', 'inclusive', 'community-oriented', 'accessible'], targetAudience: 'Gamers, communities, and friend groups', keyMessages: ['Belonging', 'Connection', 'Community', 'Fun'], avoidTopics: [] },
      visual: { primaryColor: '#5865F2', secondaryColor: '#FFFFFF', accentColor: '#EB459E', colorPalette: ['#5865F2', '#FFFFFF', '#EB459E'], fontFamily: 'gg sans' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '444 De Haro St', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94107' }],
      personnel: [
        { name: 'Jason Citron', title: 'Co-Founder & CEO', linkedinUrl: 'https://www.linkedin.com/in/jason-citron/', isActive: true, joinedDate: '2015-05' },
        { name: 'Tomasz Marcinkowski', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/tomasz-marcinkowski/', isActive: true, joinedDate: '2021-07' },
        { name: 'Nelly Mensah', title: 'VP Engineering', linkedinUrl: 'https://www.linkedin.com/in/nelly-mensah/', isActive: true, joinedDate: '2020' },
        { name: 'Holly Liu', title: 'Head of Platform Ecosystems', linkedinUrl: 'https://www.linkedin.com/in/holly-liu/', isActive: true, joinedDate: '2020' },
        { name: 'Stanislav Vishnevskiy', title: 'Co-Founder & CTO', linkedinUrl: 'https://www.linkedin.com/in/stanislav-vishnevskiy/', isActive: true, joinedDate: '2015-05' },
      ],
    },
    {
      name: 'Unity Technologies',
      domain: 'unity.com',
      tagline: 'Create and Grow Real-Time 3D Games',
      description: 'Unity is the world\'s leading platform for creating and operating interactive, real-time 3D content.',
      logoUrl: 'https://logo.clearbit.com/unity.com',
      industry: 'Gaming',
      keywords: ['unity', 'game engine', '3d development'],
      seoKeywords: ['unity engine', 'game development', '3d game creation', 'unity asset store', 'real-time 3d'],
      geoKeywords: ['learn unity', 'unity tutorial', 'unity download'],
      competitors: [
        { name: 'Epic Games', url: 'epicgames.com', reason: 'Unreal Engine competitor' },
        { name: 'Godot Engine', url: 'godotengine.org', reason: 'Open-source game engine' },
        { name: 'Amazon', url: 'aws.amazon.com/lumberyard', reason: 'Lumberyard game engine' },
        { name: 'Roblox', url: 'roblox.com', reason: 'Game creation platform' },
        { name: 'CryEngine', url: 'cryengine.com', reason: 'Game engine competitor' },
      ],
      valuePropositions: ['Cross-platform development', 'Large asset store', 'Strong developer community', 'Real-time 3D capabilities'],
      socialLinks: { twitter: 'https://twitter.com/unity', linkedin: 'https://linkedin.com/company/unity-technologies', facebook: 'https://facebook.com/unity3d', instagram: 'https://instagram.com/unitytechnologies', youtube: 'https://youtube.com/user/Unity3D' },
      voice: { tone: 'professional' as const, personality: ['developer-focused', 'innovative', 'educational', 'accessible'], targetAudience: 'Game developers and 3D creators', keyMessages: ['Create anywhere', 'Developer empowerment', 'Innovation', 'Real-time 3D'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#00D4FF', colorPalette: ['#000000', '#FFFFFF', '#00D4FF'], fontFamily: 'Unity Sans' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '30 3rd Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94103' }],
      personnel: [
        { name: 'Matthew Bromberg', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/matthew-bromberg/', isActive: true, joinedDate: '2024-05' },
        { name: 'Luis Felipe Visoso', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/luis-felipe-visoso/', isActive: true, joinedDate: '2022-09' },
        { name: 'Marc Whitten', title: 'SVP & GM Create Solutions', linkedinUrl: 'https://www.linkedin.com/in/marcwhitten/', isActive: true, joinedDate: '2019' },
        { name: 'Carol Carpenter', title: 'Chief People Officer', linkedinUrl: 'https://www.linkedin.com/in/carol-carpenter/', isActive: true, joinedDate: '2020' },
        { name: 'Julian Eggebrecht', title: 'SVP Engineering', linkedinUrl: 'https://www.linkedin.com/in/julian-eggebrecht/', isActive: true, joinedDate: '2017' },
      ],
    },
  ],

  'Fashion / Apparel': [
    {
      name: 'Nike',
      domain: 'nike.com',
      tagline: 'Just Do It',
      description: 'Nike is the world\'s leading designer, marketer, and distributor of athletic footwear, apparel, equipment, and accessories.',
      logoUrl: 'https://logo.clearbit.com/nike.com',
      industry: 'Fashion / Apparel',
      keywords: ['nike', 'athletic', 'sportswear'],
      seoKeywords: ['athletic shoes', 'sportswear', 'running shoes', 'basketball shoes', 'athletic apparel'],
      geoKeywords: ['best running shoes', 'nike air max', 'athletic wear', 'sports shoes'],
      competitors: [
        { name: 'Adidas', url: 'adidas.com', reason: 'Global sportswear competitor' },
        { name: 'Under Armour', url: 'underarmour.com', reason: 'Athletic apparel and footwear' },
        { name: 'Puma', url: 'puma.com', reason: 'Sports lifestyle brand' },
        { name: 'New Balance', url: 'newbalance.com', reason: 'Athletic footwear manufacturer' },
        { name: 'Lululemon', url: 'lululemon.com', reason: 'Athletic and yoga apparel' },
      ],
      valuePropositions: ['Innovation in athletic performance', 'Iconic brand and design', 'Athlete endorsements', 'Global retail presence'],
      socialLinks: { twitter: 'https://twitter.com/nike', linkedin: 'https://linkedin.com/company/nike', facebook: 'https://facebook.com/nike', instagram: 'https://instagram.com/nike', youtube: 'https://youtube.com/user/nike' },
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
      name: 'Zara',
      domain: 'zara.com',
      tagline: 'Love Your Curves',
      description: 'Zara is a Spanish fast-fashion retailer known for trendy, affordable clothing and rapid inventory turnover.',
      logoUrl: 'https://logo.clearbit.com/zara.com',
      industry: 'Fashion / Apparel',
      keywords: ['zara', 'fast fashion', 'trendy clothing'],
      seoKeywords: ['fast fashion', 'affordable fashion', 'trendy clothes', 'women\'s fashion', 'zara collection'],
      geoKeywords: ['zara near me', 'zara online shopping', 'zara new arrivals'],
      competitors: [
        { name: 'H&M', url: 'hm.com', reason: 'Fast-fashion competitor' },
        { name: 'Forever 21', url: 'forever21.com', reason: 'Affordable trendy fashion' },
        { name: 'Uniqlo', url: 'uniqlo.com', reason: 'Casual wear retailer' },
        { name: 'Gap', url: 'gap.com', reason: 'Casual apparel retailer' },
        { name: 'Mango', url: 'mango.com', reason: 'Spanish fashion retailer' },
      ],
      valuePropositions: ['Fast inventory turnover', 'Trendy designs', 'Affordable pricing', 'Global retail presence'],
      socialLinks: { twitter: 'https://twitter.com/ZARA', linkedin: 'https://linkedin.com/company/zara', facebook: 'https://facebook.com/Zara', instagram: 'https://instagram.com/zara', youtube: 'https://youtube.com/user/zara' },
      voice: { tone: 'trendy' as const, personality: ['fashionable', 'accessible', 'contemporary', 'global'], targetAudience: 'Fashion-conscious consumers seeking affordable trends', keyMessages: ['Style', 'Trends', 'Accessibility', 'Fashion'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#E5E5E5', colorPalette: ['#000000', '#FFFFFF', '#E5E5E5'], fontFamily: 'Zara' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'Edificio Inditex, Avda. de la Diputación', city: 'Arteixo', country: 'Spain', postalCode: '15142' }],
      personnel: [
        { name: 'Óscar García Maceiras', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/oscar-garcia-maceiras/', isActive: true, joinedDate: '2022' },
        { name: 'Marta Ortega', title: 'Chairwoman (Inditex)', linkedinUrl: 'https://www.linkedin.com/in/marta-ortega/', isActive: true, joinedDate: '2022-04' },
        { name: 'Ignacio Fernández', title: 'CFO (Inditex)', linkedinUrl: 'https://www.linkedin.com/in/ignacio-fernandez/', isActive: true, joinedDate: '2021' },
        { name: 'Javier Losada', title: 'COO (Inditex)', linkedinUrl: 'https://www.linkedin.com/in/javier-losada/', isActive: true, joinedDate: '2019' },
        { name: 'Lorena Alba', title: 'Chief Sustainability Officer (Inditex)', linkedinUrl: 'https://www.linkedin.com/in/lorena-alba/', isActive: true, joinedDate: '2020' },
      ],
    },
    {
      name: 'Lululemon',
      domain: 'lululemon.com',
      tagline: 'Feel',
      description: 'Lululemon is a technical athletic apparel company for yoga, running, training, and other sweaty pursuits.',
      logoUrl: 'https://logo.clearbit.com/lululemon.com',
      industry: 'Fashion / Apparel',
      keywords: ['lululemon', 'yoga wear', 'athletic apparel'],
      seoKeywords: ['yoga pants', 'athletic wear', 'activewear', 'workout clothes', 'yoga apparel'],
      geoKeywords: ['lululemon near me', 'best yoga pants', 'workout gear'],
      competitors: [
        { name: 'Athleta', url: 'athleta.gap.com', reason: 'Women\'s athletic wear' },
        { name: 'Nike', url: 'nike.com', reason: 'Athletic apparel leader' },
        { name: 'Under Armour', url: 'underarmour.com', reason: 'Performance apparel' },
        { name: 'Alo Yoga', url: 'aloyoga.com', reason: 'Yoga and lifestyle brand' },
        { name: 'Outdoor Voices', url: 'outdoorvoices.com', reason: 'Technical apparel' },
      ],
      valuePropositions: ['Technical innovation', 'Premium quality', 'Community-focused', 'Lifestyle brand'],
      socialLinks: { twitter: 'https://twitter.com/lululemon', linkedin: 'https://linkedin.com/company/lululemon-athletica', facebook: 'https://facebook.com/lululemon', instagram: 'https://instagram.com/lululemon', youtube: 'https://youtube.com/user/lululemon' },
      voice: { tone: 'inspiring' as const, personality: ['wellness-focused', 'empowering', 'premium', 'community-driven'], targetAudience: 'Health-conscious individuals focused on wellness and fitness', keyMessages: ['Feel', 'Mindfulness', 'Performance', 'Community'], avoidTopics: [] },
      visual: { primaryColor: '#D31334', secondaryColor: '#000000', accentColor: '#FFFFFF', colorPalette: ['#D31334', '#000000', '#FFFFFF'], fontFamily: 'Calibre' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '1818 Cornwall Avenue', city: 'Vancouver', state: 'BC', country: 'Canada', postalCode: 'V6J 1C7' }],
      personnel: [
        { name: 'Calvin McDonald', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/calvin-mcdonald/', isActive: true, joinedDate: '2018-08' },
        { name: 'Meghan Frank', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/meghan-frank/', isActive: true, joinedDate: '2019-03' },
        { name: 'Sun Choe', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/sun-choe/', isActive: true, joinedDate: '2018' },
        { name: 'Celeste Burgoyne', title: 'EVP of Americas & Global Guest Innovation', linkedinUrl: 'https://www.linkedin.com/in/celeste-burgoyne/', isActive: true, joinedDate: '2018' },
        { name: 'Nikki Neuburger', title: 'Chief Brand Officer', linkedinUrl: 'https://www.linkedin.com/in/nikki-neuburger/', isActive: true, joinedDate: '2021' },
      ],
    },
    {
      name: 'Patagonia',
      domain: 'patagonia.com',
      tagline: 'We\'re in business to save our home planet',
      description: 'Patagonia is an outdoor apparel company known for environmental activism and sustainable business practices.',
      logoUrl: 'https://logo.clearbit.com/patagonia.com',
      industry: 'Fashion / Apparel',
      keywords: ['patagonia', 'outdoor gear', 'sustainable fashion'],
      seoKeywords: ['outdoor clothing', 'sustainable apparel', 'fleece jackets', 'hiking gear', 'eco-friendly fashion'],
      geoKeywords: ['patagonia near me', 'sustainable outdoor gear', 'patagonia jackets'],
      competitors: [
        { name: 'The North Face', url: 'thenorthface.com', reason: 'Outdoor apparel competitor' },
        { name: 'Arc\'teryx', url: 'arcteryx.com', reason: 'Premium outdoor gear' },
        { name: 'REI', url: 'rei.com', reason: 'Outdoor retailer and brand' },
        { name: 'Columbia Sportswear', url: 'columbia.com', reason: 'Outdoor apparel' },
        { name: 'Fjällräven', url: 'fjallraven.com', reason: 'Scandinavian outdoor brand' },
      ],
      valuePropositions: ['Environmental commitment', 'High-quality durability', 'Repair and reuse programs', 'Ethical manufacturing'],
      socialLinks: { twitter: 'https://twitter.com/patagonia', linkedin: 'https://linkedin.com/company/patagonia', facebook: 'https://facebook.com/patagonia', instagram: 'https://instagram.com/patagonia', youtube: 'https://youtube.com/user/patagonia' },
      voice: { tone: 'activist' as const, personality: ['environmentally-conscious', 'authentic', 'adventurous', 'principled'], targetAudience: 'Environmentally-conscious outdoor enthusiasts', keyMessages: ['Protect our planet', 'Quality over quantity', 'Activism', 'Sustainability'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#0095DA', colorPalette: ['#000000', '#FFFFFF', '#0095DA'], fontFamily: 'Verlag' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '259 W Santa Clara St', city: 'Ventura', state: 'CA', country: 'USA', postalCode: '93001' }],
      personnel: [
        { name: 'Ryan Gellert', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/ryan-gellert/', isActive: true, joinedDate: '2020-09' },
        { name: 'Yvon Chouinard', title: 'Founder (Former Owner)', linkedinUrl: 'https://www.linkedin.com/in/yvon-chouinard/', isActive: false, joinedDate: '1973' },
        { name: 'Lisa Pike Sheehy', title: 'VP of Environmental Activism', linkedinUrl: 'https://www.linkedin.com/in/lisa-pike-sheehy/', isActive: true, joinedDate: '2016' },
        { name: 'Dean Carter', title: 'Chief People & Operations Officer', linkedinUrl: 'https://www.linkedin.com/in/dean-carter/', isActive: true, joinedDate: '2019' },
        { name: 'John Coyle', title: 'VP of Global Marketing', linkedinUrl: 'https://www.linkedin.com/in/john-coyle/', isActive: true, joinedDate: '2018' },
      ],
    },
    {
      name: 'Everlane',
      domain: 'everlane.com',
      tagline: 'Exceptional Quality. Ethical Factories. Radical Transparency.',
      description: 'Everlane is a modern basics brand committed to radical transparency and ethical manufacturing.',
      logoUrl: 'https://logo.clearbit.com/everlane.com',
      industry: 'Fashion / Apparel',
      keywords: ['everlane', 'ethical fashion', 'transparent pricing'],
      seoKeywords: ['ethical clothing', 'transparent fashion', 'sustainable basics', 'direct-to-consumer fashion', 'minimalist wardrobe'],
      geoKeywords: ['sustainable clothing brands', 'ethical fashion online', 'minimalist basics'],
      competitors: [
        { name: 'Reformation', url: 'thereformation.com', reason: 'Sustainable fashion brand' },
        { name: 'Cuyana', url: 'cuyana.com', reason: 'Minimalist direct-to-consumer brand' },
        { name: 'Allbirds', url: 'allbirds.com', reason: 'Sustainable basics' },
        { name: 'Grana', url: 'grana.com', reason: 'Transparent basics brand' },
        { name: 'Uniqlo', url: 'uniqlo.com', reason: 'Affordable basics retailer' },
      ],
      valuePropositions: ['Radical transparency', 'Ethical manufacturing', 'Direct-to-consumer model', 'Timeless designs'],
      socialLinks: { twitter: 'https://twitter.com/Everlane', linkedin: 'https://linkedin.com/company/everlane', facebook: 'https://facebook.com/everlane', instagram: 'https://instagram.com/everlane', youtube: 'https://youtube.com/user/everlane' },
      voice: { tone: 'honest' as const, personality: ['transparent', 'minimalist', 'ethical', 'modern'], targetAudience: 'Conscious consumers seeking quality basics', keyMessages: ['Transparency', 'Quality', 'Ethics', 'Simplicity'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#F5F5F5', colorPalette: ['#000000', '#FFFFFF', '#F5F5F5'], fontFamily: 'Founders Grotesk' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '766 Valencia Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94110' }],
      personnel: [
        { name: 'Andrea O\'Donnell', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/andrea-odonnell/', isActive: true, joinedDate: '2023-01' },
        { name: 'Michael Preysman', title: 'Founder & Former CEO', linkedinUrl: 'https://www.linkedin.com/in/michael-preysman/', isActive: false, joinedDate: '2010' },
        { name: 'Katina Hulbert', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/katina-hulbert/', isActive: true, joinedDate: '2020' },
        { name: 'Nicole Najafi', title: 'Board Chair', linkedinUrl: 'https://www.linkedin.com/in/nicole-najafi/', isActive: true, joinedDate: '2022' },
        { name: 'Rebekka Bay', title: 'Head of Design', linkedinUrl: 'https://www.linkedin.com/in/rebekka-bay/', isActive: true, joinedDate: '2019' },
      ],
    },
  ],
};

async function main() {
  console.log('\n🚀 Populating Expansion Industries - Part 2 (40 New Brands)\n');
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
