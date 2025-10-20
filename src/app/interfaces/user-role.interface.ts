export interface UserRole {
  id: number;
  username: string;
  role: 'admin' | 'delivery_user';
  permissions: {
    canViewInventory: boolean;
    canEditInventory: boolean;
    canViewAssociates: boolean;
    canEditAssociates: boolean;
    canMakeDeliveries: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
  };
}

export const DEFAULT_PERMISSIONS = {
  admin: {
    canViewInventory: true,
    canEditInventory: true,
    canViewAssociates: true,
    canEditAssociates: true,
    canMakeDeliveries: true,
    canViewReports: true,
    canManageUsers: true,
  },
  delivery_user: {
    canViewInventory: true,
    canEditInventory: false,
    canViewAssociates: true,
    canEditAssociates: false,
    canMakeDeliveries: true,
    canViewReports: false,
    canManageUsers: false,
  }
};