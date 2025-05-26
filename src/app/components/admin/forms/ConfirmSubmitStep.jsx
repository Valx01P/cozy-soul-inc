'use client'

import { useEffect, useMemo } from "react"
import { format, parseISO, isValid } from "date-fns"
import { DollarSign, Moon, CreditCard } from "lucide-react"
import usePropertyFormStore from "@/app/stores/propertyFormStore"

// Reusable component for formatting descriptions with paragraphs
function FormattedDescription({ description }) {
  if (!description) return null

  const formatDescription = () => {
    // Normalize line breaks
    const normalized = description.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    // Split into paragraphs
    return normalized.split(/\n\s*\n/).map((para, idx) => {
      const lines = para.trim().split("\n")
      return (
        <p key={idx} className="text-gray-600 mb-3">
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      )
    })
  }

  return <>{formatDescription()}</>
}

export function ConfirmSubmitStep() {
  const {
    title,
    description,
    priceRanges,
    location,
    number_of_guests,
    number_of_bedrooms,
    number_of_beds,
    number_of_bathrooms,
    additional_info,
    amenities,
    imagePreviews,
    minimum_stay,
    additionalFees
  } = usePropertyFormStore((state) => state)

  // Sort price ranges by start date so they're always chronological
  const sortedPriceRanges = useMemo(() => {
    return [...(priceRanges || [])].sort((a, b) => {
      const aDate = parseISO(a.startDate ?? a.start_date)
      const bDate = parseISO(b.startDate ?? b.start_date)
      if (!isValid(aDate) || !isValid(bDate)) return 0
      return aDate - bDate
    })
  }, [priceRanges])

  // Fallback image for failed image loads
  const fallbackImageSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23cccccc' fill='none'/%3E%3Ccircle cx='45' cy='45' r='5' fill='%23cccccc'/%3E%3C/svg%3E";

  return (
    <div className="space-y-10">
      <div className="border-b border-gray-200 pb-6">
        <h2 className="text-xl font-bold mb-4">Review Your Listing</h2>
        <p className="text-gray-600">
          Please review all the information below before submitting your property listing.
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-medium text-lg">{title}</h4>
          <FormattedDescription description={description} />
        </div>
      </div>

      {/* Property Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Images</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {imagePreviews.main_image && (
              <div className="sm:col-span-3">
                <div className="bg-gray-100 rounded-lg h-64 overflow-hidden relative">
                  <img
                    src={imagePreviews.main_image}
                    alt="Main property"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = fallbackImageSrc;
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded font-medium">
                    Main Image
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 col-span-3 gap-4">
              {imagePreviews.side_image1 && (
                <div className="aspect-square overflow-hidden rounded-lg relative">
                  <img
                    src={imagePreviews.side_image1}
                    alt="Side view 1"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = fallbackImageSrc;
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded font-medium">
                    Side Image 1
                  </div>
                </div>
              )}
              {imagePreviews.side_image2 && (
                <div className="aspect-square overflow-hidden rounded-lg relative">
                  <img
                    src={imagePreviews.side_image2}
                    alt="Side view 2"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = fallbackImageSrc;
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded font-medium">
                    Side Image 2
                  </div>
                </div>
              )}
            </div>
          </div>
          {imagePreviews.extra_images?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {imagePreviews.extra_images.map((src, idx) => (
                  <div key={`extra-image-${idx}`} className="aspect-square overflow-hidden rounded-lg">
                    <img
                      src={src || fallbackImageSrc}
                      alt={`Additional view ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = fallbackImageSrc;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pricing & Availability */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing & Availability</h3>
        <div className="bg-gray-50 rounded-xl p-6">
          {/* Minimum Stay Information */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Minimum Stay</p>
            <p className="font-semibold flex items-center">
              <Moon size={16} className="mr-2 text-gray-600" />
              {minimum_stay} {minimum_stay === 1 ? 'night' : 'nights'}
            </p>
          </div>
          
          {sortedPriceRanges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-500 py-2">
                      Date Range (Inclusive)
                    </th>
                    <th className="text-left text-sm font-medium text-gray-500 py-2">
                      Status
                    </th>
                    <th className="text-left text-sm font-medium text-gray-500 py-2">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPriceRanges.map((range) => {
                    const start = parseISO(range.startDate || range.start_date)
                    const end = parseISO(range.endDate || range.end_date)
                    const formatSafe = (d) =>
                      isValid(d) ? format(d, "MMM d, yyyy") : "Invalid Date"
                    return (
                      <tr key={range.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm">
                          {formatSafe(start)} – {formatSafe(end)}
                        </td>
                        <td className="py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              range.isAvailable
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {range.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td className="py-3 text-sm">
                          {range.isAvailable && range.price != null ? (
                            <span className="flex items-center">
                              <DollarSign size={16} className="mr-1" />
                              {range.price} / night
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No pricing information provided.</p>
          )}
          
          {/* Additional Fees Section */}
          {additionalFees && additionalFees.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-base font-medium mb-3">Additional Fees</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-sm font-medium text-gray-500 py-2">Fee Name</th>
                      <th className="text-left text-sm font-medium text-gray-500 py-2">Type</th>
                      <th className="text-left text-sm font-medium text-gray-500 py-2">Amount</th>
                      <th className="text-left text-sm font-medium text-gray-500 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalFees.map((fee) => (
                      <tr key={fee.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm font-medium">
                          {fee.title}
                        </td>
                        <td className="py-3 text-sm">
                          {fee.type === 'flat' ? 'One-time fee' : 'Per night'}
                        </td>
                        <td className="py-3 text-sm">
                          <span className="flex items-center">
                            <DollarSign size={14} className="mr-1" />
                            {fee.cost}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-500 max-w-xs">
                          {fee.description || <span className="text-gray-400 italic">No description</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location</h3>
        <div className="bg-gray-50 rounded-xl p-6">
          <p className="font-medium">
            {location.street}
            {location.apt ? `, ${location.apt}` : ""}
          </p>
          <p>
            {location.city}, {location.state} {location.zip}
          </p>
          <p>{location.country}</p>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Property Details</h3>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-gray-500 text-sm">Guests</p>
              <p className="font-semibold">{number_of_guests}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Bedrooms</p>
              <p className="font-semibold">{number_of_bedrooms}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Beds</p>
              <p className="font-semibold">{number_of_beds}</p>
            </div>
          </div>
          <div className="mb-6">
            <p className="text-gray-500 text-sm">Bathrooms</p>
            <p className="font-semibold">{number_of_bathrooms}</p>
          </div>
          {additional_info && (
            <>
              <p className="text-gray-500 text-sm mb-1">
                House Rules & Additional Information
              </p>
              <FormattedDescription description={additional_info} />
            </>
          )}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Amenities</h3>
        <div className="bg-gray-50 rounded-xl p-6">
          {Object.keys(amenities || {}).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(amenities).map(([cat, items]) => (
                <div key={cat} className="space-y-2">
                  <h4 className="font-medium">{cat}</h4>
                  <ul className="space-y-1">
                    {Object.keys(items).map((name) => (
                      <li key={name} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 text-[var(--primary-red)]"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 
                               011.06-1.06l3.894 3.893 7.48-9.817a.75.75 
                               0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No amenities selected.</p>
          )}
        </div>
      </div>
    </div>
  )
}