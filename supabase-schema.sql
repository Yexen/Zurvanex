-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create conversations table
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  model_id text not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.conversations enable row level security;

-- Create policies
create policy "Users can view their own conversations"
  on public.conversations
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations
  for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_updated_at_idx on public.conversations(updated_at desc);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger on_conversation_updated
  before update on public.conversations
  for each row
  execute procedure public.handle_updated_at();
