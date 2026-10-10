import { randomUUID } from 'node:crypto'
import { createPublicClient, createSecretClient, type Db } from '@/server/db/supabase'

// Test-only: real Sellers in the local Supabase, for tests that call operations as a Seller.
// Not a mock: each one is an auth user made with the admin API, then signed in with email
// and password like anyone else, so row-level security applies to everything it does.

export type TestSeller = {
  id: string
  email: string
  password: string
  /** A client signed in as this Seller. Pass it to operations as their `db`. */
  db: Db
}

const admin = createSecretClient()
// Every Seller this test file has made and not yet removed.
const made: string[] = []

/** A new Seller, signed in. Remove it with removeSellers, usually in afterEach. */
export async function createSeller(displayName = 'ผู้ขายทดสอบ'): Promise<TestSeller> {
  const email = `seller-${randomUUID()}@gumrai.test`
  const password = `test-${randomUUID()}`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error) throw error
  made.push(data.user.id)
  return { id: data.user.id, email, password, db: await signIn(email, password) }
}

/**
 * A new Seller with no password, signed in, like a Seller who only ever signed in with
 * Discord. Supabase Auth leaves such a user's password hash empty, but the admin API always
 * stores one (a random one if none is given), so the helper signs the Seller in first and
 * then empties the hash straight in Postgres. `password` is ''.
 */
export async function createSellerWithoutPassword(displayName = 'ผู้ขายทดสอบ'): Promise<TestSeller> {
  const seller = await createSeller(displayName)
  await runSql(`update auth.users set encrypted_password = '' where id = '${uuid(seller.id)}'`)
  return { ...seller, password: '' }
}

/** A Discord user, as Discord's /users/@me describes them. */
export type DiscordUser = {
  id: string
  username: string
  /** The display name the user chose on Discord; '' when they have none. */
  globalName: string
  /** The avatar hash; '' when they use Discord's default avatar. */
  avatar: string
  /** Whether Discord has verified the account's email. */
  emailVerified: boolean
}

/** A made-up Discord user with a display name and an avatar. */
export function discordUser(overrides: Partial<DiscordUser> = {}): DiscordUser {
  return {
    id: String(100000000000000000n + BigInt(Math.floor(Math.random() * 1e15))),
    username: 'matcha.cafe',
    globalName: 'ร้านมัทฉะ',
    avatar: 'a1b2c3d4e5f6',
    emailVerified: true,
    ...overrides,
  }
}

/**
 * The user metadata Supabase Auth's Discord provider stores for `user`
 * (supabase/auth, internal/api/provider/discord.go, with the email added by external.go).
 */
export function discordMetadata(user: DiscordUser, email: string): Record<string, unknown> {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : 'https://cdn.discordapp.com/embed/avatars/0.png'
  return {
    iss: 'https://discord.com/api',
    sub: user.id,
    name: `${user.username}#0`,
    picture: avatarUrl,
    custom_claims: { global_name: user.globalName },
    avatar_url: avatarUrl,
    full_name: user.username,
    provider_id: user.id,
    email,
    email_verified: user.emailVerified,
    phone_verified: false,
  }
}

/**
 * A new Seller with Discord bound, signed in: the auth user has the Discord provider's metadata,
 * a password, an `email` identity and a `discord` identity. The real OAuth redirect cannot run
 * in a test, so the admin API makes the user (with a password, so the test can sign in), and
 * Discord is then bound the way binding at /me binds it (bindDiscordIdentity), the only way
 * refuse_automatic_link lets a `discord` identity join a user made in another transaction.
 */
export async function createDiscordSeller(user: DiscordUser = discordUser()): Promise<TestSeller> {
  const email = `discord-${randomUUID()}@gumrai.test`
  const password = `test-${randomUUID()}`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: discordMetadata(user, email),
  })
  if (error) throw error
  made.push(data.user.id)
  await bindDiscordIdentity(data.user.id, user, email)
  return { id: data.user.id, email, password, db: await signIn(email, password) }
}

