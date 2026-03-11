import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../components/common/AppIcon';
import GlassCard from '../../components/common/GlassCard';
import InputField from '../../components/common/InputField';
import ScreenContainer from '../../components/common/ScreenContainer';
import { colors } from '../../constants/colors';
import { supportedCurrencies } from '../../constants/currencies';
import { supportedThemes, themePresets } from '../../constants/themes';
import { useAuth } from '../../hooks/AuthProvider';
import { useCurrency } from '../../hooks/CurrencyProvider';
import { useTheme } from '../../hooks/ThemeProvider';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import {
  acceptHouseholdInvite,
  createHousehold,
  createHouseholdInvite,
  leaveHousehold,
  listCurrentHouseholdMembers,
  listPendingInvites,
  listUserHouseholds,
  removeHouseholdMember,
  renameCurrentHousehold,
  switchActiveHousehold,
  transferHouseholdOwnership,
} from '../../services/householdService';
import { changePassword } from '../../services/authService';
import { getProfileSettingsSummary, updateProfileName } from '../../services/profileService';

export default function ProfileScreen() {
  const styles = useThemedStyles(createStyles);
  const { session, logout, isSupabaseConfigured } = useAuth();
  const { currencyCode, changeCurrency, isLoadingCurrency } = useCurrency();
  const { themeId, changeTheme, isLoadingTheme } = useTheme();
  const [errorMessage, setErrorMessage] = useState('');
  const [currencyMessage, setCurrencyMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [editingHouseholdName, setEditingHouseholdName] = useState('');
  const [householdRole, setHouseholdRole] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [loadingHousehold, setLoadingHousehold] = useState(false);
  const [members, setMembers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [creatingHousehold, setCreatingHousehold] = useState(false);
  const [savingHouseholdName, setSavingHouseholdName] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState('');
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState('');
  const [transferringOwnerId, setTransferringOwnerId] = useState('');
  const [confirmTransferOwnerId, setConfirmTransferOwnerId] = useState('');
  const [switchingHouseholdId, setSwitchingHouseholdId] = useState('');
  const [leavingHouseholdId, setLeavingHouseholdId] = useState('');
  const [confirmLeaveHouseholdId, setConfirmLeaveHouseholdId] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState(themeId);
  const [hasTouchedThemeSelection, setHasTouchedThemeSelection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showHouseholds, setShowHouseholds] = useState(false);
  const [showPendingInvites, setShowPendingInvites] = useState(true);

  async function loadHouseholdData() {
    if (!isSupabaseConfigured || !session?.user?.id) {
      setHouseholdName('');
      setEditingHouseholdName('');
      setHouseholdRole('');
      setMemberCount(0);
      setMembers([]);
      setHouseholds([]);
      setPendingInvites([]);
      return;
    }

    try {
      setLoadingHousehold(true);
      setLoadingMembers(true);
      const [householdRows, summary, memberRows, inviteRows] = await Promise.all([
        listUserHouseholds(),
        getProfileSettingsSummary(session.user.id),
        listCurrentHouseholdMembers(),
        listPendingInvites(),
      ]);

      setHouseholds(householdRows);
      setHouseholdName(summary.householdName);
      setEditingHouseholdName(summary.householdName);
      setHouseholdRole(summary.householdRole);
      setMemberCount(summary.memberCount);
      setFullName(summary.fullName);
      setMembers(memberRows);
      setPendingInvites(inviteRows);
    } catch (error) {
      setHouseholdName('');
      setEditingHouseholdName('');
      setHouseholdRole('');
      setMemberCount(0);
      setMembers([]);
      setHouseholds([]);
      setPendingInvites([]);
      setErrorMessage(error.message ?? 'Failed to load household settings.');
    } finally {
      setLoadingHousehold(false);
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadSettingsSummary() {
      if (!isSupabaseConfigured || !session?.user?.id) {
        if (!active) return;
        setHouseholdName('');
        setEditingHouseholdName('');
        setHouseholdRole('');
        setMemberCount(0);
        setMembers([]);
        setHouseholds([]);
        setPendingInvites([]);
        return;
      }

      try {
        setLoadingHousehold(true);
        setLoadingMembers(true);
        const [householdRows, summary, memberRows, inviteRows] = await Promise.all([
          listUserHouseholds(),
          getProfileSettingsSummary(session.user.id),
          listCurrentHouseholdMembers(),
          listPendingInvites(),
        ]);
        if (!active) return;
        setHouseholds(householdRows);
        setHouseholdName(summary.householdName);
        setEditingHouseholdName(summary.householdName);
        setHouseholdRole(summary.householdRole);
        setMemberCount(summary.memberCount);
        setFullName(summary.fullName);
        setMembers(memberRows);
        setPendingInvites(inviteRows);
      } catch (error) {
        if (!active) return;
        setHouseholdName('');
        setEditingHouseholdName('');
        setHouseholdRole('');
        setMemberCount(0);
        setMembers([]);
        setHouseholds([]);
        setPendingInvites([]);
        setErrorMessage(error.message ?? 'Failed to load household settings.');
      } finally {
        if (active) {
          setLoadingHousehold(false);
          setLoadingMembers(false);
        }
      }
    }

    loadSettingsSummary();
    return () => {
      active = false;
    };
  }, [isSupabaseConfigured, session?.user?.id]);

  useEffect(() => {
    if (!hasTouchedThemeSelection) {
      setSelectedThemeId(themeId);
    }
  }, [themeId, hasTouchedThemeSelection]);

  function clearFeedbackMessages() {
    setErrorMessage('');
    setCurrencyMessage('');
    setProfileMessage('');
    setInviteMessage('');
  }

  async function handleLogout() {
    setErrorMessage('');

    if (!isSupabaseConfigured) {
      setErrorMessage('Supabase not configured. Add your Supabase URL and anon key in .env first.');
      return;
    }

    try {
      await logout();
    } catch (error) {
      setErrorMessage(error.message ?? 'Logout failed.');
    }
  }

  async function handleCurrencyChange(nextCode) {
    setErrorMessage('');
    setCurrencyMessage('');
    setProfileMessage('');

    try {
      await changeCurrency(nextCode);
      setCurrencyMessage(`Currency updated to ${nextCode}.`);
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to update currency.');
    }
  }

  function handleThemeSelect(nextThemeId) {
    clearFeedbackMessages();
    setHasTouchedThemeSelection(true);
    setSelectedThemeId(nextThemeId);
  }

  async function handleThemeSave() {
    clearFeedbackMessages();

    if (selectedThemeId === themeId) {
      setHasTouchedThemeSelection(false);
      return;
    }

    try {
      const appliedThemeId = await changeTheme(selectedThemeId);
      setSelectedThemeId(appliedThemeId);
      setHasTouchedThemeSelection(false);
      setProfileMessage(`Theme updated to ${themePresets[appliedThemeId]?.label ?? appliedThemeId}.`);
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to update theme.');
    }
  }

  async function handleSaveName() {
    setErrorMessage('');
    setCurrencyMessage('');
    setProfileMessage('');

    if (!session?.user?.id) return;

    try {
      setSavingName(true);
      const savedName = await updateProfileName(session.user.id, fullName);
      setFullName(savedName);
      setProfileMessage(savedName ? `Name updated to ${savedName}.` : 'Name cleared.');
      await loadHouseholdData();
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to update name.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    clearFeedbackMessages();

    if (!session?.user?.email) {
      setErrorMessage('No account email found for this session.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Enter your current password and the new password twice.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Use at least 6 characters for the new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('Choose a different new password.');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({
        email: session.user.email,
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileMessage('Password updated successfully.');
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleSendInvite() {
    setErrorMessage('');
    setInviteMessage('');

    if (!inviteEmail.trim()) {
      setErrorMessage('Enter the family member email first.');
      return;
    }

    try {
      setSendingInvite(true);
      const invite = await createHouseholdInvite(inviteEmail.trim());
      setInviteEmail('');
      setInviteMessage(`Invite created for ${invite.email}.`);
      await loadHouseholdData();
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to create household invite.');
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleCreateHousehold() {
    setErrorMessage('');
    setCurrencyMessage('');
    setProfileMessage('');
    setInviteMessage('');

    try {
      setCreatingHousehold(true);
      const created = await createHousehold(newHouseholdName, { switchAfterCreate: true });
      setNewHouseholdName('');
      setProfileMessage(`Created ${created.householdName}.`);
      await loadHouseholdData();
      router.replace('/dashboard');
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to create household.');
    } finally {
      setCreatingHousehold(false);
    }
  }

  async function handleSaveHouseholdName() {
    setErrorMessage('');
    setCurrencyMessage('');
    setProfileMessage('');
    setInviteMessage('');

    try {
      setSavingHouseholdName(true);
      const savedName = await renameCurrentHousehold(editingHouseholdName);
      setHouseholdName(savedName);
      setEditingHouseholdName(savedName);
      setProfileMessage(`Household renamed to ${savedName}.`);
      await loadHouseholdData();
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to rename household.');
    } finally {
      setSavingHouseholdName(false);
    }
  }

  async function handleRemoveMember(member) {
    try {
      setErrorMessage('');
      setCurrencyMessage('');
      setProfileMessage('');
      setInviteMessage('');
      setRemovingMemberId(member.userId);
      await removeHouseholdMember(member.userId);
      setConfirmRemoveMemberId('');
      setProfileMessage(`${member.name} was removed from the household.`);
      await loadHouseholdData();
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to remove household member.');
    } finally {
      setRemovingMemberId('');
    }
  }

  async function handleTransferOwnership(member) {
    try {
      setErrorMessage('');
      setCurrencyMessage('');
      setProfileMessage('');
      setInviteMessage('');
      setTransferringOwnerId(member.userId);
      await transferHouseholdOwnership(member.userId);
      setConfirmTransferOwnerId('');
      setProfileMessage(`Ownership transferred to ${member.name}.`);
      await loadHouseholdData();
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to transfer household ownership.');
    } finally {
      setTransferringOwnerId('');
    }
  }

  async function handleAcceptInvite(inviteId) {
    try {
      setErrorMessage('');
      setInviteMessage('');
      setAcceptingInviteId(inviteId);
      await acceptHouseholdInvite(inviteId);
      setInviteMessage('Household invite accepted. Your shared bills are now active.');
      await loadHouseholdData();
      router.replace('/dashboard');
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to accept invite.');
    } finally {
      setAcceptingInviteId('');
    }
  }

  async function handleSwitchHousehold(targetHouseholdId) {
    try {
      setErrorMessage('');
      setCurrencyMessage('');
      setProfileMessage('');
      setInviteMessage('');
      setSwitchingHouseholdId(targetHouseholdId);
      await switchActiveHousehold(targetHouseholdId);
      await loadHouseholdData();
      router.replace('/dashboard');
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to switch household.');
    } finally {
      setSwitchingHouseholdId('');
    }
  }

  async function handleLeaveHousehold(household) {
    try {
      setErrorMessage('');
      setCurrencyMessage('');
      setProfileMessage('');
      setInviteMessage('');
      setLeavingHouseholdId(household.householdId);
      await leaveHousehold(household.householdId);
      setConfirmLeaveHouseholdId('');
      setProfileMessage(`You left ${household.householdName}.`);
      await loadHouseholdData();
      router.replace('/dashboard');
    } catch (error) {
      setErrorMessage(error.message ?? 'Failed to leave household.');
    } finally {
      setLeavingHouseholdId('');
    }
  }

  function renderActionLabel(iconName, label, color = colors.textPrimary) {
    return (
      <View style={styles.actionLabel}>
        <AppIcon name={iconName} size={18} color={color} />
        <Text style={[styles.actionLabelText, { color }]}>{label}</Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile & Settings</Text>

      <Text style={styles.sectionHeader}>Personal</Text>
      <Text style={styles.sectionHint}>Your account details and app preferences.</Text>
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{session?.user?.email ?? 'Not signed in'}</Text>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Your Name</Text>
        <InputField label="Display name" value={fullName} onChangeText={setFullName} placeholder="e.g. Alex dela Cruz" />
        <Pressable style={styles.secondaryButton} onPress={handleSaveName} disabled={savingName}>
          <Text style={styles.secondaryButtonText}>{savingName ? 'Saving...' : 'Save Name'}</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Password</Text>
        <InputField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Enter current password"
        />
        <InputField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 6 characters"
        />
        <InputField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Re-enter new password"
        />
        <Pressable style={styles.secondaryButton} onPress={handleChangePassword} disabled={savingPassword}>
          <Text style={styles.secondaryButtonText}>{savingPassword ? 'Saving...' : 'Change Password'}</Text>
        </Pressable>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Preferred Currency</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={currencyCode}
            enabled={!isLoadingCurrency}
            onValueChange={handleCurrencyChange}
            style={styles.picker}
          >
            {supportedCurrencies.map((code) => (
              <Picker.Item key={code} label={code} value={code} />
            ))}
          </Picker>
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Theme Color</Text>
        <View style={styles.themeChipWrap}>
          {supportedThemes.map((id) => {
            const active = selectedThemeId === id;

            return (
              <Pressable
                key={id}
                style={[styles.themeChip, active ? styles.themeChipActive : null]}
                onPress={() => handleThemeSelect(id)}
                disabled={isLoadingTheme}
              >
                <View style={[styles.themeSwatch, { backgroundColor: themePresets[id].colors.primary }]} />
                <Text style={[styles.themeChipText, active ? styles.themeChipTextActive : null]}>
                  {themePresets[id].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={[styles.secondaryButton, styles.themeSaveButton]}
          onPress={handleThemeSave}
          disabled={isLoadingTheme || selectedThemeId === themeId}
        >
          <Text style={styles.secondaryButtonText}>{isLoadingTheme ? 'Saving...' : 'Save Theme'}</Text>
        </Pressable>
      </GlassCard>

      <Text style={styles.sectionHeader}>Current Household</Text>
      <Text style={styles.sectionHint}>Manage the household you are currently using.</Text>
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Household</Text>
        {loadingHousehold ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.value}>{householdName || 'No household yet'}</Text>}
        {householdRole ? <Text style={styles.meta}>Role: {householdRole}</Text> : null}
        {memberCount > 0 ? <Text style={styles.meta}>Active members: {memberCount}</Text> : null}
        {householdRole === 'owner' ? (
          <>
            <InputField
              label="Household name"
              value={editingHouseholdName}
              onChangeText={setEditingHouseholdName}
              placeholder="e.g. Garcia Household"
            />
            <Pressable style={styles.secondaryButton} onPress={handleSaveHouseholdName} disabled={savingHouseholdName}>
              <Text style={styles.secondaryButtonText}>{savingHouseholdName ? 'Saving...' : 'Rename Household'}</Text>
            </Pressable>
          </>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.labelWithIcon}>
            <AppIcon name="Users" size={18} color={colors.textSecondary} />
            <Text style={styles.label}>Members</Text>
          </View>
          <Pressable style={styles.collapseButton} onPress={() => setShowMembers((value) => !value)}>
            <Text style={styles.collapseButtonText}>{showMembers ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>{memberCount} active member{memberCount === 1 ? '' : 's'}</Text>
        {showMembers ? (
          <>
            {loadingMembers ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            {!loadingMembers && members.length === 0 ? <Text style={styles.meta}>No household members yet.</Text> : null}
            {!loadingMembers
              ? members.map((member) => (
              <View key={member.userId} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text style={styles.value}>{member.name}</Text>
                  <Text style={styles.meta}>{member.role}</Text>
                </View>
                {householdRole === 'owner' && !member.isCurrentUser ? (
                  <View style={styles.memberActionWrap}>
                    {confirmTransferOwnerId === member.userId ? (
                      <View style={styles.confirmBox}>
                        <Text style={styles.confirmText}>Transfer ownership to this member?</Text>
                        <View style={styles.confirmActions}>
                          <Pressable
                            style={styles.ghostButton}
                            onPress={() => setConfirmTransferOwnerId('')}
                            disabled={transferringOwnerId === member.userId}
                          >
                            <Text style={styles.ghostButtonText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={styles.inlineButton}
                            onPress={() => handleTransferOwnership(member)}
                            disabled={transferringOwnerId === member.userId}
                          >
                            {renderActionLabel('Crown', transferringOwnerId === member.userId ? 'Transferring...' : 'Transfer', '#FFFFFF')}
                          </Pressable>
                        </View>
                      </View>
                    ) : confirmRemoveMemberId === member.userId ? (
                      <View style={styles.confirmBox}>
                        <Text style={styles.confirmText}>Remove this member?</Text>
                        <View style={styles.confirmActions}>
                          <Pressable
                            style={styles.ghostButton}
                            onPress={() => setConfirmRemoveMemberId('')}
                            disabled={removingMemberId === member.userId}
                          >
                            <Text style={styles.ghostButtonText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={styles.dangerButton}
                            onPress={() => handleRemoveMember(member)}
                            disabled={removingMemberId === member.userId}
                          >
                            <Text style={styles.dangerButtonText}>
                              {removingMemberId === member.userId ? 'Removing...' : 'Remove'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.memberButtonsRow}>
                        <Pressable
                          style={styles.inlineButton}
                          onPress={() => {
                            setConfirmRemoveMemberId('');
                            setConfirmTransferOwnerId(member.userId);
                          }}
                        >
                          {renderActionLabel('Crown', 'Make Owner', '#FFFFFF')}
                        </Pressable>
                        <Pressable
                          style={styles.memberRemoveButton}
                          onPress={() => {
                            setConfirmTransferOwnerId('');
                            setConfirmRemoveMemberId(member.userId);
                          }}
                        >
                          <Text style={styles.memberRemoveButtonText}>Remove</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
              ))
            : null}
          </>
        ) : null}
      </GlassCard>

      {householdRole === 'owner' ? (
        <GlassCard style={styles.card}>
          <View style={styles.labelWithIcon}>
            <AppIcon name="UserPlus" size={18} color={colors.textSecondary} />
            <Text style={styles.label}>Add Family Member</Text>
          </View>
          <InputField
            label="Family member email"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="name@example.com"
          />
          <Pressable style={styles.secondaryButton} onPress={handleSendInvite} disabled={sendingInvite}>
            {renderActionLabel('UserPlus', sendingInvite ? 'Sending...' : 'Create Invite')}
          </Pressable>
        </GlassCard>
      ) : null}

      <Text style={styles.sectionHeader}>Households & Invites</Text>
      <Text style={styles.sectionHint}>Switch households, create another one, or join a new invite.</Text>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.label}>Your Households</Text>
          <Pressable style={styles.collapseButton} onPress={() => setShowHouseholds((value) => !value)}>
            <Text style={styles.collapseButtonText}>{showHouseholds ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>{households.length} household{households.length === 1 ? '' : 's'}</Text>
        {showHouseholds ? (
          <>
            <InputField
              label="Create another household"
              value={newHouseholdName}
              onChangeText={setNewHouseholdName}
              placeholder="e.g. Parents' House"
            />
            <Pressable style={styles.secondaryButton} onPress={handleCreateHousehold} disabled={creatingHousehold}>
              <Text style={styles.secondaryButtonText}>
                {creatingHousehold ? 'Creating...' : 'Create Household'}
              </Text>
            </Pressable>
            {households.length === 0 ? <Text style={styles.meta}>No households available.</Text> : null}
            {households.map((household) => (
          <View key={household.householdId} style={styles.memberRow}>
            <View style={styles.memberInfo}>
              <Text style={styles.value}>
                {household.householdName}
                {household.isActive ? ' (Active)' : ''}
              </Text>
              <Text style={styles.meta}>{household.role}</Text>
            </View>
            <View style={styles.householdActionWrap}>
              {!household.isActive ? (
                <Pressable
                  style={styles.inlineButton}
                  onPress={() => handleSwitchHousehold(household.householdId)}
                  disabled={switchingHouseholdId === household.householdId}
                >
                  {renderActionLabel('Users', switchingHouseholdId === household.householdId ? 'Switching...' : 'Switch', '#FFFFFF')}
                </Pressable>
              ) : null}

              {confirmLeaveHouseholdId === household.householdId ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>Leave this household?</Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      style={styles.ghostButton}
                      onPress={() => setConfirmLeaveHouseholdId('')}
                      disabled={leavingHouseholdId === household.householdId}
                    >
                      <Text style={styles.ghostButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.dangerButton}
                      onPress={() => handleLeaveHousehold(household)}
                      disabled={leavingHouseholdId === household.householdId}
                    >
                      {renderActionLabel('LogOut', leavingHouseholdId === household.householdId ? 'Leaving...' : 'Leave', '#FFFFFF')}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.memberRemoveButton}
                  onPress={() => setConfirmLeaveHouseholdId(household.householdId)}
                >
                  {renderActionLabel('LogOut', 'Leave', colors.danger)}
                </Pressable>
              )}
            </View>
          </View>
            ))}
          </>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.labelWithIcon}>
            <AppIcon name="UserPlus" size={18} color={colors.textSecondary} />
            <Text style={styles.label}>Pending Invites</Text>
          </View>
          <Pressable style={styles.collapseButton} onPress={() => setShowPendingInvites((value) => !value)}>
            <Text style={styles.collapseButtonText}>{showPendingInvites ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>{pendingInvites.length} pending invite{pendingInvites.length === 1 ? '' : 's'}</Text>
        {showPendingInvites ? (
          <>
            {pendingInvites.length === 0 ? <Text style={styles.meta}>No invites waiting for this account.</Text> : null}
            {pendingInvites.map((invite) => (
          <View key={invite.id} style={styles.inviteRow}>
            <View style={styles.inviteTextWrap}>
              <Text style={styles.value}>{invite.householdName}</Text>
              <Text style={styles.meta}>Role: {invite.role}</Text>
            </View>
            <Pressable
              style={styles.inlineButton}
              onPress={() => handleAcceptInvite(invite.id)}
              disabled={acceptingInviteId === invite.id}
            >
              {renderActionLabel('UserPlus', acceptingInviteId === invite.id ? 'Joining...' : 'Accept', '#FFFFFF')}
            </Pressable>
          </View>
            ))}
          </>
        ) : null}
      </GlassCard>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {currencyMessage ? <Text style={styles.successText}>{currencyMessage}</Text> : null}
      {profileMessage ? <Text style={styles.successText}>{profileMessage}</Text> : null}
      {inviteMessage ? <Text style={styles.successText}>{inviteMessage}</Text> : null}

      <Text style={styles.sectionHeader}>Account Actions</Text>
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const createStyles = () => StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 16,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionHint: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
  card: {
    padding: 14,
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 4,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  memberRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    marginBottom: 8,
  },
  memberActionWrap: {
    alignItems: 'flex-start',
  },
  memberButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  householdActionWrap: {
    alignItems: 'flex-start',
    gap: 8,
  },
  memberRemoveButton: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  memberRemoveButtonText: {
    color: colors.danger,
    fontWeight: '700',
  },
  actionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionLabelText: {
    fontWeight: '700',
  },
  confirmBox: {
    width: '100%',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.18)',
    borderRadius: 12,
    padding: 10,
  },
  confirmText: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 10,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ghostButton: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  inviteTextWrap: {
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  themeSaveButton: {
    marginTop: 12,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  collapseButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  collapseButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  inlineButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  inlineButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    marginBottom: 10,
    fontWeight: '600',
  },
  successText: {
    color: colors.success,
    marginBottom: 10,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: colors.textPrimary,
  },
  themeChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  themeChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  themeSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  themeChipText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  themeChipTextActive: {
    color: colors.primary,
  },
});
