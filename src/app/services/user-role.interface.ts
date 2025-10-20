export interface UserPermissions {
  canViewInventory: boolean;
  canEditInventory: boolean;
  canViewAssociates: boolean;
  canEditAssociates: boolean;
  canMakeDeliveries: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}

export interface UserRole {
  name: string;
  permissions: UserPermissions;
}