/**
 * A Seller who signed up with Discord, as a first Discord sign-in leaves one: a `discord`
 * identity only (the admin API also adds an `email` identity, which is deleted here). With
 * `password: false` their password hash is empty too, as Supabase Auth leaves it; otherwise
 * they have one, as after setting one at /me. Signed in.
 */
export async function createDiscordOnlySeller(
  user: DiscordUser = discordUser(),
  { password = false }: { password?: boolean } = {},
): Promise<TestSeller> {
  const seller = await createDiscordSeller(user)
  await runSql(`delete from auth.identities where user_id = '${uuid(seller.id)}' and provider = 'email'`)
  if (password) return seller
  await runSql(`update auth.users set encrypted_password = '' where id = '${uuid(seller.id)}'`)
  return { ...seller, password: '' }
}

// Supabase Auth's callback for a Discord sign-in or bind runs in one transaction: it inserts the
// identity (and, for a first sign-in, the user before it), writes the user, then marks the flow
// state used by setting its user_id (supabase/auth v2.197.0, internal/api/external.go,
// internalExternalProviderCallback). The helpers below run those statements as that transaction
// does, so refuse_automatic_link judges them as it would the real one.

function identityInsert(sellerId: string, user: DiscordUser, email: string) {
  return `insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
     values (${literal(user.id)}, '${uuid(sellerId)}', ${literal(JSON.stringify(discordMetadata(user, email)))}::jsonb,
             'discord', now(), now(), now());`
}

function flowStateClaim(flowStateId: string, sellerId: string) {
  return `update auth.flow_state set user_id = '${uuid(sellerId)}', auth_code_issued_at = now(), updated_at = now()
      where id = '${uuid(flowStateId)}';`
}

/**
 * Writes a PKCE flow state for Discord as GET /authorize does when a sign-in starts
 * (`linkingTargetId` null), or as GET /user/identities/authorize does when `linkingTargetId`
 * starts binding Discord from /me. Returns its id, the OAuth `state`.
 */
export async function startDiscordFlowState(linkingTargetId: string | null): Promise<string> {
  const id = randomUUID()
  await runSql(
    `insert into auth.flow_state (id, provider_type, authentication_method, code_challenge, code_challenge_method,
                                  auth_code, linking_target_id, created_at, updated_at)
     values ('${id}', 'discord', 'oauth', ${literal(randomUUID())}, 's256', ${literal(randomUUID())},
             ${linkingTargetId ? `'${uuid(linkingTargetId)}'` : 'null'}, now(), now())`,
  )
  return id
}

/**
 * Binds `user`'s Discord account to the existing Seller `sellerId` as Supabase Auth's callback
 * for binding from /me does: the identity is inserted and the bind's flow state (made by
 * startDiscordFlowState(sellerId) unless `flowStateId` names one) marked used, in one
 * transaction.
 */
export async function bindDiscordIdentity(
  sellerId: string,
  user: DiscordUser,
  email: string,
  flowStateId?: string,
): Promise<void> {
  const state = flowStateId ?? (await startDiscordFlowState(sellerId))
  await runSql(`begin; ${identityInsert(sellerId, user, email)} ${flowStateClaim(state, sellerId)} commit;`)
}

/**
 * What Supabase Auth's callback for a Discord sign-in does when `user`'s email matches the
 * existing Seller `sellerId` (automatic linking by email): in one transaction, inserts the
 * identity on that Seller, writes the Discord metadata onto them, and marks the sign-in's flow
 * state (made by startDiscordFlowState(null) unless `flowStateId` names one) used. The database
 * refuses it, so this rejects with the error Postgres raised.
 */
export async function linkDiscordByEmail(
  sellerId: string,
  user: DiscordUser,
  email: string,
  flowStateId?: string,
): Promise<void> {
  const state = flowStateId ?? (await startDiscordFlowState(null))
  await runSql(
    `begin;
     ${identityInsert(sellerId, user, email)}
     update auth.users set raw_user_meta_data = raw_user_meta_data || ${literal(JSON.stringify(discordMetadata(user, email)))}::jsonb,
                           updated_at = now()
      where id = '${uuid(sellerId)}';
     ${flowStateClaim(state, sellerId)}
     commit;`,
  )
}

