import React from 'react';
import { X, Printer } from 'lucide-react';

export default function DocumentPrinter({ type, data, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  const companyDetails = {
    name: "Solar EPC Operations Hub",
    address: "101, Industrial Estate, Phase 4, Ahmedabad, Gujarat 380015",
    gstin: "24AAAAA0000A1Z5",
    email: "sales@solarepc.com",
    phone: "+91 9876543210"
  };

  const getTitle = () => {
    switch (type) {
      case 'invoice': return 'TAX INVOICE';
      case 'pi': return 'PROFORMA INVOICE';
      case 'dc': return 'DELIVERY CHALLAN';
      case 'po': return 'PURCHASE ORDER';
      case 'receipt': return 'PAYMENT RECEIPT';
      case 'ledger': return 'STATEMENT OF ACCOUNT';
      default: return 'DOCUMENT';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-start justify-center overflow-y-auto print:bg-white print:block">
      {/* Action Bar (hidden when printing) */}
      <div className="fixed top-4 right-4 flex items-center gap-4 print:hidden z-[60]">
        <button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition">
          <Printer size={18} /> Print / Save as PDF
        </button>
        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-lg transition">
          <X size={20} />
        </button>
      </div>

      {/* The Printable Page */}
      <div className="bg-white text-black w-[210mm] min-h-[297mm] p-10 m-10 shadow-2xl relative print:shadow-none print:w-full print:p-0 print:m-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{companyDetails.name}</h1>
            <p className="text-sm text-slate-600 mt-1">{companyDetails.address}</p>
            <p className="text-sm text-slate-600 font-mono mt-1">GSTIN: {companyDetails.gstin} | Ph: {companyDetails.phone}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-indigo-700 tracking-widest">{getTitle()}</h2>
            <p className="text-sm font-semibold mt-2">Date: {new Date().toLocaleDateString('en-IN')}</p>
            {(type === 'invoice' || type === 'pi') && data?.invoice_no && (
              <p className="text-sm font-semibold">Ref No: {data.invoice_no}</p>
            )}
            {type === 'po' && data?.po_no && (
              <p className="text-sm font-semibold">PO No: {data.po_no}</p>
            )}
            {type === 'receipt' && data?.receipt_no && (
              <p className="text-sm font-semibold">Receipt No: {data.receipt_no}</p>
            )}
          </div>
        </div>

        {/* Client / Party Details */}
        {(type !== 'ledger') && (
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="text-lg font-bold text-slate-800">{data?.client_name || data?.vendor_name || 'Client Name'}</p>
            <p className="text-sm text-slate-600 mt-1">{data?.client_address || 'Address not provided'}</p>
            <p className="text-sm text-slate-600 font-mono mt-1">GSTIN: {data?.client_gstin || 'Unregistered'}</p>
          </div>
        )}

        {/* Transport & Dispatch Details */}
        {(type === 'invoice' || type === 'dc') && (data?.logistics_partner || data?.tracking_number) && (
          <div className="mb-8 grid grid-cols-2 gap-4 text-sm p-4 border border-slate-200 rounded-lg">
            <div><span className="font-semibold">Logistics Partner:</span> {data.logistics_partner || 'N/A'}</div>
            <div><span className="font-semibold">LR/Tracking No:</span> {data.tracking_number || data.e_way_bill || 'N/A'}</div>
            <div><span className="font-semibold">E-Way Bill No:</span> {data.e_way_bill || 'N/A'}</div>
            <div><span className="font-semibold">Dispatch Date:</span> {data.dispatch_date || new Date().toLocaleDateString('en-IN')}</div>
          </div>
        )}

        {/* Table Content */}
        {type !== 'receipt' ? (
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-sm">
                <th className="p-3 border border-slate-300">#</th>
                <th className="p-3 border border-slate-300">Description of Goods</th>
                <th className="p-3 border border-slate-300 text-center">Qty</th>
                {(type !== 'dc') && <th className="p-3 border border-slate-300 text-right">Rate</th>}
                {(type !== 'dc') && <th className="p-3 border border-slate-300 text-right">Amount</th>}
              </tr>
            </thead>
            <tbody>
              {data?.items?.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr key={idx} className="text-sm">
                    <td className="p-3 border border-slate-300">{idx + 1}</td>
                    <td className="p-3 border border-slate-300 font-semibold">{item.product_name}</td>
                    <td className="p-3 border border-slate-300 text-center">{item.quantity}</td>
                    {(type !== 'dc') && <td className="p-3 border border-slate-300 text-right">₹{Number(item.rate).toLocaleString('en-IN')}</td>}
                    {(type !== 'dc') && <td className="p-3 border border-slate-300 text-right">₹{(item.quantity * item.rate).toLocaleString('en-IN')}</td>}
                  </tr>
                ))
              ) : (
                <tr className="text-sm">
                  <td className="p-3 border border-slate-300">1</td>
                  <td className="p-3 border border-slate-300 font-semibold">{data?.product_name || 'Standard Items'}</td>
                  <td className="p-3 border border-slate-300 text-center">{data?.quantity || 1}</td>
                  {(type !== 'dc') && <td className="p-3 border border-slate-300 text-right">₹{Number(data?.taxable_amount || data?.rate || 0).toLocaleString('en-IN')}</td>}
                  {(type !== 'dc') && <td className="p-3 border border-slate-300 text-right">₹{Number(data?.taxable_amount || (data?.quantity * data?.rate) || 0).toLocaleString('en-IN')}</td>}
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-10 border border-slate-200 rounded-lg text-center bg-slate-50 mb-8">
            <h3 className="text-xl font-semibold mb-2">Received with thanks from</h3>
            <p className="text-2xl font-bold text-slate-800 mb-6">{data?.client_name}</p>
            <p className="text-lg">a sum of Rupees</p>
            <p className="text-3xl font-black text-indigo-700 my-4">₹{Number(data?.amount || 0).toLocaleString('en-IN')}</p>
            <p className="text-sm text-slate-600 mt-6">Payment Mode: Bank Transfer / Online</p>
          </div>
        )}

        {/* GST & Totals (Only for Invoice and PI) */}
        {(type === 'invoice' || type === 'pi') && (
          <div className="flex justify-end mb-8">
            <div className="w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 text-slate-600">Taxable Value</td>
                    <td className="py-2 text-right font-semibold">₹{Number(data?.taxable_amount || data?.rate * data?.quantity || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600">CGST (9%)</td>
                    <td className="py-2 text-right font-semibold">₹{Number(data?.cgst || (data?.rate * data?.quantity * 0.09) || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600">SGST (9%)</td>
                    <td className="py-2 text-right font-semibold">₹{Number(data?.sgst || (data?.rate * data?.quantity * 0.09) || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600">IGST (18%)</td>
                    <td className="py-2 text-right font-semibold">₹{Number(data?.igst || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-800">
                    <td className="py-3 text-lg font-bold">Total Amount</td>
                    <td className="py-3 text-right text-lg font-black text-indigo-700">₹{Number(data?.total_amount || (data?.rate * data?.quantity * 1.18) || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-24 flex justify-between items-end border-t border-slate-300 pt-8">
          <div>
            <p className="text-sm font-semibold">Terms & Conditions:</p>
            <p className="text-xs text-slate-500 mt-1">1. Goods once sold will not be taken back.</p>
            <p className="text-xs text-slate-500">2. Interest @ 18% p.a. will be charged if not paid within due date.</p>
            <p className="text-xs text-slate-500">3. Subject to Ahmedabad Jurisdiction.</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
            <p className="text-sm font-bold text-slate-800">Authorized Signatory</p>
            <p className="text-xs text-slate-500">For {companyDetails.name}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
