# Community Ideas Commons: build and setup

The site is static HTML, CSS and JavaScript in `site/`. Supabase holds the data. Vercel builds and hosts it.

## Files

- `site/index.html`: the public landing page (from the mockup).
- `site/ideas.html` and `site/assets/`: the project list, project pages, comments, offers and suggestions.
- `site/assets/vendor/supabase.esm.js`: the Supabase browser library, bundled locally (supabase-js 2.45.4, MIT).
- `scripts/build.mjs`: copies `site/` to `public/` and writes `config.js` from environment variables.
- `supabase/migrations/`: the schema, row-level security and grants, in order.
- `supabase/tests/rls_test.sql`: access-rule tests. Run them in the SQL editor. The script rolls back and prints PASS or FAIL lines.
- `supabase/tests/offer_privacy_test.sql` and `supabase/tests/contact_test.sql`: anonymous offers, the hot rule, and private messages.
- `scripts/site-smoke-test.js`: browser smoke test for the signed-out experience. It mocks the Supabase requests.
- `scripts/site-signed-in-test.js`: browser test for signed-in screens (offer contact choice and messages), with a fake session and mocked requests.

## Contact between members

When someone offers help, they choose whether other members may contact them about it. The choice is off by default and can be changed later by editing the offer.

- If it is on, other signed-in members see a Send a message button on the offer. Messages are private to the two people in the conversation and appear under Messages.
- The person who made the offer can reply. If they turn contact off later, nobody can start or continue a conversation with them about that offer, but they can still reply.
- The site never stores email addresses or phone numbers for contact: offers and messages reject email addresses. People decide for themselves what to share in a message.
- An anonymous offer stays anonymous: the person writing to it sees "Someone". Replying shows the replier's name.
- Each person can send at most 20 messages an hour.
- People can delete their own messages. Deleting an offer deletes its conversations. The admin can delete a reported message, but no screen shows the admin other people's messages.

## Vercel settings

- Build command: `node scripts/build.mjs` (set in `vercel.json`).
- Output directory: `public`.
- Environment variables (set in the Vercel project, never in git):
  - `SUPABASE_URL` = `https://yfxxhiomvtiujpuxwlky.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY` = the project's publishable key (Supabase dashboard, API settings)

The build fails if either variable is missing, so a broken configuration cannot deploy silently.

## Supabase settings the owner must set

- Authentication, URL configuration: set the Site URL to the production address, and add the preview address pattern to the redirect allow list.
- Authentication, Providers, Google: add the Google OAuth client ID and secret. Until then, the Google button does nothing useful.
- Email: the built-in mail sender is rate-limited and meant for testing. Add a custom SMTP sender before a public launch.

## Making the owner the admin

The admin is a row in `public.admins`. After the owner has signed in once, run this in the SQL editor, using the owner's own account email:

```sql
insert into public.admins (user_id)
select id from auth.users where email = '<owner email>'
on conflict do nothing;
```

## Known limits in this build

- Money is not an offer type. Badges are not shown. LinkedIn sign-in is not included.
- Offers and comments reject email addresses. Phone numbers and other contact details are not checked by the database, so the owner should watch for them.
- Only the admin can remove a built-in project, and built-in projects live in `site/assets/built-in.js`, not the database.
