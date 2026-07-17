export interface UnverifiedUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export const getUnverifiedUsers = async (token: string): Promise<UnverifiedUser[]> => {
  const response = await fetch('https://crimevision-aq07.onrender.com/api/admin/unverified-users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch unverified users');
  return response.json();
};

export const verifyUserByAdmin = async (userId: number, token: string) => {
  const response = await fetch(`https://crimevision-aq07.onrender.com/api/admin/verify-user/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to verify user');
  return response.json();
};

export const rejectUserByAdmin = async (userId: number, token: string) => {
  const response = await fetch(`https://crimevision-aq07.onrender.com/api/admin/reject-user/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to reject user');
  return response.json();
};

export const getVerifiedUsers = async (token: string): Promise<UnverifiedUser[]> => {
  const response = await fetch('https://crimevision-aq07.onrender.com/api/admin/verified-users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch verified users');
  return response.json();
};

export const removeUserByAdmin = async (userId: number, token: string) => {
  const response = await fetch(`https://crimevision-aq07.onrender.com/api/admin/remove-user/${userId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to remove user');
  return response.json();
};
