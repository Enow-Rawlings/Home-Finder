const REQUIRED_TEXT_FIELDS = [
  ['Title', 'Title is required.'],
  ['Description', 'Description is required.'],
  ['Address', 'Address is required.'],
  ['City', 'City is required.'],
  ['Region', 'Region is required.'],
]

export function buildListingCreatePayload(form) {
  return {
    ...form,
    Title: form.Title?.trim() || '',
    Description: form.Description?.trim() || '',
    Address: form.Address?.trim() || '',
    City: form.City?.trim() || '',
    Region: form.Region?.trim() || '',
    Country: form.Country?.trim() || 'Cameroon',
    Currency: form.Currency?.trim() || 'XAF',
    PricePerNight: Number(form.PricePerNight),
    Bedrooms: Number(form.Bedrooms),
    Bathrooms: Number(form.Bathrooms),
    MaxGuests: Number(form.MaxGuests),
    Amenities: Array.isArray(form.Amenities) ? form.Amenities : [],
  }
}

export function validateListingCreateForm(form) {
  for (const [field, message] of REQUIRED_TEXT_FIELDS) {
    if (!form[field]?.trim()) return message
  }

  const price = Number(form.PricePerNight)
  if (!Number.isFinite(price) || price <= 0) {
    return 'Price must be greater than zero.'
  }

  const bedrooms = Number(form.Bedrooms)
  if (!Number.isInteger(bedrooms) || bedrooms < 0) {
    return 'Bedrooms must be zero or more.'
  }

  const bathrooms = Number(form.Bathrooms)
  if (!Number.isInteger(bathrooms) || bathrooms < 0) {
    return 'Bathrooms must be zero or more.'
  }

  const maxGuests = Number(form.MaxGuests)
  if (!Number.isInteger(maxGuests) || maxGuests < 1) {
    return 'Max guests must be at least one.'
  }

  return ''
}

export function getApiErrorMessage(error, fallback = 'Request failed. Please check the form and try again.') {
  const data = error?.response?.data
  const errors = data?.Errors || data?.errors

  if (errors && typeof errors === 'object') {
    return Object.values(errors).flat().filter(Boolean).join(' ')
  }

  return data?.Message || data?.message || fallback
}