/**
 * What Supabase Auth's callback does for a first Discord sign-in: in one transaction, inserts
 * a new auth user with the Discord provider's metadata and no password, then its `discord`
 * identity, then marks the sign-in's flow state used. Returns the new user's id; removeSellers
 * removes it. Not signed in: it has no password.
 */
export async function signUpWithDiscord(user: DiscordUser = discordUser()): Promise<string> {
  const id = randomUUID()
  const email = `discord-${id}@gumrai.test`
  const state = await startDiscordFlowState(null)
  const metadata = literal(JSON.stringify(discordMetadata(user, email)))
  await runSql(
    `begin;
     insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                             raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                             confirmation_token, recovery_token, email_change_token_new, email_change)
     values ('00000000-0000-0000-0000-000000000000', '${id}', 'authenticated', 'authenticated', ${literal(email)}, '',
             now(), '{"provider":"discord","providers":["discord"]}'::jsonb, ${metadata}::jsonb, now(), now(),
             '', '', '', '');
     ${identityInsert(id, user, email)}
     ${flowStateClaim(state, id)}
     commit;`,
  )
  made.push(id)
  return id
}

/** Whether the Seller's `email` identity says their email is verified, or null without one. */
export async function emailIdentityVerified(sellerId: string): Promise<boolean | null> {
  const { data, error } = await admin.auth.admin.getUserById(sellerId)
  if (error) throw error
  const identity = (data.user.identities ?? []).find((each) => each.provider === 'email')
  return identity ? identity.identity_data?.email_verified === true : null
}

/** The providers of the Seller's identities, as Supabase Auth stores them, sorted. */
export async function identityProviders(sellerId: string): Promise<string[]> {
  const { data, error } = await admin.auth.admin.getUserById(sellerId)
  if (error) throw error
  return (data.user.identities ?? []).map((identity) => identity.provider).sort()
}

/**
 * What a later Discord sign-in does after `user` changed on Discord: Supabase Auth rewrites
 * the user's metadata and the identity's data with the new values.
 */
export async function signInAgainWithDiscord(seller: TestSeller, user: DiscordUser): Promise<void> {
  const metadata = discordMetadata(user, seller.email)
  const { error } = await admin.auth.admin.updateUserById(seller.id, { user_metadata: metadata })
  if (error) throw error
  await runSql(
    `update auth.identities set identity_data = ${literal(JSON.stringify(metadata))}::jsonb, updated_at = now()
      where user_id = '${uuid(seller.id)}' and provider = 'discord'`,
  )
}

// A SQL string literal.
function literal(text: string) {
  return `'${text.replaceAll("'", "''")}'`
}

function uuid(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error(`not a uuid: ${id}`)
  return id
}

// Runs SQL as postgres through the local stack's postgres-meta (/pg/query, the API Supabase
// Studio uses), which only the secret key may call. For test set-up that the Auth admin API
// cannot do; never for the data under test.
async function runSql(query: string): Promise<void> {
  const key = process.env.SUPABASE_SECRET_KEY ?? ''
  const response = await fetch(`${process.env.SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!response.ok) throw new Error(`SQL failed (${response.status}): ${await response.text()}`)
}

/** A fresh client signed in with this email and password. */
export async function signIn(email: string, password: string): Promise<Db> {
  const db = createPublicClient()
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  return db
}

/** Records a Seller made some other way (a sign-up test), so removeSellers removes it too. */
export function trackSeller(id: string): void {
  made.push(id)
}

/**
 * Deletes every Seller this file has made. Deleting the auth user deletes their profile and
 * everything they own (each owner column cascades), so tests need no other cleanup.
 */
export async function removeSellers(): Promise<void> {
  for (const id of made.splice(0)) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error && error.status !== 404) throw error
  }
}

/** The secret-key client, for a test that must look past row-level security. */
export function adminClient(): Db {
  return admin
}
