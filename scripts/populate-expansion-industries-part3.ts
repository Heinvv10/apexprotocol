/**
 * Benchmark Brands Expansion - Part 3
 * Completes Consumer Goods & Fashion + adds Home & Garden, Beauty/Cosmetics
 * Total: 12 brands (1 + 1 + 5 + 5)
 * Tier Strategy: 3 Gold (leaders) + 2 Silver (strong competitors)
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { organizations } from '@/lib/db/schema/organizations';
import { eq } from 'drizzle-orm';

const BENCHMARK_ORG_ID = 'org_benchmark_brands';

const ALL_INDUSTRIES = {
  'Consumer Goods': [
    {
      name: 'Samsung',
      domain: 'samsung.com',
      tagline: 'Do What You Can\'t',
      description: 'Samsung is a South Korean multinational conglomerate and global leader in consumer electronics, semiconductors, and telecommunications.',
      logoUrl: 'https://logo.clearbit.com/samsung.com',
      industry: 'Consumer Goods',
      keywords: ['samsung', 'electronics', 'smartphones'],
      seoKeywords: ['samsung galaxy', 'smartphones', 'smart tv', 'home appliances', 'consumer electronics'],
      geoKeywords: ['samsung phones', 'samsung tv', 'galaxy smartphone', 'samsung near me'],
      competitors: [
        { name: 'Apple', url: 'apple.com', reason: 'Premium smartphone competitor' },
        { name: 'LG', url: 'lg.com', reason: 'Consumer electronics competitor' },
        { name: 'Sony', url: 'sony.com', reason: 'Electronics manufacturer' },
        { name: 'Huawei', url: 'huawei.com', reason: 'Smartphone competitor' },
        { name: 'Xiaomi', url: 'mi.com', reason: 'Consumer electronics competitor' },
      ],
      valuePropositions: ['Innovation leadership', 'Diverse product portfolio', 'Global manufacturing scale', 'Vertical integration'],
      socialLinks: { twitter: 'https://twitter.com/Samsung', linkedin: 'https://linkedin.com/company/samsung', facebook: 'https://facebook.com/Samsung', instagram: 'https://instagram.com/samsung', youtube: 'https://youtube.com/user/SamsungMobile' },
      voice: { tone: 'innovative' as const, personality: ['cutting-edge', 'ambitious', 'global', 'tech-forward'], targetAudience: 'Tech-savvy consumers globally', keyMessages: ['Innovation', 'Technology', 'Quality', 'Do What You Can\'t'], avoidTopics: [] },
      visual: { primaryColor: '#1428A0', secondaryColor: '#FFFFFF', accentColor: '#000000', colorPalette: ['#1428A0', '#FFFFFF', '#000000'], fontFamily: 'Samsung Sharp Sans' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '129 Samsung-ro', city: 'Suwon-si', state: 'Gyeonggi-do', country: 'South Korea', postalCode: '16677' }],
      personnel: [
        { name: 'Han Jong-hee', title: 'Vice Chairman & CEO', linkedinUrl: 'https://www.linkedin.com/in/han-jong-hee/', isActive: true, joinedDate: '2021-12' },
        { name: 'Park Hark-kyu', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/park-hark-kyu/', isActive: true, joinedDate: '2023' },
        { name: 'Roh Tae-moon', title: 'President of Mobile Experience', linkedinUrl: 'https://www.linkedin.com/in/roh-tae-moon/', isActive: true, joinedDate: '2019' },
        { name: 'Jong-hee Han', title: 'CEO of Device Experience Division', linkedinUrl: 'https://www.linkedin.com/in/jonghee-han/', isActive: true, joinedDate: '2021' },
        { name: 'Kyung Kye-hyun', title: 'CEO of Device Solutions', linkedinUrl: 'https://www.linkedin.com/in/kyung-kye-hyun/', isActive: true, joinedDate: '2021' },
      ],
    },
  ],

  'Fashion / Apparel': [
    {
      name: 'H&M',
      domain: 'hm.com',
      tagline: 'Fashion and quality at the best price',
      description: 'H&M is a Swedish multinational clothing retailer known for fast-fashion clothing for all ages.',
      logoUrl: 'https://logo.clearbit.com/hm.com',
      industry: 'Fashion / Apparel',
      keywords: ['h&m', 'fashion', 'affordable clothing'],
      seoKeywords: ['fast fashion', 'affordable clothing', 'trendy fashion', 'sustainable fashion', 'clothing stores'],
      geoKeywords: ['h&m near me', 'h&m online shopping', 'affordable fashion'],
      competitors: [
        { name: 'Zara', url: 'zara.com', reason: 'Fast-fashion competitor' },
        { name: 'Uniqlo', url: 'uniqlo.com', reason: 'Affordable basics retailer' },
        { name: 'Gap', url: 'gap.com', reason: 'Casual apparel competitor' },
        { name: 'Forever 21', url: 'forever21.com', reason: 'Fast-fashion retailer' },
        { name: 'Primark', url: 'primark.com', reason: 'Budget fashion retailer' },
      ],
      valuePropositions: ['Affordable fashion', 'Trend-focused collections', 'Sustainability initiatives', 'Global reach'],
      socialLinks: { twitter: 'https://twitter.com/hm', linkedin: 'https://linkedin.com/company/h&m', facebook: 'https://facebook.com/hm', instagram: 'https://instagram.com/hm', youtube: 'https://youtube.com/user/hennesandmauritz' },
      voice: { tone: 'friendly' as const, personality: ['accessible', 'fashionable', 'inclusive', 'trend-conscious'], targetAudience: 'Fashion-conscious consumers seeking affordable trends', keyMessages: ['Fashion democracy', 'Sustainability', 'Trends', 'Value'], avoidTopics: [] },
      visual: { primaryColor: '#E50010', secondaryColor: '#000000', accentColor: '#FFFFFF', colorPalette: ['#E50010', '#000000', '#FFFFFF'], fontFamily: 'HM Sans' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'Mäster Samuelsgatan 46', city: 'Stockholm', country: 'Sweden', postalCode: '106 38' }],
      personnel: [
        { name: 'Helena Helmersson', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/helena-helmersson/', isActive: true, joinedDate: '2020-01' },
        { name: 'Adam Karlsson', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/adam-karlsson/', isActive: true, joinedDate: '2021-05' },
        { name: 'Daniel Ervér', title: 'COO', linkedinUrl: 'https://www.linkedin.com/in/daniel-erver/', isActive: true, joinedDate: '2022-09' },
        { name: 'Ann-Sofie Johansson', title: 'Creative Advisor', linkedinUrl: 'https://www.linkedin.com/in/ann-sofie-johansson/', isActive: true, joinedDate: '2007' },
        { name: 'Nils Vinge', title: 'Head of Investor Relations', linkedinUrl: 'https://www.linkedin.com/in/nils-vinge/', isActive: true, joinedDate: '2019' },
      ],
    },
  ],

  'Home & Garden': [
    {
      name: 'IKEA',
      domain: 'ikea.com',
      tagline: 'A better everyday life for the many people',
      description: 'IKEA is a Swedish furniture retailer known for ready-to-assemble furniture, home accessories, and sustainable design.',
      logoUrl: 'https://logo.clearbit.com/ikea.com',
      industry: 'Home & Garden',
      keywords: ['ikea', 'furniture', 'home decor'],
      seoKeywords: ['affordable furniture', 'home furnishings', 'scandinavian design', 'flat-pack furniture', 'home organization'],
      geoKeywords: ['ikea near me', 'ikea catalog', 'affordable home furniture'],
      competitors: [
        { name: 'Wayfair', url: 'wayfair.com', reason: 'Online furniture retailer' },
        { name: 'Home Depot', url: 'homedepot.com', reason: 'Home improvement retailer' },
        { name: 'West Elm', url: 'westelm.com', reason: 'Modern furniture retailer' },
        { name: 'Target', url: 'target.com', reason: 'Home goods competitor' },
        { name: 'Ashley Furniture', url: 'ashleyfurniture.com', reason: 'Furniture manufacturer' },
      ],
      valuePropositions: ['Affordable design', 'Flat-pack efficiency', 'Sustainability focus', 'Scandinavian aesthetic'],
      socialLinks: { twitter: 'https://twitter.com/IKEA', linkedin: 'https://linkedin.com/company/ikea', facebook: 'https://facebook.com/IKEA', instagram: 'https://instagram.com/ikea', youtube: 'https://youtube.com/user/ikea' },
      voice: { tone: 'friendly' as const, personality: ['practical', 'democratic', 'sustainable', 'innovative'], targetAudience: 'Value-conscious consumers seeking functional design', keyMessages: ['Democratic design', 'Sustainability', 'Affordability', 'Better everyday life'], avoidTopics: [] },
      visual: { primaryColor: '#0051BA', secondaryColor: '#FFDB00', accentColor: '#FFFFFF', colorPalette: ['#0051BA', '#FFDB00', '#FFFFFF'], fontFamily: 'Noto IKEA' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: 'Box 702', city: 'Älmhult', country: 'Sweden', postalCode: '343 81' }],
      personnel: [
        { name: 'Jesper Brodin', title: 'CEO of Ingka Group', linkedinUrl: 'https://www.linkedin.com/in/jesper-brodin/', isActive: true, joinedDate: '2017-09' },
        { name: 'Jon Abrahamsson Ring', title: 'CEO of Inter IKEA', linkedinUrl: 'https://www.linkedin.com/in/jon-abrahamsson-ring/', isActive: true, joinedDate: '2020-09' },
        { name: 'Juvencio Maeztu', title: 'CFO of Ingka Group', linkedinUrl: 'https://www.linkedin.com/in/juvencio-maeztu/', isActive: true, joinedDate: '2015' },
        { name: 'Pia Heidenmark Cook', title: 'Chief Sustainability Officer', linkedinUrl: 'https://www.linkedin.com/in/pia-heidenmark-cook/', isActive: true, joinedDate: '2020' },
        { name: 'Parag Parekh', title: 'Chief Digital Officer', linkedinUrl: 'https://www.linkedin.com/in/parag-parekh/', isActive: true, joinedDate: '2021' },
      ],
    },
    {
      name: 'Wayfair',
      domain: 'wayfair.com',
      tagline: 'A Zillion Things Home',
      description: 'Wayfair is an American e-commerce company specializing in furniture and home goods with a vast online selection.',
      logoUrl: 'https://logo.clearbit.com/wayfair.com',
      industry: 'Home & Garden',
      keywords: ['wayfair', 'online furniture', 'home goods'],
      seoKeywords: ['online furniture shopping', 'home decor', 'furniture delivery', 'home goods online', 'interior design'],
      geoKeywords: ['buy furniture online', 'wayfair deals', 'home furniture delivery'],
      competitors: [
        { name: 'IKEA', url: 'ikea.com', reason: 'Furniture retailer' },
        { name: 'Amazon', url: 'amazon.com', reason: 'E-commerce home goods' },
        { name: 'Overstock', url: 'overstock.com', reason: 'Online home retailer' },
        { name: 'Article', url: 'article.com', reason: 'Direct-to-consumer furniture' },
        { name: 'West Elm', url: 'westelm.com', reason: 'Modern furniture brand' },
      ],
      valuePropositions: ['Vast selection', 'Convenient online shopping', 'Free shipping options', 'Visual search technology'],
      socialLinks: { twitter: 'https://twitter.com/Wayfair', linkedin: 'https://linkedin.com/company/wayfair', facebook: 'https://facebook.com/wayfair', instagram: 'https://instagram.com/wayfair', youtube: 'https://youtube.com/user/Wayfair' },
      voice: { tone: 'helpful' as const, personality: ['accessible', 'innovative', 'customer-focused', 'convenient'], targetAudience: 'Online shoppers seeking home furnishings', keyMessages: ['Selection', 'Convenience', 'Home inspiration', 'Value'], avoidTopics: [] },
      visual: { primaryColor: '#7B189F', secondaryColor: '#FFFFFF', accentColor: '#00CBA6', colorPalette: ['#7B189F', '#FFFFFF', '#00CBA6'], fontFamily: 'Sailec' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '4 Copley Place', city: 'Boston', state: 'MA', country: 'USA', postalCode: '02116' }],
      personnel: [
        { name: 'Niraj Shah', title: 'Co-Founder & CEO', linkedinUrl: 'https://www.linkedin.com/in/niraj-shah/', isActive: true, joinedDate: '2002' },
        { name: 'Steve Conine', title: 'Co-Founder & Co-Chairman', linkedinUrl: 'https://www.linkedin.com/in/steve-conine/', isActive: true, joinedDate: '2002' },
        { name: 'Kate Gulliver', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/kate-gulliver/', isActive: true, joinedDate: '2021-10' },
        { name: 'Jon Blotner', title: 'Chief Retail Officer', linkedinUrl: 'https://www.linkedin.com/in/jon-blotner/', isActive: true, joinedDate: '2015' },
        { name: 'Fiona Tan', title: 'Chief Technology Officer', linkedinUrl: 'https://www.linkedin.com/in/fiona-tan/', isActive: true, joinedDate: '2018' },
      ],
    },
    {
      name: 'Home Depot',
      domain: 'homedepot.com',
      tagline: 'How Doers Get More Done',
      description: 'Home Depot is the largest home improvement retailer in the United States, supplying tools, construction products, and services.',
      logoUrl: 'https://logo.clearbit.com/homedepot.com',
      industry: 'Home & Garden',
      keywords: ['home depot', 'home improvement', 'diy'],
      seoKeywords: ['home improvement', 'hardware store', 'building materials', 'power tools', 'diy projects'],
      geoKeywords: ['home depot near me', 'hardware store', 'home improvement store'],
      competitors: [
        { name: 'Lowe\'s', url: 'lowes.com', reason: 'Home improvement competitor' },
        { name: 'Menards', url: 'menards.com', reason: 'Regional home improvement' },
        { name: 'Ace Hardware', url: 'acehardware.com', reason: 'Hardware retailer' },
        { name: 'Amazon', url: 'amazon.com', reason: 'Online home improvement' },
        { name: 'Tractor Supply Co', url: 'tractorsupply.com', reason: 'Rural home improvement' },
      ],
      valuePropositions: ['Extensive product selection', 'Professional services', 'DIY resources', 'Pro customer programs'],
      socialLinks: { twitter: 'https://twitter.com/HomeDepot', linkedin: 'https://linkedin.com/company/the-home-depot', facebook: 'https://facebook.com/homedepot', instagram: 'https://instagram.com/homedepot', youtube: 'https://youtube.com/user/homedepot' },
      voice: { tone: 'helpful' as const, personality: ['practical', 'empowering', 'professional', 'accessible'], targetAudience: 'DIYers and professional contractors', keyMessages: ['Doers', 'Expertise', 'Quality', 'Service'], avoidTopics: [] },
      visual: { primaryColor: '#F96302', secondaryColor: '#FFFFFF', accentColor: '#000000', colorPalette: ['#F96302', '#FFFFFF', '#000000'], fontFamily: 'Helvetica Neue' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '2455 Paces Ferry Road', city: 'Atlanta', state: 'GA', country: 'USA', postalCode: '30339' }],
      personnel: [
        { name: 'Ted Decker', title: 'Chair, President & CEO', linkedinUrl: 'https://www.linkedin.com/in/ted-decker/', isActive: true, joinedDate: '2022-03' },
        { name: 'Richard McPhail', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/richard-mcphail/', isActive: true, joinedDate: '2019-08' },
        { name: 'Fahim Siddiqui', title: 'Chief Information Officer', linkedinUrl: 'https://www.linkedin.com/in/fahim-siddiqui/', isActive: true, joinedDate: '2021' },
        { name: 'Ann-Marie Campbell', title: 'EVP US Stores', linkedinUrl: 'https://www.linkedin.com/in/ann-marie-campbell/', isActive: true, joinedDate: '2007' },
        { name: 'Ron Jarvis', title: 'Chief Sustainability Officer', linkedinUrl: 'https://www.linkedin.com/in/ron-jarvis/', isActive: true, joinedDate: '2020' },
      ],
    },
    {
      name: 'Williams-Sonoma',
      domain: 'williams-sonoma.com',
      tagline: 'The Way to Cook',
      description: 'Williams-Sonoma is an American retailer of cookware, home furnishings, and premium kitchen products.',
      logoUrl: 'https://logo.clearbit.com/williams-sonoma.com',
      industry: 'Home & Garden',
      keywords: ['williams-sonoma', 'cookware', 'kitchen'],
      seoKeywords: ['premium cookware', 'kitchen tools', 'home furnishings', 'kitchenware', 'gourmet cooking'],
      geoKeywords: ['williams sonoma near me', 'premium cookware', 'kitchen store'],
      competitors: [
        { name: 'Sur La Table', url: 'surlatable.com', reason: 'Culinary retailer' },
        { name: 'Crate and Barrel', url: 'crateandbarrel.com', reason: 'Home goods retailer' },
        { name: 'Pottery Barn', url: 'potterybarn.com', reason: 'Sister brand competitor' },
        { name: 'Le Creuset', url: 'lecreuset.com', reason: 'Premium cookware brand' },
        { name: 'All-Clad', url: 'all-clad.com', reason: 'Premium cookware manufacturer' },
      ],
      valuePropositions: ['Premium quality products', 'Culinary expertise', 'Curated selection', 'Cooking education'],
      socialLinks: { twitter: 'https://twitter.com/WilliamsSonoma', linkedin: 'https://linkedin.com/company/williams-sonoma', facebook: 'https://facebook.com/WilliamsSonoma', instagram: 'https://instagram.com/williamssonoma', youtube: 'https://youtube.com/user/williamssonoma' },
      voice: { tone: 'refined' as const, personality: ['premium', 'culinary-focused', 'elegant', 'expert'], targetAudience: 'Home cooks and culinary enthusiasts', keyMessages: ['Quality', 'Culinary excellence', 'Home cooking', 'Entertaining'], avoidTopics: [] },
      visual: { primaryColor: '#003D71', secondaryColor: '#FFFFFF', accentColor: '#C8102E', colorPalette: ['#003D71', '#FFFFFF', '#C8102E'], fontFamily: 'Brandon Text' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '3250 Van Ness Avenue', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94109' }],
      personnel: [
        { name: 'Laura Alber', title: 'President & CEO', linkedinUrl: 'https://www.linkedin.com/in/laura-alber/', isActive: true, joinedDate: '2010-08' },
        { name: 'Julie Whalen', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/julie-whalen/', isActive: true, joinedDate: '2018-04' },
        { name: 'Felix Carbullido', title: 'Chief Technology Officer', linkedinUrl: 'https://www.linkedin.com/in/felix-carbullido/', isActive: true, joinedDate: '2020' },
        { name: 'Sandra Stangl', title: 'President of Williams Sonoma Brand', linkedinUrl: 'https://www.linkedin.com/in/sandra-stangl/', isActive: true, joinedDate: '2019' },
        { name: 'Ryan Ross', title: 'Chief Supply Chain Officer', linkedinUrl: 'https://www.linkedin.com/in/ryan-ross/', isActive: true, joinedDate: '2021' },
      ],
    },
    {
      name: 'Casper',
      domain: 'casper.com',
      tagline: 'The Sleep Company',
      description: 'Casper is a direct-to-consumer mattress and sleep products company revolutionizing the sleep industry.',
      logoUrl: 'https://logo.clearbit.com/casper.com',
      industry: 'Home & Garden',
      keywords: ['casper', 'mattress', 'sleep'],
      seoKeywords: ['memory foam mattress', 'bed in a box', 'sleep products', 'online mattress', 'mattress delivery'],
      geoKeywords: ['best mattress online', 'casper mattress review', 'buy mattress online'],
      competitors: [
        { name: 'Purple', url: 'purple.com', reason: 'Online mattress competitor' },
        { name: 'Tuft & Needle', url: 'tuftandneedle.com', reason: 'Direct-to-consumer mattress' },
        { name: 'Leesa', url: 'leesa.com', reason: 'Online sleep products' },
        { name: 'Saatva', url: 'saatva.com', reason: 'Luxury online mattress' },
        { name: 'Tempur-Pedic', url: 'tempurpedic.com', reason: 'Traditional mattress brand' },
      ],
      valuePropositions: ['Direct-to-consumer convenience', 'Trial period', 'Innovative sleep technology', 'All-in-one sleep solution'],
      socialLinks: { twitter: 'https://twitter.com/Casper', linkedin: 'https://linkedin.com/company/casper', facebook: 'https://facebook.com/Casper', instagram: 'https://instagram.com/casper', youtube: 'https://youtube.com/c/casper' },
      voice: { tone: 'friendly' as const, personality: ['approachable', 'innovative', 'sleep-focused', 'modern'], targetAudience: 'Sleep-conscious consumers seeking convenience', keyMessages: ['Better sleep', 'Convenience', 'Innovation', 'Comfort'], avoidTopics: [] },
      visual: { primaryColor: '#00A4BD', secondaryColor: '#FFFFFF', accentColor: '#F7F7F7', colorPalette: ['#00A4BD', '#FFFFFF', '#F7F7F7'], fontFamily: 'Graphik' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '230 Park Avenue South', city: 'New York', state: 'NY', country: 'USA', postalCode: '10003' }],
      personnel: [
        { name: 'Emilie Arel', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/emilie-arel/', isActive: true, joinedDate: '2022-02' },
        { name: 'Philip Krim', title: 'Co-Founder & Former CEO', linkedinUrl: 'https://www.linkedin.com/in/philipkrim/', isActive: false, joinedDate: '2014' },
        { name: 'Kiran Balakrishna', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/kiran-balakrishna/', isActive: true, joinedDate: '2021' },
        { name: 'Adam Gurian', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/adam-gurian/', isActive: true, joinedDate: '2020' },
        { name: 'Scott Lux', title: 'Chief Technology Officer', linkedinUrl: 'https://www.linkedin.com/in/scott-lux/', isActive: true, joinedDate: '2019' },
      ],
    },
  ],

  'Beauty / Cosmetics': [
    {
      name: 'Sephora',
      domain: 'sephora.com',
      tagline: 'The Beauty Insider',
      description: 'Sephora is a French multinational retailer of beauty and personal care products with a vast selection of prestige brands.',
      logoUrl: 'https://logo.clearbit.com/sephora.com',
      industry: 'Beauty / Cosmetics',
      keywords: ['sephora', 'beauty', 'cosmetics'],
      seoKeywords: ['makeup', 'skincare', 'beauty products', 'cosmetics store', 'beauty brands'],
      geoKeywords: ['sephora near me', 'makeup store', 'beauty products online'],
      competitors: [
        { name: 'Ulta Beauty', url: 'ulta.com', reason: 'Beauty retailer competitor' },
        { name: 'MAC Cosmetics', url: 'maccosmetics.com', reason: 'Prestige makeup brand' },
        { name: 'Bluemercury', url: 'bluemercury.com', reason: 'Luxury beauty retailer' },
        { name: 'Mecca', url: 'mecca.com.au', reason: 'Beauty retailer (Australia)' },
        { name: 'Boots', url: 'boots.com', reason: 'Beauty and pharmacy retailer' },
      ],
      valuePropositions: ['Prestige brand selection', 'Beauty Insider program', 'Expert services', 'Innovation hub'],
      socialLinks: { twitter: 'https://twitter.com/Sephora', linkedin: 'https://linkedin.com/company/sephora', facebook: 'https://facebook.com/Sephora', instagram: 'https://instagram.com/sephora', youtube: 'https://youtube.com/user/sephora' },
      voice: { tone: 'empowering' as const, personality: ['inclusive', 'trendy', 'expert', 'confident'], targetAudience: 'Beauty enthusiasts seeking premium products', keyMessages: ['Beauty for all', 'Innovation', 'Expertise', 'Self-expression'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#E30613', colorPalette: ['#000000', '#FFFFFF', '#E30613'], fontFamily: 'HelveticaNeueLTStd' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '525 Market Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94105' }],
      personnel: [
        { name: 'Artemis Patrick', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/artemis-patrick/', isActive: true, joinedDate: '2024-01' },
        { name: 'Jean-André Rougeot', title: 'President & CEO (LVMH)', linkedinUrl: 'https://www.linkedin.com/in/jean-andre-rougeot/', isActive: true, joinedDate: '2021' },
        { name: 'Deborah Yeh', title: 'CMO', linkedinUrl: 'https://www.linkedin.com/in/deborah-yeh/', isActive: true, joinedDate: '2020' },
        { name: 'Mary Beth Laughton', title: 'EVP Retail', linkedinUrl: 'https://www.linkedin.com/in/mary-beth-laughton/', isActive: true, joinedDate: '2015' },
        { name: 'Carolyn Bojanowski', title: 'SVP & General Manager Sephora Collection', linkedinUrl: 'https://www.linkedin.com/in/carolyn-bojanowski/', isActive: true, joinedDate: '2016' },
      ],
    },
    {
      name: 'Glossier',
      domain: 'glossier.com',
      tagline: 'Skin first. Makeup second. Smile always.',
      description: 'Glossier is a direct-to-consumer beauty brand focused on natural, easy-to-use skincare and makeup products.',
      logoUrl: 'https://logo.clearbit.com/glossier.com',
      industry: 'Beauty / Cosmetics',
      keywords: ['glossier', 'skincare', 'beauty'],
      seoKeywords: ['natural makeup', 'minimalist skincare', 'beauty essentials', 'clean beauty', 'dewy skin'],
      geoKeywords: ['buy glossier', 'natural beauty products', 'minimalist makeup'],
      competitors: [
        { name: 'Fenty Beauty', url: 'fentybeauty.com', reason: 'Direct-to-consumer beauty' },
        { name: 'The Ordinary', url: 'theordinary.com', reason: 'Affordable skincare' },
        { name: 'Milk Makeup', url: 'milkmakeup.com', reason: 'Clean beauty brand' },
        { name: 'Rare Beauty', url: 'rarebeauty.com', reason: 'Celebrity beauty brand' },
        { name: 'Ilia Beauty', url: 'iliabeauty.com', reason: 'Clean makeup brand' },
      ],
      valuePropositions: ['Community-driven development', 'Minimalist aesthetic', 'Skin-first philosophy', 'Direct-to-consumer model'],
      socialLinks: { twitter: 'https://twitter.com/glossier', linkedin: 'https://linkedin.com/company/glossier', facebook: 'https://facebook.com/glossier', instagram: 'https://instagram.com/glossier', youtube: 'https://youtube.com/c/glossier' },
      voice: { tone: 'conversational' as const, personality: ['approachable', 'authentic', 'minimalist', 'community-driven'], targetAudience: 'Millennials and Gen Z seeking natural beauty', keyMessages: ['Real skin first', 'Less is more', 'Community', 'Authenticity'], avoidTopics: [] },
      visual: { primaryColor: '#FF3D6A', secondaryColor: '#FFFFFF', accentColor: '#F5F5F5', colorPalette: ['#FF3D6A', '#FFFFFF', '#F5F5F5'], fontFamily: 'Apercu' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '233 Spring Street', city: 'New York', state: 'NY', country: 'USA', postalCode: '10013' }],
      personnel: [
        { name: 'Kyle Leahy', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/kyle-leahy/', isActive: true, joinedDate: '2022-05' },
        { name: 'Emily Weiss', title: 'Founder & Executive Chairwoman', linkedinUrl: 'https://www.linkedin.com/in/emilyweiss/', isActive: true, joinedDate: '2014' },
        { name: 'Henry Davis', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/henry-davis/', isActive: true, joinedDate: '2021' },
        { name: 'Ali Weiss', title: 'Chief Creative Officer', linkedinUrl: 'https://www.linkedin.com/in/ali-weiss/', isActive: true, joinedDate: '2015' },
        { name: 'Anna McNair', title: 'Chief Brand Officer', linkedinUrl: 'https://www.linkedin.com/in/anna-mcnair/', isActive: true, joinedDate: '2022' },
      ],
    },
    {
      name: 'Fenty Beauty',
      domain: 'fentybeauty.com',
      tagline: 'Beauty for All',
      description: 'Fenty Beauty is Rihanna\'s inclusive beauty brand offering diverse shade ranges and innovative products for all skin tones.',
      logoUrl: 'https://logo.clearbit.com/fentybeauty.com',
      industry: 'Beauty / Cosmetics',
      keywords: ['fenty beauty', 'inclusive beauty', 'rihanna'],
      seoKeywords: ['inclusive makeup', 'diverse foundation shades', 'celebrity beauty brand', 'all skin tones', 'fenty foundation'],
      geoKeywords: ['fenty beauty near me', 'inclusive foundation', 'buy fenty beauty'],
      competitors: [
        { name: 'MAC Cosmetics', url: 'maccosmetics.com', reason: 'Prestige makeup competitor' },
        { name: 'Glossier', url: 'glossier.com', reason: 'Direct-to-consumer beauty' },
        { name: 'Rare Beauty', url: 'rarebeauty.com', reason: 'Celebrity beauty brand' },
        { name: 'Huda Beauty', url: 'hudabeauty.com', reason: 'Influencer beauty brand' },
        { name: 'Pat McGrath Labs', url: 'patmcgrath.com', reason: 'Prestige makeup brand' },
      ],
      valuePropositions: ['Inclusive shade ranges', 'Celebrity credibility', 'Innovation', 'High performance'],
      socialLinks: { twitter: 'https://twitter.com/fentybeauty', linkedin: 'https://linkedin.com/company/fenty-beauty', facebook: 'https://facebook.com/fentybeauty', instagram: 'https://instagram.com/fentybeauty', youtube: 'https://youtube.com/c/fentybeauty' },
      voice: { tone: 'bold' as const, personality: ['inclusive', 'confident', 'innovative', 'unapologetic'], targetAudience: 'All beauty consumers seeking inclusive products', keyMessages: ['Beauty for all', 'Inclusion', 'Innovation', 'Unapologetic'], avoidTopics: [] },
      visual: { primaryColor: '#000000', secondaryColor: '#FFFFFF', accentColor: '#FFD700', colorPalette: ['#000000', '#FFFFFF', '#FFD700'], fontFamily: 'Proxima Nova' },
      benchmarkTier: 'gold' as const,
      locations: [{ type: 'headquarters' as const, address: '41 rue Ybry', city: 'Neuilly-sur-Seine', country: 'France', postalCode: '92200' }],
      personnel: [
        { name: 'Robyn Rihanna Fenty', title: 'Founder & Creative Director', linkedinUrl: 'https://www.linkedin.com/in/rihanna/', isActive: true, joinedDate: '2017' },
        { name: 'Aida Moudachirou-Rebois', title: 'CEO of Fenty Maison', linkedinUrl: 'https://www.linkedin.com/in/aida-moudachirou-rebois/', isActive: true, joinedDate: '2023' },
        { name: 'Martin Brok', title: 'CEO (LVMH Brands)', linkedinUrl: 'https://www.linkedin.com/in/martin-brok/', isActive: true, joinedDate: '2019' },
        { name: 'Priscilla Ono', title: 'Global Makeup Artist', linkedinUrl: 'https://www.linkedin.com/in/priscilla-ono/', isActive: true, joinedDate: '2017' },
        { name: 'Karen Hibbert-Delaney', title: 'VP Global Brand Management', linkedinUrl: 'https://www.linkedin.com/in/karen-hibbert-delaney/', isActive: true, joinedDate: '2020' },
      ],
    },
    {
      name: 'The Ordinary',
      domain: 'theordinary.com',
      tagline: 'Clinical formulations with integrity',
      description: 'The Ordinary offers clinical skincare at accessible prices with transparent ingredient-focused formulations.',
      logoUrl: 'https://logo.clearbit.com/theordinary.com',
      industry: 'Beauty / Cosmetics',
      keywords: ['the ordinary', 'skincare', 'affordable'],
      seoKeywords: ['affordable skincare', 'clinical skincare', 'active ingredients', 'niacinamide', 'retinol serum'],
      geoKeywords: ['buy the ordinary', 'affordable clinical skincare', 'the ordinary products'],
      competitors: [
        { name: 'CeraVe', url: 'cerave.com', reason: 'Dermatologist-recommended skincare' },
        { name: 'Paula\'s Choice', url: 'paulaschoice.com', reason: 'Ingredient-focused skincare' },
        { name: 'Glossier', url: 'glossier.com', reason: 'Minimalist skincare brand' },
        { name: 'Drunk Elephant', url: 'drunkelephant.com', reason: 'Clean clinical skincare' },
        { name: 'Inkey List', url: 'theinkeylist.com', reason: 'Affordable active skincare' },
      ],
      valuePropositions: ['Transparent formulations', 'Clinical efficacy', 'Accessible pricing', 'Ingredient education'],
      socialLinks: { twitter: 'https://twitter.com/TheOrdinary', linkedin: 'https://linkedin.com/company/the-ordinary', facebook: 'https://facebook.com/TheOrdinary', instagram: 'https://instagram.com/theordinary', youtube: 'https://youtube.com/c/theordinary' },
      voice: { tone: 'scientific' as const, personality: ['transparent', 'clinical', 'educational', 'accessible'], targetAudience: 'Ingredient-conscious skincare enthusiasts', keyMessages: ['Transparency', 'Efficacy', 'Education', 'Accessibility'], avoidTopics: [] },
      visual: { primaryColor: '#FFFFFF', secondaryColor: '#000000', accentColor: '#E5E5E5', colorPalette: ['#FFFFFF', '#000000', '#E5E5E5'], fontFamily: 'Helvetica Neue' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '25 Richmond Street West', city: 'Toronto', state: 'ON', country: 'Canada', postalCode: 'M5H 2G4' }],
      personnel: [
        { name: 'Nicola Kilner', title: 'CEO of DECIEM', linkedinUrl: 'https://www.linkedin.com/in/nicola-kilner/', isActive: true, joinedDate: '2017' },
        { name: 'Prudvi Kaka', title: 'COO of DECIEM', linkedinUrl: 'https://www.linkedin.com/in/prudvi-kaka/', isActive: true, joinedDate: '2019' },
        { name: 'Brandon Truaxe', title: 'Founder (Deceased)', linkedinUrl: 'https://www.linkedin.com/in/brandon-truaxe/', isActive: false, joinedDate: '2013' },
        { name: 'Kelly Tisdale', title: 'CFO of DECIEM', linkedinUrl: 'https://www.linkedin.com/in/kelly-tisdale/', isActive: true, joinedDate: '2020' },
        { name: 'Pasquale Cusano', title: 'Chief Scientific Officer', linkedinUrl: 'https://www.linkedin.com/in/pasquale-cusano/', isActive: true, joinedDate: '2016' },
      ],
    },
    {
      name: 'Drunk Elephant',
      domain: 'drunkelephant.com',
      tagline: 'A philosophy of non-toxic ingredients and formulation excellence',
      description: 'Drunk Elephant is a clean skincare brand committed to biocompatible ingredients and effective formulations.',
      logoUrl: 'https://logo.clearbit.com/drunkelephant.com',
      industry: 'Beauty / Cosmetics',
      keywords: ['drunk elephant', 'clean beauty', 'skincare'],
      seoKeywords: ['clean skincare', 'non-toxic beauty', 'biocompatible skincare', 'luxury clean beauty', 'effective skincare'],
      geoKeywords: ['buy drunk elephant', 'clean beauty products', 'luxury skincare'],
      competitors: [
        { name: 'Tatcha', url: 'tatcha.com', reason: 'Luxury clean skincare' },
        { name: 'The Ordinary', url: 'theordinary.com', reason: 'Clinical skincare competitor' },
        { name: 'Sunday Riley', url: 'sundayriley.com', reason: 'Luxury active skincare' },
        { name: 'Biossance', url: 'biossance.com', reason: 'Clean effective skincare' },
        { name: 'Youth to the People', url: 'youthtothepeople.com', reason: 'Vegan clean skincare' },
      ],
      valuePropositions: ['Clean biocompatible formulations', 'Effective actives', 'Luxury positioning', 'Transparent ingredients'],
      socialLinks: { twitter: 'https://twitter.com/drunkelephant', linkedin: 'https://linkedin.com/company/drunk-elephant', facebook: 'https://facebook.com/drunkelephant', instagram: 'https://instagram.com/drunkelephant', youtube: 'https://youtube.com/c/drunkelephant' },
      voice: { tone: 'educational' as const, personality: ['clean', 'effective', 'playful', 'premium'], targetAudience: 'Clean beauty enthusiasts seeking effective products', keyMessages: ['Clean compatible', 'Effective', 'Biocompatible', 'Results'], avoidTopics: [] },
      visual: { primaryColor: '#FF6B98', secondaryColor: '#FFFFFF', accentColor: '#4ECDC4', colorPalette: ['#FF6B98', '#FFFFFF', '#4ECDC4'], fontFamily: 'Apercu' },
      benchmarkTier: 'silver' as const,
      locations: [{ type: 'headquarters' as const, address: '2525 West End Avenue', city: 'Nashville', state: 'TN', country: 'USA', postalCode: '37203' }],
      personnel: [
        { name: 'Tiffany Masterson', title: 'Founder & Chief Creative Officer', linkedinUrl: 'https://www.linkedin.com/in/tiffany-masterson/', isActive: true, joinedDate: '2012' },
        { name: 'Maureen Case', title: 'CEO (Shiseido Americas)', linkedinUrl: 'https://www.linkedin.com/in/maureen-case/', isActive: true, joinedDate: '2020' },
        { name: 'Susie Kim', title: 'VP of Product Development', linkedinUrl: 'https://www.linkedin.com/in/susie-kim/', isActive: true, joinedDate: '2016' },
        { name: 'Brian Oh', title: 'Chief Product Officer (Shiseido)', linkedinUrl: 'https://www.linkedin.com/in/brian-oh/', isActive: true, joinedDate: '2021' },
        { name: 'Jessica Faulkner', title: 'SVP Global Marketing', linkedinUrl: 'https://www.linkedin.com/in/jessica-faulkner/', isActive: true, joinedDate: '2019' },
      ],
    },
  ],
};

async function main() {
  console.log('\n🚀 Populating Expansion Industries - Part 3 (12 New Brands)\n');
  console.log(`Industries: ${Object.keys(ALL_INDUSTRIES).length}`);
  console.log(`Total Brands: ${Object.values(ALL_INDUSTRIES).flat().length}\n`);

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
