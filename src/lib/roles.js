const ROLE_ALIASES = {
  renter: 'Renter',
  seeker: 'Renter',
  houseseeker: 'Renter',
  house_seeker: 'Renter',
  tenant: 'Renter',
  student: 'Student',
  visitor: 'Visitor',
  landlord: 'Landlord',
  hotelmanager: 'HotelManager',
  hotel_manager: 'HotelManager',
  manager: 'HotelManager',
  admin: 'Admin',
}

export const LANDLORD_ROLES = ['Landlord', 'HotelManager']
export const SEEKER_ROLES = ['Renter', 'Student', 'Visitor']

export function normalizeRole(role) {
  if (!role) return ''
  const key = String(role).replace(/[\s-]/g, '').toLowerCase()
  return ROLE_ALIASES[key] || String(role)
}

export function isLandlordRole(role) {
  return LANDLORD_ROLES.includes(normalizeRole(role))
}

export function isSeekerRole(role) {
  return SEEKER_ROLES.includes(normalizeRole(role))
}

export function isAdminRole(role) {
  return normalizeRole(role) === 'Admin'
}
