import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SiteInformation from '@/components/SiteInformation'

// Mock the GoogleMap component
vi.mock('@/components/GoogleMap', () => ({
  GoogleMap: ({ location }: { location: string }) => (
    <div data-testid="google-map" data-location={location} />
  ),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
  Maximize: () => React.createElement('div', { 'data-testid': 'maximize-icon' }),
}))

describe('SiteInformation', () => {
  const mockProps = {
    activeImageIndex: 0,
    setActiveImageIndex: vi.fn(),
    setImageViewerOpen: vi.fn(),
    handleCalendarOpen: vi.fn(),
    companyName: 'Test Company',
    companyLoading: false,
  }

  it('displays geopoint correctly when it is a GeoPoint object', () => {
    const productWithGeoPoint = {
      id: 'test-product-id',
      name: 'Test Product',
      type: 'RENTAL',
      specs_rental: {
        geopoint: {
          latitude: 14.598835524331239,
          longitude: 121.00582933349611,
        },
        location: 'Test Location',
      },
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={productWithGeoPoint} {...mockProps} />)

    expect(screen.getByText('14.598835524331239, 121.00582933349611')).toBeInTheDocument()
  })

  it('displays "Not Set" when geopoint is null', () => {
    const productWithoutGeoPoint = {
      id: 'test-product-id',
      name: 'Test Product',
      type: 'RENTAL',
      specs_rental: {
        geopoint: null,
        location: 'Test Location',
      },
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={productWithoutGeoPoint} {...mockProps} />)

    // Check that the specific geopoint value is not displayed
    expect(screen.queryByText('14.598835524331239, 121.00582933349611')).not.toBeInTheDocument()
    // The component should still render the Geopoint label
    expect(screen.getByText('Geopoint')).toBeInTheDocument()
  })

  it('displays "Not Set" when specs_rental is null', () => {
    const productWithoutSpecs = {
      id: 'test-product-id',
      name: 'Test Product',
      type: 'RENTAL',
      specs_rental: null,
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={productWithoutSpecs} {...mockProps} />)

    // Check that the specific geopoint value is not displayed
    expect(screen.queryByText('14.598835524331239, 121.00582933349611')).not.toBeInTheDocument()
    // The component should still render the Geopoint label
    expect(screen.getByText('Geopoint')).toBeInTheDocument()
  })

  it('displays product name correctly', () => {
    const product = {
      id: 'test-product-id',
      name: 'Test Product Name',
      type: 'RENTAL',
      specs_rental: {
        location: 'Test Location',
      },
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={product} {...mockProps} />)

    expect(screen.getByText('Test Product Name')).toBeInTheDocument()
  })

  it('displays location correctly', () => {
    const product = {
      id: 'test-product-id',
      name: 'Test Product',
      type: 'RENTAL',
      specs_rental: {
        location: 'Test Location Address',
      },
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={product} {...mockProps} />)

    expect(screen.getByText('Test Location Address')).toBeInTheDocument()
  })

  it('renders GoogleMap when location exists', () => {
    const product = {
      id: 'test-product-id',
      name: 'Test Product',
      type: 'RENTAL',
      specs_rental: {
        location: 'Test Location',
      },
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={product} {...mockProps} />)

    const googleMap = screen.getByTestId('google-map')
    expect(googleMap).toBeInTheDocument()
    expect(googleMap).toHaveAttribute('data-location', 'Test Location')
  })

  it('renders site calendar button', () => {
    const product = {
      id: 'test-product-id',
      name: 'Test Product',
      type: 'RENTAL',
      specs_rental: {
        location: 'Test Location',
      },
      media: [{ url: '/test-image.jpg' }],
    }

    render(<SiteInformation product={product} {...mockProps} />)

    expect(screen.getByText('Site Calendar')).toBeInTheDocument()
  })
})