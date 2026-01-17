/**
 * Enrich Benchmark Brands with Locations and Personnel
 * Adds business locations and key personnel (C-suite, directors, executives) to benchmark brands
 */

import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema/brands';
import { eq } from 'drizzle-orm';
import type { BrandLocation, BrandPersonnel } from '@/lib/db/schema/brands';

interface BrandEnrichment {
  domain: string;
  locations: BrandLocation[];
  personnel: BrandPersonnel[];
}

// Benchmark brand enrichment data
const enrichmentData: BrandEnrichment[] = [
  // SaaS / B2B Software
  {
    domain: 'hubspot.com',
    locations: [
      {
        type: 'headquarters',
        address: '25 First Street, 2nd Floor',
        city: 'Cambridge',
        state: 'MA',
        country: 'USA',
        postalCode: '02141',
      },
    ],
    personnel: [
      {
        name: 'Yamini Rangan',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/yaminirangan/',
        isActive: true,
        joinedDate: '2020-09',
      },
      {
        name: 'Kate Bueker',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/kate-bueker/',
        isActive: true,
        joinedDate: '2020-11',
      },
      {
        name: 'Andy Pitre',
        title: 'EVP of Engineering',
        linkedinUrl: 'https://www.linkedin.com/in/andy-pitre/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Kipp Bodnar',
        title: 'CMO',
        linkedinUrl: 'https://www.linkedin.com/in/kippbodnar/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Brian Halligan',
        title: 'Executive Chairman & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/brianhalligan/',
        isActive: true,
        joinedDate: '2006',
      },
    ],
  },
  {
    domain: 'salesforce.com',
    locations: [
      {
        type: 'headquarters',
        address: 'Salesforce Tower, 415 Mission Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94105',
      },
    ],
    personnel: [
      {
        name: 'Marc Benioff',
        title: 'Chair & CEO',
        linkedinUrl: 'https://www.linkedin.com/in/marcbenioff/',
        isActive: true,
        joinedDate: '1999',
      },
      {
        name: 'Amy Weaver',
        title: 'President & CFO',
        linkedinUrl: 'https://www.linkedin.com/in/amy-weaver/',
        isActive: true,
        joinedDate: '2021-01',
      },
      {
        name: 'Brian Millham',
        title: 'President & COO',
        linkedinUrl: 'https://www.linkedin.com/in/brian-millham/',
        isActive: true,
        joinedDate: '2019',
      },
      {
        name: 'Ariel Kelman',
        title: 'CMO',
        linkedinUrl: 'https://www.linkedin.com/in/arielkelman/',
        isActive: true,
        joinedDate: '2022-03',
      },
      {
        name: 'Sabastian Niles',
        title: 'President & Chief Legal Officer',
        linkedinUrl: 'https://www.linkedin.com/in/sabastian-niles/',
        isActive: true,
        joinedDate: '2021',
      },
    ],
  },
  {
    domain: 'slack.com',
    locations: [
      {
        type: 'headquarters',
        address: '500 Howard Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94105',
      },
    ],
    personnel: [
      {
        name: 'Denise Dresser',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/denise-dresser/',
        isActive: true,
        joinedDate: '2022-01',
      },
      {
        name: 'Stewart Butterfield',
        title: 'Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/butterfield/',
        isActive: false,
        joinedDate: '2013',
      },
      {
        name: 'Tamar Yehoshua',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/tamar-yehoshua/',
        isActive: true,
        joinedDate: '2018-08',
      },
      {
        name: 'Christina Kosmowski',
        title: 'Chief Customer Officer',
        linkedinUrl: 'https://www.linkedin.com/in/christinakosmowski/',
        isActive: true,
        joinedDate: '2021',
      },
      {
        name: 'Jonathan Prince',
        title: 'VP of Communications & Policy',
        linkedinUrl: 'https://www.linkedin.com/in/jonathanprince/',
        isActive: true,
        joinedDate: '2016',
      },
    ],
  },
  {
    domain: 'airtable.com',
    locations: [
      {
        type: 'headquarters',
        address: '799 Market Street, 8th Floor',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94103',
      },
    ],
    personnel: [
      {
        name: 'Howie Liu',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/howieliu/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Andrew Ofstad',
        title: 'Co-Founder & CPO',
        linkedinUrl: 'https://www.linkedin.com/in/andrewofstad/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Emmett Nicholas',
        title: 'Co-Founder & CTO',
        linkedinUrl: 'https://www.linkedin.com/in/emmettnicholas/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Rishi Bhargava',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/rishikbhargava/',
        isActive: true,
        joinedDate: '2022',
      },
      {
        name: 'Krishna Srinivasan',
        title: 'Chief Revenue Officer',
        linkedinUrl: 'https://www.linkedin.com/in/krishnasrinivasan/',
        isActive: true,
        joinedDate: '2021',
      },
    ],
  },

  // E-commerce / Retail
  {
    domain: 'shopify.com',
    locations: [
      {
        type: 'headquarters',
        address: '151 O\'Connor Street',
        city: 'Ottawa',
        state: 'ON',
        country: 'Canada',
        postalCode: 'K2P 2L8',
      },
    ],
    personnel: [
      {
        name: 'Harley Finkelstein',
        title: 'President',
        linkedinUrl: 'https://www.linkedin.com/in/harleyf/',
        isActive: true,
        joinedDate: '2010',
      },
      {
        name: 'Tobi Lütke',
        title: 'CEO & Founder',
        linkedinUrl: 'https://www.linkedin.com/in/tobi/',
        isActive: true,
        joinedDate: '2004',
      },
      {
        name: 'Amy Shapero',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/amy-shapero/',
        isActive: true,
        joinedDate: '2021-12',
      },
      {
        name: 'Kaz Nejatian',
        title: 'VP of Product & COO',
        linkedinUrl: 'https://www.linkedin.com/in/kaz/',
        isActive: true,
        joinedDate: '2021',
      },
      {
        name: 'Jeff Hoffmeister',
        title: 'Chief Legal Officer',
        linkedinUrl: 'https://www.linkedin.com/in/jeff-hoffmeister/',
        isActive: true,
        joinedDate: '2021',
      },
    ],
  },
  {
    domain: 'etsy.com',
    locations: [
      {
        type: 'headquarters',
        address: '117 Adams Street',
        city: 'Brooklyn',
        state: 'NY',
        country: 'USA',
        postalCode: '11201',
      },
    ],
    personnel: [
      {
        name: 'Josh Silverman',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/joshsilverman/',
        isActive: true,
        joinedDate: '2017-05',
      },
      {
        name: 'Rachel Glaser',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/rachel-glaser/',
        isActive: true,
        joinedDate: '2019-04',
      },
      {
        name: 'Raina Moskowitz',
        title: 'COO',
        linkedinUrl: 'https://www.linkedin.com/in/rainamoskowitz/',
        isActive: true,
        joinedDate: '2021-01',
      },
      {
        name: 'Nick Daniel',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/nickdaniel/',
        isActive: true,
        joinedDate: '2021-09',
      },
      {
        name: 'Ryan Scott',
        title: 'Chief Marketing Officer',
        linkedinUrl: 'https://www.linkedin.com/in/ryan-scott/',
        isActive: true,
        joinedDate: '2020-04',
      },
    ],
  },

  // Fintech / Financial Services
  {
    domain: 'stripe.com',
    locations: [
      {
        type: 'headquarters',
        address: '354 Oyster Point Boulevard',
        city: 'South San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94080',
      },
    ],
    personnel: [
      {
        name: 'Patrick Collison',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/patrick-collison/',
        isActive: true,
        joinedDate: '2010',
      },
      {
        name: 'John Collison',
        title: 'President & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/john-collison/',
        isActive: true,
        joinedDate: '2010',
      },
      {
        name: 'David Singleton',
        title: 'CTO',
        linkedinUrl: 'https://www.linkedin.com/in/dsingleton/',
        isActive: true,
        joinedDate: '2022-09',
      },
      {
        name: 'Dhivya Suryadevara',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/dhivya-suryadevara/',
        isActive: true,
        joinedDate: '2021-09',
      },
      {
        name: 'Will Gaybrick',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/wgaybrick/',
        isActive: true,
        joinedDate: '2014',
      },
    ],
  },
  {
    domain: 'robinhood.com',
    locations: [
      {
        type: 'headquarters',
        address: '85 Willow Road',
        city: 'Menlo Park',
        state: 'CA',
        country: 'USA',
        postalCode: '94025',
      },
    ],
    personnel: [
      {
        name: 'Vlad Tenev',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/vladtenev/',
        isActive: true,
        joinedDate: '2013',
      },
      {
        name: 'Jason Warnick',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/jason-warnick/',
        isActive: true,
        joinedDate: '2019-03',
      },
      {
        name: 'Steve Quirk',
        title: 'Chief Brokerage Officer',
        linkedinUrl: 'https://www.linkedin.com/in/steve-quirk/',
        isActive: true,
        joinedDate: '2018',
      },
      {
        name: 'Gretchen Howard',
        title: 'Chief Revenue Officer',
        linkedinUrl: 'https://www.linkedin.com/in/gretchenhoward/',
        isActive: true,
        joinedDate: '2021-03',
      },
      {
        name: 'Christine Brown',
        title: 'COO',
        linkedinUrl: 'https://www.linkedin.com/in/christine-brown/',
        isActive: true,
        joinedDate: '2020-05',
      },
    ],
  },

  // Healthcare / Wellness
  {
    domain: 'headspace.com',
    locations: [
      {
        type: 'headquarters',
        address: '2415 Michigan Avenue',
        city: 'Santa Monica',
        state: 'CA',
        country: 'USA',
        postalCode: '90404',
      },
    ],
    personnel: [
      {
        name: 'Russell Glass',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/russellglass/',
        isActive: true,
        joinedDate: '2021-05',
      },
      {
        name: 'Andy Puddicombe',
        title: 'Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/andy-puddicombe/',
        isActive: true,
        joinedDate: '2010',
      },
      {
        name: 'Frank Meehan',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/frank-meehan/',
        isActive: true,
        joinedDate: '2023-01',
      },
      {
        name: 'Will Peng',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/will-peng/',
        isActive: true,
        joinedDate: '2021',
      },
      {
        name: 'Lauren Weinberg',
        title: 'Chief Marketing Officer',
        linkedinUrl: 'https://www.linkedin.com/in/lauren-weinberg/',
        isActive: true,
        joinedDate: '2022-02',
      },
    ],
  },
  {
    domain: 'onepeloton.com',
    locations: [
      {
        type: 'headquarters',
        address: '441 Ninth Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
      },
    ],
    personnel: [
      {
        name: 'Barry McCarthy',
        title: 'CEO & President',
        linkedinUrl: 'https://www.linkedin.com/in/barry-mccarthy/',
        isActive: true,
        joinedDate: '2022-02',
      },
      {
        name: 'Liz Coddington',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/liz-coddington/',
        isActive: true,
        joinedDate: '2022-02',
      },
      {
        name: 'Jill Foley',
        title: 'Chief Financial Officer',
        linkedinUrl: 'https://www.linkedin.com/in/jill-foley/',
        isActive: false,
        joinedDate: '2018',
      },
      {
        name: 'Dalana Brand',
        title: 'Chief People Officer',
        linkedinUrl: 'https://www.linkedin.com/in/dalanabrand/',
        isActive: true,
        joinedDate: '2022-08',
      },
      {
        name: 'Nick Caldwell',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/nickcaldwell/',
        isActive: true,
        joinedDate: '2022-08',
      },
    ],
  },

  // Education / E-Learning
  {
    domain: 'coursera.org',
    locations: [
      {
        type: 'headquarters',
        address: '381 E. Evelyn Avenue',
        city: 'Mountain View',
        state: 'CA',
        country: 'USA',
        postalCode: '94041',
      },
    ],
    personnel: [
      {
        name: 'Jeff Maggioncalda',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/jeffmaggionc',
        isActive: true,
        joinedDate: '2017-05',
      },
      {
        name: 'Kenneth Hahn',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/kenneth-hahn/',
        isActive: true,
        joinedDate: '2019-01',
      },
      {
        name: 'Shravan Goli',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/shravangoli/',
        isActive: true,
        joinedDate: '2017',
      },
      {
        name: 'Leah Belsky',
        title: 'Chief Enterprise Officer',
        linkedinUrl: 'https://www.linkedin.com/in/leahbelsky/',
        isActive: true,
        joinedDate: '2016',
      },
      {
        name: 'Daphne Koller',
        title: 'Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/daphne-koller/',
        isActive: false,
        joinedDate: '2012',
      },
    ],
  },
  {
    domain: 'duolingo.com',
    locations: [
      {
        type: 'headquarters',
        address: '5900 Penn Avenue',
        city: 'Pittsburgh',
        state: 'PA',
        country: 'USA',
        postalCode: '15206',
      },
    ],
    personnel: [
      {
        name: 'Luis von Ahn',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/luisvonahn/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Matt Skaruppa',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/matthew-skaruppa/',
        isActive: true,
        joinedDate: '2021-01',
      },
      {
        name: 'Severin Hacker',
        title: 'CTO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/severinhacker/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Bob Meese',
        title: 'Chief Revenue Officer',
        linkedinUrl: 'https://www.linkedin.com/in/bobmeese/',
        isActive: true,
        joinedDate: '2022-06',
      },
      {
        name: 'Manu Orssaud',
        title: 'Chief Design Officer',
        linkedinUrl: 'https://www.linkedin.com/in/manuorssaud/',
        isActive: true,
        joinedDate: '2021',
      },
    ],
  },

  // Marketing / Martech
  {
    domain: 'canva.com',
    locations: [
      {
        type: 'headquarters',
        address: '110 Kippax Street',
        city: 'Surry Hills',
        state: 'NSW',
        country: 'Australia',
        postalCode: '2010',
      },
    ],
    personnel: [
      {
        name: 'Melanie Perkins',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/melanieperkins/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Cliff Obrecht',
        title: 'COO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/cliff-obrecht/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Cameron Adams',
        title: 'Chief Product Officer & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/themaninblue/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Zach Kitschke',
        title: 'Chief Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/zkitschke/',
        isActive: true,
        joinedDate: '2015',
      },
      {
        name: 'Jennie Rogerson',
        title: 'Chief People Officer',
        linkedinUrl: 'https://www.linkedin.com/in/jennierogerson/',
        isActive: true,
        joinedDate: '2020',
      },
    ],
  },
  {
    domain: 'mailchimp.com',
    locations: [
      {
        type: 'headquarters',
        address: '675 Ponce de Leon Avenue NE',
        city: 'Atlanta',
        state: 'GA',
        country: 'USA',
        postalCode: '30308',
      },
    ],
    personnel: [
      {
        name: 'Rania Succar',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/rania-succar/',
        isActive: true,
        joinedDate: '2023-03',
      },
      {
        name: 'Ben Chestnut',
        title: 'Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/benchestnut/',
        isActive: false,
        joinedDate: '2001',
      },
      {
        name: 'Michelle Taite',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/michelle-taite/',
        isActive: true,
        joinedDate: '2022-06',
      },
      {
        name: 'John Foreman',
        title: 'SVP Product Management',
        linkedinUrl: 'https://www.linkedin.com/in/john-foreman/',
        isActive: true,
        joinedDate: '2015',
      },
      {
        name: 'Tom Klein',
        title: 'Chief Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/tomklein/',
        isActive: true,
        joinedDate: '2021',
      },
    ],
  },

  // Food & Beverage
  {
    domain: 'doordash.com',
    locations: [
      {
        type: 'headquarters',
        address: '303 2nd Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94107',
      },
    ],
    personnel: [
      {
        name: 'Tony Xu',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/tonyxu1/',
        isActive: true,
        joinedDate: '2013',
      },
      {
        name: 'Ravi Inukonda',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/ravi-inukonda/',
        isActive: true,
        joinedDate: '2022-05',
      },
      {
        name: 'Christopher Payne',
        title: 'President & COO',
        linkedinUrl: 'https://www.linkedin.com/in/chris-payne/',
        isActive: true,
        joinedDate: '2021-04',
      },
      {
        name: 'Prabir Adarkar',
        title: 'Chief Financial Officer',
        linkedinUrl: 'https://www.linkedin.com/in/prabirAdarkar/',
        isActive: false,
        joinedDate: '2020-05',
      },
      {
        name: 'Rajat Shroff',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/rajatshroff/',
        isActive: true,
        joinedDate: '2020',
      },
    ],
  },
  {
    domain: 'hellofresh.com',
    locations: [
      {
        type: 'headquarters',
        address: 'Saarbrücker Straße 37-38',
        city: 'Berlin',
        country: 'Germany',
        postalCode: '10405',
      },
    ],
    personnel: [
      {
        name: 'Dominik Richter',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/dominik-richter/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Christian Gärtner',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/christian-g%C3%A4rtner/',
        isActive: true,
        joinedDate: '2018',
      },
      {
        name: 'Thomas Griesel',
        title: 'Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/thomas-griesel/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Edward Boyes',
        title: 'Chief Product & Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/edward-boyes/',
        isActive: true,
        joinedDate: '2017',
      },
      {
        name: 'Olga Blsochin',
        title: 'Chief People Officer',
        linkedinUrl: 'https://www.linkedin.com/in/olga-blochina/',
        isActive: true,
        joinedDate: '2019',
      },
    ],
  },

  // Travel / Hospitality
  {
    domain: 'airbnb.com',
    locations: [
      {
        type: 'headquarters',
        address: '888 Brannan Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94103',
      },
    ],
    personnel: [
      {
        name: 'Brian Chesky',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/brianchesky/',
        isActive: true,
        joinedDate: '2008',
      },
      {
        name: 'Dave Stephenson',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/dave-stephenson/',
        isActive: true,
        joinedDate: '2020-06',
      },
      {
        name: 'Joe Gebbia',
        title: 'Co-Founder & Chairman',
        linkedinUrl: 'https://www.linkedin.com/in/jgebbia/',
        isActive: true,
        joinedDate: '2008',
      },
      {
        name: 'Nathan Blecharczyk',
        title: 'Co-Founder & Chief Strategy Officer',
        linkedinUrl: 'https://www.linkedin.com/in/nathanblecharczyk/',
        isActive: true,
        joinedDate: '2008',
      },
      {
        name: 'Hiroki Asai',
        title: 'Chief Marketing Officer',
        linkedinUrl: 'https://www.linkedin.com/in/hirokiasai/',
        isActive: true,
        joinedDate: '2022-09',
      },
    ],
  },
  {
    domain: 'booking.com',
    locations: [
      {
        type: 'headquarters',
        address: 'Herengracht 597',
        city: 'Amsterdam',
        country: 'Netherlands',
        postalCode: '1017 CE',
      },
    ],
    personnel: [
      {
        name: 'Glenn Fogel',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/glenn-fogel/',
        isActive: true,
        joinedDate: '2017-01',
      },
      {
        name: 'David Goulden',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/david-goulden/',
        isActive: true,
        joinedDate: '2017-08',
      },
      {
        name: 'Arjan Dijk',
        title: 'SVP & CMO',
        linkedinUrl: 'https://www.linkedin.com/in/arjandijk/',
        isActive: true,
        joinedDate: '2015',
      },
      {
        name: 'Matthias Schmid',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/matthias-schmid/',
        isActive: true,
        joinedDate: '2019',
      },
      {
        name: 'Gillian Tans',
        title: 'Former CEO',
        linkedinUrl: 'https://www.linkedin.com/in/gilliantans/',
        isActive: false,
        joinedDate: '2002',
      },
    ],
  },

  // Entertainment / Media
  {
    domain: 'spotify.com',
    locations: [
      {
        type: 'headquarters',
        address: 'Regeringsgatan 19',
        city: 'Stockholm',
        country: 'Sweden',
        postalCode: '111 53',
      },
    ],
    personnel: [
      {
        name: 'Daniel Ek',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/danielek/',
        isActive: true,
        joinedDate: '2006',
      },
      {
        name: 'Paul Vogel',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/paul-vogel/',
        isActive: true,
        joinedDate: '2020-01',
      },
      {
        name: 'Gustav Söderström',
        title: 'Chief Product & Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/gustavsoederstroem/',
        isActive: true,
        joinedDate: '2013',
      },
      {
        name: 'Alex Norström',
        title: 'Chief Business Officer',
        linkedinUrl: 'https://www.linkedin.com/in/alexnorstrom/',
        isActive: true,
        joinedDate: '2014',
      },
      {
        name: 'Katarina Berg',
        title: 'Chief Human Resources Officer',
        linkedinUrl: 'https://www.linkedin.com/in/katarina-berg/',
        isActive: true,
        joinedDate: '2016',
      },
    ],
  },
  {
    domain: 'netflix.com',
    locations: [
      {
        type: 'headquarters',
        address: '121 Albright Way',
        city: 'Los Gatos',
        state: 'CA',
        country: 'USA',
        postalCode: '95032',
      },
    ],
    personnel: [
      {
        name: 'Ted Sarandos',
        title: 'Co-CEO',
        linkedinUrl: 'https://www.linkedin.com/in/ted-sarandos/',
        isActive: true,
        joinedDate: '2000',
      },
      {
        name: 'Greg Peters',
        title: 'Co-CEO',
        linkedinUrl: 'https://www.linkedin.com/in/greg-peters/',
        isActive: true,
        joinedDate: '2008',
      },
      {
        name: 'Spencer Neumann',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/spencer-neumann/',
        isActive: true,
        joinedDate: '2019-01',
      },
      {
        name: 'Bela Bajaria',
        title: 'Chief Content Officer',
        linkedinUrl: 'https://www.linkedin.com/in/bela-bajaria/',
        isActive: true,
        joinedDate: '2016',
      },
      {
        name: 'Rachel Whetstone',
        title: 'Chief Communications Officer',
        linkedinUrl: 'https://www.linkedin.com/in/rachelwhetstone/',
        isActive: true,
        joinedDate: '2015',
      },
    ],
  },

  // Real Estate / PropTech
  {
    domain: 'zillow.com',
    locations: [
      {
        type: 'headquarters',
        address: '1301 Second Avenue',
        city: 'Seattle',
        state: 'WA',
        country: 'USA',
        postalCode: '98101',
      },
    ],
    personnel: [
      {
        name: 'Rich Barton',
        title: 'CEO & Co-Founder',
        linkedinUrl: 'https://www.linkedin.com/in/richbarton/',
        isActive: true,
        joinedDate: '2005',
      },
      {
        name: 'Jeremy Wacksman',
        title: 'President & COO',
        linkedinUrl: 'https://www.linkedin.com/in/jeremywacksman/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Allen Parker',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/allen-parker/',
        isActive: true,
        joinedDate: '2021-07',
      },
      {
        name: 'Jun Choo',
        title: 'Chief Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/junchoo/',
        isActive: true,
        joinedDate: '2022-05',
      },
      {
        name: 'Josh Weisberg',
        title: 'Chief Marketing Officer',
        linkedinUrl: 'https://www.linkedin.com/in/joshweisberg/',
        isActive: true,
        joinedDate: '2022-08',
      },
    ],
  },
  {
    domain: 'redfin.com',
    locations: [
      {
        type: 'headquarters',
        address: '1099 Stewart Street',
        city: 'Seattle',
        state: 'WA',
        country: 'USA',
        postalCode: '98101',
      },
    ],
    personnel: [
      {
        name: 'Glenn Kelman',
        title: 'CEO',
        linkedinUrl: 'https://www.linkedin.com/in/glennkelman/',
        isActive: true,
        joinedDate: '2005',
      },
      {
        name: 'Chris Nielsen',
        title: 'CFO',
        linkedinUrl: 'https://www.linkedin.com/in/chris-nielsen/',
        isActive: true,
        joinedDate: '2011',
      },
      {
        name: 'Adam Wiener',
        title: 'Chief Growth Officer',
        linkedinUrl: 'https://www.linkedin.com/in/adamwiener/',
        isActive: true,
        joinedDate: '2007',
      },
      {
        name: 'Bridget Frey',
        title: 'Chief Technology Officer',
        linkedinUrl: 'https://www.linkedin.com/in/bridgetfrey/',
        isActive: true,
        joinedDate: '2012',
      },
      {
        name: 'Christian Taubman',
        title: 'Chief Product Officer',
        linkedinUrl: 'https://www.linkedin.com/in/christian-taubman/',
        isActive: true,
        joinedDate: '2015',
      },
    ],
  },
];

async function main() {
  console.log('\n🔄 Enriching Benchmark Brands with Locations & Personnel\n');
  console.log(`Total brands to enrich: ${enrichmentData.length}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const data of enrichmentData) {
    try {
      console.log(`Processing: ${data.domain}...`);

      // Find brand by domain
      const brand = await db.query.brands.findFirst({
        where: eq(brands.domain, data.domain),
      });

      if (!brand) {
        console.log(`  ⏭️  Brand not found, skipping\n`);
        skipCount++;
        continue;
      }

      // Update brand with locations and personnel
      await db
        .update(brands)
        .set({
          locations: data.locations,
          personnel: data.personnel,
          updatedAt: new Date(),
        })
        .where(eq(brands.id, brand.id));

      console.log(`  ✅ Updated successfully`);
      console.log(`     Locations: ${data.locations.length}`);
      console.log(`     Personnel: ${data.personnel.length}\n`);
      successCount++;

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`  ❌ Error updating ${data.domain}:`, error);
      errorCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`⏭️  Skipped (not found): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`Total: ${enrichmentData.length}`);
  console.log(`${'='.repeat(60)}\n`);
}

main()
  .then(() => {
    console.log('✅ Enrichment complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
