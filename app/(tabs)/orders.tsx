import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { googleSheetsService, Order, OrderDetail } from '../../services/GoogleSheets';
import { Check, Clock, Truck, Package, User, Calendar } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

interface OrderWithDetails extends Order {
  details: OrderDetail[];
}

export default function ViewOrdersScreen() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    productStats: {} as Record<string, number>,
  });

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [ordersData, allOrderDetails] = await Promise.all([
        googleSheetsService.getOrders(),
        googleSheetsService.getOrderDetails(),
      ]);

      // Combine orders with their details
let ordersWithDetails: OrderWithDetails[] = ordersData.map(order => ({
  ...order,
  details: allOrderDetails.filter(detail => detail.orderId === order.orderId),
}));

      // Show all orders (both pending and delivered)
      setOrders(ordersWithDetails);

      calculateStats(ordersWithDetails, allOrderDetails);
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders from Google Sheets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (orders: OrderWithDetails[], allDetails: OrderDetail[]) => {
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(order => order.delivered).length;
    const pendingOrders = totalOrders - deliveredOrders;

    // Calculate product statistics
    const productStats: Record<string, number> = {};
    allDetails.forEach(detail => {
      productStats[detail.productName] = (productStats[detail.productName] || 0) + detail.quantity;
    });

    setStats({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      productStats,
    });
  };

  const toggleOrderStatus = async (order: OrderWithDetails) => {
    const newDeliveredStatus = !order.delivered;
    const newStatus = newDeliveredStatus ? 'Delivered' : 'Pending';

    try {
      await googleSheetsService.updateOrderStatus(order.orderId, newStatus, newDeliveredStatus);

      if (newDeliveredStatus) {
        // Archive the order when marked as delivered
        await googleSheetsService.archiveOrder(order, order.details);
        Alert.alert('Success', 'Order has been marked as delivered and archived to history.');
      } else {
        Alert.alert('Success', 'Order status updated successfully.');
      }

      // Reload orders to reflect changes
      await loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status.');
    }
  };

  const getStatusIcon = (order: Order) => {
    if (order.delivered) {
      return <Check size={20} color="#34C759" />;
    } else if (order.status === 'Pending') {
      return <Clock size={20} color="#FF9500" />;
    } else {
      return <Truck size={20} color="#007AFF" />;
    }
  };

  const getStatusColor = (order: Order) => {
    if (order.delivered) return '#34C759';
    if (order.status === 'Pending') return '#FF9500';
    return '#007AFF';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Order Management</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.deliveredOrders}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* Product Statistics */}
        {Object.keys(stats.productStats).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Product Orders</Text>
            </View>
            {Object.entries(stats.productStats).map(([product, quantity]) => (
              <View key={product} style={styles.productStat}>
                <Text style={styles.productName}>{product}</Text>
                <Text style={styles.productQuantity}>{quantity} units</Text>
              </View>
            ))}
          </View>
        )}

        {/* Orders List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Orders ({orders.length})</Text>
          </View>

          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders found</Text>
          ) : (
            orders.map(order => (
              <View key={order.orderId} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.orderId}</Text>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(order)}
                    <Text style={[styles.status, { color: getStatusColor(order) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <User size={16} color="#8E8E93" />
                    <Text style={styles.infoText}>{order.customerName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Calendar size={16} color="#8E8E93" />
                    <Text style={styles.infoText}>
                      Delivery: {order.deliveryDate}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderSummary}>
                  <Text style={styles.summaryText}>
                    {order.totalQuantity} items • ${order.totalPrice.toFixed(2)}
                  </Text>
                </View>

                {/* Order Details */}
                <View style={styles.orderDetails}>
                  <Text style={styles.detailsTitle}>Items:</Text>
                  {order.details.map((detail, index) => (
                    <Text key={index} style={styles.detailItem}>
                      • {detail.productName} x{detail.quantity} - ${detail.subtotal.toFixed(2)}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    order.delivered ? styles.markPendingButton : styles.markDeliveredButton
                  ]}
                  onPress={() => toggleOrderStatus(order)}
                >
                  <Text style={styles.actionButtonText}>
                    {order.delivered ? 'Mark as Pending' : 'Mark as Delivered'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
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
  productStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productName: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  productQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#8E8E93',
    paddingVertical: 20,
  },
  orderCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  orderSummary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 6,
  },
  detailItem: {
    fontSize: 13,
    color: '#3C3C43',
    marginBottom: 2,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  markDeliveredButton: {
    backgroundColor: '#34C759',
  },
  markPendingButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
