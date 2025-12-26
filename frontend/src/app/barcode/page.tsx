'use client';

import { useState } from 'react';
import { useTrackByBarcode } from '@/services/trackingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BarcodePage() {
  const [barcode, setBarcode] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');

  const { data, isLoading, error } = useTrackByBarcode(searchBarcode);

  const handleSearch = () => {
    if (barcode.trim()) {
      setSearchBarcode(barcode.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Barcode Tracking</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scan or Enter Barcode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!barcode.trim()}>
              Track Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <p>Loading...</p>}

      {error && (
        <Alert className="mb-6">
          <AlertDescription>
            Error tracking item: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Barcode:</p>
                  <p>{data.barcode}</p>
                </div>
                <div>
                  <p className="font-semibold">Item Name:</p>
                  <p>{data.itemName}</p>
                </div>
                <div>
                  <p className="font-semibold">Description:</p>
                  <p>{data.itemDescription || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">Category:</p>
                  <p>{data.category}</p>
                </div>
                <div>
                  <p className="font-semibold">Serial Number:</p>
                  <p>{data.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">Current Status:</p>
                  <Badge variant={data.currentStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                    {data.currentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold">Owner Office:</p>
                  <p>{data.currentOwnerOffice}</p>
                </div>
                <div>
                  <p className="font-semibold">Purchase Date:</p>
                  <p>{data.purchaseDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">Warranty Expiry:</p>
                  <p>{data.warrantyExpiry || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold">Created At:</p>
                  <p>{new Date(data.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {data.remarks && (
                <div className="mt-4">
                  <p className="font-semibold">Remarks:</p>
                  <p>{data.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {data.purchaseInformation && (
            <Card>
              <CardHeader>
                <CardTitle>Purchase Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Purchase ID:</p>
                    <p>{data.purchaseInformation.purchaseId}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Quantity:</p>
                    <p>{data.purchaseInformation.quantity}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Unit Price:</p>
                    <p>${data.purchaseInformation.unitPrice}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Total Cost:</p>
                    <p>${data.purchaseInformation.totalCost}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Supplier:</p>
                    <p>{data.purchaseInformation.supplier || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Purchased By:</p>
                    <p>{data.purchaseInformation.purchasedBy} ({data.purchaseInformation.purchasedByUsername})</p>
                  </div>
                  <div>
                    <p className="font-semibold">Purchased For Office:</p>
                    <p>{data.purchaseInformation.purchasedForOffice}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Purchase Date:</p>
                    <p>{new Date(data.purchaseInformation.purchaseDate).toLocaleString()}</p>
                  </div>
                </div>
                {data.purchaseInformation.remarks && (
                  <div className="mt-4">
                    <p className="font-semibold">Remarks:</p>
                    <p>{data.purchaseInformation.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Movement History ({data.totalMovements} movements)</CardTitle>
            </CardHeader>
            <CardContent>
              {data.movementHistory.length === 0 ? (
                <p>No movement history available.</p>
              ) : (
                <div className="space-y-4">
                  {data.movementHistory.map((transaction, index) => (
                    <div key={transaction.transactionId}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{transaction.transactionType} - {transaction.status}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {transaction.fromOffice && (
                          <p className="text-sm">
                            <span className="font-medium">From:</span> {transaction.fromOffice} ({transaction.fromOfficeCode})
                          </p>
                        )}
                        {transaction.toOffice && (
                          <p className="text-sm">
                            <span className="font-medium">To:</span> {transaction.toOffice} ({transaction.toOfficeCode})
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Initiated By:</span> {transaction.initiatedBy} ({transaction.initiatedByUsername})
                        </p>
                        {transaction.confirmedBy && (
                          <p className="text-sm">
                            <span className="font-medium">Confirmed By:</span> {transaction.confirmedBy} ({transaction.confirmedByUsername})
                          </p>
                        )}
                        {transaction.confirmedDate && (
                          <p className="text-sm">
                            <span className="font-medium">Confirmed Date:</span> {new Date(transaction.confirmedDate).toLocaleString()}
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Quantity:</span> {transaction.quantity}
                        </p>
                        {transaction.remarks && (
                          <p className="text-sm col-span-2">
                            <span className="font-medium">Remarks:</span> {transaction.remarks}
                          </p>
                        )}
                      </div>
                      {index < data.movementHistory.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Movement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Total Transfers:</p>
                  <p>{data.movementSummary.totalTransfers}</p>
                </div>
                <div>
                  <p className="font-semibold">Confirmed:</p>
                  <p>{data.movementSummary.confirmedTransfers}</p>
                </div>
                <div>
                  <p className="font-semibold">Rejected:</p>
                  <p>{data.movementSummary.rejectedTransfers}</p>
                </div>
                <div>
                  <p className="font-semibold">Pending:</p>
                  <p>{data.movementSummary.pendingTransfers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Office Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1">
                {data.officeJourney.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}