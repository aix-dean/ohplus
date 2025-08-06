'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User, Package, Zap, Monitor, Cpu, HardDrive, Wifi, Camera, Printer, Smartphone, Tablet, Headphones, Mouse, Keyboard, ExternalLink, Download, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InventoryItem {
  id: string
  name: string
  category: string
  brand: string
  model: string
  serialNumber: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired'
  location: string
  assignedTo?: string
  purchaseDate: string
  warrantyExpiry?: string
  cost: number
  description?: string
  images: string[]
  specifications: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy: string
}

const categoryIcons = {
  'Desktop Computer': Monitor,
  'Laptop': Monitor,
  'Server': Cpu,
  'Network Equipment': Wifi,
  'Storage Device': HardDrive,
  'Printer': Printer,
  'Scanner': Camera,
  'Mobile Device': Smartphone,
  'Tablet': Tablet,
  'Audio Equipment': Headphones,
  'Input Device': Mouse,
  'Display': Monitor,
  'Power Supply': Zap,
  'Other': Package
}

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  retired: 'bg-red-100 text-red-800 border-red-200'
}

export default function InventoryItemDetails() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch item details
    const fetchItem = async () => {
      try {
        // Mock data - replace with actual API call
        const mockItem: InventoryItem = {
          id: params.id as string,
          name: 'Dell OptiPlex 7090',
          category: 'Desktop Computer',
          brand: 'Dell',
          model: 'OptiPlex 7090',
          serialNumber: 'DL7090-2024-001',
          status: 'active',
          location: 'IT Department - Floor 3',
          assignedTo: 'John Doe',
          purchaseDate: '2024-01-15',
          warrantyExpiry: '2027-01-15',
          cost: 85000,
          description: 'High-performance desktop computer for development work',
          images: [
            '/placeholder.svg?height=400&width=600&text=Dell+OptiPlex+7090',
            '/placeholder.svg?height=400&width=600&text=Side+View',
            '/placeholder.svg?height=400&width=600&text=Ports+View'
          ],
          specifications: {
            processor: 'Intel Core i7-11700',
            memory: '32GB DDR4',
            storage: '1TB NVMe SSD',
            graphics: 'Intel UHD Graphics 750',
            operatingSystem: 'Windows 11 Pro',
            networkConnectivity: 'Gigabit Ethernet, Wi-Fi 6',
            ports: 'USB 3.2, USB-C, HDMI, DisplayPort',
            powerConsumption: '65W',
            dimensions: '292 x 95 x 293 mm',
            weight: '4.2 kg'
          },
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z',
          createdBy: 'Admin User'
        }
        
        setTimeout(() => {
          setItem(mockItem)
          setLoading(false)
        }, 1000)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load item details',
          variant: 'destructive'
        })
        setLoading(false)
      }
    }

    fetchItem()
  }, [params.id, toast])

  const handleEdit = () => {
    router.push(`/it/inventory/edit/${params.id}`)
  }

  const handleDelete = () => {
    // Implement delete functionality
    toast({
      title: 'Delete Item',
      description: 'Delete functionality would be implemented here',
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: 'Link Copied',
      description: 'Item link copied to clipboard',
    })
  }

  const formatSpecificationKey = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-6">The requested inventory item could not be found.</p>
          <Button onClick={() => router.push('/it/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </div>
    )
  }

  const CategoryIcon = categoryIcons[item.category as keyof typeof categoryIcons] || Package

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/it/inventory')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-600">{item.brand} {item.model}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${item.name} - Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(image, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="h-5 w-5 mr-2" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(item.specifications).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-gray-600">
                      {formatSpecificationKey(key)}
                    </dt>
                    <dd className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                      {value}
                    </dd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {item.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CategoryIcon className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <Badge className={statusColors[item.status]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600">{item.location}</p>
                  </div>
                </div>
                
                {item.assignedTo && (
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback>{item.assignedTo.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-gray-600">{item.assignedTo}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Purchase Date</p>
                    <p className="text-sm text-gray-600">{formatDate(item.purchaseDate)}</p>
                  </div>
                </div>
                
                {item.warrantyExpiry && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Warranty Expiry</p>
                      <p className="text-sm text-gray-600">{formatDate(item.warrantyExpiry)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Purchase Cost</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(item.cost)}</p>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Serial Number</p>
                <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded mt-1">{item.serialNumber}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-sm text-gray-600">{formatDate(item.createdAt)}</p>
                <p className="text-xs text-gray-500">by {item.createdBy}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-sm text-gray-600">{formatDate(item.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Change Assignment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
