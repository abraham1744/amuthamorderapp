import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { googleSheetsService, Product, Customer, OrderDetail } from'/home/project/services/GoogleSheets';
import { Plus, Trash2, Calendar, User, Package } from 'lucide-react-native';

interface OrderItem extends OrderDetail {
  id: string;
}

export default function CreateOrderScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, customersData] = await Promise.all([
        googleSheetsService.getProducts(),
        googleSheetsService.getCustomers(),
      ]);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data from Google Sheets. Please check your configuration.');
    } finally {
      setInitialLoading(false);
    }
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      orderId: '',
      productName: '',
      quantity: 1,
      price: 0,
      subtotal: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const updateOrderItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrderItems(items =>
      items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'productName') {
            const product = products.find(p => p.name === value);
            if (product) {
              updatedItem.price = product.price;
              updatedItem.subtotal = updatedItem.quantity * product.price;
            }
          } else if (field === 'quantity') {
            updatedItem.subtotal = value * item.price;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeOrderItem = (id: string) => {
    setOrderItems(items => items.filter(item => item.id !== id));
  };

  const getTotals = () => {
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    return { totalQuantity, totalPrice };
  };

  const validateOrder = () => {
    if (!selectedCustomer) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return false;
    }
    
    if (orderItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one product.');
      return false;
    }
    
    const hasInvalidItems = orderItems.some(item => 
      !item.productName || item.quantity <= 0
    );
    
    if (hasInvalidItems) {
      Alert.alert('Validation Error', 'Please fill in all product details with valid quantities.');
      return false;
    }
    
    if (!invoiceDate || !deliveryDate) {
      Alert.alert('Validation Error', 'Please set both invoice and delivery dates.');
      return false;
    }
    
    return true;
  };

  const placeOrder = async () => {
    if (!validateOrder()) return;

    setLoading(true);
    try {
      const orderId = googleSheetsService.generateOrderId();
      const { totalQuantity, totalPrice } = getTotals();

      // Create order
      const order = {
        orderId,
        customerName: selectedCustomer,
        invoiceDate,
        deliveryDate,
        totalQuantity,
        totalPrice,
        status: 'Pending',
        delivered: false,
      };

      await googleSheetsService.createOrder(order);

      // Create order details
      const orderDetails: OrderDetail[] = orderItems.map(item => ({
        orderId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      }));

      await googleSheetsService.addOrderDetails(orderDetails);

      Alert.alert('Success', `Order ${orderId} has been placed successfully!`);
      
      // Reset form
      setSelectedCustomer('');
      setOrderItems([]);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDeliveryDate(new Date().toISOString().split('T')[0]);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { totalQuantity, totalPrice } = getTotals();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Order</Text>
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Customer</Text>
          </View>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCustomer}
              onValueChange={setSelectedCustomer}
              style={styles.picker}
            >
              <Picker.Item label="Select Customer" value="" />
              {customers.map(customer => (
                <Picker.Item
                  key={customer.name}
                  label={customer.name}
                  value={customer.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Dates</Text>
          </View>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Invoice Date</Text>
              <TextInput
                style={styles.dateInput}
                value={invoiceDate}
                onChangeText={setInvoiceDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>Delivery Date</Text>
              <TextInput
                style={styles.dateInput}
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Products</Text>
          </View>

          {orderItems.map((item, index) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNumber}>Item {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeOrderItem(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={item.productName}
                  onValueChange={value => updateOrderItem(item.id, 'productName', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Product" value="" />
                  {products.map(product => (
                    <Picker.Item
                      key={product.name}
                      label={`${product.name} - $${product.price.toFixed(2)}`}
                      value={product.name}
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.quantityContainer}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={item.quantity.toString()}
                    onChangeText={text => updateOrderItem(item.id, 'quantity', parseInt(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.label}>Price: ${item.price.toFixed(2)}</Text>
                  <Text style={styles.subtotal}>Subtotal: ${item.subtotal.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addOrderItem}>
            <Plus size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Totals */}
        {orderItems.length > 0 && (
          <View style={styles.totalsSection}>
            <Text style={styles.totalsTitle}>Order Summary</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Quantity:</Text>
              <Text style={styles.totalValue}>{totalQuantity}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price:</Text>
              <Text style={styles.totalValuePrice}>${totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Place Order Button */}
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={placeOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  picker: {
    height: 50,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  orderItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  deleteButton: {
    padding: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    width: 80,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0F8FF',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  totalsSection: {
    backgroundColor: 'white',
    marginTop: 12,
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: '#007AFF',
  },
  totalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  totalValuePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});