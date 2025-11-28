import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Product, ProductType } from '../types';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Edit, AlertCircle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    type: ProductType.WATER,
    price: 0,
    depositPrice: 0,
    stock: 0,
    linkedDepositId: ''
  });

  const loadProducts = async () => {
      const data = await DataService.getProducts();
      setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return;

    if (editingProduct) {
        const productToSave: Product = { 
            ...editingProduct, 
            ...formData, 
            stock: editingProduct.stock 
        } as Product;
        await DataService.saveProduct(productToSave);
    } else {
        const newProduct: Product = {
            id: Date.now().toString(),
            name: formData.name!,
            type: formData.type || ProductType.WATER,
            price: Number(formData.price) || 0,
            depositPrice: 0,
            stock: Number(formData.stock) || 0,
            linkedDepositId: formData.linkedDepositId
        };
        await DataService.saveProduct(newProduct);
    }
    
    await loadProducts();
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({});
  };

  const openEdit = (product: Product) => {
      setEditingProduct(product);
      setFormData(product);
      setIsModalOpen(true);
  };

  const openNew = () => {
      setEditingProduct(null);
      setFormData({ type: ProductType.WATER, price: 0, depositPrice: 0, stock: 0 });
      setIsModalOpen(true);
  }

  const handleDelete = async (id: string) => {
      if(!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
      await DataService.deleteProduct(id);
      await loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Stok ve Ürünler</h2>
        <Button onClick={openNew}>
            <Plus size={18} className="mr-2" />
            Ürün Ekle
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                    <th className="p-4">Ürün Adı</th>
                    <th className="p-4">Tip</th>
                    <th className="p-4">Birim Fiyat</th>
                    <th className="p-4">Stok Adedi</th>
                    <th className="p-4">Bağlı Depozito</th>
                    <th className="p-4 text-right">İşlemler</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {products.map(product => {
                    const linkedName = products.find(p => p.id === product.linkedDepositId)?.name;
                    return (
                        <tr key={product.id} className="hover:bg-gray-50">
                            <td className="p-4 font-medium">{product.name}</td>
                            <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{product.type}</span></td>
                            <td className="p-4">₺{product.price}</td>
                            <td className="p-4 font-bold">{product.stock}</td>
                            <td className="p-4 text-sm text-gray-500">{linkedName || '-'}</td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => openEdit(product)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
                <h3 className="text-lg font-bold">{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ürün Adı</label>
                        <input 
                            type="text" 
                            className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-water-500 outline-none" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tip</label>
                        <select 
                            className="w-full border rounded p-2 mt-1 focus:ring-2 focus:ring-water-500 outline-none"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as ProductType})}
                        >
                            <option value={ProductType.WATER}>Su</option>
                            <option value={ProductType.DEPOSIT}>Depozito (Boş Damacana/Palet)</option>
                            <option value={ProductType.OTHER}>Diğer</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Satış Fiyatı (TL)</label>
                        <input type="number" className="w-full border rounded p-2 mt-1" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                        
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mevcut Stok</label>
                        <input 
                            type="number" 
                            className={`w-full border rounded p-2 mt-1 ${editingProduct ? 'bg-gray-100 text-gray-500' : ''}`}
                            value={formData.stock} 
                            onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                            disabled={!!editingProduct} 
                        />
                        {editingProduct && <p className="text-xs text-orange-500 flex items-center mt-1"><AlertCircle size={12} className="mr-1"/> Stok değişimi için "Hareket Ekle" menüsünü kullanın.</p>}
                    </div>

                    {formData.type === ProductType.WATER && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Bağlı Depozito (Boş) Ürünü</label>
                            <select 
                                className="w-full border rounded p-2 mt-1"
                                value={formData.linkedDepositId || ''}
                                onChange={e => setFormData({...formData, linkedDepositId: e.target.value})}
                            >
                                <option value="">Yok</option>
                                {products.filter(p => p.type === ProductType.DEPOSIT).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Dolu satıldığında müşteriye otomatik borç yazılacak boş ürün.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>İptal</Button>
                    <Button onClick={handleSave}>Kaydet</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};