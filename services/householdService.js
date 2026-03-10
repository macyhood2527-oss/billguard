import { isSupabaseConfigured, supabase } from '../lib/supabase';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }
}

async function requireCurrentUser() {
  assertSupabaseReady();

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const user = data?.user ?? null;
  if (!user?.id) {
    throw new Error('You must be logged in to access household data.');
  }

  return user;
}

function getDefaultHouseholdName(user) {
  const emailPrefix = String(user?.email ?? '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();

  if (emailPrefix) {
    const label = emailPrefix
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return `${label}'s Household`;
  }

  return 'My Household';
}

async function findActiveMembership(userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_household_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile?.active_household_id) {
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, role, status, households(id, name, created_by)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('household_id', profile.active_household_id)
      .maybeSingle();

    if (error) throw error;
    if (data?.household_id) {
      return {
        householdId: data.household_id,
        householdName: data.households?.name ?? 'My Household',
        householdRole: data.role ?? 'member',
        createdBy: data.households?.created_by ?? null,
      };
    }
  }

  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, role, status, households(id, name, created_by)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.household_id) return null;

  return {
    householdId: data.household_id,
    householdName: data.households?.name ?? 'My Household',
    householdRole: data.role ?? 'member',
    createdBy: data.households?.created_by ?? null,
  };
}

async function createPersonalHousehold(user) {
  const householdName = getDefaultHouseholdName(user);

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      name: householdName,
      created_by: user.id,
    })
    .select('id, name, created_by')
    .single();

  if (householdError) throw householdError;

  const { error: membershipError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
  });

  if (membershipError) throw membershipError;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, active_household_id: household.id }, { onConflict: 'id' });

  if (profileError) throw profileError;

  return {
    householdId: household.id,
    householdName: household.name,
    householdRole: 'owner',
    createdBy: household.created_by,
  };
}

export async function requireCurrentHousehold() {
  const user = await requireCurrentUser();
  const membership = await findActiveMembership(user.id);
  const household = membership ?? (await createPersonalHousehold(user));

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, active_household_id: household.householdId }, { onConflict: 'id' });

  if (profileError) throw profileError;

  return {
    userId: user.id,
    userEmail: user.email ?? '',
    householdId: household.householdId,
    householdName: household.householdName,
    householdRole: household.householdRole,
    householdCreatedBy: household.createdBy,
  };
}

export async function getCurrentHouseholdSummary() {
  const context = await requireCurrentHousehold();

  const { data: members, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', context.householdId)
    .eq('status', 'active');

  if (error) throw error;

  return {
    householdId: context.householdId,
    householdName: context.householdName,
    householdRole: context.householdRole,
    memberCount: (members ?? []).length,
  };
}

export async function listUserHouseholds() {
  const user = await requireCurrentUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_household_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  const activeHouseholdId = profile?.active_household_id ?? null;

  const { data: memberships, error } = await supabase
    .from('household_members')
    .select('household_id, role, status, created_at, households(id, name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (memberships ?? []).map((membership) => ({
    householdId: membership.household_id,
    householdName: membership.households?.name ?? 'Household',
    role: membership.role ?? 'member',
    isActive: membership.household_id === activeHouseholdId,
  }));
}

export async function listCurrentHouseholdMembers() {
  const context = await requireCurrentHousehold();

  const { data: members, error } = await supabase
    .from('household_members')
    .select('user_id, role, status, created_at')
    .eq('household_id', context.householdId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const userIds = [...new Set((members ?? []).map((member) => member.user_id).filter(Boolean))];
  let profileById = {};

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    profileById = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile]));
  }

  return (members ?? []).map((member) => ({
    userId: member.user_id,
    role: member.role,
    isCurrentUser: member.user_id === context.userId,
    name:
      member.user_id === context.userId
        ? 'You'
        : profileById[member.user_id]?.full_name?.trim() || 'Household member',
  }));
}

function normalizeHouseholdName(value) {
  return String(value ?? '').trim().slice(0, 80);
}

export async function createHousehold(nextName, { switchAfterCreate = true } = {}) {
  const user = await requireCurrentUser();
  const normalizedName = normalizeHouseholdName(nextName);

  if (!normalizedName) {
    throw new Error('Household name is required.');
  }

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({
      name: normalizedName,
      created_by: user.id,
    })
    .select('id, name, created_by')
    .single();

  if (householdError) throw householdError;

  const { error: membershipError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
    status: 'active',
  });

  if (membershipError) throw membershipError;

  if (switchAfterCreate) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, active_household_id: household.id }, { onConflict: 'id' });

    if (profileError) throw profileError;
  }

  return {
    householdId: household.id,
    householdName: household.name,
    role: 'owner',
    isActive: Boolean(switchAfterCreate),
  };
}

export async function renameCurrentHousehold(nextName) {
  const context = await requireCurrentHousehold();

  if (context.householdRole !== 'owner') {
    throw new Error('Only household owners can rename the household.');
  }

  const normalizedName = normalizeHouseholdName(nextName);
  if (!normalizedName) {
    throw new Error('Household name is required.');
  }

  const { error } = await supabase
    .from('households')
    .update({ name: normalizedName })
    .eq('id', context.householdId);

  if (error) throw error;

  return normalizedName;
}

