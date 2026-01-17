/**
 * Enrich Remaining Benchmark Brands with Locations and Personnel
 * Part 2: Remaining 27 brands across all industries
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

const enrichmentData: BrandEnrichment[] = [
  // E-commerce (remaining)
  {
    domain: 'warbyparker.com',
    locations: [
      { type: 'headquarters', address: '233 Spring Street', city: 'New York', state: 'NY', country: 'USA', postalCode: '10013' },
    ],
    personnel: [
      { name: 'Dave Gilboa', title: 'Co-CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/gilboa/', isActive: true, joinedDate: '2010' },
      { name: 'Neil Blumenthal', title: 'Co-CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/neilblumenthal/', isActive: true, joinedDate: '2010' },
      { name: 'Steve Miller', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/steve-miller/', isActive: true, joinedDate: '2020-02' },
      { name: 'Russ Isling', title: 'Chief People Officer', linkedinUrl: 'https://www.linkedin.com/in/russ-isling/', isActive: true, joinedDate: '2018' },
      { name: 'Joanne O\'Connell', title: 'Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/joanneoconnell/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'glossier.com',
    locations: [
      { type: 'headquarters', address: '233 Spring Street', city: 'New York', state: 'NY', country: 'USA', postalCode: '10013' },
    ],
    personnel: [
      { name: 'Kyle Leahy', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/kyleleahy/', isActive: true, joinedDate: '2022-05' },
      { name: 'Emily Weiss', title: 'Executive Chairwoman & Founder', linkedinUrl: 'https://www.linkedin.com/in/emilyweiss/', isActive: true, joinedDate: '2014' },
      { name: 'Vanessa Wittman', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/vanessa-wittman/', isActive: true, joinedDate: '2022-11' },
      { name: 'Ali Weiss', title: 'Chief Brand Officer', linkedinUrl: 'https://www.linkedin.com/in/ali-weiss/', isActive: true, joinedDate: '2014' },
      { name: 'Kinga Daradics', title: 'Chief People Officer', linkedinUrl: 'https://www.linkedin.com/in/kingadaradics/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'allbirds.com',
    locations: [
      { type: 'headquarters', address: '730 Montgomery Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94111' },
    ],
    personnel: [
      { name: 'Joseph Zwillinger', title: 'Co-CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/joseph-zwillinger/', isActive: true, joinedDate: '2014' },
      { name: 'Tim Brown', title: 'Co-CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/timbrownallbirds/', isActive: true, joinedDate: '2014' },
      { name: 'Mike Bufano', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/michael-bufano/', isActive: true, joinedDate: '2021-02' },
      { name: 'Erick Haskell', title: 'President', linkedinUrl: 'https://www.linkedin.com/in/erick-haskell/', isActive: true, joinedDate: '2021-09' },
      { name: 'Jill Dumain', title: 'Chief Creative Officer', linkedinUrl: 'https://www.linkedin.com/in/jill-dumain/', isActive: true, joinedDate: '2018' },
    ],
  },

  // Fintech (remaining)
  {
    domain: 'wise.com',
    locations: [
      { type: 'headquarters', address: 'Tea Building, 56 Shoreditch High Street', city: 'London', country: 'United Kingdom', postalCode: 'E1 6JJ' },
    ],
    personnel: [
      { name: 'Kristo Käärmann', title: 'CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/kristokaarmann/', isActive: true, joinedDate: '2011' },
      { name: 'Matt Briers', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/matthewbriers/', isActive: true, joinedDate: '2015' },
      { name: 'Harsh Sinha', title: 'CTO', linkedinUrl: 'https://www.linkedin.com/in/harsh-sinha/', isActive: true, joinedDate: '2016' },
      { name: 'Steve Naudé', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/stevenaude/', isActive: true, joinedDate: '2019' },
      { name: 'Nilan Peiris', title: 'Chief Growth Officer', linkedinUrl: 'https://www.linkedin.com/in/nilanpeiris/', isActive: true, joinedDate: '2013' },
    ],
  },
  {
    domain: 'chime.com',
    locations: [
      { type: 'headquarters', address: '101 California Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94111' },
    ],
    personnel: [
      { name: 'Chris Britt', title: 'CEO & Founder', linkedinUrl: 'https://www.linkedin.com/in/chrisbritt/', isActive: true, joinedDate: '2013' },
      { name: 'Melissa Burch', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/melissaburch/', isActive: true, joinedDate: '2022-11' },
      { name: 'Ryan King', title: 'Co-Founder & CTO', linkedinUrl: 'https://www.linkedin.com/in/ryan-king/', isActive: true, joinedDate: '2013' },
      { name: 'Jean Khawaja', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/jeankhawaja/', isActive: true, joinedDate: '2020' },
      { name: 'Omar Sahid', title: 'Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/omarsahid/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'plaid.com',
    locations: [
      { type: 'headquarters', address: 'One Front Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94111' },
    ],
    personnel: [
      { name: 'Zach Perret', title: 'CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/zachperret/', isActive: true, joinedDate: '2013' },
      { name: 'William Hockey', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/williamhockey/', isActive: true, joinedDate: '2013' },
      { name: 'Eric Sager', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/ericsager/', isActive: true, joinedDate: '2021-09' },
      { name: 'Jean-Denis Grèze', title: 'CTO', linkedinUrl: 'https://www.linkedin.com/in/jdgreze/', isActive: true, joinedDate: '2016' },
      { name: 'John Anderson', title: 'Head of Product', linkedinUrl: 'https://www.linkedin.com/in/johnanderson/', isActive: true, joinedDate: '2019' },
    ],
  },

  // Healthcare (remaining)
  {
    domain: 'calm.com',
    locations: [
      { type: 'headquarters', address: '1415 North Cherry Avenue', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94103' },
    ],
    personnel: [
      { name: 'David Ko', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/davidkonyc/', isActive: true, joinedDate: '2020-09' },
      { name: 'Michael Acton Smith', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/actonsmith/', isActive: true, joinedDate: '2012' },
      { name: 'Alex Tew', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/alextew/', isActive: true, joinedDate: '2012' },
      { name: 'Nancy Vitale', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/nancy-vitale/', isActive: true, joinedDate: '2021-01' },
      { name: 'Chris Advansun', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/chrisadvansun/', isActive: true, joinedDate: '2018' },
    ],
  },
  {
    domain: 'hims.com',
    locations: [
      { type: 'headquarters', address: '200 Arizona Avenue', city: 'Santa Monica', state: 'CA', country: 'USA', postalCode: '90401' },
    ],
    personnel: [
      { name: 'Andrew Dudum', title: 'CEO & Founder', linkedinUrl: 'https://www.linkedin.com/in/andrewdudum/', isActive: true, joinedDate: '2017' },
      { name: 'Yemi Okupe', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/yemi-okupe/', isActive: true, joinedDate: '2021-04' },
      { name: 'Melissa Baird', title: 'Chief Medical Officer', linkedinUrl: 'https://www.linkedin.com/in/melissa-baird/', isActive: true, joinedDate: '2018' },
      { name: 'Soleil Boughton', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/soleilboughton/', isActive: true, joinedDate: '2019' },
      { name: 'Deb Stallings', title: 'Chief People Officer', linkedinUrl: 'https://www.linkedin.com/in/debstallings/', isActive: true, joinedDate: '2020' },
    ],
  },
  {
    domain: 'zocdoc.com',
    locations: [
      { type: 'headquarters', address: '568 Broadway', city: 'New York', state: 'NY', country: 'USA', postalCode: '10012' },
    ],
    personnel: [
      { name: 'Oliver Kharraz', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/oliverkharraz/', isActive: true, joinedDate: '2015-11' },
      { name: 'Cyrus Massoumi', title: 'Founder', linkedinUrl: 'https://www.linkedin.com/in/cyrusmassoumi/', isActive: false, joinedDate: '2007' },
      { name: 'Nick Ganju', title: 'Co-Founder & Former CEO', linkedinUrl: 'https://www.linkedin.com/in/nickganju/', isActive: false, joinedDate: '2007' },
      { name: 'Jennifer Schneider', title: 'President', linkedinUrl: 'https://www.linkedin.com/in/jenniferschneider/', isActive: true, joinedDate: '2019' },
      { name: 'Netta Samroengraja', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/netta-samroengraja/', isActive: true, joinedDate: '2021' },
    ],
  },

  // Education (remaining)
  {
    domain: 'masterclass.com',
    locations: [
      { type: 'headquarters', address: '405 Howard Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94105' },
    ],
    personnel: [
      { name: 'David Rogier', title: 'CEO & Founder', linkedinUrl: 'https://www.linkedin.com/in/davidrogier/', isActive: true, joinedDate: '2015' },
      { name: 'Aaron Rasmussen', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/aaronrasmussen/', isActive: false, joinedDate: '2015' },
      { name: 'Stephanie Druley', title: 'Chief Content Officer', linkedinUrl: 'https://www.linkedin.com/in/stephaniedruley/', isActive: true, joinedDate: '2020-09' },
      { name: 'Martha Kang', title: 'Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/marthakang/', isActive: true, joinedDate: '2021-10' },
      { name: 'Caryn Sterling', title: 'Chief People Officer', linkedinUrl: 'https://www.linkedin.com/in/carynsterling/', isActive: true, joinedDate: '2019' },
    ],
  },
  {
    domain: 'khanacademy.org',
    locations: [
      { type: 'headquarters', address: '473 Bryant Street', city: 'Mountain View', state: 'CA', country: 'USA', postalCode: '94041' },
    ],
    personnel: [
      { name: 'Sal Khan', title: 'CEO & Founder', linkedinUrl: 'https://www.linkedin.com/in/khanacademy/', isActive: true, joinedDate: '2008' },
      { name: 'Kristen DiCerbo', title: 'Chief Learning Officer', linkedinUrl: 'https://www.linkedin.com/in/kristendicerbo/', isActive: true, joinedDate: '2015' },
      { name: 'Ginny Lee', title: 'CFO & COO', linkedinUrl: 'https://www.linkedin.com/in/ginnylee/', isActive: true, joinedDate: '2020' },
      { name: 'Sal Khan', title: 'President', linkedinUrl: 'https://www.linkedin.com/in/khanacademy/', isActive: true, joinedDate: '2008' },
      { name: 'Devon Simmons', title: 'Chief Technology Officer', linkedinUrl: 'https://www.linkedin.com/in/devon-simmons/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'udemy.com',
    locations: [
      { type: 'headquarters', address: '600 Harrison Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94107' },
    ],
    personnel: [
      { name: 'Gregg Coccari', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/gregg-coccari/', isActive: true, joinedDate: '2022-02' },
      { name: 'Sarah Blanchard', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/sarah-blanchard/', isActive: true, joinedDate: '2021-05' },
      { name: 'Dennis Yang', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/dennisyang/', isActive: true, joinedDate: '2010' },
      { name: 'Eren Bali', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/erenbali/', isActive: true, joinedDate: '2010' },
      { name: 'Stephanie Shyu', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/stephanieshyu/', isActive: true, joinedDate: '2022' },
    ],
  },

  // Marketing (remaining)
  {
    domain: 'semrush.com',
    locations: [
      { type: 'headquarters', address: '800 Boylston Street', city: 'Boston', state: 'MA', country: 'USA', postalCode: '02199' },
    ],
    personnel: [
      { name: 'Oleg Shchegolev', title: 'CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/olegshchegolev/', isActive: true, joinedDate: '2008' },
      { name: 'Dmitry Melnikov', title: 'Co-Founder & CTO', linkedinUrl: 'https://www.linkedin.com/in/dmitriymelnikov/', isActive: true, joinedDate: '2008' },
      { name: 'Brian Mulroy', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/brian-mulroy/', isActive: true, joinedDate: '2020-09' },
      { name: 'Eugene Levin', title: 'Chief Strategy Officer', linkedinUrl: 'https://www.linkedin.com/in/eugenelevin/', isActive: true, joinedDate: '2014' },
      { name: 'Olga Andrienko', title: 'VP of Brand Marketing', linkedinUrl: 'https://www.linkedin.com/in/olgaandrienko/', isActive: true, joinedDate: '2015' },
    ],
  },
  {
    domain: 'hootsuite.com',
    locations: [
      { type: 'headquarters', address: '5 East 8th Avenue', city: 'Vancouver', state: 'BC', country: 'Canada', postalCode: 'V5T 1R6' },
    ],
    personnel: [
      { name: 'Tom Keiser', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/thomaskeiser/', isActive: true, joinedDate: '2020-06' },
      { name: 'Ryan Holmes', title: 'Founder', linkedinUrl: 'https://www.linkedin.com/in/invoker/', isActive: false, joinedDate: '2008' },
      { name: 'Tara Ataya', title: 'Chief People & Diversity Officer', linkedinUrl: 'https://www.linkedin.com/in/taraataya/', isActive: true, joinedDate: '2015' },
      { name: 'Chris Lobay', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/chrislobay/', isActive: true, joinedDate: '2019' },
      { name: 'Nick Martin', title: 'Chief Revenue Officer', linkedinUrl: 'https://www.linkedin.com/in/nickmartin/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'monday.com',
    locations: [
      { type: 'headquarters', address: '1 Hamahshev Street', city: 'Tel Aviv', country: 'Israel', postalCode: '6721501' },
    ],
    personnel: [
      { name: 'Roy Mann', title: 'Co-CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/roymann/', isActive: true, joinedDate: '2012' },
      { name: 'Eran Zinman', title: 'Co-CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/eranzinman/', isActive: true, joinedDate: '2012' },
      { name: 'Eliran Glazer', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/eliran-glazer/', isActive: true, joinedDate: '2021-03' },
      { name: 'Daniel Lereya', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/daniellereya/', isActive: true, joinedDate: '2013' },
      { name: 'Netta Barak-Corren', title: 'Chief Customer Officer', linkedinUrl: 'https://www.linkedin.com/in/netta-barak-corren/', isActive: true, joinedDate: '2020' },
    ],
  },

  // Food & Beverage (remaining)
  {
    domain: 'blueapron.com',
    locations: [
      { type: 'headquarters', address: '40 West 23rd Street', city: 'New York', state: 'NY', country: 'USA', postalCode: '10010' },
    ],
    personnel: [
      { name: 'Linda Findley', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/linda-findley/', isActive: true, joinedDate: '2019-10' },
      { name: 'Randy Greben', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/randy-greben/', isActive: true, joinedDate: '2021-11' },
      { name: 'Matt Salzberg', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/msalzberg/', isActive: false, joinedDate: '2012' },
      { name: 'Ilia Papas', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/iliapapas/', isActive: false, joinedDate: '2012' },
      { name: 'Jason Brooks', title: 'Chief Technology Officer', linkedinUrl: 'https://www.linkedin.com/in/jason-brooks/', isActive: true, joinedDate: '2020' },
    ],
  },
  {
    domain: 'oatly.com',
    locations: [
      { type: 'headquarters', address: 'Jagaregatan 4', city: 'Malmö', country: 'Sweden', postalCode: '211 19' },
    ],
    personnel: [
      { name: 'Jean-Christophe Flatin', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/jcflatin/', isActive: true, joinedDate: '2022-09' },
      { name: 'Christian Hanke', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/christianhanke/', isActive: true, joinedDate: '2021-03' },
      { name: 'Toni Petersson', title: 'Former CEO', linkedinUrl: 'https://www.linkedin.com/in/toni-petersson/', isActive: false, joinedDate: '2012' },
      { name: 'Cecilia McAleavey', title: 'General Manager Americas', linkedinUrl: 'https://www.linkedin.com/in/cecilia-mcaleavey/', isActive: true, joinedDate: '2019' },
      { name: 'Daniel Ordonez', title: 'Chief Brand & Communications Officer', linkedinUrl: 'https://www.linkedin.com/in/danielordonez/', isActive: true, joinedDate: '2020' },
    ],
  },
  {
    domain: 'liquiddeath.com',
    locations: [
      { type: 'headquarters', address: '1624 Market Street', city: 'Los Angeles', state: 'CA', country: 'USA', postalCode: '90021' },
    ],
    personnel: [
      { name: 'Mike Cessario', title: 'CEO & Founder', linkedinUrl: 'https://www.linkedin.com/in/mikecessario/', isActive: true, joinedDate: '2017' },
      { name: 'Natalie Hallett', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/nataliehallett/', isActive: true, joinedDate: '2021' },
      { name: 'Steve Crandall', title: 'VP of Creative', linkedinUrl: 'https://www.linkedin.com/in/steve-crandall/', isActive: true, joinedDate: '2019' },
      { name: 'Andy Pearson', title: 'VP of Marketing', linkedinUrl: 'https://www.linkedin.com/in/andypearson/', isActive: true, joinedDate: '2020' },
      { name: 'Pat Cook', title: 'Chief Operating Officer', linkedinUrl: 'https://www.linkedin.com/in/patcook/', isActive: true, joinedDate: '2021' },
    ],
  },

  // Travel (remaining)
  {
    domain: 'tripadvisor.com',
    locations: [
      { type: 'headquarters', address: '400 1st Avenue', city: 'Needham', state: 'MA', country: 'USA', postalCode: '02494' },
    ],
    personnel: [
      { name: 'Matt Goldberg', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/matthewgoldberg/', isActive: true, joinedDate: '2022-07' },
      { name: 'Mike Noonan', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/michael-noonan/', isActive: true, joinedDate: '2022-06' },
      { name: 'Stephen Kaufer', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/stephen-kaufer/', isActive: false, joinedDate: '2000' },
      { name: 'Kanika Soni', title: 'Chief Commercial Officer', linkedinUrl: 'https://www.linkedin.com/in/kanika-soni/', isActive: true, joinedDate: '2019' },
      { name: 'John Boris', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/johnboris/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'expedia.com',
    locations: [
      { type: 'headquarters', address: '1111 Expedia Group Way W', city: 'Seattle', state: 'WA', country: 'USA', postalCode: '98119' },
    ],
    personnel: [
      { name: 'Ariane Gorin', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/ariane-gorin/', isActive: true, joinedDate: '2023-05' },
      { name: 'Julie Whalen', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/julie-whalen/', isActive: true, joinedDate: '2022-02' },
      { name: 'Peter Kern', title: 'Vice Chairman', linkedinUrl: 'https://www.linkedin.com/in/peter-kern/', isActive: true, joinedDate: '2019' },
      { name: 'Rathi Murthy', title: 'CTO', linkedinUrl: 'https://www.linkedin.com/in/rathi-murthy/', isActive: true, joinedDate: '2021' },
      { name: 'Lance Soliday', title: 'President of Expedia Brands', linkedinUrl: 'https://www.linkedin.com/in/lancesoliday/', isActive: true, joinedDate: '2020' },
    ],
  },
  {
    domain: 'vrbo.com',
    locations: [
      { type: 'headquarters', address: '1345 South Capital of Texas Highway', city: 'Austin', state: 'TX', country: 'USA', postalCode: '78746' },
    ],
    personnel: [
      { name: 'Jeff Hurst', title: 'President of Vrbo', linkedinUrl: 'https://www.linkedin.com/in/jeffhurst/', isActive: true, joinedDate: '2022-09' },
      { name: 'Alison Kwong', title: 'VP of Product', linkedinUrl: 'https://www.linkedin.com/in/alisonkwong/', isActive: true, joinedDate: '2019' },
      { name: 'Julie Whalen', title: 'CFO (Expedia Group)', linkedinUrl: 'https://www.linkedin.com/in/julie-whalen/', isActive: true, joinedDate: '2022' },
      { name: 'Brian Sharples', title: 'Founder', linkedinUrl: 'https://www.linkedin.com/in/brian-sharples/', isActive: false, joinedDate: '1995' },
      { name: 'Melanie Fish', title: 'VP of Global Marketing', linkedinUrl: 'https://www.linkedin.com/in/melanie-fish/', isActive: true, joinedDate: '2021' },
    ],
  },

  // Entertainment (remaining)
  {
    domain: 'twitch.tv',
    locations: [
      { type: 'headquarters', address: '350 Bush Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94104' },
    ],
    personnel: [
      { name: 'Dan Clancy', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/daniel-clancy/', isActive: true, joinedDate: '2019' },
      { name: 'Emmett Shear', title: 'Co-Founder & Former CEO', linkedinUrl: 'https://www.linkedin.com/in/eshear/', isActive: false, joinedDate: '2011' },
      { name: 'Justin Kan', title: 'Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/justinkan/', isActive: false, joinedDate: '2011' },
      { name: 'Tom Verrilli', title: 'VP of Product', linkedinUrl: 'https://www.linkedin.com/in/tomverrilli/', isActive: true, joinedDate: '2019' },
      { name: 'Will Farrell', title: 'VP of Creator Development', linkedinUrl: 'https://www.linkedin.com/in/will-farrell/', isActive: true, joinedDate: '2020' },
    ],
  },
  {
    domain: 'patreon.com',
    locations: [
      { type: 'headquarters', address: '600 Townsend Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94103' },
    ],
    personnel: [
      { name: 'Jack Conte', title: 'CEO & Co-Founder', linkedinUrl: 'https://www.linkedin.com/in/jackpconte/', isActive: true, joinedDate: '2013' },
      { name: 'Sam Yam', title: 'Co-Founder & CTO', linkedinUrl: 'https://www.linkedin.com/in/samyam/', isActive: true, joinedDate: '2013' },
      { name: 'Julian Gutman', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/juliangutman/', isActive: true, joinedDate: '2022' },
      { name: 'Wyatt Jenkins', title: 'Chief Financial Officer', linkedinUrl: 'https://www.linkedin.com/in/wyattjenkins/', isActive: true, joinedDate: '2021' },
      { name: 'Karin Timpone', title: 'Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/karintimpone/', isActive: true, joinedDate: '2022' },
    ],
  },
  {
    domain: 'medium.com',
    locations: [
      { type: 'headquarters', address: '548 Market Street', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94104' },
    ],
    personnel: [
      { name: 'Tony Stubblebine', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/tonystubblebine/', isActive: true, joinedDate: '2022-10' },
      { name: 'Evan Williams', title: 'Founder', linkedinUrl: 'https://www.linkedin.com/in/evwilliams/', isActive: true, joinedDate: '2012' },
      { name: 'Scott Lamb', title: 'VP of Product', linkedinUrl: 'https://www.linkedin.com/in/scottlamb/', isActive: true, joinedDate: '2019' },
      { name: 'Michael Sippey', title: 'VP of Product (Former)', linkedinUrl: 'https://www.linkedin.com/in/sippey/', isActive: false, joinedDate: '2014' },
      { name: 'Sari Azout', title: 'VP of Product Strategy', linkedinUrl: 'https://www.linkedin.com/in/sariazout/', isActive: true, joinedDate: '2021' },
    ],
  },

  // Real Estate (remaining)
  {
    domain: 'compass.com',
    locations: [
      { type: 'headquarters', address: '90 5th Avenue', city: 'New York', state: 'NY', country: 'USA', postalCode: '10011' },
    ],
    personnel: [
      { name: 'Robert Reffkin', title: 'CEO & Founder', linkedinUrl: 'https://www.linkedin.com/in/robertreffkin/', isActive: true, joinedDate: '2012' },
      { name: 'Kristen Ankerbrandt', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/kristen-ankerbrandt/', isActive: true, joinedDate: '2021-02' },
      { name: 'Ori Allon', title: 'Co-Founder & Executive Chairman', linkedinUrl: 'https://www.linkedin.com/in/orialon/', isActive: true, joinedDate: '2012' },
      { name: 'Kalani Reelitz', title: 'Chief Operating Officer', linkedinUrl: 'https://www.linkedin.com/in/kalanireelitz/', isActive: true, joinedDate: '2020' },
      { name: 'Greg Hart', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/greghart/', isActive: true, joinedDate: '2019' },
    ],
  },
  {
    domain: 'opendoor.com',
    locations: [
      { type: 'headquarters', address: '410 North Scottsdale Road', city: 'Tempe', state: 'AZ', country: 'USA', postalCode: '85281' },
    ],
    personnel: [
      { name: 'Carrie Wheeler', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/carriewheeler/', isActive: true, joinedDate: '2023-01' },
      { name: 'Eric Wu', title: 'Co-Founder & Former CEO', linkedinUrl: 'https://www.linkedin.com/in/ericwu/', isActive: true, joinedDate: '2014' },
      { name: 'Selim Freiha', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/selimfreiha/', isActive: true, joinedDate: '2021-11' },
      { name: 'Andrew Low Ah Kee', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/andrewlowahkee/', isActive: true, joinedDate: '2019' },
      { name: 'David Eisman', title: 'Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/davideisma/', isActive: true, joinedDate: '2021' },
    ],
  },
  {
    domain: 'realtor.com',
    locations: [
      { type: 'headquarters', address: '950 Tower Lane', city: 'Santa Clara', state: 'CA', country: 'USA', postalCode: '95054' },
    ],
    personnel: [
      { name: 'Damian Eales', title: 'CEO', linkedinUrl: 'https://www.linkedin.com/in/damian-eales/', isActive: true, joinedDate: '2019-08' },
      { name: 'David Mele', title: 'Chief Revenue Officer', linkedinUrl: 'https://www.linkedin.com/in/davidmele/', isActive: true, joinedDate: '2018' },
      { name: 'Nate Johnson', title: 'Chief Product Officer', linkedinUrl: 'https://www.linkedin.com/in/natejohnson/', isActive: true, joinedDate: '2020' },
      { name: 'Janice McDill', title: 'CFO', linkedinUrl: 'https://www.linkedin.com/in/janicemcdill/', isActive: true, joinedDate: '2021' },
      { name: 'Ryan Goulart', title: 'Chief Marketing Officer', linkedinUrl: 'https://www.linkedin.com/in/ryangoulart/', isActive: true, joinedDate: '2021' },
    ],
  },
];

async function main() {
  console.log('\n🔄 Enriching Remaining Benchmark Brands with Locations & Personnel\n');
  console.log(`Total brands to enrich: ${enrichmentData.length}\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const data of enrichmentData) {
    try {
      console.log(`Processing: ${data.domain}...`);

      const brand = await db.query.brands.findFirst({
        where: eq(brands.domain, data.domain),
      });

      if (!brand) {
        console.log(`  ⏭️  Brand not found, skipping\n`);
        skipCount++;
        continue;
      }

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

      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`  ❌ Error updating ${data.domain}:`, error);
      errorCount++;
    }
  }

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
