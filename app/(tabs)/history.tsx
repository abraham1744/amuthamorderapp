import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { googleSheetsService, OrderHistory } from '../../services/GoogleSheets';
import { Search, Clock, User, Calendar, Package } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OrderHistoryScreen() {
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // date filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchQuery, startDate, endDate]);

  const loadHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const historyData = await googleSheetsService.getOrderHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load order history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterHistory = () => {
    let data = [...history];

    // apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter(order =>
        order.orderId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.details.some(detail =>
          detail.productName.toLowerCase().includes(query)
        )
      );
    }

    // apply date range filter
    if (startDate && endDate) {
      data = data.filter(order => {
        const deliveryDate = new Date(order.deliveryDate);
        return deliveryDate >= startDate && deliveryDate <= endDate;
      });
    }

    setFilteredHistory(data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // calculate summary stats
  const totalRevenue = filteredHistory.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalDeliveredQty = filteredHistory.reduce((sum, order) => {
    return sum + order.details.reduce((s, d) => s + d.quantity, 0);
  }, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading order history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, customers, or products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Date Range Filter */}
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toLocaleDateString() : 'Start Date'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {endDate ? endDate.toLocaleDateString() : 'End Date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DateTimePickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") setShowStartPicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") setShowEndPicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />
        }
        style={styles.scrollView}
      >
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredHistory.length}</Text>
            <Text style={styles.statLabel}>Completed Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalDeliveredQty}</Text>
            <Text style={styles.statLabel}>Total Qty Delivered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>
              ${totalRevenue.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>

        {/* History List */}
        <View style={styles.section}>
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock size={48} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Order History</Text>
              <Text style={styles.emptyText}>
                {searchQuery || startDate || endDate
                  ? 'No orders match your filters.'
                  : 'Complete some orders to see history.'}
              </Text>
            </View>
          ) : (
            filteredHistory.map(order => (
              <View key={`${order.orderId}-${order.timestamp}`} style={styles.historyCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>{order.orderId}</Text>
                    <Text style={styles.timestamp}>
                      Completed: {formatTimestamp(order.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Delivered</Text>
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
                      Ordered: {formatDate(order.invoiceDate)} •
                      Delivered: {formatDate(order.deliveryDate)}
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
                  <View style={styles.detailsHeader}>
                    <Package size={16} color="#007AFF" />
                    <Text style={styles.detailsTitle}>Items Ordered</Text>
                  </View>
                  {order.details.map((detail, index) => (
                    <View key={index} style={styles.detailRow}>
                      <View style={styles.detailInfo}>
                        <Text style={styles.productName}>{detail.productName}</Text>
                        <Text style={styles.productDetails}>
                          Qty: {detail.quantity} × ${detail.price.toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.subtotal}>${detail.subtotal.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#8E8E93' },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1D1D1F', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1D1D1F' },
  dateFilterContainer: { flexDirection: 'row', gap: 10 },
  dateButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: { fontSize: 14, color: '#1D1D1F' },
  scrollView: { flex: 1 },
  statsContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '500', textAlign: 'center' },
  section: { backgroundColor: 'white', marginTop: 12, padding: 20, minHeight: 300 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1D1D1F', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#8E8E93', textAlign: 'center', maxWidth: 280 },
  historyCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: '600', color: '#1D1D1F' },
  timestamp: { fontSize: 12, color: '#8E8E93' },
  statusBadge: { backgroundColor: '#34C759', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '500', color: 'white' },
  orderInfo: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  infoText: { fontSize: 14, color: '#3C3C43' },
  orderSummary: { padding: 8, backgroundColor: 'white', borderRadius: 8, marginBottom: 16 },
  summaryText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  orderDetails: { borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 16 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  detailsTitle: { fontSize: 16, fontWeight: '600', color: '#1D1D1F' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '500', color: '#1D1D1F' },
  productDetails: { fontSize: 12, color: '#8E8E93' },
  subtotal: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
});