export async function removeHouseholdMember(memberUserId) {
  const context = await requireCurrentHousehold();

  if (context.householdRole !== 'owner') {
    throw new Error('Only household owners can remove members.');
  }

  if (!memberUserId) {
    throw new Error('Member not found.');
  }

  if (memberUserId === context.userId) {
    throw new Error('Use a leave-household action to remove yourself.');
  }

  const { data: member, error: memberError } = await supabase
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', context.householdId)
    .eq('user_id', memberUserId)
    .eq('status', 'active')
    .maybeSingle();

  if (memberError) throw memberError;
  if (!member) {
    throw new Error('Household member not found.');
  }

  if (member.role === 'owner') {
    throw new Error('Transfer ownership before removing another owner.');
  }

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', context.householdId)
    .eq('user_id', memberUserId);

  if (error) throw error;

  return true;
}

export async function switchActiveHousehold(targetHouseholdId) {
  const user = await requireCurrentUser();

  if (!targetHouseholdId) {
    throw new Error('Household not found.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('household_id', targetHouseholdId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) {
    throw new Error('You are not an active member of that household.');
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, active_household_id: targetHouseholdId }, { onConflict: 'id' });

  if (error) throw error;

  return true;
}

export async function leaveHousehold(targetHouseholdId) {
  const context = await requireCurrentHousehold();

  if (!targetHouseholdId) {
    throw new Error('Household not found.');
  }

  const { data, error } = await supabase.rpc('leave_household', {
    target_household_id: targetHouseholdId,
  });

  if (error) throw error;
  if (!data) {
    throw new Error('Could not leave this household.');
  }

  if (context.householdId === targetHouseholdId) {
    await requireCurrentHousehold();
  }

  return true;
}

export async function transferHouseholdOwnership(newOwnerUserId) {
  const context = await requireCurrentHousehold();

  if (context.householdRole !== 'owner') {
    throw new Error('Only household owners can transfer ownership.');
  }

  if (!newOwnerUserId || newOwnerUserId === context.userId) {
    throw new Error('Choose another household member as the new owner.');
  }

  const { data, error } = await supabase.rpc('transfer_household_ownership', {
    target_household_id: context.householdId,
    new_owner_user_id: newOwnerUserId,
  });

  if (error) throw error;
  if (!data) {
    throw new Error('Could not transfer household ownership.');
  }

  return true;
}

export async function listPendingInvites() {
  const user = await requireCurrentUser();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('household_invites')
    .select('id, household_id, email, role, token, expires_at, accepted_at, households(name)')
    .eq('email', user.email ?? '')
    .is('accepted_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((invite) => ({
    id: invite.id,
    householdId: invite.household_id,
    householdName: invite.households?.name ?? 'Household',
    email: invite.email,
    role: invite.role,
    token: invite.token,
    expiresAt: invite.expires_at,
  }));
}

function createInviteToken() {
  return `invite_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function createHouseholdInvite(email, role = 'member') {
  const context = await requireCurrentHousehold();

  if (context.householdRole !== 'owner') {
    throw new Error('Only household owners can invite members.');
  }

  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }

  const nowIso = new Date().toISOString();

  const { data: existingInvites, error: invitesError } = await supabase
    .from('household_invites')
    .select('id')
    .eq('household_id', context.householdId)
    .eq('email', normalizedEmail)
    .is('accepted_at', null)
    .gt('expires_at', nowIso)
    .limit(1);

  if (invitesError) throw invitesError;
  if ((existingInvites ?? []).length > 0) {
    throw new Error('That email already has a pending household invite.');
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('household_invites')
    .insert({
      household_id: context.householdId,
      email: normalizedEmail,
      role,
      token: createInviteToken(),
      invited_by: context.userId,
      expires_at: expiresAt,
    })
    .select('id, email, role, expires_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    expiresAt: data.expires_at,
  };
}

export async function acceptHouseholdInvite(inviteId) {
  const user = await requireCurrentUser();

  const { data: invite, error: inviteError } = await supabase
    .from('household_invites')
    .select('id, household_id, email, role, accepted_at, expires_at')
    .eq('id', inviteId)
    .maybeSingle();

  if (inviteError) throw inviteError;
  if (!invite) throw new Error('Invite not found.');
  if (invite.accepted_at) throw new Error('This invite has already been accepted.');
  if ((user.email ?? '').toLowerCase() !== String(invite.email ?? '').toLowerCase()) {
    throw new Error('This invite does not belong to your account.');
  }
  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    throw new Error('This invite has expired.');
  }

  const { data: existingMembership, error: membershipError } = await supabase
    .from('household_members')
    .select('id, household_id')
    .eq('user_id', user.id)
    .eq('household_id', invite.household_id)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (!existingMembership) {
    const { error: insertError } = await supabase.from('household_members').insert({
      household_id: invite.household_id,
      user_id: user.id,
      role: invite.role,
      status: 'active',
    });

    if (insertError) throw insertError;
  }

  const { error: inviteUpdateError } = await supabase
    .from('household_invites')
    .update({
      accepted_by: user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invite.id);

  if (inviteUpdateError) throw inviteUpdateError;

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, active_household_id: invite.household_id }, { onConflict: 'id' });

  if (profileError) throw profileError;

  return invite.household_id;
}
