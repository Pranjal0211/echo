-- Echo initial schema (Milestone 1, ADR-020).
--
-- Mirrors the contracts in packages/contracts/src/domain.ts. Ids are text because the
-- API generates them (UUIDs in production, readable ids in synthetic seed data).
--
-- Access: row level security is on for every table with no policies yet, so the anon
-- and authenticated roles see nothing. Only the Worker's secret key (service_role)
-- reads and writes. owner_id stays null until sign-in arrives at deploy time; then it
-- becomes `not null references auth.users` with owner-only policies.

-- Profile: one row per owner. Before sign-in there is a single row with id 'owner'.
create table public.profiles (
  id text primary key,
  owner_id uuid,
  name text not null check (length(name) between 1 and 200),
  headline text not null default '',
  style_notes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_facts (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  owner_id uuid,
  position integer not null,
  text text not null check (length(text) > 0),
  category text not null check (category in ('experience', 'skill', 'project', 'education', 'preference', 'other')),
  verified boolean not null default false,
  sensitivity text not null default 'normal' check (sensitivity in ('normal', 'ask_every_time')),
  created_at timestamptz not null default now()
);
create index profile_facts_profile_position on public.profile_facts (profile_id, position);

create table public.style_examples (
  id text primary key,
  profile_id text not null references public.profiles (id) on delete cascade,
  owner_id uuid,
  position integer not null,
  situation text not null check (length(situation) > 0),
  text text not null check (length(text) > 0),
  created_at timestamptz not null default now()
);
create index style_examples_profile_position on public.style_examples (profile_id, position);

create table public.contacts (
  id text primary key,
  owner_id uuid,
  name text not null check (length(name) between 1 and 200),
  company text,
  role text,
  relationship text not null check (relationship in ('recruiter', 'hiring_manager', 'referrer', 'former_colleague', 'friend', 'other')),
  verified_email text,
  linkedin_url text,
  opt_out boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id text primary key,
  owner_id uuid,
  channel text not null check (channel in ('gmail', 'linkedin')),
  contact_id text not null references public.contacts (id) on delete restrict,
  subject text,
  import_source text not null check (import_source in ('pasted', 'gmail_sync')),
  waiting_on text not null check (waiting_on in ('me', 'them', 'nobody')),
  waiting_since timestamptz,
  created_at timestamptz not null default now()
);
create index conversations_contact on public.conversations (contact_id);

-- Messages are append-only: saving a conversation never rewrites an existing message.
create table public.messages (
  id text primary key,
  conversation_id text not null references public.conversations (id) on delete cascade,
  owner_id uuid,
  direction text not null check (direction in ('inbound', 'outbound')),
  content text not null check (length(content) between 1 and 20000),
  occurred_at timestamptz not null
);
create index messages_conversation_time on public.messages (conversation_id, occurred_at);

create table public.drafts (
  id text primary key,
  conversation_id text not null references public.conversations (id) on delete cascade,
  owner_id uuid,
  channel text not null check (channel in ('gmail', 'linkedin')),
  delivery_capability text not null check (delivery_capability in ('copy_only', 'provider_send')),
  intent text not null,
  tone text not null,
  length text not null,
  subject text,
  body text not null check (length(body) > 0),
  version integer not null check (version > 0),
  status text not null check (status in (
    'generated', 'edited', 'needs_approval', 'approved', 'queued', 'sending',
    'sent', 'failed', 'rejected', 'cancelled', 'copied', 'sent_manually'
  )),
  fact_ids_used text[] not null default '{}',
  warnings text[] not null default '{}',
  decisions_needed text[] not null default '{}',
  model_id text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  -- Same rule as the Draft contract: LinkedIn is copy-only (ADR-008), Gmail can be sent.
  constraint drafts_capability_matches_channel check (
    (channel = 'gmail' and delivery_capability = 'provider_send')
    or (channel = 'linkedin' and delivery_capability = 'copy_only')
  )
);
create index drafts_conversation_created on public.drafts (conversation_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.profile_facts enable row level security;
alter table public.style_examples enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.drafts enable row level security;

-- Save a conversation and any new messages in one transaction.
create function public.save_conversation(p_conversation jsonb, p_messages jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.conversations (id, channel, contact_id, subject, import_source, waiting_on, waiting_since)
  values (
    p_conversation->>'id',
    p_conversation->>'channel',
    p_conversation->>'contact_id',
    p_conversation->>'subject',
    p_conversation->>'import_source',
    p_conversation->>'waiting_on',
    (p_conversation->>'waiting_since')::timestamptz
  )
  on conflict (id) do update set
    channel = excluded.channel,
    contact_id = excluded.contact_id,
    import_source = excluded.import_source,
    subject = excluded.subject,
    waiting_on = excluded.waiting_on,
    waiting_since = excluded.waiting_since;

  insert into public.messages (id, conversation_id, direction, content, occurred_at)
  select m->>'id', p_conversation->>'id', m->>'direction', m->>'content', (m->>'occurred_at')::timestamptz
  from jsonb_array_elements(p_messages) as m
  on conflict (id) do nothing;
end;
$$;

-- Replace the profile with its facts and style examples in one transaction.
create function public.save_profile(p_profile jsonb, p_facts jsonb, p_examples jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id text := p_profile->>'id';
begin
  insert into public.profiles (id, name, headline, style_notes)
  values (
    v_id,
    p_profile->>'name',
    p_profile->>'headline',
    array(select jsonb_array_elements_text(p_profile->'style_notes'))
  )
  on conflict (id) do update set
    name = excluded.name,
    headline = excluded.headline,
    style_notes = excluded.style_notes,
    updated_at = now();

  delete from public.profile_facts where profile_id = v_id;
  insert into public.profile_facts (id, profile_id, position, text, category, verified, sensitivity)
  select f->>'id', v_id, (ord - 1)::integer, f->>'text', f->>'category', (f->>'verified')::boolean, f->>'sensitivity'
  from jsonb_array_elements(p_facts) with ordinality as t(f, ord);

  delete from public.style_examples where profile_id = v_id;
  insert into public.style_examples (id, profile_id, position, situation, text)
  select e->>'id', v_id, (ord - 1)::integer, e->>'situation', e->>'text'
  from jsonb_array_elements(p_examples) with ordinality as t(e, ord);
end;
$$;

-- Only the Worker (service_role) may call these until owner policies exist.
revoke execute on function public.save_conversation(jsonb, jsonb) from public, anon, authenticated;
revoke execute on function public.save_profile(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_conversation(jsonb, jsonb) to service_role;
grant execute on function public.save_profile(jsonb, jsonb, jsonb) to service_role;
