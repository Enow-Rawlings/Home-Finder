export function getCollection(response) {
  if (Array.isArray(response)) return response

  return (
    response?.Items ||
    response?.items ||
    response?.Data ||
    response?.data ||
    response?.Results ||
    response?.results ||
    []
  )
}

export function getTotalCount(response) {
  if (Array.isArray(response)) return response.length

  return (
    response?.TotalCount ||
    response?.totalCount ||
    response?.Total ||
    response?.total ||
    getCollection(response).length
  )
}

export function getEntityId(entity) {
  return entity?.Id || entity?.id || entity?.ListingId || entity?.listingId || null
}

function getPhotos(listing = {}) {
  return listing.Photos || listing.photos || listing.ListingPhotos || listing.listingPhotos || []
}

export function normalizeListing(listing = {}) {
  const photos = getPhotos(listing)
  const primaryPhotoUrl =
    listing.PrimaryPhotoUrl ||
    listing.primaryPhotoUrl ||
    listing.Url ||
    listing.url ||
    photos.find?.(photo => photo.IsPrimary || photo.isPrimary)?.Url ||
    photos.find?.(photo => photo.IsPrimary || photo.isPrimary)?.url ||
    photos[0]?.Url ||
    photos[0]?.url ||
    null

  return {
    ...listing,
    Id: listing.Id || listing.id || listing.ListingId || listing.listingId,
    OwnerId: listing.OwnerId || listing.ownerId,
    Title: listing.Title || listing.title || 'Untitled listing',
    Description: listing.Description || listing.description || '',
    Type: listing.Type || listing.type || listing.PropertyType || listing.propertyType || 'N/A',
    PropertyType: listing.PropertyType || listing.propertyType || listing.Type || listing.type || 'N/A',
    Status: listing.Status || listing.status,
    Address: listing.Address || listing.address,
    City: listing.City || listing.city || '',
    Region: listing.Region || listing.region || '',
    Country: listing.Country || listing.country || '',
    PricePerNight: listing.PricePerNight ?? listing.pricePerNight ?? 0,
    Currency: listing.Currency || listing.currency || 'XAF',
    Bedrooms: listing.Bedrooms ?? listing.bedrooms ?? 0,
    Bathrooms: listing.Bathrooms ?? listing.bathrooms ?? 0,
    MaxGuests: listing.MaxGuests ?? listing.maxGuests ?? 1,
    AvailableFrom: listing.AvailableFrom || listing.availableFrom,
    AvailableTo: listing.AvailableTo || listing.availableTo,
    Amenities: listing.Amenities || listing.amenities || [],
    PrimaryPhotoUrl: primaryPhotoUrl,
    CreatedAtUtc: listing.CreatedAtUtc || listing.createdAtUtc || listing.CreatedAt || listing.createdAt,
    UpdatedAtUtc: listing.UpdatedAtUtc || listing.updatedAtUtc || listing.UpdatedAt || listing.updatedAt,
    SubmittedAtUtc: listing.SubmittedAtUtc || listing.submittedAtUtc || listing.SubmittedAt || listing.submittedAt,
  }
}

export function normalizePhoto(photo = {}) {
  return {
    ...photo,
    Id: photo.Id || photo.id,
    ListingId: photo.ListingId || photo.listingId,
    Provider: photo.Provider || photo.provider,
    Url: photo.Url || photo.url,
    FileName: photo.FileName || photo.fileName,
    ContentType: photo.ContentType || photo.contentType,
    SizeBytes: photo.SizeBytes ?? photo.sizeBytes,
    AltText: photo.AltText || photo.altText || '',
    DisplayOrder: photo.DisplayOrder ?? photo.displayOrder ?? 0,
    IsPrimary: photo.IsPrimary ?? photo.isPrimary ?? false,
    CreatedAtUtc: photo.CreatedAtUtc || photo.createdAtUtc || photo.CreatedAt || photo.createdAt,
  }
}
