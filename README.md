# Apex Protocol

Performance Enhancement Specialists - Premium Peptides & Supplements

## Tech Stack

- **Framework:** Next.js 14
- **Database:** Neon PostgreSQL
- **Hosting:** Cloudflare Pages
- **Styling:** Tailwind CSS
- **Email:** orders@apexprotocol.co.za

## Environment Variables

Required for deployment:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SITE_URL=https://apexprotocol.co.za
```

## Deployment

### Cloudflare Pages

1. Connect this repository to Cloudflare Pages
2. Set build command: `npm run pages:build`
3. Set build output directory: `.vercel/output/static`
4. Add environment variables
5. Deploy!

## Development

```bash
npm install
npm run dev
```

Visit http://localhost:3100

## Database

Neon PostgreSQL with automatic migrations. Schema includes:
- Products (141 items)
- Orders & Order Items
- Users & Addresses
- Notifications & Settings

## Admin Access

Default admin account:
- Email: admin@apexprotocol.co.za
- Password: (set during deployment)

## Automation

Order fulfillment automation via Apex Agent:
- Auto-send customer quotes
- Auto-place orders on supplier (Muscles SA)
- Auto-sync tracking numbers
- Email monitoring

## Bank Details

**Absa Cheque Account**
- Account Name: Apex Protocol
- Account Number: 4123044486
- Branch Code: 632005
- Reference: Order number (AP-XXXX)
