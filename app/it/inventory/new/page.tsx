import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/authContext';
import { createInventoryItem } from '@/lib/inventory';

const NewInventoryPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    brand: '',
    department: '',
    assignedTo: '',
    condition: '',
    vendorType: '',
    storeName: '',
    storeLocation: '',
    websiteName: '',
    websiteUrl: '',
    purchaseDate: '',
    warrantyExpiry: '',
    cost: '',
    currency: '',
    description: '',
    serialNumber: '',
    specifications: '',
    licenseKey: '',
    version: '',
    status: '',
    categorySpecs: {},
  });

  const { userData } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemData = {
      name: formData.name,
      type: formData.type,
      category: formData.category,
      brand: formData.brand,
      department: formData.department,
      assignedTo: formData.assignedTo || "unassigned",
      condition: formData.condition,
      vendorType: formData.vendorType,
      storeName: formData.storeName || "",
      storeLocation: formData.storeLocation || "",
      websiteName: formData.websiteName || "",
      websiteUrl: formData.websiteUrl || "",
      purchaseDate: formData.purchaseDate || "",
      warrantyExpiry: formData.warrantyExpiry || "",
      cost: formData.cost ? parseFloat(formData.cost) : 0,
      currency: formData.currency || "USD",
      description: formData.description || "",
      serialNumber: formData.serialNumber || "",
      specifications: formData.specifications || "",
      licenseKey: formData.licenseKey || "",
      version: formData.version || "",
      status: formData.status,
      categorySpecs: formData.categorySpecs || {},
      deleted: false, // Add this line
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      created_by: userData.uid,
      company_id: userData.company_id,
    };

    try {
      await createInventoryItem(itemData);
      router.push('/it/inventory');
    } catch (error) {
      console.error('Error creating inventory item:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div>
      <h1>Create New Inventory Item</h1>
      <form onSubmit={handleSubmit}>
        {/* Form fields here */}
        <button type="submit">Create Item</button>
      </form>
    </div>
  );
};

export default NewInventoryPage;
